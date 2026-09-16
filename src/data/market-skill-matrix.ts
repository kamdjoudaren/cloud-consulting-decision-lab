import type { Skill } from '@/lib/types';

const groups: Record<string, [string, string][]> = {
  Consulting: [['discovery', 'Client discovery'], ['problem-framing', 'Problem framing'], ['tradeoffs', 'Trade-off analysis'], ['communication', 'Executive communication'], ['adr', 'Architecture decision records'], ['business-value', 'Business and technical translation']],
  Architecture: [['performance', 'Performance diagnosis'], ['scalability', 'Scalability and peak traffic'], ['compute', 'Compute decisions'], ['containers', 'Containers and platforms'], ['databases', 'Database architecture'], ['caching', 'Caching'], ['async', 'Asynchronous processing'], ['storage', 'Storage and lifecycle'], ['networking', 'Networking and data transfer'], ['managed-services', 'Managed versus self-managed']],
  Operations: [['reliability', 'Reliability and availability'], ['disaster-recovery', 'Disaster recovery / RTO / RPO'], ['observability', 'Observability'], ['operations', 'Operational burden'], ['cicd', 'CI/CD and rollback'], ['iac', 'Infrastructure as Code']],
  Modernization: [['migration', 'Migration strategy'], ['modernization', 'Modernization']],
  'Cost & governance': [['finops', 'FinOps and cost allocation'], ['commitments', 'Capacity commitments'], ['security', 'Security architecture'], ['iam', 'Identity and access'], ['governance', 'Multi-account governance']],
  'Cloud + AI': [['ai-infrastructure', 'AI infrastructure'], ['ai-cost', 'AI cost and performance'], ['rag', 'Retrieval and GenAI systems'], ['ai-security', 'AI data and security'], ['mlops', 'MLOps and model lifecycle']],
};

const descriptions: Record<string, string> = {
  discovery: 'Ask questions whose answers can change a decision; record source and certainty.',
  'problem-framing': 'Separate business impact from symptoms and requested technologies.',
  tradeoffs: 'Compare defensible alternatives against explicit requirements.',
  communication: 'Explain engineering decisions using money, risk, and customer outcomes.',
  adr: 'Record context, alternatives, consequences, and reasons for superseding a decision.',
  'business-value': 'Connect latency, availability, and effort to business outcomes.',
  performance: 'Diagnose bottlenecks using distributions and evidence before adding capacity.',
  scalability: 'Plan for load shape, downstream limits, and realistic capacity tests.',
  compute: 'Balance utilization, elasticity, commitments, and ownership.',
  containers: 'Match orchestration complexity to workload and team maturity.',
  databases: 'Reason about queries, connections, consistency, and migration risk.',
  caching: 'Evaluate freshness, invalidation, cache keys, and measured hit rates.',
  async: 'Design bounded retries, idempotency, backpressure, and visible job states.',
  storage: 'Match retention and retrieval time to obligations and access patterns.',
  networking: 'Account for locality, connectivity, egress, and fault boundaries.',
  'managed-services': 'Include toil and control requirements in total cost.',
  reliability: 'Define objectives from business tolerance and failure modes.',
  'disaster-recovery': 'Distinguish backups from demonstrated recovery and data-loss limits.',
  observability: 'Connect customer symptoms to actionable metrics, logs, traces, and alerts.',
  operations: 'Budget on-call effort, runbooks, ownership, and skills.',
  cicd: 'Make releases repeatable, observable, reversible, and safe for schema changes.',
  iac: 'Bring existing systems under change control without accidental replacement.',
  migration: 'Sequence dependencies, cutover validation, and rollback around deadlines.',
  modernization: 'Choose what must change and what can remain.',
  finops: 'Optimize unit economics without removing required resilience.',
  commitments: 'Weigh stable baselines against uncertainty and reversibility.',
  security: 'Limit exposure using explicit trust boundaries and staged verification.',
  iam: 'Use accountable identities, least privilege, and evidence of isolation.',
  governance: 'Establish ownership, guardrails, and billing allocation across teams.',
  'ai-infrastructure': 'Connect inference choices to demand, data boundaries, and service objectives.',
  'ai-cost': 'Measure cost per successful task while preserving quality and latency.',
  rag: 'Diagnose retrieval, freshness, permissions, and grounded answer quality separately.',
  'ai-security': 'Evaluate data flows, retention, prompt attacks, and tenant isolation.',
  mlops: 'Version models and data, detect regressions, and make releases reproducible.',
};

// Curated curriculum, not a live labor-market ranking or a certification claim.
export const skills: Skill[] = Object.entries(groups).flatMap(([group, values]) => values.map(([id, name]) => ({ id, name, group, description: descriptions[id] })));
export const levelDescriptions = [
  { level: 1, name: 'Decision fundamentals', description: 'A focused problem, two alternatives, and guided discovery.' },
  { level: 2, name: 'Small business architecture', description: 'Connect components and constraints for a small team.' },
  { level: 3, name: 'Consulting', description: 'Challenge ambiguous requests and reconcile stakeholder priorities.' },
  { level: 4, name: 'High-stakes architecture', description: 'Make recoverable decisions under deadlines, scale, and business risk.' },
  { level: 5, name: 'Cloud + AI infrastructure', description: 'Balance quality, data boundaries, operations, and unit economics.' },
];
