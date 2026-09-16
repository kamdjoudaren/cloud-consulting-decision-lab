import { describe, expect, it } from 'vitest';
import { mergeSemanticEvaluation } from '../src/lib/evaluation/semantic';
import type { Evaluation } from '../src/lib/types';
const baseline: Evaluation = {
  total: 80,
  status: 'needs_revision',
  dimensions: [20, 10, 15, 20, 10, 10, 10, 5].map((max, i) => ({
    name: `Dimension ${i}`,
    score: max,
    max,
    feedback: 'Evidence-backed rationale.',
  })),
  criticalMisses: ['Recovery objective not established.'],
  strengths: ['Clear discovery.'],
  improvements: ['Confirm recovery objective.'],
  provider: 'Mock',
  evaluatedAt: '2026-09-15T00:00:00Z',
};
describe('Semantic evaluation boundary', () => {
  it('never lets a semantic evaluator erase critical scenario findings', () => {
    const semantic = { ...baseline, total: 999, criticalMisses: [], status: 'completed' as const };
    const result = mergeSemanticEvaluation(baseline, semantic, 'OpenAI');
    expect(result.status).toBe('needs_revision');
    expect(result.criticalMisses).toEqual(baseline.criticalMisses);
    expect(result.total).toBe(100);
  });
  it('rejects changed scoring weights or dimension order', () => {
    const semantic = structuredClone(baseline);
    semantic.dimensions[0].max = 100;
    expect(() => mergeSemanticEvaluation(baseline, semantic, 'OpenAI')).toThrow(
      'invalid scoring rubric',
    );
  });
});
