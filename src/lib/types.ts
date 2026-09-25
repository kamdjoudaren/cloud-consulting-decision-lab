import type { LabConfig, LabTruth, ConsultingDraft, SimulationState, Debrief } from './lab/schema';
export const phases = [
  'brief',
  'discovery',
  'frame',
  'options',
  'tradeoffs',
  'recommendation',
  'simplify',
  'conditions',
  'validation',
  'adr',
  'communication',
  'review',
  'final',
  'evaluation',
  'portfolio',
] as const;
export type Phase = (typeof phases)[number] | 'analysis';
export const phaseLabels: Record<Phase, string> = {
  brief: 'Business brief',
  discovery: 'Discovery',
  frame: 'Problem framing',
  analysis: 'Technology → Value',
  options: 'Architecture options',
  tradeoffs: 'Trade-off matrix',
  recommendation: 'Recommendation',
  simplify: 'Why not simpler?',
  conditions: 'Change my mind',
  validation: 'Validation plan',
  adr: 'Decision record',
  communication: 'Communication',
  review: 'AI review',
  final: 'Final revision',
  evaluation: 'Evaluation',
  portfolio: 'Portfolio',
};
export const dimensions = [
  'cost',
  'reliability',
  'performance',
  'scalability',
  'security',
  'operationalBurden',
  'implementationSpeed',
  'teamFit',
  'flexibility',
  'reversibility',
] as const;
export type Dimension = (typeof dimensions)[number];
export type Audience = 'engineer' | 'cto' | 'cfo' | 'ceo';
export interface HiddenFact {
  id: string;
  topic: string;
  keywords: string[];
  text: string;
  source: string;
  critical?: boolean;
}
export interface Evidence {
  id: string;
  topic: string;
  keywords: string[];
  title: string;
  status: 'available' | 'unavailable' | 'measurement_required' | 'approximate';
  content: string;
  format?: 'memo' | 'csv';
  source?: string;
  chapter?: number;
  requires?: string[];
  factIds?: string[];
  date?: string;
  period?: string;
  scope?: string;
  owner?: string;
  confidence?: 'low' | 'medium' | 'high';
  provenance?:
    | 'management-provided'
    | 'finance-reconciled'
    | 'engineering-observed'
    | 'third-party'
    | 'estimated'
    | 'unverified';
  definition?: string;
  metrics?: {
    cloudBefore: number;
    cloudAfter: number;
    unitsBefore: number;
    unitsAfter: number;
    revenueBefore: number;
    revenueAfter: number;
    cogsBefore: number;
    cogsAfter: number;
    /** Optional AI economics measures used when the workload is model-mediated. */
    attempts?: number;
    successfulTasks?: number;
    retries?: number;
    aiVariableCost?: number;
    humanReviewRate?: number;
    /** Optional carve-out bridge measures. Values are planning estimates unless stated otherwise. */
    allocatedBefore?: number;
    allocatedAfter?: number;
    standaloneBefore?: number;
    standaloneAfter?: number;
    tsaMonthly?: number;
    separationSpend?: number;
  };
}
export interface Stakeholder {
  name: string;
  role: string;
  concern: string;
  objective?: string;
  incentive?: string;
  confidence?: 'low' | 'medium' | 'high';
  possibleDisagreement?: string;
}
export interface CompanyProfile {
  industry?: string;
  businessModel: string;
  customerType: string;
  revenueModel: string;
  growthStage: string;
  regulatoryContext: string;
  transactionContext: string;
}
export interface ScenarioPublic {
  id: string;
  title: string;
  company: string;
  level: number;
  industry: string;
  companySize: number;
  engineeringTeamSize: number;
  category: string;
  duration: number;
  businessBrief: string;
  knownFacts: string[];
  skillTags: string[];
  stakeholders: Stakeholder[];
  profile?: CompanyProfile;
  metricFocus?: string[];
  financialArchetype?: string;
  generated?: boolean;
  lab?: LabConfig;
}
export interface Scenario extends ScenarioPublic {
  truth?: LabTruth;
  variants?: {
    id: string;
    hiddenFacts: HiddenFact[];
    evidenceAvailable: Evidence[];
    truth: LabTruth;
  }[];
  hiddenFacts: HiddenFact[];
  evidenceAvailable: Evidence[];
  constraints: string[];
  acceptableArchitecturePatterns: { name: string; validWhen: string }[];
  redFlags: { id: string; description: string; topic: string }[];
  evaluationCriteria: string[];
  financialContext: string;
  architectureContext: string;
  possibleQuestionTopics: string[];
}
export interface Note {
  id: string;
  kind: 'fact' | 'assumption' | 'unknown';
  text: string;
  source: string;
  confidence: 'low' | 'medium' | 'high';
  validation: string;
}
export interface Requirement {
  id: string;
  text: string;
  priority: 'must' | 'should' | 'could';
  source: string;
}
export interface ArchitectureOption {
  id: string;
  name: string;
  summary: string;
  components: string;
  advantages: string;
  disadvantages: string;
  cost: string;
  operations: string;
  reliability: string;
  security: string;
  implementation: string;
  assumptions: string;
  risks: string;
  ratings: Record<Dimension, number>;
  tradeoffRationale: string;
}
export interface DecisionLink {
  requirementId: string;
  decision: string;
  status: 'satisfied' | 'at_risk' | 'unaddressed';
  rationale: string;
}
export interface ChangeCondition {
  id: string;
  condition: string;
  signal: string;
  threshold: string;
  alternative: string;
}
export interface Draft {
  consulting?: ConsultingDraft;
  notes: Note[];
  requirements: Requirement[];
  framing: {
    statedProblem: string;
    actualProblem: string;
    businessImpact: string;
    symptoms: string;
    constraints: string;
    uncertainties: string;
  };
  options: ArchitectureOption[];
  recommendation: {
    optionId: string;
    decision: string;
    why: string;
    alternatives: string;
    risks: string;
    assumptions: string;
  };
  simpler: string;
  links: DecisionLink[];
  conditions: ChangeCondition[];
  poc: {
    required: boolean;
    justification: string;
    hypothesis: string;
    scope: string;
    metrics: string;
    success: string;
    exit: string;
    goNoGo: string;
  };
  adr: {
    title: string;
    context: string;
    decision: string;
    alternatives: string;
    consequences: string;
    risks: string;
  };
  communication: Record<Audience, string> & { analogy: string; withoutServiceNames: string };
  diagram: string;
  finalDecision: string;
  lessons: string;
}
export interface DiscoveryMessage {
  id: string;
  role: 'consultant' | 'client';
  text: string;
  timestamp: string;
  stakeholder: string;
  revealedFactIds: string[];
}
export interface EvidenceRequest {
  id: string;
  question: string;
  reason: string;
  response: string;
  evidenceIds: string[];
  status: Evidence['status'];
  timestamp: string;
}
export interface ADR {
  id: string;
  title: string;
  context: string;
  decision: string;
  alternatives: string;
  consequences: string;
  risks: string;
  requirements: string[];
  createdAt: string;
  supersedes: string | null;
  reason: string;
  status: 'accepted';
}
export interface ReasoningSnapshot {
  id: string;
  kind: 'first' | 'final';
  draft: Draft;
  createdAt: string;
}
export interface ReviewItem {
  id: string;
  category: string;
  severity: 'info' | 'warning' | 'critical';
  suggestion: string;
  response: 'accept' | 'partial' | 'reject' | null;
  rationale: string;
}
export interface Evaluation {
  debrief?: Debrief;
  total: number;
  status: 'completed' | 'needs_revision';
  dimensions: { name: string; score: number; max: number; feedback: string }[];
  criticalMisses: string[];
  strengths: string[];
  improvements: string[];
  provider: string;
  evaluatedAt: string;
}
export interface CaseSession {
  evaluationHistory?: Evaluation[];
  simulation?: SimulationState;
  id: string;
  scenarioId: string;
  phase: Phase;
  version: number;
  createdAt: string;
  updatedAt: string;
  draft: Draft;
  messages: DiscoveryMessage[];
  revealedFactIds: string[];
  evidenceRequests: EvidenceRequest[];
  adrs: ADR[];
  snapshots: ReasoningSnapshot[];
  reviews: ReviewItem[];
  evaluation: Evaluation | null;
  reviewProvider: string | null;
  published: boolean;
  isExample: boolean;
}
export interface CaseData {
  documents?: Evidence[];
  session: CaseSession;
  scenario: ScenarioPublic;
}
export interface Skill {
  id: string;
  name: string;
  group: string;
  description: string;
}
export interface GeneratorInput {
  level: number;
  primarySkill: string;
  secondarySkill: string;
  industry: string;
  companySize: number;
}
export interface ClientResponse {
  text: string;
  revealedFactIds: string[];
}
export interface EvidenceResponse {
  response: string;
  evidenceIds: string[];
  revealedFactIds: string[];
  status: Evidence['status'];
}
