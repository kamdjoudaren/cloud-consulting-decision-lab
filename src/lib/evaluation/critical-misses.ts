import type { CaseSession, Scenario } from '../types';

export function criticalMisses(scenario: Scenario, session: CaseSession): string[] {
  const d = session.draft;
  const misses: string[] = [];
  const decision = `${d.recommendation.decision} ${d.finalDecision}`.toLowerCase();
  const reasoning = [
    d.recommendation.why,
    d.recommendation.risks,
    d.recommendation.assumptions,
    d.simpler,
    d.poc.justification,
    d.poc.scope,
    d.poc.metrics,
    d.poc.success,
    ...d.notes.map((n) => `${n.text} ${n.validation}`),
  ]
    .join(' ')
    .toLowerCase();
  const explicitlyDeferred =
    /(?:defer|not (?:yet |ready to )?(?:decide|commit|approve)|before (?:committing|deciding)|conditional|pending (?:measurement|validation|confirmation))/.test(
      decision + ' ' + d.recommendation.why.toLowerCase(),
    );
  const pendingValidation = d.poc.required && !!d.poc.metrics.trim() && !!d.poc.success.trim();
  const flags = scenario.redFlags
    .map((flag) => `${flag.topic} ${flag.description}`)
    .join(' ')
    .toLowerCase();
  const selected = d.options.find((option) => option.id === d.recommendation.optionId);
  const proposedArchitecture =
    `${decision} ${selected?.name || ''} ${selected?.components || ''}`.toLowerCase();
  const evidenceContext =
    `${scenario.constraints.join(' ')} ${scenario.hiddenFacts.map((fact) => fact.text).join(' ')}`.toLowerCase();
  for (const fact of scenario.hiddenFacts.filter((f) => f.critical)) {
    if (session.revealedFactIds.includes(fact.id)) continue;
    const acknowledged = d.notes.some(
      (n) =>
        n.kind === 'unknown' &&
        (n.text.toLowerCase().includes(fact.topic.toLowerCase()) ||
          fact.keywords.some((k) => n.text.toLowerCase().includes(k.toLowerCase()))) &&
        n.validation.trim(),
    );
    if (!(explicitlyDeferred && pendingValidation && acknowledged))
      misses.push(
        `A decision-critical ${fact.topic} constraint was not established. Discover it, or explicitly defer the decision with a measurable validation plan.`,
      );
  }
  if (
    /\b(?:public(?:ly accessible)?|internet[- ]accessible) (?:database|db|rds)\b/.test(
      proposedArchitecture,
    ) &&
    !/\b(?:no|not|never|avoid|reject|remove|disable)\b.{0,45}\bpublic/.test(proposedArchitecture) &&
    !/(?:restricted|allowlist|least privilege|access control)/.test(
      reasoning + ' ' + (selected?.security || '').toLowerCase(),
    )
  )
    misses.push(
      'The proposed database exposure has no documented access controls or justification.',
    );
  if (
    /(?:sensitive|confidential|customer data)/i.test(
      scenario.businessBrief + ' ' + scenario.constraints.join(' '),
    ) &&
    /(?:ai|model|inference|llm)/i.test(scenario.category + ' ' + scenario.title) &&
    !/(?:encrypt|redact|residen|retention|access control|least privilege|private|consent|data boundar)/.test(
      reasoning +
        ' ' +
        d.options
          .map((o) => o.security)
          .join(' ')
          .toLowerCase(),
    )
  )
    misses.push(
      'Sensitive data enters an AI workflow without documented access, retention, or data boundary controls.',
    );
  const financialCommitment =
    /(?:3[- ]year|three[- ]year|long[- ]term commitment|savings plans?|reserved instances?)/.test(
      proposedArchitecture,
    ) &&
    !/(?:do not|don't|reject|avoid|no)\s+(?:buy|purchase|commit|recommend|approve)?[^.!?]{0,45}(?:commitment|savings plan|reserved instance)/.test(
      decision,
    );
  const baselineMissing =
    /(?:no|without|missing|unavailable|lack)[^.!?]{0,50}(?:baseline|utilization history|usage history)/.test(
      evidenceContext,
    ) ||
    /(?:baseline|utilization history)[^.!?]{0,40}(?:unknown|unavailable|missing|not measured)/.test(
      evidenceContext,
    );
  if (
    financialCommitment &&
    baselineMissing &&
    /(?:baseline|commit|utilization)/.test(flags) &&
    !explicitlyDeferred
  )
    misses.push(
      'A long-term financial commitment is proposed despite the scenario’s missing usage baseline. Measure representative usage and defer the commitment.',
    );
  const platformHeavy = /\b(?:eks|kubernetes|self[- ]managed (?:kafka|database|cluster))\b/.test(
    proposedArchitecture,
  );
  const staffingPlan =
    /(?:hire|hiring|recruit|dedicated platform team|managed operations partner|training plan)/.test(
      reasoning + ' ' + (selected?.operations || '').toLowerCase(),
    );
  if (
    platformHeavy &&
    scenario.engineeringTeamSize <= 3 &&
    /(?:team|operation|kubernetes|platform|complexity)/.test(flags) &&
    /(?:no|without|limited|lack)[^.!?]{0,50}(?:platform|kubernetes|operations|operational)/.test(
      evidenceContext,
    ) &&
    !staffingPlan &&
    !explicitlyDeferred
  )
    misses.push(
      'The proposed platform requires operational capacity the scenario’s small team does not have. Simplify it or document a funded staffing and operations plan.',
    );
  for (const requirement of d.requirements.filter((r) => r.priority === 'must')) {
    const link = d.links.find((l) => l.requirementId === requirement.id);
    if (!link || link.status === 'unaddressed')
      misses.push(
        `${requirement.id} is a must-have requirement with no addressed decision. Record a mitigation or revise the recommendation.`,
      );
  }
  if (d.notes.some((n) => n.kind === 'fact' && !n.source.trim()))
    misses.push(
      'An unsupported statement is recorded as a fact. Supply evidence or label it as an assumption.',
    );
  return [...new Set(misses)];
}
