import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dimensions, type ArchitectureOption, type ReviewItem } from '../src/lib/types';
import { acceptADR } from '../src/lib/adr/service';
import { closeDatabase } from '../src/lib/db';
import {
  createCase,
  getCase,
  getPublicScenarios,
  mutateCase,
  updateDraft,
} from '../src/lib/cases/store';
import { performAction } from '../src/lib/cases/actions';

const provider = vi.hoisted(() => ({
  name: 'Test reviewer',
  reviewCase: vi.fn(),
  evaluateCommunication: vi.fn(),
  respondAsClient: vi.fn(),
  requestEvidence: vi.fn(),
}));
vi.mock('../src/lib/ai/provider', () => ({ getProvider: () => provider }));

function reviewReadyCase() {
  const data = createCase(getPublicScenarios()[0].id);
  return mutateCase(data.session.id, 0, (session) => {
    const d = session.draft;
    d.requirements = [
      {
        id: 'R01',
        text: 'Budget below $1200 per month.',
        priority: 'must',
        source: 'CFO conversation',
      },
    ];
    d.framing = {
      statedProblem: 'Slow checkout during campaigns.',
      actualProblem: 'Capacity does not match campaign bursts.',
      businessImpact: 'Customers abandon their orders.',
      symptoms: 'High p95 latency and error rate.',
      constraints: 'Two engineers manage production.',
      uncertainties: 'Database connections need measuring.',
    };
    d.options = ['Managed capacity', 'Fixed hosts'].map(
      (name, i) =>
        ({
          id: `option-${i}`,
          name,
          summary: `${name} supports checkout traffic.`,
          components: 'App and managed private database.',
          advantages: 'Capacity meets campaign traffic.',
          disadvantages: 'Additional spending and ownership.',
          cost: '$900 to $1200 monthly planning range.',
          operations: 'Two engineers share alert ownership.',
          reliability: 'Restore within 30 minutes.',
          security: 'Private database and least privilege.',
          implementation: 'Use a reversible release.',
          assumptions: 'Traffic peaks are short.',
          risks: 'Unmeasured database bottleneck.',
          ratings: Object.fromEntries(dimensions.map((key) => [key, 3])),
          tradeoffRationale: 'Managed services cost more but reduce host maintenance.',
        }) as ArchitectureOption,
    );
    d.recommendation = {
      optionId: 'option-0',
      decision: 'Use managed application capacity.',
      why: 'Reduce operational load on this team.',
      alternatives: 'Fixed hosts add ownership.',
      risks: 'Database bottleneck remains possible.',
      assumptions: 'Traffic stays variable.',
    };
    d.links = [
      {
        requirementId: 'R01',
        status: 'satisfied',
        decision: d.recommendation.decision,
        rationale: 'Estimated costs are within the stated budget.',
      },
    ];
    d.simpler = 'A single larger host does not meet campaign capacity requirements.';
    d.conditions = [
      {
        id: 'condition',
        condition: 'Stable compute demand.',
        signal: 'Average utilization.',
        threshold: 'Above 70% for 30 days.',
        alternative: 'Evaluate fixed hosts.',
      },
    ];
    d.poc = {
      required: true,
      justification: '',
      hypothesis: 'Managed capacity sustains campaigns.',
      scope: 'Checkout staging workload.',
      metrics: 'Latency, errors, and estimated cost.',
      success: 'p95 below 300ms.',
      exit: 'Stop above $1200.',
      goNoGo: 'Approve after passing load tests.',
    };
    d.adr = {
      title: 'Managed checkout capacity',
      context: d.framing.actualProblem,
      decision: d.recommendation.decision,
      alternatives: d.recommendation.alternatives,
      consequences: 'Additional cost reduces operations work.',
      risks: d.recommendation.risks,
    };
    d.communication = {
      engineer: 'Deploy with a reversible release and monitor latency.',
      cto: 'Reduce operational load and preserve reversibility.',
      cfo: 'Budget remains below $1200 per month.',
      ceo: 'Keep customers able to check out during campaigns.',
      analogy: '',
      withoutServiceNames: '',
    };
    session.adrs.push(acceptADR(d, []));
    session.phase = 'review';
  });
}
const review: ReviewItem[] = [
  {
    id: 'review-1',
    category: 'Validation',
    severity: 'warning',
    suggestion: 'Confirm recovery objectives before committing.',
    response: null,
    rationale: '',
  },
];

describe('Review snapshot ordering and lifecycle enforcement', () => {
  beforeEach(() => {
    process.env.DATABASE_PATH = ':memory:';
    closeDatabase();
    vi.clearAllMocks();
    provider.evaluateCommunication.mockResolvedValue([]);
    provider.reviewCase.mockResolvedValue(review);
  });
  afterEach(() => {
    closeDatabase();
    delete process.env.DATABASE_PATH;
  });
  it('commits the first analysis before the reviewer sees the case', async () => {
    const data = reviewReadyCase();
    provider.reviewCase.mockImplementation(async () => {
      const persisted = getCase(data.session.id);
      expect(persisted.session.snapshots).toHaveLength(1);
      expect(persisted.session.snapshots[0].kind).toBe('first');
      return review;
    });
    const result = await performAction(data.session.id, {
      action: 'review',
      version: data.session.version,
    });
    expect(result.session.reviews).toHaveLength(1);
    expect(result.session.reviewProvider).toBe('Test reviewer');
    expect(() =>
      updateDraft(result.session.id, result.session.version, result.session.draft),
    ).toThrow('sealed');
  });
  it('preserves the first analysis through provider failure and retry', async () => {
    const data = reviewReadyCase();
    provider.reviewCase.mockRejectedValueOnce(new Error('Provider unavailable'));
    await expect(
      performAction(data.session.id, { action: 'review', version: data.session.version }),
    ).rejects.toThrow('Provider unavailable');
    const failed = getCase(data.session.id);
    expect(failed.session.snapshots).toHaveLength(1);
    expect(failed.session.reviews).toHaveLength(0);
    const snapshot = JSON.stringify(failed.session.snapshots[0]);
    provider.reviewCase.mockResolvedValueOnce(review);
    const retry = await performAction(data.session.id, {
      action: 'review',
      version: failed.session.version,
    });
    expect(retry.session.snapshots).toHaveLength(1);
    expect(JSON.stringify(retry.session.snapshots[0])).toBe(snapshot);
  });
  it('cannot evaluate or publish by bypassing the workflow', async () => {
    const data = createCase(getPublicScenarios()[0].id);
    await expect(
      performAction(data.session.id, { action: 'evaluate', version: 0 }),
    ).rejects.toThrow('final');
    await expect(performAction(data.session.id, { action: 'publish', version: 0 })).rejects.toThrow(
      'evaluation',
    );
    expect(getCase(data.session.id).session.phase).toBe('brief');
  });
  it('requires every review response and protects earlier prerequisites when advancing', async () => {
    const data = reviewReadyCase();
    const reviewed = await performAction(data.session.id, {
      action: 'review',
      version: data.session.version,
    });
    await expect(
      performAction(data.session.id, { action: 'advance', version: reviewed.session.version }),
    ).rejects.toThrow('every item');
    const responded = await performAction(data.session.id, {
      action: 'respondReview',
      version: reviewed.session.version,
      reviewId: reviewed.session.reviews[0].id,
      response: 'partial',
      rationale: 'I will validate recovery before approving the final rollout.',
    });
    const final = await performAction(data.session.id, {
      action: 'advance',
      version: responded.session.version,
    });
    expect(final.session.phase).toBe('final');
    expect(final.session.reviews[0].response).toBe('partial');
  });
});
