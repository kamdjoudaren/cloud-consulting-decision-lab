import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { getProvider } from '../ai/provider';
import { acceptADR } from '../adr/service';
import { evaluateCase } from '../evaluation/scoring';
import { mergeSemanticEvaluation } from '../evaluation/semantic';
import { DomainError, type CaseAction } from '../validation';
import { advancePhase, assertFirstAnalysisReady, assertPhaseReady } from './workflow';
import { assertVersion, getCase, getCaseScenario, mutateCase, sealSnapshot } from './store';
import { interview, requestDocument } from '../lab/engine';
import { coachingHint } from '../lab/coaching';
import type { CaseData, CaseSession, Evaluation, Scenario } from '../types';

function only(session: CaseSession, phases: CaseSession['phase'][]) {
  if (!phases.includes(session.phase))
    throw new DomainError(`This action is available during ${phases.join(' or ')}.`);
}
const reviewSchema = z
  .array(
    z.object({
      id: z.string().min(1),
      category: z.string().min(1),
      severity: z.enum(['info', 'warning', 'critical']),
      suggestion: z.string().min(1),
      response: z.null(),
      rationale: z.string(),
    }),
  )
  .min(1)
  .max(30);

export async function performAction(id: string, action: CaseAction): Promise<CaseData> {
  const initial = getCase(id).session;
  assertVersion(initial, action.version);
  const scenario = getCaseScenario(initial);
  if (['assistance', 'hint', 'chapter', 'defend'].includes(action.action)) {
    if (!initial.simulation || !scenario.lab)
      throw new DomainError('This action is available in upgraded simulations.');
    return mutateCase(id, action.version, (session) => {
      const sim = session.simulation!;
      if (action.action === 'assistance') {
        only(session, ['brief']);
        if (sim.hints.length)
          throw new DomainError(
            'Assistance is fixed once coaching has been used. Start another attempt to change it.',
          );
        sim.mode = action.mode;
      } else if (action.action === 'hint') {
        if (['evaluation', 'portfolio', 'review'].includes(session.phase))
          throw new DomainError('Coaching is available while investigating or revising.');
        if (sim.mode === 'expert') throw new DomainError('Expert mode has no contextual hints.');
        if (sim.hints.length >= 30)
          throw new DomainError(
            'Review your existing coaching notes before requesting more hints.',
          );
        sim.hints.push({
          kind: action.kind,
          text: coachingHint(session, action.kind),
          cost: sim.mode === 'hard' ? 2 : 0,
          createdAt: new Date().toISOString(),
        });
      } else if (action.action === 'chapter') {
        if (['review', 'evaluation', 'portfolio'].includes(session.phase))
          throw new DomainError('Advance the workstream before sealing the review.');
        if (sim.chapter >= scenario.lab!.chapters.length - 1)
          throw new DomainError('This is the final workstream chapter.');
        const unlocked = [...new Set(session.evidenceRequests.flatMap((r) => r.evidenceIds))];
        const required = scenario.evidenceAvailable.filter(
          (d) => d.chapter === sim.chapter && d.status === 'available',
        );
        if ((sim.chapter > 0 && !unlocked.length) || required.some((d) => !unlocked.includes(d.id)))
          throw new DomainError(
            'Obtain the records for the current chapter before recording its conclusion.',
          );
        sim.chapterNotes.push({ chapter: sim.chapter, text: action.note, evidenceIds: unlocked });
        sim.chapter++;
      } else if (action.action === 'defend') {
        only(session, ['review', 'final']);
        const challenge = sim.challenges.find((c) => c.id === action.challengeId);
        if (!challenge) throw new DomainError('Challenge not found.', 404);
        const unlocked = new Set(session.evidenceRequests.flatMap((r) => r.evidenceIds));
        if (action.evidenceIds.some((id) => !unlocked.has(id)))
          throw new DomainError('Cite requested evidence only.');
        challenge.answer = action.answer;
        challenge.evidenceIds = action.evidenceIds;
      }
    });
  }
  if (action.action === 'chat') {
    only(initial, [
      'discovery',
      'frame',
      'analysis',
      'options',
      'tradeoffs',
      'recommendation',
      'simplify',
      'conditions',
      'validation',
      'adr',
      'communication',
      'final',
    ]);
    const response = scenario.lab
      ? interview(scenario, initial, action.question, action.stakeholder)
      : await getProvider().respondAsClient(scenario, initial, action.question, action.stakeholder);
    return mutateCase(id, action.version, (session) => {
      only(session, [
        'discovery',
        'frame',
        'analysis',
        'options',
        'tradeoffs',
        'recommendation',
        'simplify',
        'conditions',
        'validation',
        'adr',
        'communication',
        'final',
      ]);
      const revealedFactIds = response.revealedFactIds.filter((factId) =>
        scenario.hiddenFacts.some((f) => f.id === factId),
      );
      const timestamp = new Date().toISOString();
      session.messages.push(
        {
          id: randomUUID(),
          role: 'consultant',
          text: action.question,
          timestamp,
          stakeholder: action.stakeholder,
          revealedFactIds: [],
        },
        {
          id: randomUUID(),
          role: 'client',
          text: response.text,
          timestamp,
          stakeholder: action.stakeholder,
          revealedFactIds,
        },
      );
      session.revealedFactIds = [...new Set([...session.revealedFactIds, ...revealedFactIds])];
    });
  }
  if (action.action === 'evidence') {
    only(initial, [
      'discovery',
      'frame',
      'analysis',
      'options',
      'tradeoffs',
      'recommendation',
      'simplify',
      'conditions',
      'validation',
      'adr',
      'communication',
      'final',
    ]);
    const response = scenario.lab
      ? requestDocument(scenario, initial, action.question)
      : await getProvider().requestEvidence(scenario, action.question, action.reason);
    return mutateCase(id, action.version, (session) => {
      only(session, [
        'discovery',
        'frame',
        'analysis',
        'options',
        'tradeoffs',
        'recommendation',
        'simplify',
        'conditions',
        'validation',
        'adr',
        'communication',
        'final',
      ]);
      session.evidenceRequests.push({
        id: randomUUID(),
        question: action.question,
        reason: action.reason,
        response: response.response,
        evidenceIds: response.evidenceIds.filter((eid) =>
          scenario.evidenceAvailable.some((e) => e.id === eid),
        ),
        status: response.status,
        timestamp: new Date().toISOString(),
      });
      session.revealedFactIds = [
        ...new Set([
          ...session.revealedFactIds,
          ...response.revealedFactIds.filter((fid) =>
            scenario.hiddenFacts.some((f) => f.id === fid),
          ),
        ]),
      ];
    });
  }
  if (action.action === 'review') {
    only(initial, ['review']);
    if (initial.reviews.length)
      throw new DomainError(
        'This first analysis has already been reviewed. Respond to the existing feedback.',
        409,
      );
    assertFirstAnalysisReady(initial);
    if (
      scenario.lab?.chapters.length &&
      initial.simulation!.chapter < scenario.lab.chapters.length - 1
    )
      throw new DomainError('Finish the staged workstream before sealing the first analysis.');
    if (
      scenario.lab &&
      ['Value Creation', 'Mega-Case'].includes(scenario.lab.family) &&
      scenario.lab.peStage === '100-Day Plan' &&
      !initial.draft.consulting?.initiatives.some(
        (i) =>
          [i.name, i.owner, i.baseline, i.target, i.kpi, i.timeline, i.risk, i.benefitKey].every(
            (v) => v.trim().length >= 3,
          ) && i.evidenceIds.length,
      )
    )
      throw new DomainError(
        'Record at least one sourced initiative with an owner, baseline, target, timeline, risk, KPI and unique benefit key.',
      );
    // Commit the immutable first analysis before any external request, including failures.
    const sealed = mutateCase(id, action.version, (session) => {
      sealSnapshot(session, 'first');
    });
    const provider = getProvider();
    const [review, communication] = await Promise.all([
      provider.reviewCase(scenario, sealed.session),
      provider.evaluateCommunication(sealed.session.draft),
    ]);
    const checked = reviewSchema.parse(review);
    return mutateCase(id, sealed.session.version, (session) => {
      session.reviews = [
        ...checked.map((item) => ({ ...item, id: randomUUID() })),
        ...communication.map((item) => ({
          id: randomUUID(),
          category: `Communication · ${item.audience}`,
          severity: 'info' as const,
          suggestion: item.feedback,
          response: null,
          rationale: '',
        })),
      ];
      session.reviewProvider = provider.name;
      if (session.simulation && !session.simulation.challenges.length)
        session.simulation.challenges = scenario
          .truth!.challengeQuestions.slice(0, session.simulation.level <= 2 ? 1 : 3)
          .map((q) => ({
            ...q,
            id: randomUUID(),
            answer: '',
            evidenceIds: [],
            createdAt: new Date().toISOString(),
          }));
    });
  }
  if (action.action === 'evaluate') {
    only(initial, ['final']);
    assertFirstAnalysisReady(initial);
    assertPhaseReady('review', initial);
    assertPhaseReady('final', initial);
    if (!initial.snapshots.some((snapshot) => snapshot.kind === 'first'))
      throw new DomainError('Your first analysis must be sealed before evaluation.');
    const baseline = evaluateCase(scenario, initial, 'Transparent rubric · scenario rules');
    const provider = getProvider() as ReturnType<typeof getProvider> & {
      evaluateCase?: (
        scenario: Scenario,
        session: CaseSession,
        baseline: Evaluation,
      ) => Promise<Evaluation>;
    };
    const sealed = mutateCase(id, action.version, (session) => {
      sealSnapshot(session, 'final');
      session.phase = 'evaluation';
      session.published = false;
      session.evaluation = provider.evaluateCase && !session.simulation ? null : baseline;
    });
    if (!provider.evaluateCase || initial.simulation) return sealed;
    let evaluation = baseline;
    try {
      evaluation = mergeSemanticEvaluation(
        baseline,
        await provider.evaluateCase(scenario, sealed.session, baseline),
        provider.name,
      );
    } catch {
      evaluation = {
        ...baseline,
        provider: 'Transparent rubric · AI evaluation unavailable',
        improvements: [
          ...baseline.improvements,
          'The semantic evaluator was unavailable or returned an invalid rubric. This score uses the local rubric and scenario safety rules.',
        ],
      };
    }
    return mutateCase(id, sealed.session.version, (session) => {
      session.evaluation = evaluation;
    });
  }
  return mutateCase(id, action.version, (session) => {
    switch (action.action) {
      case 'advance':
        advancePhase(session);
        break;
      case 'acceptAdr':
        only(session, ['adr', 'communication', 'final']);
        session.adrs.push(acceptADR(session.draft, session.adrs, action.supersedes, action.reason));
        break;
      case 'respondReview': {
        only(session, ['review', 'final']);
        const item = session.reviews.find((review) => review.id === action.reviewId);
        if (!item) throw new DomainError('Review item not found.', 404);
        item.response = action.response;
        item.rationale = action.rationale;
        break;
      }
      case 'publish':
        only(session, ['evaluation', 'portfolio']);
        if (!session.evaluation)
          throw new DomainError('Wait for the evaluation to finish before publishing.');
        // Publishing is the learner's choice. Keep the original evaluation and its
        // critical misses visible so a draft can be shared without implying it passed.
        session.phase = 'portfolio';
        session.published = true;
        break;
      case 'reopen':
        only(session, ['evaluation', 'portfolio']);
        if (session.evaluation)
          session.evaluationHistory = [...(session.evaluationHistory || []), session.evaluation];
        session.phase = 'final';
        session.published = false;
        session.evaluation = null;
        break;
    }
  });
}
