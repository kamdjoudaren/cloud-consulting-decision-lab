import { z } from 'zod';

const text = z.string().max(12000);
const label = z.string().min(1).max(200);
const list = z.array(label).max(40);
const money = z.number().finite().min(0).max(1e12);
export const assistanceModes = ['guided', 'standard', 'hard', 'expert'] as const;
export const families = [
  'Cloud',
  'FinOps',
  'AI / MLOps',
  'Buy-Side DD',
  'Value Creation',
  'Sell-Side',
  'M&A / Carve-Out',
  'Mega-Case',
] as const;
export const peStages = [
  'None',
  'Screening',
  'Initial DD',
  'Confirmatory DD',
  'IC',
  'Signing / Closing',
  'Day 1',
  '100-Day Plan',
  'Hold Period',
  'Add-On Acquisition',
  'Integration',
  'Exit Readiness',
  'Sell-Side DD',
  'Exit',
] as const;
export const configSchema = z.object({
  version: z.literal(2),
  family: z.enum(families),
  peStage: z.enum(peStages),
  context: text,
  awsServices: list,
  finopsConcepts: list,
  mlopsConcepts: list,
  businessMetrics: list,
  financialMetrics: list,
  peConcepts: list,
  deliverables: list.min(1),
  assistanceCompatibility: z.array(z.enum(assistanceModes)).min(1),
  chapters: z.array(z.object({ id: label, title: label, task: text })).max(12),
});
export type LabConfig = z.infer<typeof configSchema>;
export const authoringSchema = z
  .object({
    companyProfile: z.record(z.string(), text).optional(),
    stakeholderPack: z
      .array(
        z.object({
          name: label,
          role: label.optional(),
          objective: text.optional(),
          topics: list.optional(),
        }),
      )
      .optional(),
    financialArchetype: label.optional(),
    financialOverrides: z.record(z.string(), money).optional(),
    metrics: list.optional(),
    findings: z
      .array(
        z.object({
          id: label,
          title: text,
          domain: label.optional(),
          evidenceIds: list,
          materiality: z.enum(['green', 'amber', 'red']).optional(),
        }),
      )
      .optional(),
    contradictions: z
      .array(z.object({ id: label, claim: text, counterEvidenceId: label, resolution: text }))
      .optional(),
    falseLeads: list.optional(),
    challengePack: z.array(z.object({ audience: label, question: text.min(10) })).optional(),
    coachingPack: list.optional(),
    deliverables: list.optional(),
    difficultyOverrides: z.record(z.string(), text).optional(),
    chapters: z.array(z.object({ id: label, title: label, task: text })).optional(),
    companyConstraints: list.optional(),
    customerContext: text.optional(),
    regulatoryContext: text.optional(),
  })
  .partial();
export type AuthoringDefinition = z.infer<typeof authoringSchema>;
export const knowledgeSchema = z.object({
  name: label,
  topics: list.min(1),
  objective: text,
  unknowns: text,
  bias: text,
  style: z.enum(['direct', 'cautious', 'defensive']),
  evidenceIds: list,
});
export const truthSchema = z.object({
  rootCause: text.min(1),
  falseLeads: list,
  expectedFindings: z
    .array(
      z.object({
        id: label,
        finding: text,
        evidenceIds: list.min(1),
        keywords: list.min(1),
        domain: label.optional(),
        businessImpact: text.optional(),
        financialImpact: text.optional(),
        peImpact: text.optional(),
        severity: z.enum(['info', 'warning', 'critical']).optional(),
        materiality: z.enum(['green', 'amber', 'red']).optional(),
        confidence: z.enum(['low', 'medium', 'high']).optional(),
        costToFix: money.optional(),
        timing: text.optional(),
        owner: label.optional(),
        recommendedAction: text.optional(),
        validationNeeded: text.optional(),
        dependencies: list.optional(),
        possibleCounterEvidence: text.optional(),
      }),
    )
    .min(1),
  contradictions: z
    .array(z.object({ id: label, claim: text, counterEvidenceId: label, resolution: text }))
    .max(10),
  knowledge: z.array(knowledgeSchema).min(2),
  coaching: list.min(1),
  debrief: text.min(1),
  challengeQuestions: z.array(z.object({ audience: label, question: text.min(10) })).min(1),
});
export type LabTruth = z.infer<typeof truthSchema>;
export const findingSchema = z.object({
  id: label,
  title: text,
  technical: text,
  operational: text,
  customer: text,
  businessMetric: text,
  financialMetric: text,
  forecast: text,
  value: text,
  action: text,
  confidence: z.enum(['low', 'medium', 'high']),
  evidenceIds: list,
  materiality: z.enum(['green', 'amber', 'red']),
  materialityReason: text,
  probability: z.number().min(0).max(100),
  timing: text,
  costToFix: money,
  managementDependency: text,
  validation: text,
});
export const valueKinds = [
  'recurring',
  'one-time',
  'avoidance',
  'capacity',
  'revenue',
  'risk',
] as const;
export const valueStages = [
  'identified',
  'validated',
  'implemented',
  'realized',
  'verified',
] as const;
export const initiativeSchema = z.object({
  id: label,
  name: text,
  owner: text,
  baseline: text,
  target: text,
  annualValue: money,
  kind: z.enum(valueKinds),
  stage: z.enum(valueStages),
  cost: money,
  offset: money,
  monthsToStart: z.number().min(0).max(120),
  timeline: text,
  risk: text,
  confidence: z.enum(['low', 'medium', 'high']),
  kpi: text,
  evidenceIds: list,
  verifiedAnnualValue: money,
  financeSignoff: text,
  benefitKey: text,
});
export const economicsSchema = z.object({
  cloudBefore: money.nullable(),
  cloudAfter: money.nullable(),
  unitsBefore: money.nullable(),
  unitsAfter: money.nullable(),
  revenueBefore: money.nullable(),
  revenueAfter: money.nullable(),
  cogsBefore: money.nullable(),
  cogsAfter: money.nullable(),
  unit: text,
  period: text,
  sourceIds: list,
  interpretation: text,
  conclusion: z.enum(['unknown', 'improving', 'deteriorating', 'mixed']),
});
export const consultingSchema = z.object({
  technicalAnalysis: text,
  hypotheses: text,
  economics: economicsSchema,
  findings: z.array(findingSchema).max(20),
  initiatives: z.array(initiativeSchema).max(20),
  recommendationConfidence: z.enum(['low', 'medium', 'high']),
  executiveSummary: text,
  operatingPartner: text,
  investmentCommittee: text,
  communicationFormat: z.enum([
    '30-second summary',
    '90-second summary',
    '5-minute explanation',
    'Executive one-pager',
    'DD finding',
    'Risk register',
    'Business case',
    '100-Day action',
    'IC summary',
    'Sell-side evidence response',
  ]),
  deliverables: z.array(z.object({ title: text, body: text })).max(15),
});
export type ConsultingDraft = z.infer<typeof consultingSchema>;
export type Finding = z.infer<typeof findingSchema>;
export type Initiative = z.infer<typeof initiativeSchema>;
export type AssistanceMode = (typeof assistanceModes)[number];
export interface SimulationState {
  mode: AssistanceMode;
  level: number;
  chapter: number;
  chapterNotes: { chapter: number; text: string; evidenceIds: string[] }[];
  hints: { kind: string; text: string; cost: number; createdAt: string }[];
  challenges: {
    id: string;
    audience: string;
    question: string;
    answer: string;
    evidenceIds: string[];
    createdAt: string;
  }[];
}
export interface Debrief {
  summary: string;
  reasoning: string;
  mistakes: string[];
  nextPractice: string[];
  evidenceGaps: string[];
  hintsUsed: number;
  hintPenalty: number;
}
export function emptyConsulting(): ConsultingDraft {
  return {
    technicalAnalysis: '',
    hypotheses: '',
    economics: {
      cloudBefore: null,
      cloudAfter: null,
      unitsBefore: null,
      unitsAfter: null,
      revenueBefore: null,
      revenueAfter: null,
      cogsBefore: null,
      cogsAfter: null,
      unit: '',
      period: '',
      sourceIds: [],
      interpretation: '',
      conclusion: 'unknown',
    },
    findings: [],
    initiatives: [],
    recommendationConfidence: 'medium',
    executiveSummary: '',
    operatingPartner: '',
    investmentCommittee: '',
    communicationFormat: '30-second summary',
    deliverables: [],
  };
}
