import { randomUUID } from 'node:crypto';
import type {
  CaseSession,
  ClientResponse,
  Draft,
  EvidenceResponse,
  GeneratorInput,
  ReviewItem,
  Scenario,
} from '../types';
import type { AIProvider } from './types';
import { scenarios } from '../scenarios/seeds';
import { scenarioSchema } from '../scenarios/schema';
import { criticalMisses } from '../evaluation/critical-misses';
import { requirementCoverage } from '../requirements/traceability';

const normalized = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
export function matchScore(question: string, keywords: string[]): number {
  const q = ` ${normalized(question)} `;
  return keywords.reduce(
    (score, keyword) => score + Number(q.includes(` ${normalized(keyword)} `)),
    0,
  );
}
export function isSolutionRequest(question: string): boolean {
  return /(?:what architecture should|which (?:architecture|service|cloud|aws).*(?:should|choose)|recommend (?:an? |the )?(?:architecture|solution|service)|solve (?:this|the) (?:case|problem)|give me (?:the )?(?:answer|solution)|quelle (?:architecture|solution).*(?:recommande|choisir)|donne.*(?:solution|reponse)|recommande.*(?:architecture|service))|(?:(?:reveal|show|dump|list|give|revele|montre).*(?:all (?:the )?(?:facts|data)|hidden facts|system prompt|evaluator|answer key|faits caches))|ignore (?:all |previous |les )?instructions/i.test(
    normalized(question),
  );
}
export function relevantFacts(
  scenario: Scenario,
  question: string,
  alreadyRevealed: string[] = [],
) {
  if (isSolutionRequest(question)) return [];
  return scenario.hiddenFacts
    .map((fact) => ({ fact, score: matchScore(question, [fact.topic, ...fact.keywords]) }))
    .filter((item) => item.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        Number(alreadyRevealed.includes(a.fact.id)) - Number(alreadyRevealed.includes(b.fact.id)),
    )
    .slice(0, 2)
    .map((item) => item.fact);
}

export class MockProvider implements AIProvider {
  constructor(public readonly name = 'Mock · local simulation') {}
  async respondAsClient(
    scenario: Scenario,
    session: CaseSession,
    question: string,
    stakeholder: string,
  ): Promise<ClientResponse> {
    if (isSolutionRequest(question))
      return {
        text: 'That is what we are hoping you can help us determine. Ask us about the business, our constraints, or the evidence you need before making your recommendation.',
        revealedFactIds: [],
      };
    const role =
      scenario.stakeholders.find((person) => person.name === stakeholder)?.role || stakeholder;
    if (
      /\b(?:rto|rpo)\b/i.test(question) &&
      !/(?:recover|downtime|data loss|lose|restore)/i.test(question) &&
      /(?:ceo|cfo|founder)/i.test(role)
    )
      return {
        text: "I don't know that acronym. Could you ask in terms of how long we could be offline, or how much recent work we could afford to lose?",
        revealedFactIds: [],
      };
    const facts = relevantFacts(scenario, question, session.revealedFactIds);
    if (!facts.length)
      return {
        text: "I don't have a reliable answer to that yet. Could you narrow the question to a business constraint or a specific measurement? If we aren't measuring it, we can discuss what evidence you need.",
        revealedFactIds: [],
      };
    return {
      text: facts.map((fact) => `${fact.text} (Source: ${fact.source})`).join('\n\n'),
      revealedFactIds: facts.map((fact) => fact.id),
    };
  }
  async requestEvidence(
    scenario: Scenario,
    question: string,
    reason: string,
  ): Promise<EvidenceResponse> {
    if (isSolutionRequest(question))
      return {
        response:
          'Please request a specific measurement or artifact and explain how it could change your decision.',
        evidenceIds: [],
        revealedFactIds: [],
        status: 'unavailable',
      };
    const evidence = scenario.evidenceAvailable
      .map((item) => ({ item, score: matchScore(question, [item.topic, ...item.keywords]) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)[0]?.item;
    if (!evidence)
      return {
        response: `We do not currently have that evidence available. Engineering would need to define and collect the measurement. Record this as an unknown and use your reason — “${reason}” — to prioritize validation.`,
        evidenceIds: [],
        revealedFactIds: [],
        status: 'measurement_required',
      };
    const facts = relevantFacts(scenario, question).filter(
      (fact) =>
        fact.topic === evidence.topic ||
        fact.keywords.some((key) => evidence.keywords.includes(key)),
    );
    return {
      response: `${evidence.title}\n\n${evidence.content}`,
      evidenceIds: [evidence.id],
      revealedFactIds: facts.map((fact) => fact.id),
      status: evidence.status,
    };
  }
  async reviewCase(scenario: Scenario, session: CaseSession): Promise<ReviewItem[]> {
    const d = session.draft;
    const items: ReviewItem[] = [];
    const add = (category: string, severity: ReviewItem['severity'], suggestion: string) =>
      items.push({
        id: randomUUID(),
        category,
        severity,
        suggestion,
        response: null,
        rationale: '',
      });
    for (const miss of criticalMisses(scenario, session).slice(0, 4))
      add('Decision-critical evidence', 'critical', miss);
    if (
      !d.notes.some((note) => note.kind === 'assumption') ||
      !d.notes.some((note) => note.kind === 'unknown')
    )
      add(
        'Facts versus assumptions',
        'warning',
        'Your notes do not distinguish both assumptions and unknowns. Identify what is inferred, what remains unmeasured, and which uncertainty could change this decision.',
      );
    if (requirementCoverage(d.requirements, d.links) < 1)
      add(
        'Traceability',
        'warning',
        'Some requirements have no explained decision link. Show which are satisfied, at risk, or deliberately unaddressed.',
      );
    const acceptedRisks = d.links.filter((link) => link.status === 'at_risk');
    if (acceptedRisks.length)
      add(
        'Accepted risk',
        'warning',
        `You marked ${acceptedRisks.map((link) => link.requirementId).join(', ')} at risk. Explain the mitigation, owner, and threshold that would trigger an alternative.`,
      );
    if (!session.evidenceRequests.length)
      add(
        'Validation',
        'warning',
        'No evidence request supports the recommendation yet. Defend why the available client statements are enough, or identify one measurement that could disprove your diagnosis.',
      );
    add(
      'Trade-offs',
      'info',
      `You recommend “${d.recommendation.decision}”. Defend it against your least complex alternative using a specific requirement and the team’s operating capacity. A more sophisticated service is not automatically a better fit.`,
    );
    add(
      'Change of mind',
      'info',
      d.conditions.length
        ? `Your first reconsideration threshold is “${d.conditions[0].threshold}”. Explain who will observe this signal and when the decision will be reviewed.`
        : 'Name an observable threshold that would make your current recommendation inappropriate.',
    );
    return items;
  }
  async evaluateCommunication(draft: Draft) {
    const feedback: { audience: string; feedback: string }[] = [];
    const executive = `${draft.communication.ceo} ${draft.communication.cfo}`;
    if (/\b(?:EKS|ECS|RDS|IAM|VPC|SQS|EC2)\b/.test(executive))
      feedback.push({
        audience: 'CEO / CFO',
        feedback:
          'Your executive explanation includes service acronyms. Translate them into financial exposure, customer outcomes, and the trade-off the executive must approve.',
      });
    if (!/\d|budget|cost|spend|revenue|financial/i.test(draft.communication.cfo))
      feedback.push({
        audience: 'CFO',
        feedback:
          'State the estimated cost range, confidence, and financial consequence of delaying the decision.',
      });
    if (
      !/risk|recover|failure|deploy|monitor|observ|rollback|test/i.test(
        draft.communication.engineer,
      )
    )
      feedback.push({
        audience: 'Engineer',
        feedback:
          'Add an implementation or failure-mode detail so an engineer can challenge how this decision would behave in production.',
      });
    if (!feedback.length)
      feedback.push({
        audience: 'All audiences',
        feedback:
          'Your four explanations use different perspectives. Verify that their promised cost, risk, and delivery outcomes remain consistent with the same architecture decision.',
      });
    return feedback;
  }
  async generateScenario(input: GeneratorInput): Promise<Scenario> {
    const candidates = scenarios
      .filter((scenario) => scenario.engineeringTeamSize <= input.companySize)
      .sort((a, b) => {
        const fit = (s: Scenario) =>
          Number(s.level === input.level) * 6 +
          Number(s.skillTags.includes(input.primarySkill)) * 5 +
          Number(s.skillTags.includes(input.secondarySkill)) * 2;
        return fit(b) - fit(a);
      });
    const base = structuredClone(candidates[0]);
    // A disclosed curated variant preserves the original internally consistent numbers and evidence.
    return scenarioSchema.parse({
      ...base,
      id: `generated-${randomUUID()}`,
      generated: true,
      title: `${base.title} · practice variant`,
      company: `${input.industry} practice company`,
      industry: input.industry,
      level: input.level,
      companySize: input.companySize,
      skillTags: [
        ...new Set([...base.skillTags, input.primarySkill, input.secondarySkill].filter(Boolean)),
      ],
      businessBrief: `${base.businessBrief}\n\nPractice context: ${input.industry}, ${input.companySize} employees. This mock-generated case is a curated scenario variant; its supplied operational and financial evidence remains the scenario baseline.`,
    });
  }
}
