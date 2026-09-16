import type { Evaluation } from '../types';
import { z } from 'zod';

const semanticSchema = z.object({
  dimensions: z
    .array(
      z.object({
        name: z.string(),
        score: z.number().int().nonnegative(),
        max: z.number().int().positive(),
        feedback: z.string().min(1),
      }),
    )
    .length(8),
  criticalMisses: z.array(z.string()).max(30),
  strengths: z.array(z.string()).max(30),
  improvements: z.array(z.string()).max(30),
  provider: z.string(),
});

/** The provider can assess reasoning, but cannot change the rubric or erase deterministic critical misses. */
export function mergeSemanticEvaluation(
  baseline: Evaluation,
  candidate: Evaluation,
  provider: string,
): Evaluation {
  const parsed = semanticSchema.parse(candidate);
  const dimensions = baseline.dimensions.map((base, index) => {
    const item = parsed.dimensions[index];
    if (item.name !== base.name || item.max !== base.max || item.score > base.max)
      throw new Error('The semantic evaluator returned an invalid scoring rubric.');
    return item;
  });
  const criticalMisses = [...new Set([...baseline.criticalMisses, ...parsed.criticalMisses])];
  return {
    total: dimensions.reduce((total, d) => total + d.score, 0),
    dimensions,
    criticalMisses,
    status: criticalMisses.length ? 'needs_revision' : 'completed',
    strengths: parsed.strengths,
    improvements: parsed.improvements,
    provider,
    evaluatedAt: new Date().toISOString(),
  };
}
