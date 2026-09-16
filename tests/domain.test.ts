import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  dimensions,
  type ArchitectureOption,
  type CaseSession,
  type Draft,
  type Scenario,
} from '../src/lib/types';
import { acceptADR, assertADRUnchanged, hasCurrentADR } from '../src/lib/adr/service';
import {
  assignRequirementIds,
  requirementCoverage,
  validateTraceability,
} from '../src/lib/requirements/traceability';
import { actionSchema, draftSchema } from '../src/lib/validation';
import { emptyDraft } from '../src/lib/cases/defaults';
import { advancePhase, assertFirstAnalysisReady } from '../src/lib/cases/workflow';
import { closeDatabase, database } from '../src/lib/db';
import {
  createCase,
  getCase,
  getPublicScenarios,
  getScenario,
  mutateCase,
  sealSnapshot,
  updateDraft,
} from '../src/lib/cases/store';
import { evaluateCase, scoringWeights } from '../src/lib/evaluation/scoring';

const scenario: Scenario = {
  id: 'test',
  title: 'Sales disappear during campaigns',
  company: 'Practice shop',
  level: 1,
  industry: 'Retail',
  companySize: 15,
  engineeringTeamSize: 2,
  category: 'Reliability',
  duration: 30,
  businessBrief: 'Our customers cannot check out during campaigns.',
  knownFacts: ['Two engineers maintain the application.'],
  skillTags: ['reliability'],
  stakeholders: [{ name: 'CEO', role: 'CEO', concern: 'Lost sales' }],
  hiddenFacts: [
    {
      id: 'budget',
      topic: 'budget',
      keywords: ['budget'],
      text: '$1200 per month.',
      source: 'Finance',
      critical: true,
    },
    {
      id: 'traffic',
      topic: 'traffic',
      keywords: ['traffic'],
      text: '5x campaign spikes.',
      source: 'Metrics',
    },
  ],
  evidenceAvailable: [],
  constraints: ['Two engineers'],
  acceptableArchitecturePatterns: [{ name: 'Managed app', validWhen: 'Small operations team' }],
  redFlags: [],
  evaluationCriteria: ['Contextual reasoning'],
  financialContext: 'Lost sales',
  architectureContext: 'One server',
  possibleQuestionTopics: ['budget', 'traffic'],
};

function completeDraft(): Draft {
  const d = emptyDraft(scenario);
  d.requirements = [
    {
      id: 'R01',
      text: 'Keep estimated monthly cost below $1200.',
      priority: 'must',
      source: 'CFO interview',
    },
  ];
  d.framing = {
    statedProblem: scenario.businessBrief,
    actualProblem: 'Checkout capacity cannot match short campaign peaks.',
    businessImpact: 'Failed sales cost $1000 per campaign.',
    symptoms: 'Checkout latency rises during peak traffic.',
    constraints: 'Two engineers own all operations and releases.',
    uncertainties: 'Peak database connections still need measuring.',
  };
  d.options = ['Managed capacity', 'Self-managed capacity'].map(
    (name, index) =>
      ({
        id: `option-${index}`,
        name,
        summary: `${name} scales checkout during campaign periods.`,
        components: 'Application, managed database, load balancer.',
        advantages: 'Supports capacity growth with predictable releases.',
        disadvantages: 'Adds service cost and needs ownership of monitoring.',
        cost: 'Planning estimate $900 to $1200/month.',
        operations: 'Two engineers share alerts with a documented runbook.',
        reliability: 'Recover within 30 minutes using a tested restore.',
        security: 'Private data store and least privilege access.',
        implementation: 'Deploy behind a reversible traffic switch.',
        assumptions: 'Traffic is variable rather than stable.',
        risks: 'Scaling will not solve unmeasured database contention.',
        ratings: Object.fromEntries(dimensions.map((dimension) => [dimension, 3])),
        tradeoffRationale:
          'Managed capacity costs more but saves operations time for this small team.',
      }) as ArchitectureOption,
  );
  d.recommendation = {
    optionId: 'option-0',
    decision: 'Use managed application capacity for checkout.',
    why: 'A small team needs time to fix checkout instead of managing hosts.',
    alternatives: 'Host management saves spend but adds operations responsibility.',
    risks: 'Database saturation may remain and will be measured.',
    assumptions: 'Campaign peaks remain intermittent.',
  };
  d.links = [
    {
      requirementId: 'R01',
      decision: 'Managed capacity within the stated monthly budget.',
      status: 'satisfied',
      rationale: 'The planning range is $900 to $1200/month including headroom.',
    },
  ];
  d.simpler =
    'A single larger host is simpler but cannot absorb the measured fivefold burst safely.';
  d.conditions = [
    {
      id: 'condition-1',
      condition: 'Compute becomes predictable.',
      signal: 'Average monthly utilization.',
      threshold: 'Above 70% for 30 days.',
      alternative: 'Evaluate fixed host capacity with the same load test.',
    },
  ];
  d.poc = {
    required: true,
    justification: '',
    hypothesis: 'Managed capacity sustains the campaign peak.',
    scope: 'Run representative checkout traffic in staging.',
    metrics: 'p95 latency, error rate, and monthly cost estimate.',
    success: 'p95 below 300ms with errors below 0.5%.',
    exit: 'Stop when cost exceeds $1200 per month.',
    goNoGo: 'Approve only after latency and cost gates pass.',
  };
  d.adr = {
    title: 'Use managed checkout capacity',
    context: d.framing.actualProblem,
    decision: d.recommendation.decision,
    alternatives: d.recommendation.alternatives,
    consequences: 'Higher service spend trades for fewer host tasks.',
    risks: d.recommendation.risks,
  };
  d.communication = {
    engineer: 'Deploy the application with a reversible release and measure p95 and errors.',
    cto: 'Reduce platform ownership while keeping the capacity decision reversible.',
    cfo: 'Estimated monthly costs stay between $900 and $1200; compare against lost sales.',
    ceo: 'Keep customers able to check out during campaigns without delaying product work.',
    analogy: 'Add checkout lanes when queues grow.',
    withoutServiceNames:
      'Add application capacity as customers arrive while keeping spending within the agreed budget.',
  };
  d.finalDecision = 'Proceed with managed checkout capacity after the load test passes.';
  d.lessons = 'Measure the real bottleneck before committing to more infrastructure.';
  return d;
}

function sessionWithDraft(): CaseSession {
  const now = new Date().toISOString();
  return {
    id: 'case',
    scenarioId: scenario.id,
    phase: 'final',
    version: 0,
    createdAt: now,
    updatedAt: now,
    draft: completeDraft(),
    messages: [],
    revealedFactIds: ['budget', 'traffic'],
    evidenceRequests: [],
    adrs: [],
    snapshots: [],
    reviews: [],
    evaluation: null,
    reviewProvider: null,
    published: false,
    isExample: false,
  };
}

describe('Architecture decision history', () => {
  it('accepted ADR content cannot be modified', () => {
    const adr = acceptADR(completeDraft(), []);
    expect(() => assertADRUnchanged(adr, { ...adr, decision: 'Silently changed' })).toThrow(
      'immutable',
    );
  });
  it('superseding ADR preserves relationship and requires a reason', () => {
    const draft = completeDraft();
    const first = acceptADR(draft, []);
    draft.adr.decision = 'Reconsider fixed hosts because compute stabilized.';
    expect(() => acceptADR(draft, [first], first.id)).toThrow('Explain why');
    const second = acceptADR(
      draft,
      [first],
      first.id,
      'Thirty days of stable utilization justified this change.',
    );
    expect(second.id).toBe('ADR-002');
    expect(second.supersedes).toBe('ADR-001');
    expect(first.decision).toBe('Use managed application capacity for checkout.');
  });
  it('requires a superseding ADR when its addressed requirements change', () => {
    const draft = completeDraft();
    const adr = acceptADR(draft, []);
    expect(hasCurrentADR(draft, [adr])).toBe(true);
    draft.links = [];
    expect(hasCurrentADR(draft, [adr])).toBe(false);
  });
});

describe('Requirements and traceability', () => {
  it('allocates monotonic IDs even after deleting requirements', () => {
    const first = assignRequirementIds(
      [],
      [{ id: 'temporary', text: 'Budget', source: 'CFO', priority: 'must' }],
      0,
    );
    expect(first.requirements[0].id).toBe('R01');
    const second = assignRequirementIds(
      [],
      [{ id: '', text: 'Recovery', source: 'CTO', priority: 'must' }],
      first.counter,
    );
    expect(second.requirements[0].id).toBe('R02');
  });
  it('retains existing IDs and rejects duplicate traceability links or dangling references', () => {
    const draft = completeDraft();
    expect(assignRequirementIds(draft.requirements, draft.requirements, 1).requirements[0].id).toBe(
      'R01',
    );
    expect(requirementCoverage(draft.requirements, draft.links)).toBe(1);
    expect(() => validateTraceability([], draft.links)).toThrow('missing requirement');
    expect(() =>
      validateTraceability(draft.requirements, [...draft.links, ...draft.links]),
    ).toThrow('Only one');
  });
  it('supports accept, partial, and reject feedback while requiring rationale', () => {
    for (const response of ['accept', 'partial', 'reject'])
      expect(
        actionSchema.safeParse({
          action: 'respondReview',
          version: 1,
          reviewId: 'review',
          response,
          rationale: 'The requirement evidence justifies my response.',
        }).success,
      ).toBe(true);
    expect(
      actionSchema.safeParse({
        action: 'respondReview',
        version: 1,
        reviewId: 'review',
        response: 'accept',
        rationale: '',
      }).success,
    ).toBe(false);
  });
});

describe('Evaluation and workflow', () => {
  it('validates the complete contract and sums all eight weighted dimensions to 100', () => {
    expect(draftSchema.safeParse(completeDraft()).success).toBe(true);
    const result = evaluateCase(scenario, sessionWithDraft());
    expect(Object.values(scoringWeights).reduce((a, b) => a + b, 0)).toBe(100);
    expect(result.dimensions).toHaveLength(8);
    expect(result.total).toBe(result.dimensions.reduce((sum, d) => sum + d.score, 0));
    expect(result.total).toBeLessThanOrEqual(100);
    expect(result.status).toBe('completed');
  });
  it('a critical miss forces revision regardless of a strong overall score', () => {
    const session = sessionWithDraft();
    session.revealedFactIds = ['traffic'];
    const result = evaluateCase(scenario, session);
    expect(result.total).toBeGreaterThan(70);
    expect(result.status).toBe('needs_revision');
    expect(result.criticalMisses.join(' ')).toContain('budget');
  });
  it('rewards explicit deferral with a measurable plan instead of fabricating certainty', () => {
    const session = sessionWithDraft();
    session.revealedFactIds = ['traffic'];
    session.draft.finalDecision = 'Defer this decision pending confirmation of the budget.';
    session.draft.notes.push({
      id: 'unknown',
      kind: 'unknown',
      text: 'Budget is not confirmed.',
      source: '',
      confidence: 'low',
      validation: 'Ask finance to approve the monthly limit.',
    });
    expect(evaluateCase(scenario, session).criticalMisses).toHaveLength(0);
  });
  it('blocks skipping phases and reruns prerequisites before review', () => {
    const session = sessionWithDraft();
    session.phase = 'conditions';
    session.draft.conditions = [];
    expect(() => advancePhase(session)).toThrow('observable');
    expect(() => assertFirstAnalysisReady(session)).toThrow();
  });
  it('does not permit high numeric ratings to substitute for trade-off reasoning', () => {
    const session = sessionWithDraft();
    const before = evaluateCase(scenario, session).dimensions.find(
      (d) => d.name === 'Trade-off reasoning',
    )!.score;
    session.draft.options.forEach((option) => {
      option.tradeoffRationale = '';
      option.advantages = '';
      option.disadvantages = '';
      option.ratings.cost = 5;
    });
    expect(
      evaluateCase(scenario, session).dimensions.find((d) => d.name === 'Trade-off reasoning')!
        .score,
    ).toBeLessThan(before);
  });
  it('rejects a long commitment when discovery confirms that no baseline exists', () => {
    const financial = structuredClone(scenario);
    financial.hiddenFacts[1].text = 'We have no stable usage baseline.';
    financial.redFlags = [
      {
        id: 'commitment',
        topic: 'baseline',
        description: 'A commitment without a usage baseline is premature.',
      },
    ];
    const session = sessionWithDraft();
    session.draft.recommendation.decision = 'Buy a 3-year Savings Plan immediately.';
    session.draft.finalDecision = 'Commit to the plan now.';
    expect(evaluateCase(financial, session).criticalMisses.join(' ')).toContain(
      'long-term financial commitment',
    );
  });
  it('requires an operations plan for a complex platform beyond the team capacity', () => {
    const constrained = structuredClone(scenario);
    constrained.constraints.push('The team has no Kubernetes or platform operations experience.');
    constrained.redFlags = [
      {
        id: 'capacity',
        topic: 'team',
        description: 'Platform complexity exceeds available operations capacity.',
      },
    ];
    const session = sessionWithDraft();
    session.draft.recommendation.decision = 'Build Kubernetes for all application workloads.';
    expect(evaluateCase(constrained, session).criticalMisses.join(' ')).toContain(
      'operational capacity',
    );
    session.draft.recommendation.why +=
      ' Hire a dedicated platform team with approved budget before launch.';
    expect(evaluateCase(constrained, session).criticalMisses).toHaveLength(0);
  });
});

describe('SQLite persistence and immutable snapshots', () => {
  beforeEach(() => {
    process.env.DATABASE_PATH = ':memory:';
    closeDatabase();
  });
  afterEach(() => {
    closeDatabase();
    delete process.env.DATABASE_PATH;
  });
  it('keeps server-only facts out of all public scenario payloads', () => {
    const publicScenarios = getPublicScenarios();
    expect(publicScenarios.length).toBeGreaterThanOrEqual(20);
    expect(publicScenarios[0]).not.toHaveProperty('hiddenFacts');
    expect(publicScenarios[0]).not.toHaveProperty('redFlags');
    const data = createCase(publicScenarios[0].id);
    expect(data.scenario).not.toHaveProperty('acceptableArchitecturePatterns');
    expect(data.session.revealedFactIds).toEqual([]);
    expect(getScenario(publicScenarios[0].id).hiddenFacts.length).toBeGreaterThan(0);
  });
  it('persists drafts and prevents stale updates from silently overwriting data', () => {
    const first = createCase(getPublicScenarios()[0].id);
    const draft = first.session.draft;
    draft.framing.actualProblem = 'A saved analysis.';
    const saved = updateDraft(first.session.id, 0, draft);
    expect(getCase(first.session.id).session.draft.framing.actualProblem).toBe('A saved analysis.');
    expect(saved.session.version).toBe(1);
    expect(() => updateDraft(first.session.id, 0, draft)).toThrow('another tab');
  });
  it('keeps first and final snapshots immutable in service and database', () => {
    const first = createCase(getPublicScenarios()[0].id);
    const sealed = mutateCase(first.session.id, 0, (session) => {
      sealSnapshot(session, 'first');
    });
    const initialText = sealed.session.snapshots[0].draft.framing.statedProblem;
    expect(() =>
      mutateCase(first.session.id, 1, (session) => {
        session.snapshots[0].draft.framing.statedProblem = 'Rewritten';
      }),
    ).toThrow('immutable');
    expect(() =>
      database()
        .sqlite.prepare('UPDATE reasoning_snapshots SET payload = ? WHERE case_id = ?')
        .run('{}', first.session.id),
    ).toThrow('immutable');
    expect(getCase(first.session.id).session.snapshots[0].draft.framing.statedProblem).toBe(
      initialText,
    );
  });
  it('enforces accepted ADR immutability even against direct SQL writes', () => {
    const first = createCase(getPublicScenarios()[0].id);
    mutateCase(first.session.id, 0, (session) => {
      session.adrs.push(acceptADR(completeDraft(), []));
    });
    expect(() =>
      database()
        .sqlite.prepare('UPDATE accepted_adrs SET payload = ? WHERE case_id = ?')
        .run('{}', first.session.id),
    ).toThrow('immutable');
    expect(() =>
      database()
        .sqlite.prepare('DELETE FROM accepted_adrs WHERE case_id = ?')
        .run(first.session.id),
    ).toThrow('immutable');
    expect(() =>
      database()
        .sqlite.prepare(
          'INSERT OR REPLACE INTO accepted_adrs (case_id, id, payload) VALUES (?, ?, ?)',
        )
        .run(first.session.id, 'ADR-001', '{}'),
    ).toThrow('immutable');
  });
  it('requires a source when promoting assumptions to facts', () => {
    const first = createCase(getPublicScenarios()[0].id);
    first.session.draft.notes.push({
      id: 'unconfirmed',
      kind: 'fact',
      text: 'The database is the bottleneck.',
      source: '',
      confidence: 'high',
      validation: '',
    });
    expect(() => updateDraft(first.session.id, 0, first.session.draft)).toThrow(
      'Facts require a source',
    );
  });
  it('allocates new requirement IDs without reusing a deleted ID in persisted drafts', () => {
    let current = createCase(getPublicScenarios()[0].id);
    current.session.draft.requirements = [
      { id: '', text: 'Budget', source: 'CFO', priority: 'must' },
    ];
    current = updateDraft(current.session.id, current.session.version, current.session.draft);
    expect(current.session.draft.requirements[0].id).toBe('R01');
    current.session.draft.requirements = [];
    current = updateDraft(current.session.id, current.session.version, current.session.draft);
    current.session.draft.requirements = [
      { id: '', text: 'Recovery', source: 'CTO', priority: 'must' },
    ];
    current = updateDraft(current.session.id, current.session.version, current.session.draft);
    expect(current.session.draft.requirements[0].id).toBe('R02');
  });
});
