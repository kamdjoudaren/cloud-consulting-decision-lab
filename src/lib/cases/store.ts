import { randomUUID } from 'node:crypto';
import { and, desc, eq } from 'drizzle-orm';
import { database } from '../db';
import { adrsTable, scenariosTable, sessionsTable, snapshotsTable } from '../db/schema';
import type {
  ADR,
  CaseData,
  CaseSession,
  Draft,
  ReasoningSnapshot,
  Scenario,
  ScenarioPublic,
} from '../types';
import { DomainError } from '../validation';
import { emptyDraft } from './defaults';
import { assignRequirementIds } from '../requirements/traceability';
import { validateDraft } from './workflow';
import { assertADRUnchanged } from '../adr/service';

// Explicit allow-list: evaluator metadata and undiscovered facts never cross the API boundary.
export function publicScenario(s: Scenario): ScenarioPublic {
  return {
    id: s.id,
    title: s.title,
    company: s.company,
    level: s.level,
    industry: s.industry,
    companySize: s.companySize,
    engineeringTeamSize: s.engineeringTeamSize,
    category: s.category,
    duration: s.duration,
    businessBrief: s.businessBrief,
    knownFacts: s.knownFacts,
    skillTags: s.skillTags,
    stakeholders: s.stakeholders,
    generated: s.generated,
  };
}
export function getScenario(id: string): Scenario {
  const row = database().orm.select().from(scenariosTable).where(eq(scenariosTable.id, id)).get();
  if (!row) throw new DomainError('Scenario not found.', 404);
  return JSON.parse(row.payload) as Scenario;
}
export function getPublicScenarios(): ScenarioPublic[] {
  return database()
    .orm.select()
    .from(scenariosTable)
    .all()
    .map((row) => publicScenario(JSON.parse(row.payload) as Scenario));
}
export function saveGeneratedScenario(scenario: Scenario): ScenarioPublic {
  const saved = { ...scenario, id: `generated-${randomUUID()}`, generated: true };
  database()
    .orm.insert(scenariosTable)
    .values({ id: saved.id, payload: JSON.stringify(saved) })
    .run();
  return publicScenario(saved);
}

function getSession(id: string): CaseSession {
  const { orm } = database();
  const row = orm.select().from(sessionsTable).where(eq(sessionsTable.id, id)).get();
  if (!row) throw new DomainError('Case not found.', 404);
  const session = JSON.parse(row.payload) as CaseSession;
  session.version = row.version;
  session.adrs = orm
    .select()
    .from(adrsTable)
    .where(eq(adrsTable.caseId, id))
    .all()
    .map((record) => JSON.parse(record.payload) as ADR)
    .sort((a, b) => a.id.localeCompare(b.id));
  session.snapshots = orm
    .select()
    .from(snapshotsTable)
    .where(eq(snapshotsTable.caseId, id))
    .all()
    .map((record) => JSON.parse(record.payload) as ReasoningSnapshot)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return session;
}
export function getCase(id: string): CaseData {
  const session = getSession(id);
  return { session, scenario: publicScenario(getScenario(session.scenarioId)) };
}
export function listCases(): CaseData[] {
  return database()
    .orm.select({ id: sessionsTable.id })
    .from(sessionsTable)
    .orderBy(desc(sessionsTable.updatedAt))
    .all()
    .map(({ id }) => getCase(id));
}
export function createCase(scenarioId: string, isExample = false): CaseData {
  const scenario = getScenario(scenarioId);
  const now = new Date().toISOString();
  const session: CaseSession = {
    id: randomUUID(),
    scenarioId,
    phase: 'brief',
    version: 0,
    createdAt: now,
    updatedAt: now,
    draft: emptyDraft(scenario),
    messages: [],
    revealedFactIds: [],
    evidenceRequests: [],
    adrs: [],
    snapshots: [],
    reviews: [],
    evaluation: null,
    reviewProvider: null,
    published: false,
    isExample,
  };
  database()
    .orm.insert(sessionsTable)
    .values({
      id: session.id,
      scenarioId,
      payload: JSON.stringify(session),
      version: 0,
      requirementCounter: 0,
      updatedAt: now,
    })
    .run();
  return { session, scenario: publicScenario(scenario) };
}

export function assertVersion(session: CaseSession, expectedVersion: number): void {
  if (session.version !== expectedVersion)
    throw new DomainError(
      'This case changed in another tab. Reload the latest saved version before continuing.',
      409,
    );
}

/** All writes, history inserts, and optimistic version checks share one SQLite transaction. */
export function mutateCase(
  id: string,
  expectedVersion: number,
  change: (session: CaseSession, requirementCounter: number) => number | void,
): CaseData {
  const { sqlite, orm } = database();
  sqlite
    .transaction(() => {
      const row = orm.select().from(sessionsTable).where(eq(sessionsTable.id, id)).get();
      if (!row) throw new DomainError('Case not found.', 404);
      const current = getSession(id);
      assertVersion(current, expectedVersion);
      const previous = structuredClone(current);
      const counter = change(current, row.requirementCounter) ?? row.requirementCounter;
      for (const adr of previous.adrs) {
        const incoming = current.adrs.find((entry) => entry.id === adr.id);
        if (!incoming) throw new DomainError('Accepted ADRs cannot be deleted.', 409);
        assertADRUnchanged(adr, incoming);
      }
      for (const snapshot of previous.snapshots) {
        if (
          JSON.stringify(snapshot) !==
          JSON.stringify(current.snapshots.find((entry) => entry.id === snapshot.id))
        )
          throw new DomainError('Reasoning snapshots are immutable.', 409);
      }
      current.updatedAt = new Date().toISOString();
      current.version = expectedVersion + 1;
      const result = orm
        .update(sessionsTable)
        .set({
          payload: JSON.stringify({ ...current, adrs: [], snapshots: [] }),
          version: current.version,
          requirementCounter: counter,
          updatedAt: current.updatedAt,
        })
        .where(and(eq(sessionsTable.id, id), eq(sessionsTable.version, expectedVersion)))
        .run();
      if (result.changes !== 1) throw new DomainError('Concurrent update. Reload this case.', 409);
      for (const adr of current.adrs.filter(
        (entry) => !previous.adrs.some((a) => a.id === entry.id),
      ))
        orm
          .insert(adrsTable)
          .values({ caseId: id, id: adr.id, payload: JSON.stringify(adr) })
          .run();
      for (const snapshot of current.snapshots.filter(
        (entry) => !previous.snapshots.some((s) => s.id === entry.id),
      ))
        orm
          .insert(snapshotsTable)
          .values({
            id: snapshot.id,
            caseId: id,
            kind: snapshot.kind,
            payload: JSON.stringify(snapshot),
          })
          .run();
    })
    .immediate();
  return getCase(id);
}

export function updateDraft(id: string, expectedVersion: number, incoming: Draft): CaseData {
  return mutateCase(id, expectedVersion, (session, counter) => {
    if (['review', 'evaluation', 'portfolio'].includes(session.phase))
      throw new DomainError(
        'This analysis is sealed. Finish the review or reopen a final revision to edit it.',
        409,
      );
    const draft = structuredClone(incoming);
    const assigned = assignRequirementIds(session.draft.requirements, draft.requirements, counter);
    draft.requirements = assigned.requirements;
    draft.links = draft.links.map((link) => ({
      ...link,
      requirementId: assigned.renamed.get(link.requirementId) || link.requirementId,
    }));
    validateDraft(draft);
    session.draft = draft;
    session.evaluation = null;
    session.published = false;
    return assigned.counter;
  });
}

export function sealSnapshot(session: CaseSession, kind: 'first' | 'final'): ReasoningSnapshot {
  if (kind === 'first' && session.snapshots.some((s) => s.kind === 'first'))
    return session.snapshots.find((s) => s.kind === 'first')!;
  const snapshot: ReasoningSnapshot = {
    id: randomUUID(),
    kind,
    draft: structuredClone(session.draft),
    createdAt: new Date().toISOString(),
  };
  session.snapshots.push(snapshot);
  return snapshot;
}
