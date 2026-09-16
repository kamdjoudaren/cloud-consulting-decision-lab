import { phases, type CaseSession, type Draft, type Phase } from '../types';
import { hasCurrentADR } from '../adr/service';
import { requirementCoverage, validateTraceability } from '../requirements/traceability';
import { DomainError } from '../validation';

const filled = (...values: string[]) => values.every((value) => value.trim().length > 0);
export function phaseIssues(phase: Phase, session: CaseSession): string[] {
  const d = session.draft;
  switch (phase) {
    case 'brief':
      return [];
    case 'discovery':
      return d.requirements.some((r) => filled(r.text, r.source))
        ? []
        : ['Record at least one requirement with its source.'];
    case 'frame':
      return Object.values(d.framing).every((value) => filled(value))
        ? []
        : ['Complete all six problem framing fields.'];
    case 'options':
      return d.options.length >= 2 &&
        d.options.every((o) =>
          filled(
            o.name,
            o.summary,
            o.components,
            o.advantages,
            o.disadvantages,
            o.cost,
            o.operations,
            o.reliability,
            o.security,
            o.implementation,
            o.assumptions,
            o.risks,
          ),
        )
        ? []
        : [
            'Compare at least two options and complete their costs, risks, assumptions, and operational implications.',
          ];
    case 'tradeoffs':
      return d.options.every((o) => filled(o.tradeoffRationale))
        ? []
        : ['Explain the trade-offs for every option; numeric ratings alone are insufficient.'];
    case 'recommendation':
      return filled(
        d.recommendation.optionId,
        d.recommendation.decision,
        d.recommendation.why,
        d.recommendation.alternatives,
        d.recommendation.risks,
        d.recommendation.assumptions,
      ) &&
        (d.recommendation.optionId === 'hybrid' ||
          d.options.some((o) => o.id === d.recommendation.optionId)) &&
        requirementCoverage(d.requirements, d.links) === 1
        ? []
        : [
            'Select an option or hybrid, explain your recommendation, and trace every requirement (including those at risk or unaddressed).',
          ];
    case 'simplify':
      return filled(d.simpler)
        ? []
        : ['Explain why a simpler approach does or does not meet the requirements.'];
    case 'conditions':
      return d.conditions.length > 0 &&
        d.conditions.every((c) => filled(c.condition, c.signal, c.threshold, c.alternative))
        ? []
        : ['Define at least one observable change condition, signal, threshold, and alternative.'];
    case 'validation':
      return d.poc.required
        ? filled(
            d.poc.hypothesis,
            d.poc.scope,
            d.poc.metrics,
            d.poc.success,
            d.poc.exit,
            d.poc.goNoGo,
          )
          ? []
          : ['Complete the POC hypothesis, scope, metrics, success, exit, and go/no-go criteria.']
        : filled(d.poc.justification, d.poc.scope, d.poc.success, d.poc.goNoGo)
          ? []
          : [
              'Justify why a POC is unnecessary and provide validation scope, success criteria, and a go/no-go decision.',
            ];
    case 'adr':
      return hasCurrentADR(d, session.adrs)
        ? []
        : ['Accept the current decision record, or create a superseding ADR for changed content.'];
    case 'communication':
      return filled(
        d.communication.engineer,
        d.communication.cto,
        d.communication.cfo,
        d.communication.ceo,
      )
        ? []
        : ['Explain the decision to engineers, the CTO, CFO, and CEO.'];
    case 'review':
      return session.reviews.length > 0 &&
        session.reviews.every((r) => r.response && r.rationale.trim().length >= 10)
        ? []
        : [
            'Request your review and accept, partially accept, or reject every item with a rationale.',
          ];
    case 'final':
      return filled(d.finalDecision, d.lessons)
        ? []
        : ['Write your final decision and lessons learned before evaluation.'];
    case 'evaluation':
      return session.evaluation?.status === 'completed'
        ? []
        : ['Resolve the critical misses and re-evaluate before publishing.'];
    case 'portfolio':
      return [];
  }
}

export function assertPhaseReady(phase: Phase, session: CaseSession): void {
  const issues = phaseIssues(phase, session);
  if (issues.length) throw new DomainError(issues.join(' '));
}

export function assertFirstAnalysisReady(session: CaseSession): void {
  for (const phase of phases.slice(1, phases.indexOf('review'))) assertPhaseReady(phase, session);
  validateTraceability(session.draft.requirements, session.draft.links);
}

export function advancePhase(session: CaseSession): void {
  if (session.phase === 'final')
    throw new DomainError('Use Evaluate to seal and score your final analysis.');
  if (session.phase === 'portfolio')
    throw new DomainError('This case is complete. Reopen it to record a revision.');
  const currentIndex = phases.indexOf(session.phase);
  for (const phase of phases.slice(1, currentIndex + 1)) assertPhaseReady(phase, session);
  session.phase = phases[phases.indexOf(session.phase) + 1];
}

export function validateDraft(draft: Draft): void {
  const ids = (values: { id: string }[], label: string) => {
    if (new Set(values.map((v) => v.id)).size !== values.length)
      throw new DomainError(`${label} IDs must be unique.`);
  };
  ids(draft.notes, 'Note');
  ids(draft.options, 'Option');
  ids(draft.conditions, 'Condition');
  for (const note of draft.notes)
    if (note.kind === 'fact' && note.text.trim() && !note.source.trim())
      throw new DomainError(
        'Facts require a source. Keep unconfirmed information as an assumption or unknown.',
      );
  validateTraceability(draft.requirements, draft.links);
}
