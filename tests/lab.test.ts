import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { closeDatabase, database } from '../src/lib/db';
import {
  createCase,
  getCase,
  getCaseScenario,
  getPublicScenarios,
  updateDraft,
} from '../src/lib/cases/store';
import { performAction } from '../src/lib/cases/actions';
import { scenarios, legacyScenarios } from '../src/lib/scenarios/seeds';
import {
  selectVariant,
  validateSimulation,
  requestDocument,
  interview,
} from '../src/lib/lab/engine';
import { families, findingSchema, initiativeSchema } from '../src/lib/lab/schema';
import { economicMetrics, valueLedger } from '../src/lib/lab/economics';
import { workflowPhases } from '../src/lib/lab/workflow';
import { evaluateSimulation } from '../src/lib/lab/scoring';
import { workProducts, zipWorkProducts } from '../src/lib/lab/bundle';
import { caseToMarkdown } from '../src/lib/export';
import { dimensions, type CaseData, type ArchitectureOption } from '../src/lib/types';

beforeEach(() => {
  closeDatabase();
  process.env.DATABASE_PATH = ':memory:';
  process.env.AI_PROVIDER = 'mock';
});
afterEach(() => {
  closeDatabase();
  delete process.env.DATABASE_PATH;
  delete process.env.AI_PROVIDER;
});

async function action(data: CaseData, body: Record<string, unknown>): Promise<CaseData> {
  return performAction(data.session.id, { ...body, version: data.session.version } as Parameters<
    typeof performAction
  >[1]);
}
async function investigate(id = 'aws-growth-55') {
  let data = createCase(id);
  data = await action(data, { action: 'advance' });
  const people = data.scenario.stakeholders;
  const financeOwner = people.find((p) => /cfo|finance/i.test(p.role)) ?? people[0];
  const technicalOwner =
    people.find((p) => /cto|engineer|sre|platform|ml/i.test(p.role)) ?? people[1] ?? people[0];
  const businessOwner =
    people.find((p) => /business|product|ceo|partner|operating/i.test(p.role)) ??
    people[2] ??
    people[0];
  data = await action(data, {
    action: 'chat',
    stakeholder: financeOwner.name,
    question: 'What are the comparable unit economics, transactions and margin?',
  });
  data = await action(data, {
    action: 'chat',
    stakeholder: technicalOwner.name,
    question: 'What does the architecture and technical load test show?',
  });
  data = await action(data, {
    action: 'chat',
    stakeholder: businessOwner.name,
    question: 'What business revenue and customer growth assumptions matter?',
  });
  data = await action(data, {
    action: 'evidence',
    question: 'CUR transactions economics margin cost',
    reason: 'Compare equivalent useful output before judging efficiency.',
  });
  data = await action(data, {
    action: 'evidence',
    question: 'engineering technical architecture load test report',
    reason: 'Test the competing infrastructure explanation and quality guardrails.',
  });
  return data;
}
function completeDraft(data: CaseData) {
  const d = structuredClone(data.session.draft),
    c = d.consulting!;
  const evidence = data.documents!.filter((doc) => doc.status === 'available').map((doc) => doc.id);
  const ledger = data.documents!.find((doc) => doc.metrics)!.metrics!;
  c.technicalAnalysis =
    'Compare stable latency and the same completed workload before changing capacity.';
  c.hypotheses =
    'Growth and unproductive capacity are competing explanations; the ledger distinguishes them.';
  c.economics = {
    ...c.economics,
    ...ledger,
    period: 'Comparable full years',
    unit: 'Completed transactions',
    sourceIds: [evidence[0]],
    interpretation:
      'Compare cost per useful transaction with service quality and separate absolute spend from efficiency.',
    conclusion:
      economicMetrics({ ...c.economics, ...ledger }).unitChange! < 0
        ? 'improving'
        : 'deteriorating',
  };
  c.findings = [
    findingSchema.parse({
      id: 'finding-1',
      title: 'Investigate the unit-cost mechanism',
      technical: 'The measured unit cost changed; compare stable workload definitions.',
      operational: 'Establish useful capacity and distinguish idle resources from volume growth.',
      customer: 'Preserve measured latency and completed transaction quality.',
      businessMetric: 'Cost-to-Serve and capacity for customer growth.',
      financialMetric: 'Gross Margin may move through COGS; this is not a verified saving.',
      forecast: 'Future workload mix needs validation.',
      value: 'A conditional operating decision, not an exact valuation.',
      action:
        'Validate the baseline and run a bounded pilot if resource ownership supports removal.',
      confidence: 'medium',
      evidenceIds: evidence,
      materiality: 'amber',
      materialityReason:
        'Recurring cost is material, but unnecessary capacity cuts could harm customers.',
      probability: 50,
      timing: 'Next month',
      costToFix: 10000,
      managementDependency: 'CTO and Finance',
      validation:
        'Measure cost per transaction, p95 and error rate under a representative workload.',
    }),
  ];
  c.executiveSummary =
    'The comparable baseline informs the decision; preserve customer guardrails and validate future workload assumptions before booking value.';
  d.notes.push(
    {
      id: 'unknown',
      kind: 'unknown',
      text: 'Future workload mix is not established.',
      source: '',
      confidence: 'low',
      validation: 'Request representative feature workload forecasts.',
    },
    {
      id: 'assumption',
      kind: 'assumption',
      text: 'The comparable historical workload remains useful for the next pilot.',
      source: '',
      confidence: 'medium',
      validation: 'Validate with the workload owner.',
    },
  );
  d.requirements = [
    {
      id: 'new-requirement',
      text: 'Preserve p95 latency and error rate during any change.',
      source: evidence[1],
      priority: 'must',
    },
  ];
  d.options = ['Maintain and monitor', 'Bounded capacity pilot'].map(
    (name, i) =>
      ({
        id: `option-${i}`,
        name,
        summary: `${name} with a comparable evidence baseline.`,
        components: 'Existing managed application and database.',
        advantages: 'Preserve customer outcomes.',
        disadvantages: 'Opportunity may take longer to verify.',
        cost: 'Planning cost $10,000 including validation.',
        operations: 'Platform owner and Finance verify results.',
        reliability: 'Stop if latency or error rate worsens.',
        security: 'Private data and least privilege access.',
        implementation: 'Reversible pilot on one workload.',
        assumptions: 'Current workload is representative.',
        risks: 'Future workload mix may change.',
        tradeoffRationale:
          'Trade near-term effort against avoidable capacity risk; deferral remains valid.',
        ratings: Object.fromEntries(dimensions.map((key) => [key, 3])),
      }) as ArchitectureOption,
  );
  d.recommendation = {
    optionId: 'option-0',
    decision:
      'Maintain a conditional baseline pending validation of the workload and removal dependencies.',
    why: 'The evidence supports disciplined unit economics, not a blanket infrastructure cut.',
    alternatives: 'A bounded pilot is appropriate after its owner and guardrails are verified.',
    risks: 'New workloads may invalidate the historical comparison.',
    assumptions: 'The full-year transaction definition is comparable.',
  };
  d.links = [
    {
      requirementId: 'new-requirement',
      decision: 'Monitor p95 and errors through a reversible pilot.',
      status: 'satisfied',
      rationale: 'Stop if quality worsens relative to the measured baseline.',
    },
  ];
  d.communication.engineer =
    'Validate the workload, instrument latency and errors, and retain a reversible rollout.';
  d.communication.cfo =
    'Compare comparable annual costs per useful transaction; do not treat capacity as verified cash savings.';
  d.finalDecision =
    'Retain the conditional recommendation and validate the workload before committing to a platform or cost change.';
  d.lessons =
    'Higher spend and worse efficiency are different claims; source evidence and uncertainty decide the recommendation.';
  return d;
}
describe('Consulting simulation engine', () => {
  it('covers the reference families and permits beginner PE without exposing truth', () => {
    const minimum = [5, 5, 3, 5, 4, 2, 2, 2];
    families.forEach((family, i) =>
      expect(scenarios.filter((s) => s.lab?.family === family).length).toBeGreaterThanOrEqual(
        minimum[i],
      ),
    );
    expect(scenarios.some((s) => s.level === 1 && s.lab?.family === 'Buy-Side DD')).toBe(true);
    scenarios.forEach(validateSimulation);
    const data = createCase('aws-growth-55');
    expect(JSON.stringify(data)).not.toContain('rootCause');
    expect(JSON.stringify(data)).not.toContain('healthy-growth');
    expect(data.documents).toEqual([]);
    expect(getPublicScenarios()[0]).not.toHaveProperty('truth');
  });
  it('selects different consistent variants and freezes case truth across catalog changes', () => {
    const base = scenarios.find((s) => s.id === 'aws-growth-55')!;
    const healthy = selectVariant(base, () => 0),
      waste = selectVariant(base, () => 1);
    expect(healthy.businessBrief).toBe(waste.businessBrief);
    expect(healthy.evidenceAvailable[0].metrics!.unitsAfter).not.toBe(
      waste.evidenceAvailable[0].metrics!.unitsAfter,
    );
    const data = createCase(base.id),
      frozen = JSON.stringify(getCaseScenario(data.session));
    database()
      .sqlite.prepare('UPDATE scenarios SET payload = ? WHERE id = ?')
      .run(JSON.stringify(waste), base.id);
    expect(JSON.stringify(getCaseScenario(getCase(data.session.id).session))).toBe(frozen);
    expect(() =>
      database()
        .sqlite.prepare('UPDATE case_truth SET payload = ? WHERE case_id = ?')
        .run('{}', data.session.id),
    ).toThrow('immutable');
  });
  it('migrates old case payloads without rewriting their draft or difficulty path', () => {
    const old = legacyScenarios.find((s) => s.id === 'lost-sales')!;
    const data = createCase('regional-recovery');
    const payload = { ...data.session, id: 'old-session', scenarioId: old.id };
    database()
      .sqlite.prepare('UPDATE scenarios SET payload = ? WHERE id = ?')
      .run(JSON.stringify(old), old.id);
    database()
      .sqlite.prepare(
        'INSERT INTO case_sessions(id,scenario_id,payload,version,requirement_counter,updated_at) VALUES(?,?,?,?,?,?)',
      )
      .run(payload.id, old.id, JSON.stringify(payload), 0, 0, payload.updatedAt);
    // The migration statement runs before any catalog refresh; emulate it on this memory DB.
    database().sqlite.exec(
      'INSERT OR IGNORE INTO case_truth (case_id,payload) SELECT c.id,s.payload FROM case_sessions c JOIN scenarios s ON c.scenario_id=s.id',
    );
    database()
      .sqlite.prepare('UPDATE scenarios SET payload = ? WHERE id = ?')
      .run(JSON.stringify(scenarios.find((s) => s.id === old.id)), old.id);
    const migrated = getCase(payload.id);
    expect(migrated.scenario.lab).toBeUndefined();
    expect(migrated.session.draft).toEqual(payload.draft);
    expect(workflowPhases(migrated.session)).not.toContain('analysis');
  });
  it('keeps assistance independent of level and enforces hints and scope server-side', async () => {
    let hard = createCase('dd-growth-claim', false, 'hard');
    hard = await action(hard, { action: 'hint', kind: 'metric' });
    expect(hard.session.simulation!.hints[0].cost).toBe(2);
    await expect(action(hard, { action: 'assistance', mode: 'guided' })).rejects.toThrow('fixed');
    const expert = createCase('dd-growth-claim', false, 'expert');
    expect(expert.scenario.skillTags).toEqual([]);
    await expect(action(expert, { action: 'hint', kind: 'small' })).rejects.toThrow(
      'no contextual hints',
    );
    const advanced = createCase('mega-ai-acquisition', false, 'guided');
    expect(advanced.session.simulation!.mode).toBe('guided');
    expect(workflowPhases(advanced.session)).toContain('adr');
    expect(workflowPhases(createCase('vc-400k').session)).not.toContain('adr');
  });
  it('constrains stakeholder knowledge, preserves memory and gates later evidence', async () => {
    let data = createCase('mega-ai-acquisition');
    const s = getCaseScenario(data.session);
    const tech = s.stakeholders.find((p) => /cto|engineer|sre|platform|ml/i.test(p.role))!;
    const finance = s.stakeholders.find((p) => /cfo|finance/i.test(p.role))!;
    expect(
      requestDocument(s, data.session, 'technical engineering load test report').evidenceIds,
    ).toEqual([]);
    expect(
      interview(
        s,
        data.session,
        'What technical architecture and database bottleneck did the load test reveal?',
        tech.name,
      ).revealedFactIds,
    ).toEqual([]);
    const cfo = interview(
      s,
      data.session,
      'What are the RDS connections and database query metrics?',
      finance.name,
    );
    expect(cfo.revealedFactIds).toEqual([]);
    data = await action(data, { action: 'advance' });
    data = await action(data, {
      action: 'chat',
      stakeholder: finance.name,
      question: 'What are the economics and margin assumptions?',
    });
    const repeat = interview(
      s,
      data.session,
      'What are the economics and margin assumptions?',
      finance.name,
    );
    expect(repeat.text).toContain('discussed');
    const bad = structuredClone(data.session.draft);
    bad.consulting!.economics.sourceIds = ['unrequested-secret'];
    expect(() => updateDraft(data.session.id, data.session.version, bad)).toThrow(
      'actually requested',
    );
  });
  it('completes the guided investigation, seals reasoning, defends, publishes and retains attempts', async () => {
    let data = await investigate();
    data = updateDraft(data.session.id, data.session.version, completeDraft(data));
    for (const phase of ['discovery', 'analysis', 'options', 'recommendation', 'communication']) {
      expect(data.session.phase).toBe(phase);
      data = await action(data, { action: 'advance' });
    }
    await expect(action(data, { action: 'advance' })).rejects.toThrow('review');
    data = await action(data, { action: 'review' });
    expect(data.session.snapshots.filter((s) => s.kind === 'first')).toHaveLength(1);
    for (const item of data.session.reviews)
      data = await action(data, {
        action: 'respondReview',
        reviewId: item.id,
        response: 'partial',
        rationale:
          'Accept the evidence concern and retain the conditional recommendation with measured validation.',
      });
    for (const q of data.session.simulation!.challenges)
      data = await action(data, {
        action: 'defend',
        challengeId: q.id,
        answer:
          'The requested comparable ledger supports a conditional position. Future workloads and realized savings still need validation.',
        evidenceIds: data.documents!.map((d) => d.id),
      });
    data = await action(data, { action: 'advance' });
    data = await action(data, { action: 'evaluate' });
    expect(data.session.evaluation!.criticalMisses).toEqual([]);
    expect(data.session.evaluation!.dimensions).toHaveLength(10);
    expect(data.session.evaluation!.dimensions.reduce((n, d) => n + d.max, 0)).toBe(100);
    expect(data.session.evaluation!.total).toBeLessThanOrEqual(100);
    expect(data.session.evaluation!.debrief!.reasoning).toBeTruthy();
    data = await action(data, { action: 'publish' });
    expect(data.session.published).toBe(true);
    const files = workProducts(data),
      zip = zipWorkProducts(files);
    expect(files).toHaveProperty('100-day-plan.md');
    expect(files).toHaveProperty('financial-bridge.csv');
    expect(caseToMarkdown(data)).toContain('Technology → Value');
    expect(zip.readUInt32LE(0)).toBe(0x04034b50);
    expect(zip.readUInt32LE(zip.length - 22)).toBe(0x06054b50);
    expect(zip.readUInt16LE(zip.length - 12)).toBe(Object.keys(files).length);
    data = await action(data, { action: 'reopen' });
    expect(data.session.evaluationHistory).toHaveLength(1);
    expect(data.session.published).toBe(false);
    expect(data.session.snapshots.filter((s) => s.kind === 'first')).toHaveLength(1);
  });
  it('does not reward a conclusion that contradicts the ledger or invented high confidence', async () => {
    const data = await investigate();
    data.session.draft = completeDraft(data);
    data.session.draft.consulting!.economics.cloudAfter = 1;
    data.session.draft.consulting!.findings[0].confidence = 'high';
    data.session.draft.consulting!.findings[0].evidenceIds = [];
    const result = evaluateSimulation(getCaseScenario(data.session), data.session);
    expect(result.status).toBe('needs_revision');
    expect(result.criticalMisses.join(' ')).toContain('reconcile');
    expect(result.criticalMisses.join(' ')).toContain('high-confidence');
  });
  it.each(['mega-ai-acquisition', 'vc-400k', 'exit-scalability'])(
    'completes the %s workstream with required artifacts and retained state',
    async (id) => {
      let data = await investigate(id);
      const source = getCaseScenario(data.session);
      if (source.lab!.chapters.length) {
        expect(data.documents!.some((d) => d.id === `${id}-technical`)).toBe(false);
        while (data.session.simulation!.chapter < source.lab!.chapters.length - 1) {
          if (data.session.simulation!.chapter === 3)
            data = await action(data, {
              action: 'evidence',
              question: 'engineering technical architecture load test report',
              reason: 'Reconcile the engineering evidence against management capacity claims.',
            });
          if (data.session.simulation!.chapter === 8)
            data = await action(data, {
              action: 'evidence',
              question: 'management response pushback reconcile',
              reason: 'Record management counter-evidence before finalizing findings.',
            });
          data = await action(data, {
            action: 'chapter',
            note: 'Document the current source limitations and validate the next workstream hypothesis.',
          });
        }
        expect(data.session.simulation!.chapterNotes).toHaveLength(9);
      }
      const draft = completeDraft(data),
        c = draft.consulting!;
      c.operatingPartner =
        'Assign an accountable owner, sequence the reversible pilot, and require Finance to verify the comparable baseline.';
      c.investmentCommittee =
        'Treat management forecasts as conditional. The source limitations and cost-to-fix belong in the thesis risk register.';
      c.deliverables = [
        {
          title: 'Workstream executive one-pager',
          body: 'Evidence supports a conditional recommendation. Prioritize the measured operational constraint, assign owners and preserve customer guardrails; do not credit unverified future savings.',
        },
      ];
      c.initiatives = [
        initiativeSchema.parse({
          id: 'pilot',
          name: 'Validate the avoidable cloud opportunity',
          owner: 'Platform and Finance',
          baseline: 'Requested comparable full-year source ledger',
          target: 'Lower cost per completed transaction without degraded p95',
          annualValue: 400000,
          kind: 'recurring',
          stage: 'identified',
          cost: 60000,
          offset: 20000,
          monthsToStart: 3,
          timeline: 'Days 30–100',
          risk: 'Customer latency regression',
          confidence: 'medium',
          kpi: 'Comparable unit cost and p95',
          evidenceIds: data.documents!.map((d) => d.id),
          verifiedAnnualValue: 0,
          financeSignoff: '',
          benefitKey: 'compute-opportunity',
        }),
      ];
      draft.conditions = [
        {
          id: 'condition',
          condition: 'The next workload is not comparable.',
          signal: 'p95 latency and completed transaction rate',
          threshold: 'p95 worsens by more than 10%',
          alternative: 'Stop the pilot and restore the baseline.',
        },
      ];
      draft.poc = {
        required: true,
        justification: 'Representative validation is needed.',
        hypothesis: 'A bounded change can preserve customer quality.',
        scope: 'One reversible workload pilot.',
        metrics: 'p95, error rate, cost per completed transaction',
        success: 'No more than 5% p95 regression and lower comparable unit cost.',
        exit: 'Roll back if customer guardrails fail.',
        goNoGo: 'The CTO and Finance review measured results before scaling.',
      };
      draft.adr = {
        title: 'Conditional workstream decision',
        context: source.businessBrief,
        decision: draft.recommendation.decision,
        alternatives: draft.recommendation.alternatives,
        consequences: 'Prioritize evidence and preserve reversibility.',
        risks: draft.recommendation.risks,
      };
      data = updateDraft(data.session.id, data.session.version, draft);
      while (data.session.phase !== 'review') {
        if (data.session.phase === 'adr') data = await action(data, { action: 'acceptAdr' });
        data = await action(data, { action: 'advance' });
      }
      data = await action(data, { action: 'review' });
      for (const item of data.session.reviews)
        data = await action(data, {
          action: 'respondReview',
          reviewId: item.id,
          response: 'partial',
          rationale:
            'Retain the conditional recommendation and address the measurement concern with an owned validation plan.',
        });
      for (const q of data.session.simulation!.challenges)
        data = await action(data, {
          action: 'defend',
          challengeId: q.id,
          answer:
            'The requested records establish the current baseline. Management forecasts and recurring savings still depend on validation, workload comparability and accountable execution.',
          evidenceIds: data.documents!.map((d) => d.id),
        });
      data = await action(data, { action: 'advance' });
      data = await action(data, { action: 'evaluate' });
      expect(data.session.evaluation!.criticalMisses).toEqual([]);
      data = await action(data, { action: 'publish' });
      const persisted = getCase(data.session.id);
      expect(persisted.session.published).toBe(true);
      expect(persisted.session.draft.consulting!.initiatives[0].stage).toBe('identified');
      expect(workProducts(persisted)['100-day-plan.md']).toContain('Platform and Finance');
    },
    30000,
  );
});
describe('Financial reasoning boundaries', () => {
  const initiative = (patch: Record<string, unknown> = {}) =>
    initiativeSchema.parse({
      id: 'a',
      name: 'Compute pilot',
      owner: 'Platform',
      baseline: 'Measured invoice',
      target: 'Lower comparable run-rate',
      annualValue: 400000,
      kind: 'recurring',
      stage: 'identified',
      cost: 60000,
      offset: 20000,
      monthsToStart: 3,
      timeline: 'Days 30–100',
      risk: 'Latency regression',
      confidence: 'medium',
      kpi: 'Unit cost and p95',
      evidenceIds: [],
      verifiedAnnualValue: 0,
      financeSignoff: '',
      benefitKey: 'compute',
      ...patch,
    });
  it('distinguishes theoretical value, delayed cash, capacity and verification', () => {
    const result = valueLedger([
      initiative(),
      initiative({
        id: 'b',
        kind: 'capacity',
        annualValue: 500000,
        cost: 0,
        offset: 0,
        benefitKey: 'engineer-capacity',
      }),
    ]);
    expect(result.identifiedRecurring).toBe(380000);
    expect(result.verifiedRecurring).toBe(0);
    expect(result.firstYearNetCash).toBe(225000);
    expect(
      valueLedger([initiative({ stage: 'verified', verifiedAnnualValue: 160000 })]).warnings.length,
    ).toBeGreaterThan(0);
    expect(
      valueLedger([
        initiative({
          stage: 'verified',
          verifiedAnnualValue: 160000,
          evidenceIds: ['invoice'],
          financeSignoff: 'Finance measured comparable usage.',
        }),
      ]).verifiedRecurring,
    ).toBe(140000);
  });
  it('excludes duplicate benefits and handles missing or zero denominators', () => {
    const result = valueLedger([initiative(), initiative({ id: 'b' })]);
    expect(result.identifiedRecurring).toBe(380000);
    expect(result.warnings.join(' ')).toContain('Duplicate');
    const c = createCase('vc-400k').session.draft.consulting!;
    expect(
      economicMetrics({ ...c.economics, unitsBefore: 0, cloudBefore: 3000 }).unitBefore,
    ).toBeNull();
    expect(() => zipWorkProducts({ '../escape': 'bad' })).toThrow('Invalid');
  });
});
