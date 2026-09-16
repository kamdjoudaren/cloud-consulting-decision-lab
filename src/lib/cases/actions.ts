import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { getProvider } from '../ai/provider';
import { acceptADR } from '../adr/service';
import { evaluateCase } from '../evaluation/scoring';
import { mergeSemanticEvaluation } from '../evaluation/semantic';
import { DomainError, type CaseAction } from '../validation';
import { advancePhase, assertFirstAnalysisReady, assertPhaseReady } from './workflow';
import { assertVersion, getCase, getScenario, mutateCase, sealSnapshot } from './store';
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
  const scenario = getScenario(initial.scenarioId);
  if (action.action === 'chat') {
    only(initial, [
      'discovery',
      'frame',
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
    const response = await getProvider().respondAsClient(
      scenario,
      initial,
      action.question,
      action.stakeholder,
    );
    return mutateCase(id, action.version, (session) => {
      only(session, [
        'discovery',
        'frame',
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
    const response = await getProvider().requestEvidence(scenario, action.question, action.reason);
    return mutateCase(id, action.version, (session) => {
      only(session, [
        'discovery',
        'frame',
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
      session.evaluation = provider.evaluateCase ? null : baseline;
    });
    if (!provider.evaluateCase) return sealed;
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
        assertPhaseReady('evaluation', session);
        session.phase = 'portfolio';
        session.published = true;
        break;
      case 'reopen':
        only(session, ['evaluation', 'portfolio']);
        session.phase = 'final';
        session.published = false;
        session.evaluation = null;
        break;
    }
  });
}
