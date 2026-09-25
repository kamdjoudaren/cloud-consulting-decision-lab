import type { CaseSession, Evaluation, Scenario } from '../types';
import { requirementCoverage } from '../requirements/traceability';
import { criticalMisses } from './critical-misses';
import { evaluateSimulation } from '../lab/scoring';

export const scoringWeights = {
  discovery: 20,
  framing: 10,
  architecture: 15,
  tradeoffs: 20,
  business: 10,
  operations: 10,
  communication: 10,
  limits: 5,
} as const;
const ratio = (values: string[]) =>
  values.length ? values.filter((s) => s.trim().length >= 12).length / values.length : 0;
const clamp = (value: number) => Math.min(1, Math.max(0, value));
export function evaluateCase(
  scenario: Scenario,
  session: CaseSession,
  provider = 'Mock · transparent rubric',
): Evaluation {
  if (session.simulation && scenario.lab && session.draft.consulting)
    return evaluateSimulation(scenario, session);
  const d = session.draft;
  const topics = new Set(scenario.hiddenFacts.map((f) => f.topic));
  const discovered = new Set(
    scenario.hiddenFacts.filter((f) => session.revealedFactIds.includes(f.id)).map((f) => f.topic),
  );
  const relevantEvidence = session.evidenceRequests.filter(
    (r) => r.evidenceIds.length && r.reason.trim().length >= 12,
  );
  const epistemic =
    d.notes.some((n) => n.kind === 'assumption') && d.notes.some((n) => n.kind === 'unknown');
  const facts = d.notes.filter((n) => n.kind === 'fact');
  const coverage = requirementCoverage(d.requirements, d.links);
  const comparableOptions = d.options.length >= 2 ? 1 : 0;
  const uniqueOptions =
    new Set(d.options.map((o) => o.summary.trim().toLowerCase())).size >= 2 ? 1 : 0;
  const opsFields = d.options.flatMap((o) => [o.operations, o.reliability, o.security, o.risks]);
  const businessFields = [
    d.framing.businessImpact,
    ...d.options.map((o) => o.cost),
    d.communication.cfo,
  ];
  const quantitativeBusiness =
    businessFields.filter((v) => /\d/.test(v)).length / Math.max(1, businessFields.length);
  const communications = [
    d.communication.engineer,
    d.communication.cto,
    d.communication.cfo,
    d.communication.ceo,
  ];
  const distinctAudiences = new Set(communications.map((v) => v.trim().toLowerCase())).size / 4;
  const execJargon =
    (d.communication.ceo + ' ' + d.communication.withoutServiceNames).match(
      /\b(?:EC2|EKS|ECS|RDS|IAM|VPC|SQS|SNS|Fargate|Aurora|Kinesis)\b/g,
    )?.length || 0;
  const dimensions: Evaluation['dimensions'] = [];
  const add = (name: string, max: number, value: number, feedback: string) =>
    dimensions.push({ name, max, score: Math.round(max * clamp(value)), feedback });
  add(
    'Discovery quality',
    20,
    (0.45 * discovered.size) / Math.max(1, topics.size) +
      0.2 * ratio(d.requirements.map((r) => r.text + ' ' + r.source)) +
      0.15 * Number(epistemic) +
      0.1 * Number(facts.length > 0 && facts.every((n) => n.source.trim())) +
      0.1 * Math.min(1, relevantEvidence.length),
    `${discovered.size}/${topics.size} discovery topics established; ${relevantEvidence.length} reasoned evidence request(s). Keep assumptions separate from facts and pursue constraints that could change the decision.`,
  );
  add(
    'Problem framing',
    10,
    ratio(Object.values(d.framing)) * 0.7 +
      0.3 *
        Number(
          d.framing.actualProblem.trim().toLowerCase() !==
            d.framing.statedProblem.trim().toLowerCase() && d.framing.actualProblem.length >= 20,
        ),
    'A strong framing separates the client’s symptoms from an actionable business problem and makes uncertainties explicit.',
  );
  add(
    'Architecture',
    15,
    0.25 * comparableOptions +
      0.15 * uniqueOptions +
      0.35 *
        ratio(
          d.options.flatMap((o) => [
            o.components,
            o.summary,
            o.implementation,
            o.assumptions,
            o.risks,
          ]),
        ) +
      0.25 * coverage,
    `${d.options.length} alternatives compared; ${Math.round(coverage * 100)}% of requirements traced. The rubric rewards documented fit, not particular cloud services.`,
  );
  add(
    'Trade-off reasoning',
    20,
    0.5 * ratio(d.options.flatMap((o) => [o.tradeoffRationale, o.advantages, o.disadvantages])) +
      0.25 * ratio([d.recommendation.why, d.recommendation.alternatives, d.simpler]) +
      0.25 * coverage,
    'Trade-offs need explicit advantages, accepted costs, simpler alternatives, and connections to requirements. Numeric ratings do not determine this score.',
  );
  add(
    'Cost and business reasoning',
    10,
    0.7 * ratio(businessFields) + 0.3 * quantitativeBusiness,
    'Tie costs to a stated budget, observed baseline, or financial impact. Ranges and explicitly labeled estimates are acceptable.',
  );
  add(
    'Security, reliability, operations',
    10,
    0.65 * ratio(opsFields) +
      0.35 *
        ratio([
          d.recommendation.risks,
          d.framing.constraints,
          d.poc.required ? d.poc.exit : d.poc.justification,
        ]),
    'Document failure modes, security controls, operational ownership, and a practical validation or exit path.',
  );
  add(
    'Communication',
    10,
    0.55 * ratio(communications) +
      0.25 * distinctAudiences +
      0.2 * Number(d.communication.withoutServiceNames.trim().length >= 12 && execJargon <= 1),
    'Adapt the same decision to each audience. Executive explanations should describe business outcomes and risk in plain language.',
  );
  add(
    'Limits and change of mind',
    5,
    0.5 *
      Number(
        d.conditions.length > 0 &&
          d.conditions.every(
            (c) => ratio([c.condition, c.signal, c.threshold, c.alternative]) >= 0.5,
          ),
      ) +
      0.5 *
        (d.poc.required
          ? ratio([d.poc.hypothesis, d.poc.metrics, d.poc.success, d.poc.exit, d.poc.goNoGo])
          : ratio([d.poc.justification])),
    'Revisit the decision when an observable threshold changes. A POC should have measurable success and stop criteria.',
  );
  const misses = criticalMisses(scenario, session);
  const total = dimensions.reduce((sum, dimension) => sum + dimension.score, 0);
  return {
    total,
    status: misses.length ? 'needs_revision' : 'completed',
    dimensions,
    criticalMisses: misses,
    strengths: dimensions
      .filter((item) => item.score / item.max >= 0.8)
      .map((item) => `${item.name}: ${item.score}/${item.max}`),
    improvements: dimensions
      .filter((item) => item.score / item.max < 0.8)
      .map((item) => item.feedback),
    provider,
    evaluatedAt: new Date().toISOString(),
  };
}
