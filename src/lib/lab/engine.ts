import { randomInt } from 'node:crypto';
import type {
  CaseSession,
  ClientResponse,
  EvidenceResponse,
  Scenario,
  ScenarioPublic,
} from '../types';
import { matchScore, isSolutionRequest } from '../ai/mock-provider';
import { configSchema, truthSchema, economicsSchema } from './schema';

export function validateSimulation(s: Scenario): void {
  if (!s.lab) return;
  configSchema.parse(s.lab);
  const truth = truthSchema.parse(s.truth);
  const facts = new Set(s.hiddenFacts.map((f) => f.id));
  const docs = new Map(s.evidenceAvailable.map((d) => [d.id, d]));
  if (new Set(s.lab.chapters.map((c) => c.id)).size !== s.lab.chapters.length)
    throw new Error(`${s.id}: duplicate chapter IDs`);
  if (facts.size !== s.hiddenFacts.length || docs.size !== s.evidenceAvailable.length)
    throw new Error(`${s.id}: duplicate content IDs`);
  for (const doc of s.evidenceAvailable) {
    if (doc.metrics) {
      economicsSchema
        .pick({
          cloudBefore: true,
          cloudAfter: true,
          unitsBefore: true,
          unitsAfter: true,
          revenueBefore: true,
          revenueAfter: true,
          cogsBefore: true,
          cogsAfter: true,
        })
        .parse(doc.metrics);
      const m = doc.metrics;
      if (m.cloudAfter < 0 || m.cloudBefore < 0 || m.unitsAfter < 0 || m.unitsBefore < 0)
        throw new Error(`${s.id}: negative economic metric`);
      if (m.cogsBefore > m.revenueBefore || m.cogsAfter > m.revenueAfter)
        throw new Error(`${s.id}: COGS cannot exceed revenue in a reconciled ledger`);
      if (m.attempts !== undefined || m.successfulTasks !== undefined || m.retries !== undefined) {
        if ((m.attempts ?? 0) < 0 || (m.successfulTasks ?? 0) < 0 || (m.retries ?? 0) < 0)
          throw new Error(`${s.id}: invalid AI workload metric`);
        if (
          m.successfulTasks !== undefined &&
          m.attempts !== undefined &&
          m.successfulTasks > m.attempts
        )
          throw new Error(`${s.id}: successful AI tasks exceed attempts`);
        if (m.retries !== undefined && m.attempts !== undefined && m.retries > m.attempts)
          throw new Error(`${s.id}: AI retries exceed attempts`);
      }
      for (const key of [
        'allocatedBefore',
        'allocatedAfter',
        'standaloneBefore',
        'standaloneAfter',
        'tsaMonthly',
        'separationSpend',
      ] as const)
        if (m[key] !== undefined && m[key] < 0)
          throw new Error(`${s.id}: invalid carve-out metric`);
    }
    if (doc.chapter !== undefined && (!Number.isInteger(doc.chapter) || doc.chapter < 0))
      throw new Error(`${s.id}: invalid chapter`);
    for (const id of doc.factIds || [])
      if (!facts.has(id)) throw new Error(`${s.id}: unknown evidence fact ${id}`);
    for (const id of doc.requires || [])
      if (!docs.has(id) || id === doc.id) throw new Error(`${s.id}: invalid document prerequisite`);
    if ((doc.chapter || 0) >= Math.max(1, s.lab.chapters.length))
      throw new Error(`${s.id}: invalid chapter`);
    const visit = (id: string, path = new Set<string>()) => {
      if (path.has(id)) throw new Error(`${s.id}: cyclic evidence dependencies`);
      for (const parent of docs.get(id)?.requires || []) visit(parent, new Set([...path, id]));
    };
    visit(doc.id);
  }
  for (const finding of truth.expectedFindings)
    for (const id of finding.evidenceIds)
      if (!docs.has(id)) throw new Error(`${s.id}: unknown expected evidence`);
  for (const p of truth.knowledge) {
    if (!s.stakeholders.some((v) => v.name === p.name))
      throw new Error(`${s.id}: unknown stakeholder`);
    if (p.evidenceIds.some((id) => !docs.has(id)))
      throw new Error(`${s.id}: unknown stakeholder evidence`);
  }
  for (const conflict of truth.contradictions)
    if (!docs.has(conflict.counterEvidenceId))
      throw new Error(`${s.id}: unknown contradiction evidence`);
  for (const variant of s.variants || [])
    validateSimulation({ ...s, ...variant, id: s.id, variants: undefined });
}
export function selectVariant(
  scenario: Scenario,
  choose: (max: number) => number = randomInt,
): Scenario {
  validateSimulation(scenario);
  const s = structuredClone(scenario);
  if (s.variants?.length) {
    const variant = s.variants[choose(s.variants.length)];
    s.hiddenFacts = variant.hiddenFacts;
    s.evidenceAvailable = variant.evidenceAvailable;
    s.truth = variant.truth;
  }
  delete s.variants;
  return s;
}
export function visibleDocuments(s: Scenario, session: CaseSession) {
  const unlocked = new Set(session.evidenceRequests.flatMap((r) => r.evidenceIds));
  return s.evidenceAvailable.filter((d) => unlocked.has(d.id));
}
export function permittedFacts(s: Scenario, session: CaseSession) {
  if (!s.lab) return s.hiddenFacts;
  const blocked = new Set(
    s.evidenceAvailable
      .filter((d) => (d.chapter || 0) > (session.simulation?.chapter || 0))
      .flatMap((d) => d.factIds || []),
  );
  return s.hiddenFacts.filter((f) => !blocked.has(f.id));
}
export function interview(
  s: Scenario,
  session: CaseSession,
  question: string,
  stakeholder: string,
): ClientResponse {
  if (isSolutionRequest(question))
    return {
      text: 'I can explain our constraints and records. Your task is to investigate and form the recommendation.',
      revealedFactIds: [],
    };
  const person = s.truth?.knowledge.find((p) => p.name === stakeholder);
  if (!person)
    return {
      text: 'Select a stakeholder from this case to continue the interview.',
      revealedFactIds: [],
    };
  const matches = permittedFacts(s, session)
    .filter((f) => person.topics.includes(f.topic))
    .map((fact) => ({ fact, score: matchScore(question, [fact.topic, ...fact.keywords]) }))
    .filter((v) => v.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        Number(session.revealedFactIds.includes(a.fact.id)) -
          Number(session.revealedFactIds.includes(b.fact.id)),
    );
  const precise =
    question.trim().split(/\s+/).length >= 7 || /\d|CUR|RTO|RPO|p95|load test/i.test(question);
  if (!matches.length)
    return {
      text: `${person.unknowns} My responsibility is: ${person.objective} Ask for a specific observation or artifact.`,
      revealedFactIds: [],
    };
  if (['hard', 'expert'].includes(session.simulation?.mode || '') && !precise)
    return {
      text: `From my perspective: ${person.objective} Which period, workload or measurement do you want to examine?`,
      revealedFactIds: [],
    };
  const selected = matches.slice(0, precise ? 2 : 1).map((v) => v.fact);
  const previous = session.messages
    .filter((m) => m.stakeholder === stakeholder && m.role === 'client')
    .flatMap((m) => m.revealedFactIds);
  const repeated = selected.every((f) => previous.includes(f.id));
  return {
    text: `${repeated ? 'To clarify the observation we discussed: ' : ''}${selected.map((f) => `${f.text} (Source: ${f.source})`).join('\n\n')}${repeated ? '\nRequest the supporting record or specify the uncertainty to move the discussion forward.' : ''}`,
    revealedFactIds: selected.map((f) => f.id),
  };
}
export function requestDocument(
  s: Scenario,
  session: CaseSession,
  question: string,
): EvidenceResponse {
  const no = (response: string): EvidenceResponse => ({
    response,
    evidenceIds: [],
    revealedFactIds: [],
    status: 'measurement_required',
  });
  if (isSolutionRequest(question))
    return no('Request a particular record, period or measurement rather than the hidden answer.');
  const candidates = s.evidenceAvailable
    .map((d) => ({ d, score: matchScore(question, [d.title, d.topic, ...d.keywords]) }))
    .filter((v) => v.score > 0)
    .sort((a, b) => b.score - a.score);
  if (!candidates.length)
    return no(
      'No matching record is available. Specify the measurement, owner and period needed to validate this question.',
    );
  const doc = candidates[0].d;
  if ((doc.chapter || 0) > (session.simulation?.chapter || 0))
    return no(
      'This record is scheduled for a later workstream meeting. Record the gap and advance the chapter after documenting your current findings.',
    );
  const unlocked = new Set(session.evidenceRequests.flatMap((r) => r.evidenceIds));
  if (doc.requires?.some((id) => !unlocked.has(id)))
    return no(
      'The response depends on earlier source records. Request the underlying technical evidence first.',
    );
  return {
    response: `${doc.title}\n\n${doc.content}`,
    evidenceIds: [doc.id],
    revealedFactIds:
      doc.status === 'available' || doc.status === 'approximate' ? doc.factIds || [] : [],
    status: doc.status,
  };
}
export function expertView(s: ScenarioPublic, session: CaseSession): ScenarioPublic {
  if (session.simulation?.mode !== 'expert') return s;
  return {
    ...s,
    category: 'Open investigation',
    skillTags: [],
    profile: undefined,
    metricFocus: [],
    financialArchetype: undefined,
    lab: s.lab
      ? {
          ...s.lab,
          awsServices: [],
          finopsConcepts: [],
          mlopsConcepts: [],
          businessMetrics: [],
          financialMetrics: [],
          peConcepts: [],
        }
      : undefined,
  };
}
