import { phases, type CaseSession, type Phase } from '../types';
export function workflowPhases(session: CaseSession): Phase[] {
  if (!session.simulation) return [...phases];
  const core: Phase[] = ['brief', 'discovery', 'analysis', 'options', 'recommendation'];
  if (session.simulation.level >= 3) core.push('conditions', 'validation', 'adr');
  return [...core, 'communication', 'review', 'final', 'evaluation', 'portfolio'];
}
export function labPhaseIssues(phase: Phase, session: CaseSession): string[] | null {
  const d = session.draft,
    c = d.consulting;
  if (!session.simulation) return null;
  const filled = (...values: string[]) => values.every((v) => v.trim().length >= 5);
  if (!c) return ['This simulation needs a consulting draft. Reload the case.'];
  switch (phase) {
    case 'discovery':
      return session.messages.some((m) => m.role === 'consultant') &&
        session.evidenceRequests.some((e) => e.evidenceIds.length) &&
        d.requirements.some((r) => filled(r.text, r.source))
        ? []
        : [
            'Ask a stakeholder a question, obtain a relevant document, and record a sourced requirement.',
          ];
    case 'analysis': {
      const issues: string[] = [];
      if (!filled(c.technicalAnalysis, c.hypotheses, c.economics.interpretation))
        issues.push(
          'Record your technical interpretation, competing hypothesis, and economic interpretation.',
        );
      if (!c.economics.sourceIds.length)
        issues.push('Link the economic analysis to an unlocked document.');
      if (
        !c.findings.some(
          (f) =>
            filled(
              f.technical,
              f.operational,
              f.customer,
              f.businessMetric,
              f.financialMetric,
              f.action,
              f.validation,
            ) && f.evidenceIds.length,
        )
      )
        issues.push(
          'Connect one evidence-backed technical finding to operations, customers, business and finance, with an action and validation step.',
        );
      if (
        session.simulation.level >= 3 &&
        (!d.notes.some((n) => n.kind === 'unknown') ||
          !d.notes.some((n) => n.kind === 'assumption'))
      )
        issues.push(
          'Distinguish at least one assumption and one unknown in the discovery notebook.',
        );
      return issues;
    }
    case 'options':
      return d.options.length >= 2 &&
        d.options.every((o) => filled(o.name, o.summary, o.cost, o.risks, o.tradeoffRationale))
        ? []
        : [
            'Compare at least two options, including cost, risk and a written trade-off. Keeping the status quo is a valid option.',
          ];
    case 'communication':
      return filled(d.communication.engineer, d.communication.cfo, c.executiveSummary) &&
        (session.simulation.level < 4 || filled(c.operatingPartner, c.investmentCommittee))
        ? []
        : [
            'Write the engineer and CFO explanations and an executive summary. Advanced cases also need Operating Partner and IC explanations.',
          ];
    case 'review':
      return null;
    case 'final': {
      const issues: string[] = [];
      if (!filled(d.finalDecision, d.lessons))
        issues.push('Write a final decision and reflection.');
      if (
        !session.simulation.challenges.length ||
        session.simulation.challenges.some((q) => !filled(q.answer))
      )
        issues.push('Answer each executive challenge before evaluation.');
      if (
        session.simulation.level >= 4 &&
        !c.deliverables.some((doc) => filled(doc.title, doc.body))
      )
        issues.push('Create a structured work product in the Deliverables tab.');
      return issues;
    }
    default:
      return null;
  }
}
