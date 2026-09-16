import { z } from 'zod';
const text = z.string().trim().min(1).max(6000);
const keywords = z.array(z.string().min(2).max(80)).min(1).max(30);
export const scenarioSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9][a-z0-9-]{1,99}$/),
    title: text,
    company: text,
    level: z.number().int().min(1).max(5),
    industry: text,
    companySize: z.number().int().min(2).max(1000000),
    engineeringTeamSize: z.number().int().min(1).max(100000),
    category: text,
    duration: z.number().int().min(10).max(240),
    businessBrief: z.string().min(50).max(3000),
    knownFacts: z.array(text).min(2).max(8),
    skillTags: z.array(text).min(2).max(12),
    stakeholders: z
      .array(z.object({ name: text, role: text, concern: text }))
      .min(2)
      .max(8),
    generated: z.boolean().optional(),
    hiddenFacts: z
      .array(
        z.object({
          id: text,
          topic: text,
          keywords,
          text,
          source: text,
          critical: z.boolean().optional(),
        }),
      )
      .min(4)
      .max(20),
    evidenceAvailable: z
      .array(
        z.object({
          id: text,
          topic: text,
          keywords,
          title: text,
          status: z.enum(['available', 'unavailable', 'measurement_required', 'approximate']),
          content: text,
        }),
      )
      .min(2)
      .max(15),
    constraints: z.array(text).min(2).max(12),
    acceptableArchitecturePatterns: z
      .array(z.object({ name: text, validWhen: text }))
      .min(2)
      .max(6),
    redFlags: z
      .array(z.object({ id: text, description: text, topic: text }))
      .min(2)
      .max(10),
    evaluationCriteria: z.array(text).min(3).max(12),
    financialContext: text,
    architectureContext: text,
    possibleQuestionTopics: z.array(text).min(4).max(20),
  })
  .superRefine((scenario, ctx) => {
    if (scenario.engineeringTeamSize > scenario.companySize)
      ctx.addIssue({
        code: 'custom',
        message: 'Engineering team exceeds company size',
        path: ['engineeringTeamSize'],
      });
    for (const key of ['hiddenFacts', 'evidenceAvailable', 'redFlags'] as const) {
      if (new Set(scenario[key].map((item) => item.id)).size !== scenario[key].length)
        ctx.addIssue({
          code: 'custom',
          message: 'IDs must be unique within the scenario',
          path: [key],
        });
    }
    if (!scenario.hiddenFacts.some((fact) => fact.critical))
      ctx.addIssue({
        code: 'custom',
        message: 'At least one decision-changing fact is required',
        path: ['hiddenFacts'],
      });
    if (/^(?:we need to choose|should we use|choose between)\b/i.test(scenario.businessBrief))
      ctx.addIssue({
        code: 'custom',
        message: 'Start with a business problem',
        path: ['businessBrief'],
      });
  });
export const generatorInputSchema = z.object({
  level: z.number().int().min(1).max(5),
  primarySkill: text,
  secondarySkill: text,
  industry: z.string().trim().min(2).max(80),
  companySize: z.number().int().min(2).max(1000000),
});
