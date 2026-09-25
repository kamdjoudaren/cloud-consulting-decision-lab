import type { CaseSession } from '../types';
import { valueLedger } from './economics';

export function reasoningFeedback(session: CaseSession): string[] {
  const c = session.draft.consulting;
  if (!c) return [];
  const feedback: string[] = [];
  const decision =
    `${session.draft.recommendation.decision} ${session.draft.recommendation.why} ${c.executiveSummary}`.toLowerCase();
  if (!c.economics.sourceIds.length)
    feedback.push(
      'Establish a comparable workload and financial baseline before concluding that a larger bill means worse efficiency.',
    );
  for (const f of c.findings) {
    if (f.technical.trim() && !f.operational.trim())
      feedback.push(
        `So what? “${f.title || 'This technical signal'}” needs an operational consequence.`,
      );
    else if (f.operational.trim() && !f.customer.trim())
      feedback.push(
        'So what for the customer? State the affected workflow, quality or service outcome.',
      );
    else if (f.businessMetric.trim() && !f.financialMetric.trim())
      feedback.push(
        'So what financially? Explain the possible transmission path without treating correlation as proof.',
      );
    if (f.confidence === 'high' && f.evidenceIds.length < 2)
      feedback.push(
        'High confidence needs corroboration. A statement or one limited sample may not establish the forecast.',
      );
    if (f.materiality !== 'green' && !f.materialityReason.trim())
      feedback.push(
        'Explain materiality using impact, timing and likelihood; a color alone is not a finding.',
      );
  }
  if (
    /3.year|three.year|savings plan|reserved instance/.test(decision) &&
    !/baseline|stable|utilization|defer|pending/.test(decision)
  )
    feedback.push(
      'A commitment decision needs workload stability, portability and downside utilization evidence first.',
    );
  if (
    /ebitda/.test(decision) &&
    /capacity|hours|engineer/.test(decision) &&
    !/not|avoidance|budget|payroll|conditional/.test(decision)
  )
    feedback.push(
      'Engineering capacity is not immediate EBITDA. Identify an actual budget change or classify the benefit separately.',
    );
  if (
    /multiple|valuation|enterprise value/.test(decision) &&
    !/sensitivity|illustrat|uncertain|conditional/.test(decision)
  )
    feedback.push(
      'Savings multiplied by a valuation multiple are an illustrative sensitivity, not a proven value increase. State the assumptions.',
    );
  feedback.push(...valueLedger(c.initiatives).warnings);
  return [...new Set(feedback)];
}
export function coachingHint(session: CaseSession, kind: string): string {
  if (kind === 'reasoning')
    return (
      reasoningFeedback(session)[0] ||
      'What plausible alternative explanation have you tested, and what observation would make you change your recommendation?'
    );
  if (kind === 'evidence')
    return 'Ask for a comparable period, a defined unit of useful output, its cost and a service-quality measure. Identify who owns each source and what the source does not prove.';
  if (kind === 'metric')
    return 'Cost per unit = comparable cost / completed useful units. Gross Margin = (recognized revenue − COGS) / revenue. Check scope, period and workload mix. A cost reduction is not automatically verified EBITDA.';
  return 'Separate what you observed, what you inferred and what remains unknown. Choose one question whose answer could change the decision.';
}
