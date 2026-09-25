import { z } from 'zod';
import { dimensions } from './types';
import { consultingSchema, assistanceModes } from './lab/schema';

const text = z.string().max(20_000);
const id = z.string().max(100);
const ratings = z.object(
  Object.fromEntries(dimensions.map((key) => [key, z.number().int().min(1).max(5)])) as Record<
    (typeof dimensions)[number],
    z.ZodNumber
  >,
);
export const draftSchema = z.object({
  consulting: consultingSchema.optional(),
  notes: z
    .array(
      z.object({
        id,
        kind: z.enum(['fact', 'assumption', 'unknown']),
        text,
        source: text,
        confidence: z.enum(['low', 'medium', 'high']),
        validation: text,
      }),
    )
    .max(100),
  requirements: z
    .array(z.object({ id, text, priority: z.enum(['must', 'should', 'could']), source: text }))
    .max(100),
  framing: z.object({
    statedProblem: text,
    actualProblem: text,
    businessImpact: text,
    symptoms: text,
    constraints: text,
    uncertainties: text,
  }),
  options: z
    .array(
      z.object({
        id,
        name: text,
        summary: text,
        components: text,
        advantages: text,
        disadvantages: text,
        cost: text,
        operations: text,
        reliability: text,
        security: text,
        implementation: text,
        assumptions: text,
        risks: text,
        ratings,
        tradeoffRationale: text,
      }),
    )
    .max(10),
  recommendation: z.object({
    optionId: id,
    decision: text,
    why: text,
    alternatives: text,
    risks: text,
    assumptions: text,
  }),
  simpler: text,
  links: z
    .array(
      z.object({
        requirementId: id,
        decision: text,
        status: z.enum(['satisfied', 'at_risk', 'unaddressed']),
        rationale: text,
      }),
    )
    .max(100),
  conditions: z
    .array(z.object({ id, condition: text, signal: text, threshold: text, alternative: text }))
    .max(20),
  poc: z.object({
    required: z.boolean(),
    justification: text,
    hypothesis: text,
    scope: text,
    metrics: text,
    success: text,
    exit: text,
    goNoGo: text,
  }),
  adr: z.object({
    title: text,
    context: text,
    decision: text,
    alternatives: text,
    consequences: text,
    risks: text,
  }),
  communication: z.object({
    engineer: text,
    cto: text,
    cfo: text,
    ceo: text,
    analogy: text,
    withoutServiceNames: text,
  }),
  diagram: text,
  finalDecision: text,
  lessons: text,
});
export const versionSchema = z.number().int().nonnegative();
export const patchSchema = z.object({ version: versionSchema, draft: draftSchema }).strict();
export const generatorSchema = z
  .object({
    level: z.number().int().min(1).max(5),
    primarySkill: z.string().min(1).max(100),
    secondarySkill: z.string().max(100),
    industry: z.string().min(1).max(100),
    companySize: z.number().int().min(2).max(100_000),
  })
  .strict();
const base = { version: versionSchema };
export const actionSchema = z.discriminatedUnion('action', [
  z.object({ ...base, action: z.literal('assistance'), mode: z.enum(assistanceModes) }).strict(),
  z
    .object({
      ...base,
      action: z.literal('hint'),
      kind: z.enum(['evidence', 'reasoning', 'metric', 'small']),
    })
    .strict(),
  z
    .object({ ...base, action: z.literal('chapter'), note: z.string().trim().min(20).max(4000) })
    .strict(),
  z
    .object({
      ...base,
      action: z.literal('defend'),
      challengeId: id,
      answer: z.string().trim().min(10).max(12000),
      evidenceIds: z.array(id).max(20),
    })
    .strict(),
  z.object({ ...base, action: z.literal('advance') }).strict(),
  z
    .object({
      ...base,
      action: z.literal('chat'),
      question: z.string().trim().min(2).max(3000),
      stakeholder: z.string().max(120),
    })
    .strict(),
  z
    .object({
      ...base,
      action: z.literal('evidence'),
      question: z.string().trim().min(3).max(3000),
      reason: z.string().trim().min(3).max(3000),
    })
    .strict(),
  z
    .object({
      ...base,
      action: z.literal('acceptAdr'),
      supersedes: z.string().max(100).nullable().optional(),
      reason: z.string().max(3000).optional(),
    })
    .strict(),
  z.object({ ...base, action: z.literal('review') }).strict(),
  z
    .object({
      ...base,
      action: z.literal('respondReview'),
      reviewId: id,
      response: z.enum(['accept', 'partial', 'reject']),
      rationale: z.string().trim().min(10).max(10_000),
    })
    .strict(),
  z.object({ ...base, action: z.literal('evaluate') }).strict(),
  z.object({ ...base, action: z.literal('publish') }).strict(),
  z.object({ ...base, action: z.literal('reopen') }).strict(),
]);
export type CaseAction = z.infer<typeof actionSchema>;

export class DomainError extends Error {
  constructor(
    message: string,
    public status = 422,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}
