import type { CaseSession, Evaluation, Scenario } from '../types';
import { economicMetrics, valueLedger } from './economics';
import { reasoningFeedback } from './coaching';
import { criticalMisses } from '../evaluation/critical-misses';

const nonempty = (v: string) => v.trim().length > 0;
export function evaluateSimulation(s: Scenario, session: CaseSession): Evaluation {
  const c = session.draft.consulting!;
  const docs = s.evidenceAvailable.filter((d) =>
    session.evidenceRequests.some((r) => r.evidenceIds.includes(d.id)),
  );
  const evidence = new Set(
    docs.filter((d) => ['available', 'approximate'].includes(d.status)).map((d) => d.id),
  );
  const measured = docs.find((d) => d.metrics)?.metrics;
  const actual = measured ? economicMetrics({ ...c.economics, ...measured }) : null;
  const inputMatches = measured
    ? Object.entries(measured).every(([key, value]) => {
        if (!(key in c.economics)) return true;
        return c.economics[key as keyof typeof c.economics] === value;
      })
    : true;
  const conclusionMatches =
    !actual?.unitChange ||
    c.economics.conclusion === (actual.unitChange < 0 ? 'improving' : 'deteriorating') ||
    c.economics.conclusion === 'mixed';
  const misses = criticalMisses(s, session);
  if (measured && !inputMatches)
    misses.push(
      'The economic inputs do not reconcile to the requested ledger. Correct them or explicitly document a different, comparable source.',
    );
  if (measured && !conclusionMatches && c.economics.conclusion !== 'unknown')
    misses.push(
      'The stated unit-economics conclusion contradicts the supplied comparable workload evidence.',
    );
  const ledger = valueLedger(c.initiatives);
  misses.push(...ledger.warnings);
  if (c.initiatives.some((i) => i.kind === 'capacity' && i.verifiedAnnualValue > 0))
    misses.push(
      'Recovered engineering capacity cannot be claimed as verified cash savings in the same initiative.',
    );
  const unsupported = c.findings.filter(
    (f) =>
      f.confidence === 'high' &&
      (f.evidenceIds.length < 2 || f.evidenceIds.some((id) => !evidence.has(id))),
  );
  if (unsupported.length)
    misses.push(
      'A high-confidence finding lacks corroborating available evidence. Reduce confidence or obtain support.',
    );
  if (s.lab!.chapters.length && session.simulation!.chapter < s.lab!.chapters.length - 1)
    misses.push(
      'Complete the staged workstream before defending the final mega-case recommendation.',
    );
  const gaps = s
    .truth!.expectedFindings.filter((f) => f.evidenceIds.some((id) => !evidence.has(id)))
    .map((f) => `Missing source support for: ${f.finding}`);
  const baselineFindings = c.findings.filter((f) => f.evidenceIds.some((id) => evidence.has(id)));
  const chainFields = [
    'technical',
    'operational',
    'customer',
    'businessMetric',
    'financialMetric',
    'action',
    'validation',
  ] as const;
  const completeChains = baselineFindings.filter((f) =>
    chainFields.every((key) => nonempty(f[key])),
  );
  const ratio = (n: number, d: number) => Math.min(1, n / Math.max(1, d));
  const hasUnknown = session.draft.notes.some((n) => n.kind === 'unknown' && n.validation.trim());
  const judgements = s.truth!.expectedFindings.filter((expected) =>
    c.findings.some(
      (f) =>
        expected.evidenceIds.some((id) => f.evidenceIds.includes(id)) &&
        expected.keywords.some((word) =>
          `${f.technical} ${f.action} ${c.technicalAnalysis}`
            .toLowerCase()
            .includes(word.toLowerCase()),
        ),
    ),
  );
  const weights =
    session.simulation!.level <= 2
      ? [20, 15, 20, 10, 10, 10, 5, 5, 2.5, 2.5]
      : [15, 10, 20, 10, 10, 15, 7.5, 5, 5, 2.5];
  const answers = session.simulation!.challenges;
  const checks: [string, number, string][] = [
    [
      'Discovery',
      ratio(
        new Set(
          session.messages
            .filter((m) => m.role === 'consultant')
            .map((m) => m.text.trim().toLowerCase()),
        ).size,
        session.simulation!.level <= 2 ? 3 : 5,
      ),
      'Ask distinct questions that test the client’s framing, constraints and alternative explanations.',
    ],
    [
      'Evidence gathering',
      ratio(
        evidence.size,
        Math.min(3, s.evidenceAvailable.filter((d) => d.status === 'available').length),
      ),
      'Credit is based on requested source records; planned tests are not measured evidence.',
    ],
    [
      'Technical reasoning',
      0.5 * ratio(judgements.length, s.truth!.expectedFindings.length) +
        0.25 * Number(nonempty(c.hypotheses)) +
        0.25 * Number(nonempty(c.technicalAnalysis)),
      'Tie the technical diagnosis to source evidence and test an alternative explanation. Mock checks provide formative evidence coverage, not a semantic guarantee.',
    ],
    [
      'FinOps / Economics',
      0.4 * Number(inputMatches && c.economics.sourceIds.some((id) => evidence.has(id))) +
        0.4 * Number(conclusionMatches && nonempty(c.economics.interpretation)) +
        0.2 * Number(!ledger.warnings.length),
      'Reconcile comparable units, costs, periods and offsets. Keep cash, avoidance and capacity distinct.',
    ],
    [
      'Business understanding',
      ratio(
        baselineFindings.filter(
          (f) =>
            nonempty(f.customer) && nonempty(f.businessMetric) && nonempty(f.materialityReason),
        ).length,
        Math.max(1, c.findings.length),
      ),
      'Explain who is affected, why the metric matters and whether the finding is material.',
    ],
    [
      'Technology → Value',
      ratio(completeChains.length, Math.max(1, c.findings.length)),
      'Connect the full causal path with evidence, uncertainty and a specific action. Beginners do not need valuation expertise.',
    ],
    [
      'Trade-offs',
      ratio(
        session.draft.options.filter(
          (o) => nonempty(o.cost) && nonempty(o.risks) && nonempty(o.tradeoffRationale),
        ).length,
        2,
      ),
      'Compare viable alternatives including deferral or the status quo when defensible.',
    ],
    [
      'Risk / uncertainty',
      0.5 * Number(hasUnknown) +
        0.5 * Number(!unsupported.length && c.findings.some((f) => nonempty(f.validation))),
      'Explicit uncertainty with a measurable validation plan is good judgment.',
    ],
    [
      'Executive communication',
      Number(
        nonempty(c.executiveSummary) &&
          nonempty(session.draft.communication.cfo) &&
          c.executiveSummary.trim() !== session.draft.communication.engineer.trim(),
      ),
      'Adapt the explanation to a decision-maker rather than repeating technical detail.',
    ],
    [
      'Defense under challenge',
      ratio(
        answers.filter(
          (a) => a.answer.trim().length >= 20 && a.evidenceIds.some((id) => evidence.has(id)),
        ).length,
        Math.max(1, answers.length),
      ),
      'Defend a conditional position and cite evidence when challenged.',
    ],
  ];
  const dimensions = checks.map(([name, value, feedback], i) => ({
    name,
    max: weights[i],
    score: Math.round(weights[i] * value * 2) / 2,
    feedback,
  }));
  const penalty = Math.min(
    10,
    session.simulation!.hints.reduce((sum, h) => sum + h.cost, 0),
  );
  // Apply penalty to a visible dimension so the displayed dimensions still sum to the total.
  dimensions[0].score = Math.max(0, dimensions[0].score - penalty);
  if (penalty)
    dimensions[0].feedback += ` Hard-mode assistance cost: ${penalty} points (capped at the earned discovery score).`;
  const mistakes = reasoningFeedback(session);
  return {
    total: dimensions.reduce((n, d) => n + d.score, 0),
    dimensions,
    status: misses.length ? 'needs_revision' : 'completed',
    criticalMisses: [...new Set(misses)],
    strengths: dimensions.filter((d) => d.max > 0 && d.score / d.max >= 0.8).map((d) => d.name),
    improvements: [
      ...mistakes,
      ...dimensions.filter((d) => d.max > 0 && d.score / d.max < 0.8).map((d) => d.feedback),
    ],
    provider: 'Deterministic simulation rubric v2',
    evaluatedAt: new Date().toISOString(),
    debrief: {
      summary: misses.length
        ? 'Revise the unsupported claims before publishing.'
        : 'Your investigation is complete. Review the reasoning and plan another attempt.',
      reasoning: s.truth!.debrief,
      mistakes,
      nextPractice: [
        s.lab!.family === 'FinOps'
          ? 'Try the same unit-economics question in a Value Creation context.'
          : 'Repeat with less assistance or a different professional context.',
        'Choose the lowest-scoring dimension and name one concrete behavior to improve.',
      ],
      evidenceGaps: gaps,
      hintsUsed: session.simulation!.hints.length,
      hintPenalty: penalty,
    },
  };
}
