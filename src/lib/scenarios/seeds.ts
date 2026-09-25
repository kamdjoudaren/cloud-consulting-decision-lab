import type { Evidence, HiddenFact, Scenario } from '@/lib/types';
import { consultingCatalog } from './consulting-bank';
import { cloudArchitectureSeeds } from './cloud-architecture';
import { commonCloudSeeds } from './cloud-common';

const topicKeywords: Record<string, string[]> = {
  business: [
    'business',
    'impact',
    'revenue',
    'sales',
    'customer impact',
    'loss',
    'revenu',
    'ventes',
    'perte',
    'objectif',
    'conversion',
  ],
  traffic: [
    'traffic',
    'load',
    'requests',
    'peak',
    'concurrency',
    'growth',
    'volume',
    'trafic',
    'charge',
    'pic',
    'croissance',
    'utilisateurs',
  ],
  architecture: [
    'architecture',
    'current system',
    'infrastructure',
    'stack',
    'components',
    'hebergement',
    'actuelle',
    'serveurs',
    'system',
  ],
  budget: [
    'budget',
    'cost',
    'spend',
    'bill',
    'finance',
    'price',
    'cout',
    'couts',
    'facture',
    'depenses',
    'dollars',
    'pricing',
  ],
  team: [
    'team',
    'engineers',
    'skills',
    'operations',
    'on call',
    'equipe',
    'ingenieurs',
    'competences',
    'astreinte',
    'experience',
  ],
  recovery: [
    'rto',
    'rpo',
    'recovery',
    'downtime',
    'data loss',
    'availability',
    'outage',
    'restore',
    'backup',
    'panne',
    'perte de donnees',
    'disponibilite',
    'retablissement',
    'sauvegarde',
  ],
  security: [
    'security',
    'sensitive',
    'privacy',
    'compliance',
    'access',
    'data',
    'retention',
    'securite',
    'donnees',
    'conformite',
    'acces',
    'personnelles',
    'permissions',
  ],
  database: [
    'database',
    'queries',
    'query',
    'cpu',
    'connections',
    'pool',
    'sql',
    'db',
    'base de donnees',
    'requete',
    'connexions',
    'memoire',
  ],
  observability: [
    'metrics',
    'p95',
    'p99',
    'latency',
    'monitoring',
    'logs',
    'trace',
    'measure',
    'evidence',
    'metriques',
    'latence',
    'mesurer',
    'monitoring',
    'preuves',
  ],
  deployment: [
    'deployment',
    'deploy',
    'rollback',
    'release',
    'pipeline',
    'deploiement',
    'retour arriere',
    'livraison',
    'version',
  ],
  migration: [
    'migration',
    'deadline',
    'dependencies',
    'license',
    'cutover',
    'datacenter',
    'dependances',
    'licence',
    'delai',
    'bascule',
    'echeance',
  ],
  storage: [
    'storage',
    'retention',
    'archive',
    'restore',
    'objects',
    'access frequency',
    'stockage',
    'conservation',
    'fichiers',
    'archives',
  ],
  network: [
    'network',
    'egress',
    'transfer',
    'nat',
    'bandwidth',
    'connectivity',
    'reseau',
    'transfert',
    'bande passante',
    'connexion',
  ],
  quality: [
    'quality',
    'accuracy',
    'evaluation',
    'correct',
    'hallucination',
    'grounding',
    'qualite',
    'precision',
    'erreur',
    'fiabilite',
  ],
  inference: [
    'inference',
    'model',
    'tokens',
    'gpu',
    'prompt',
    'batch',
    'modele',
    'jetons',
    'contexte',
    'generation',
  ],
};

type FactInput = [
  topic: string,
  text: string,
  source: string,
  critical?: boolean,
  keywords?: string[],
];
type EvidenceInput = [
  topic: string,
  title: string,
  status: Evidence['status'],
  content: string,
  keywords?: string[],
];
export interface SeedInput {
  id: string;
  title: string;
  company: string;
  level: number;
  industry: string;
  size: number;
  engineers: number;
  category: string;
  brief: string;
  known: string[];
  skills: string[];
  facts: FactInput[];
  evidence: EvidenceInput[];
  constraints: string[];
  patterns: [string, string][];
  flags: [string, string][];
  criteria: string[];
}

function createScenario(seed: SeedInput): Scenario {
  const hiddenFacts: HiddenFact[] = seed.facts.map(
    ([topic, text, source, critical = false, extra = []], i) => ({
      id: `${seed.id}-f${i + 1}`,
      topic,
      keywords: [...new Set([...(topicKeywords[topic] ?? [topic]), ...extra])],
      text,
      source,
      critical,
    }),
  );
  return {
    id: seed.id,
    title: seed.title,
    company: seed.company,
    level: seed.level,
    industry: seed.industry,
    companySize: seed.size,
    engineeringTeamSize: seed.engineers,
    category: seed.category,
    duration: [25, 40, 55, 70, 80][seed.level - 1],
    businessBrief: seed.brief,
    knownFacts: seed.known,
    skillTags: [
      ...new Set([
        ...seed.skills,
        'discovery',
        'problem-framing',
        'tradeoffs',
        'communication',
        'adr',
      ]),
    ],
    stakeholders: [
      {
        name: 'Alex Morgan',
        role: 'Business sponsor',
        concern: seed.facts.find((fact) => fact[0] === 'business')
          ? 'Customer impact and business priorities'
          : 'Outcome, timeline, and business risk',
      },
      {
        name: 'Priya Shah',
        role: 'CTO',
        concern: 'Feasibility, reliability, and engineering capacity',
      },
      {
        name: 'Sam Chen',
        role: 'Lead engineer',
        concern: 'How the current system behaves and who operates it',
      },
      { name: 'Jordan Ellis', role: 'CFO', concern: 'Budget, total cost, and reversibility' },
    ],
    hiddenFacts,
    evidenceAvailable: seed.evidence.map(([topic, title, status, content, extra = []], i) => ({
      id: `${seed.id}-e${i + 1}`,
      topic,
      title,
      status,
      content,
      keywords: [...new Set([...(topicKeywords[topic] ?? [topic]), ...extra])],
    })),
    constraints: seed.constraints,
    acceptableArchitecturePatterns: seed.patterns.map(([name, validWhen]) => ({ name, validWhen })),
    redFlags: seed.flags.map(([topic, description], i) => ({
      id: `${seed.id}-r${i + 1}`,
      topic,
      description,
    })),
    evaluationCriteria: seed.criteria,
    financialContext:
      hiddenFacts.find((fact) => fact.topic === 'budget')?.text ??
      hiddenFacts.find((fact) => fact.topic === 'business')!.text,
    architectureContext: hiddenFacts.find((fact) => fact.topic === 'architecture')!.text,
    possibleQuestionTopics: [...new Set(hiddenFacts.map((fact) => fact.topic))],
  };
}

const seeds: SeedInput[] = [
  {
    id: 'lost-sales',
    title: 'When campaigns cost you sales',
    company: 'Harbor & Pine',
    level: 1,
    industry: 'E-commerce',
    size: 24,
    engineers: 3,
    category: 'Performance & scalability',
    brief:
      'Our store becomes painfully slow whenever we send a promotional email. Customers abandon their baskets and our marketing team is afraid to launch the next campaign. Can you help us protect those sales?',
    known: [
      'A small online retailer with a three-person engineering team.',
      'The next campaign is in six weeks.',
    ],
    skills: ['performance', 'databases', 'caching', 'business-value'],
    facts: [
      [
        'business',
        'Campaign checkout conversion falls from 3.1% to 1.8%. Finance estimates $8,000 of missed orders per campaign, but this is correlation, not a measured causal loss.',
        'Business sponsor',
        true,
      ],
      [
        'traffic',
        'We serve 20 requests/second normally and 160 for about 30 minutes after emails. There are two campaigns each month.',
        'Lead engineer',
      ],
      [
        'architecture',
        'One application VM serves pages and checkout. A managed PostgreSQL database stores orders. The application keeps a database connection while waiting for the shipping provider.',
        'Lead engineer',
      ],
      [
        'database',
        'During the last campaign, application CPU stayed below 45%, but all 100 database connections were occupied. Slow traces show the shipping call taking 2–5 seconds.',
        'Lead engineer',
        true,
      ],
      [
        'budget',
        'Current hosting costs $850/month. Finance permits up to $600/month extra, including monitoring, if the change can be justified against checkout outcomes.',
        'CFO',
      ],
      [
        'team',
        'Three developers own the store; no platform team. We can allocate one engineer for two weeks, and nobody has production Kubernetes experience.',
        'CTO',
      ],
      [
        'recovery',
        'The sponsor tolerates a 30-minute interruption outside campaigns. Confirmed paid orders must not be lost. Backups exist, but a restore has not been rehearsed this quarter.',
        'Business sponsor',
      ],
      [
        'security',
        'Checkout sends payment details directly to a payment provider. We store customer contact details and order references, not card numbers. Customer-specific prices must never leak through a shared cache.',
        'Lead engineer',
      ],
    ],
    evidence: [
      [
        'database',
        'Campaign trace excerpt',
        'available',
        'Synthetic 10-minute sample: app CPU 41%; DB CPU 32%; connections 100/100; checkout p95 5.2s; 68% of slow spans wait on shipping while holding a connection. The sample does not establish behavior at the next peak.',
      ],
      [
        'business',
        'Campaign conversion comparison',
        'approximate',
        'Analytics: ordinary sessions 3.1% checkout conversion, email-campaign sessions 1.8%. Audiences differ. Finance estimate: $8,000 missed order value per campaign; margin and attribution need confirmation.',
      ],
      [
        'observability',
        'Controlled load-test report',
        'measurement_required',
        'No representative load test exists. Engineering can reproduce a campaign against test data and record connection occupancy, checkout p95, errors, and shipping latency.',
      ],
    ],
    constraints: [
      'Six weeks before campaign; one engineer for two weeks.',
      'At most $600/month additional recurring spend.',
      'Do not lose confirmed orders or expose personalized prices.',
    ],
    patterns: [
      [
        'Tune the existing checkout and connection handling',
        'Defensible if traces and a load test show external waits are exhausting connections; preserve rollback and observe conversion.',
      ],
      [
        'Add bounded application capacity with a separately validated database plan',
        'Defensible if measurement finds an additional compute limit after connection handling is controlled; respect the small operating team.',
      ],
    ],
    flags: [
      [
        'database',
        'Scaling application replicas without bounding their aggregate database connections may worsen checkout failure.',
      ],
      [
        'team',
        'A new orchestration platform needs a workload requirement and an operating owner, not just a growth forecast.',
      ],
    ],
    criteria: [
      'Separate observed symptoms from a causal hypothesis.',
      'Use a representative test before promising conversion improvement.',
      'Compare the simplest viable change with a capacity alternative.',
    ],
  },
  {
    id: 'weekend-outage',
    title: 'The booking desk goes dark',
    company: 'Cedar Trails',
    level: 1,
    industry: 'Travel',
    size: 18,
    engineers: 2,
    category: 'Reliability',
    brief:
      'Our booking website stopped working on Saturday. We were back online by the afternoon, but the office was closed and nobody knew what to do. We need a sensible way to stop losing an entire weekend of bookings.',
    known: ['Bookings happen seven days a week.', 'The system is maintained by two developers.'],
    skills: ['reliability', 'disaster-recovery', 'operations'],
    facts: [
      [
        'business',
        'Weekend bookings contribute 45% of weekly revenue. The last outage lasted three hours and support recorded 17 abandoned reservations.',
        'Business sponsor',
        true,
      ],
      [
        'architecture',
        'The application has two instances, but its managed database runs in one availability zone. A database host event caused the last outage.',
        'Lead engineer',
      ],
      [
        'recovery',
        'The business can tolerate 20 minutes without bookings and at most five minutes of lost reservation edits. These are proposed targets awaiting cost approval.',
        'Business sponsor',
        true,
      ],
      [
        'budget',
        'We can add $250/month; the existing database costs $190/month. The extra expense must include alerting and a way to test recovery.',
        'CFO',
      ],
      [
        'team',
        'One developer checks alerts on weekends informally. Nobody has practised restoring the database without the lead developer.',
        'CTO',
      ],
    ],
    evidence: [
      [
        'recovery',
        'Saturday incident timeline',
        'available',
        '09:12 database unavailable; 10:04 first customer email; 11:48 developer responds; 12:15 recovered. No independent synthetic booking alert existed.',
      ],
      [
        'recovery',
        'Restore timing',
        'measurement_required',
        'Backups are green but restoration duration and recovered transaction age have never been measured.',
      ],
    ],
    constraints: ['Two-person team; limited weekend coverage.', '$250/month incremental budget.'],
    patterns: [
      [
        'Managed standby and tested recovery',
        'Useful if failure recovery and lost edits meet the agreed objectives at an affordable total cost.',
      ],
      [
        'Single-zone service with faster detection and rehearsed restoration',
        'Defensible only if the sponsor explicitly accepts a longer interruption and data-loss exposure.',
      ],
    ],
    flags: [
      ['recovery', 'A green backup job does not demonstrate a 20-minute restoration.'],
      ['operations', 'An alert has no operational value without an owner and response plan.'],
    ],
    criteria: [
      'Distinguish RTO from RPO.',
      'Price resilience against lost bookings.',
      'Include an owned recovery rehearsal.',
    ],
  },
  {
    id: 'archive-attic',
    title: 'Nobody knows what we can delete',
    company: 'Framehouse Studio',
    level: 1,
    industry: 'Media',
    size: 32,
    engineers: 2,
    category: 'Storage & FinOps',
    brief:
      'Our design studio keeps every original image and every intermediate export. The storage bill rises every month, but the team is afraid to delete anything in case a client comes back. We need a policy people can trust.',
    known: [
      'Client projects generate large image files.',
      'The studio has seven years of archives.',
    ],
    skills: ['storage', 'finops', 'business-value'],
    facts: [
      [
        'business',
        'Repeat clients occasionally request an original from a past project. Staff currently promise same-day delivery without checking contract terms.',
        'Business sponsor',
      ],
      [
        'architecture',
        '120 TB of originals and exports share one object-storage bucket and one storage class. Object prefixes identify project and year.',
        'Lead engineer',
      ],
      [
        'storage',
        'Signed contracts require originals for seven years; intermediate renders need only 90 days. Fewer than 1% of objects older than one year were read last quarter.',
        'Operations manager',
        true,
      ],
      [
        'recovery',
        'Sales will accept next-business-day retrieval of projects closed over a year ago, provided active projects remain immediate.',
        'Business sponsor',
        true,
      ],
      [
        'budget',
        'Storage costs $2,900/month. Finance wants 30% reduction, but unexpected retrieval charges must be included.',
        'CFO',
      ],
    ],
    evidence: [
      [
        'storage',
        'Access inventory and retention extract',
        'available',
        'Synthetic sample: 72 TB original files; 48 TB intermediates; 0.8% of closed-project objects read in 90 days. Contract extract requires seven-year original retention. Legal holds need a separate label.',
      ],
      [
        'budget',
        'Retrieval demand forecast',
        'unavailable',
        'There is no forecast of restore volume. The studio can first record archival requests for one month.',
      ],
    ],
    constraints: [
      'Seven-year original retention and legal holds take priority over savings.',
      'Active project assets must remain immediately available.',
    ],
    patterns: [
      [
        'Lifecycle tiers with explicit project and hold tags',
        'Appropriate when age and file purpose reliably distinguish retention and retrieval needs.',
      ],
      [
        'Keep originals hot while deleting validated disposable intermediates',
        'Appropriate when retrieval uncertainty outweighs deeper storage savings; secure business sign-off before deletion.',
      ],
    ],
    flags: [
      ['storage', 'Deleting by age alone can violate contractual retention or legal holds.'],
      ['budget', 'Ignoring retrieval volume makes the savings estimate incomplete.'],
    ],
    criteria: [
      'Separate retention from access speed.',
      'Validate classification before destructive lifecycle actions.',
      'Estimate total cost including retrieval.',
    ],
  },
  {
    id: 'quiet-servers',
    title: 'Paying for a peak that rarely comes',
    company: 'Rosterly',
    level: 1,
    industry: 'B2B SaaS',
    size: 20,
    engineers: 3,
    category: 'Compute & cost',
    brief:
      'We pay for a large set of servers all month, yet customers only get busy when they publish next week’s staff rotas. Our finance lead wants costs down, and engineering worries smaller servers will embarrass us on Monday morning.',
    known: [
      'Customers publish weekly staff schedules.',
      'The team has a simple containerized application.',
    ],
    skills: ['compute', 'scalability', 'finops'],
    facts: [
      [
        'business',
        'Monday publishing is the core customer workflow. A five-minute wait is acceptable; failed schedules trigger support calls and churn risk.',
        'Business sponsor',
      ],
      [
        'architecture',
        'Six identical VMs run stateless app containers. Sessions are external. Background exports use a shared queue.',
        'Lead engineer',
      ],
      [
        'traffic',
        'CPU is under 10% for 90% of the week and 65% during a two-hour Monday peak. New capacity takes four minutes to become ready.',
        'Lead engineer',
        true,
      ],
      [
        'budget',
        'Compute costs $1,400/month. A customer launch in three months may change the baseline, so finance dislikes a new long commitment.',
        'CFO',
        true,
      ],
      [
        'team',
        'Three engineers know container deployment but only one knows host patching. A failed patch consumed one engineering day last month.',
        'CTO',
      ],
    ],
    evidence: [
      [
        'traffic',
        'Four-week utilization summary',
        'available',
        'Five-minute CPU samples show a repeatable Monday peak, no memory pressure, and 90th percentile weekly CPU 11%. App start-to-ready takes 240 seconds.',
      ],
      [
        'traffic',
        'Scale-down safety test',
        'measurement_required',
        'Connection draining and queue behavior during instance termination have not been tested.',
      ],
    ],
    constraints: [
      'Keep Monday scheduling dependable.',
      'Avoid a long commitment before the next customer launch.',
    ],
    patterns: [
      [
        'Scheduled capacity with a conservative minimum',
        'Useful for repeatable peaks once drain and readiness behavior are verified.',
      ],
      [
        'Managed elastic containers',
        'Useful when lower host maintenance justifies a different unit compute price and app readiness is controlled.',
      ],
    ],
    flags: [
      ['traffic', 'CPU-only scaling may respond after the short publishing burst has failed.'],
      ['budget', 'Committing all current capacity can lock in avoidable idle spend.'],
    ],
    criteria: [
      'Use utilization shape rather than average alone.',
      'Include host maintenance in total cost.',
      'Keep a measured minimum and rollback path.',
    ],
  },
  {
    id: 'invisible-transfer',
    title: 'The bill nobody can explain',
    company: 'Paperpath',
    level: 1,
    industry: 'Document services',
    size: 16,
    engineers: 2,
    category: 'Networking & FinOps',
    brief:
      'Our document-processing bill went up even though the number of paying customers stayed flat. The invoice has a transfer line nobody understands. We want to reduce it without accidentally exposing customer documents.',
    known: [
      'Customers upload documents for processing.',
      'Processing runs in private network subnets.',
    ],
    skills: ['networking', 'finops', 'security'],
    facts: [
      [
        'business',
        'Document volume doubled because one customer now uploads larger files; account count is misleading for cost allocation.',
        'Business sponsor',
      ],
      [
        'architecture',
        'Private compute downloads and uploads object-storage files through a NAT gateway. Processing and storage are in the same region.',
        'Lead engineer',
        true,
      ],
      [
        'network',
        '14 TB/month goes through the gateway to object storage. External document-signing calls still require controlled internet egress.',
        'Lead engineer',
      ],
      [
        'security',
        'Documents contain customer identifiers. Finance agrees that private storage policies and audit records remain required.',
        'CTO',
        true,
      ],
      [
        'budget',
        'The network line increased from $110 to $780/month. No per-customer bytes metric is currently collected.',
        'CFO',
      ],
    ],
    evidence: [
      [
        'network',
        'Flow-log sample and billing extract',
        'available',
        'Sample identifies object-storage destinations for 86% of processed bytes; remaining destinations include a signing API. Resource ownership is known, but byte allocation by tenant is absent.',
      ],
      [
        'security',
        'Storage endpoint policy test',
        'measurement_required',
        'No endpoint policy has been tested. Validate authorized bucket access and blocked unrelated buckets before changing routes.',
      ],
    ],
    constraints: [
      'Retain outbound access to the signing provider.',
      'Do not make buckets public to lower network charges.',
    ],
    patterns: [
      [
        'Private object-storage endpoint with scoped policies',
        'Fits same-region object traffic once route and policy tests prove no workload is broken.',
      ],
      [
        'Keep current routing while instrumenting and reducing transferred bytes',
        'Defensible as a short reversible step when endpoint policy dependencies are not yet understood.',
      ],
    ],
    flags: [
      [
        'security',
        'Removing egress controls or making documents public is not a cost optimization.',
      ],
      ['network', 'Deleting the NAT path breaks the external signing dependency.'],
    ],
    criteria: [
      'Connect costs to bytes per document.',
      'Separate internal storage traffic from external dependencies.',
      'Verify routing and identity together.',
    ],
  },
  {
    id: 'developers-overloaded',
    title: 'The roadmap is losing to maintenance',
    company: 'Parcelwise',
    level: 2,
    industry: 'Logistics SaaS',
    size: 38,
    engineers: 5,
    category: 'Developer productivity',
    brief:
      'Our developers spend more time patching machines and nursing deployments than building the features customers ask for. We missed two roadmap commitments. We need to get the team back to product work without losing control of our costs.',
    known: [
      'The product coordinates deliveries for small merchants.',
      'Customers expect weekly improvements.',
    ],
    skills: ['managed-services', 'containers', 'operations', 'cicd'],
    facts: [
      [
        'business',
        'Two promised carrier integrations are six weeks late. Product estimates each could unblock $12,000 annual contract value, but neither contract is signed.',
        'Business sponsor',
        true,
      ],
      [
        'architecture',
        'Four application containers run on manually patched VMs. A managed database and object storage are already in use. One worker needs a licensed native binary.',
        'Lead engineer',
      ],
      [
        'team',
        'Five engineers spend about 35 hours/week on infrastructure. One developer handles almost every release; there is no platform hire in the approved plan.',
        'CTO',
        true,
      ],
      [
        'deployment',
        'Releases use shell scripts and manually copied environment files. The same container image is not consistently promoted from staging to production.',
        'Lead engineer',
      ],
      [
        'budget',
        'Recurring spend is $2,400/month. Finance can fund $700/month more if it demonstrably removes toil; the migration time must also be costed.',
        'CFO',
      ],
      [
        'traffic',
        'The API has variable office-hour demand; the native worker runs continuously at roughly 60% utilization.',
        'Lead engineer',
      ],
    ],
    evidence: [
      [
        'team',
        'Two-week engineering time log',
        'approximate',
        'Self-reported work: patching 16h; release recovery 24h; certificate/configuration incidents 18h; routine inspection 12h. Categories overlap and should be measured again after a change.',
      ],
      [
        'deployment',
        'Release checklist',
        'available',
        'Build on developer laptop → copy image tag → update secrets manually → restart each host → check HTTP 200. No automated smoke test or previous-image rollback command.',
      ],
      [
        'architecture',
        'Native worker portability test',
        'measurement_required',
        'The binary license and runtime filesystem requirements need a representative deployment test.',
      ],
    ],
    constraints: [
      'No additional platform headcount.',
      'Keep the licensed native worker functional.',
    ],
    patterns: [
      [
        'Managed container runtime plus reproducible pipeline',
        'Useful if deployment controls eliminate measured toil and the native worker is supported or deliberately retained.',
      ],
      [
        'Keep compute and automate patching/configuration/releases first',
        'Useful if changing runtime has disproportionate migration cost and operational work is mostly process drift.',
      ],
    ],
    flags: [
      [
        'team',
        'A new platform can add work before it removes it; assign an owner and migration budget.',
      ],
      ['deployment', 'Changing the runtime alone does not make releases reproducible.'],
    ],
    criteria: [
      'Quantify removed toil and opportunity cost.',
      'Identify which component creates each operational burden.',
      'Validate the exceptional worker rather than assuming portability.',
    ],
  },
  {
    id: 'deployment-dread',
    title: 'Every release feels like a gamble',
    company: 'Fieldnote',
    level: 2,
    industry: 'Field services',
    size: 52,
    engineers: 6,
    category: 'CI/CD & rollback',
    brief:
      'Every few releases our dispatch system breaks and field crews stop receiving work. Rolling back takes about 45 minutes and everyone stays late to watch the release. We need safer delivery without turning every change into a committee meeting.',
    known: [
      'Dispatchers use the product during working hours.',
      'Releases currently happen once every two weeks.',
    ],
    skills: ['cicd', 'observability', 'reliability'],
    facts: [
      [
        'business',
        'A failed release leaves roughly 300 technicians waiting. The sponsor wants failed deployments recoverable within ten minutes.',
        'Business sponsor',
        true,
      ],
      [
        'architecture',
        'A stateless API runs on two instances behind a load balancer; one PostgreSQL database holds all job assignments.',
        'Lead engineer',
      ],
      [
        'deployment',
        'The last failure removed a database column. Reverting the application image did not restore compatibility. Database changes run automatically at application startup.',
        'Lead engineer',
        true,
      ],
      [
        'observability',
        'We check HTTP success rate, but an endpoint can return 200 while dispatch jobs stay unassigned. There is no synthetic end-to-end dispatch check.',
        'Lead engineer',
      ],
      [
        'team',
        'Six engineers can maintain a standard pipeline, but no one can supervise a long manual rollout every evening.',
        'CTO',
      ],
      [
        'budget',
        'Finance permits double application capacity for a release hour; keeping two complete stacks all month would exceed the $500 extra monthly budget.',
        'CFO',
      ],
    ],
    evidence: [
      [
        'deployment',
        'Last failed release timeline',
        'available',
        '18:00 schema column dropped; 18:06 error rate rises; 18:12 previous image restored; 18:18 errors continue; 18:45 forward fix restores compatibility.',
      ],
      [
        'observability',
        'Business smoke-test coverage',
        'unavailable',
        'There is no automated test of create-job → assign-technician → acknowledge-dispatch in staging or production.',
      ],
    ],
    constraints: [
      'Ten-minute recovery target for a failed deployment.',
      'Avoid prolonged duplicate capacity and out-of-hours supervision.',
    ],
    patterns: [
      [
        'Progressive delivery with backwards-compatible database changes',
        'Useful if business metrics can trigger rollback and schema expand/contract is rehearsed.',
      ],
      [
        'Short-lived blue/green application environments',
        'Useful if both app versions can use the database safely and traffic cutover is fast and observable.',
      ],
    ],
    flags: [
      ['deployment', 'Application rollback cannot undo a destructive schema change safely.'],
      ['observability', 'HTTP success alone is an incomplete release health signal.'],
    ],
    criteria: [
      'Separate code rollback from data recovery.',
      'Define stop/rollback thresholds on customer workflows.',
      'Include immutable artifacts and an owned deployment path.',
    ],
  },
  {
    id: 'morning-slowdown',
    title: 'The morning queue nobody can explain',
    company: 'Ledgerlane',
    level: 2,
    industry: 'Accounting SaaS',
    size: 30,
    engineers: 4,
    category: 'Database performance',
    brief:
      'Every morning our accountants complain that the product freezes. The engineering team has asked for a much larger database. Finance is willing to pay if it fixes the problem, but last quarter’s upgrade only helped for a few weeks.',
    known: [
      'Most customers work in the same time zone.',
      'Morning reporting is an important workflow.',
    ],
    skills: ['databases', 'performance', 'observability', 'caching'],
    facts: [
      [
        'business',
        'Accountants run reconciliation reports before 10 a.m. A report within 60 seconds is acceptable, but entering transactions should remain responsive.',
        'Business sponsor',
        true,
      ],
      [
        'architecture',
        'Interactive accounting and reports share one PostgreSQL database. The application starts a separate report query for each open browser tab.',
        'Lead engineer',
      ],
      [
        'database',
        'At 9 a.m. a report query scans 18 million rows and holds locks while updating a temporary status table. CPU reaches 70%, and transaction write waits rise sharply.',
        'Lead engineer',
        true,
      ],
      [
        'traffic',
        'Only 280 users are active during the slowdown. Browser refreshes repeat the same report for the same accounting period.',
        'Lead engineer',
      ],
      [
        'budget',
        'The database already costs $1,100/month after two upgrades. A tuning experiment has a two-week budget; another resize needs evidence.',
        'CFO',
      ],
      [
        'security',
        'Reports must remain tenant-scoped. Cached report data may lag by up to five minutes, but ledger writes must not be stale.',
        'CTO',
      ],
    ],
    evidence: [
      [
        'database',
        'Database wait sample',
        'available',
        '09:05–09:15: 62% sampled wait time lock-related; report query reads 18M rows; seven equivalent report jobs run concurrently. Transaction write p95 4.8s versus 80ms outside reports.',
      ],
      [
        'observability',
        'Query plan with representative data',
        'measurement_required',
        'Production query text is available, but a safe representative EXPLAIN analysis and test of changed indexing have not been performed.',
      ],
    ],
    constraints: [
      'Protect transaction correctness and tenant isolation.',
      'Five-minute report freshness is acceptable.',
    ],
    patterns: [
      [
        'Tune and deduplicate reports on the current database',
        'Appropriate if query and lock changes restore interactive performance under a representative load.',
      ],
      [
        'Move reporting to an asynchronous or read-isolated path',
        'Appropriate when reporting freshness permits separation and operating another path is justified by measured contention.',
      ],
    ],
    flags: [
      ['database', 'A bigger instance may not remove lock contention or duplicate queries.'],
      ['security', 'A report cache key must include the tenant and access context.'],
    ],
    criteria: [
      'Diagnose waits rather than treating CPU as the whole system.',
      'Distinguish reporting freshness from ledger correctness.',
      'Test effect on interactive writes as well as reports.',
    ],
  },
  {
    id: 'customers-as-monitors',
    title: 'Our customers are our alarm system',
    company: 'LinkHarbor',
    level: 2,
    industry: 'B2B integrations',
    size: 27,
    engineers: 4,
    category: 'Observability',
    brief:
      'Customers tell us their integrations stopped before we notice anything wrong. Our dashboards are mostly green even during incidents. We need earlier warning and fewer late-night surprises, but the team is already tired of alerts.',
    known: [
      'The product synchronizes orders between business systems.',
      'A four-person team operates the service.',
    ],
    skills: ['observability', 'reliability', 'operations', 'async'],
    facts: [
      [
        'business',
        'Customers expect new orders synchronized within five minutes. A successful API response is not proof that an order reached the destination.',
        'Business sponsor',
        true,
      ],
      [
        'architecture',
        'An API accepts jobs, queues them, and workers call partner APIs. The current dashboard only tracks application CPU and incoming HTTP errors.',
        'Lead engineer',
      ],
      [
        'observability',
        'In the last incident a partner returned 429s for 40 minutes. The queue grew to 18,000 jobs while every incoming request returned 202.',
        'Lead engineer',
        true,
      ],
      [
        'team',
        'The team gets 120 notifications/week, mostly transient CPU warnings. Nobody knows which alerts require waking an engineer.',
        'CTO',
      ],
      [
        'budget',
        'Monitoring costs $180/month. Finance can fund $300 more, but unrestricted debug logging would exceed that cap.',
        'CFO',
      ],
      [
        'security',
        'Payloads contain customer addresses. Full raw order bodies must not appear in general-access logs.',
        'Lead engineer',
      ],
    ],
    evidence: [
      [
        'observability',
        'Incident and alert sample',
        'available',
        'Queue oldest age 42m; incoming HTTP error rate 0.2%; 429 partner responses 78%; first customer ticket 19m after delay begins. Forty CPU alerts fired without a related user issue.',
      ],
      [
        'business',
        'Customer freshness baseline',
        'measurement_required',
        'End-to-end completion delay is not measured consistently. Instrument accepted_at and delivered_at before committing to an SLO.',
      ],
    ],
    constraints: [
      'Do not log customer payloads indiscriminately.',
      'Alerts must fit a four-person on-call team.',
    ],
    patterns: [
      [
        'Workflow SLOs with queue-age and synthetic delivery checks',
        'Useful when delayed completion is the customer failure mode and each alert has a response.',
      ],
      [
        'Managed observability service with selective instrumentation',
        'Useful if faster correlation reduces toil enough to justify usage and retention costs.',
      ],
    ],
    flags: [
      [
        'observability',
        'Green infrastructure charts do not establish successful business processing.',
      ],
      ['security', 'Capturing every payload creates exposure and unbounded cost.'],
    ],
    criteria: [
      'Define a customer-visible SLI.',
      'Separate paging from investigative dashboards.',
      'Add ownership, runbooks, and actionable thresholds.',
    ],
  },
  {
    id: 'waiting-for-reports',
    title: 'Customers watch a spinning wheel',
    company: 'Claimkit',
    level: 2,
    industry: 'Insurance operations',
    size: 46,
    engineers: 5,
    category: 'Asynchronous processing',
    brief:
      'Our users wait several minutes while the application prepares claim bundles. They refresh the page, sometimes see duplicate bundles, and call support. We want the workflow to feel dependable even when a big customer submits hundreds at once.',
    known: [
      'The product assembles downloadable claim documents.',
      'The feature is used in unpredictable bursts.',
    ],
    skills: ['async', 'reliability', 'scalability', 'storage'],
    facts: [
      [
        'business',
        'A completed bundle within 15 minutes is acceptable if users receive a reliable status and notification. Duplicate external submissions are unacceptable.',
        'Business sponsor',
        true,
      ],
      [
        'architecture',
        'The web request renders PDFs, uploads the bundle, and calls a submission partner synchronously. The browser times out after 60 seconds.',
        'Lead engineer',
      ],
      [
        'traffic',
        'A typical job takes three minutes; the largest takes 12. Month-end batches contain 500 jobs and overwhelm the six web workers.',
        'Lead engineer',
      ],
      [
        'recovery',
        'A retried job can call the partner twice because there is no persistent submission identifier. The partner supports idempotency keys retained for 24 hours.',
        'Lead engineer',
        true,
      ],
      [
        'budget',
        'The team can fund $450/month for background processing; most hours have no jobs at all.',
        'CFO',
      ],
      [
        'security',
        'Bundles contain personal claim data and must be accessible only to the originating tenant for 30 days.',
        'CTO',
      ],
    ],
    evidence: [
      [
        'traffic',
        'Job duration distribution',
        'available',
        'Synthetic 1,000-job sample: median 180s; p95 540s; max 720s; peak burst 500 jobs. Partner accepts at most 20 submissions/minute per account.',
      ],
      [
        'recovery',
        'Duplicate-submission incident',
        'available',
        'User refreshed after a timeout; two server workers completed the same request; partner received different identifiers. No job-state record was available to support.',
      ],
      [
        'observability',
        'Retry and timeout test',
        'measurement_required',
        'Crash-after-submit and notification failure paths have not been tested.',
      ],
    ],
    constraints: [
      'No duplicate partner submission.',
      'Maintain tenant access controls through asynchronous storage and status APIs.',
    ],
    patterns: [
      [
        'Durable queue and bounded workers with idempotent jobs',
        'Useful if job state, retry limits, partner quotas, and idempotency are designed together.',
      ],
      [
        'Managed workflow orchestration with activity workers',
        'Useful if the multi-step recovery state is complex enough to justify workflow overhead.',
      ],
    ],
    flags: [
      [
        'recovery',
        'A queue delivers work again after failures; it does not guarantee exactly-once business effects.',
      ],
      ['traffic', 'Unbounded workers can violate partner quotas faster.'],
    ],
    criteria: [
      'Define user-visible state transitions.',
      'Handle retry and crash boundaries explicitly.',
      'Size throughput against the partner limit, not just compute.',
    ],
  },
];

const advancedSeeds: SeedInput[] = [
  {
    id: 'datacenter-deadline',
    title: 'The building closes in six months',
    company: 'Northline Parts',
    level: 3,
    industry: 'Manufacturing',
    size: 240,
    engineers: 8,
    category: 'Cloud migration',
    brief:
      'Our server-room lease ends in six months. Sales cannot stop taking orders during the move, and the board wants a credible plan with a clear cost ceiling.',
    known: [
      'An order platform connects sales and warehouse teams.',
      'The facility will close in six months.',
    ],
    skills: ['migration', 'networking', 'databases', 'business-value'],
    facts: [
      [
        'business',
        'Order entry can pause for two hours on Sunday; warehouse scanning cannot pause during weekday shifts.',
        'Business sponsor',
        true,
      ],
      [
        'architecture',
        'A Windows application uses SQL Server and a license server. Warehouse scanners call the application over the local network.',
        'Lead engineer',
      ],
      [
        'migration',
        'The software vendor supports virtual machines but has not approved a managed database. The license is tied to a hardware fingerprint.',
        'CTO',
        true,
      ],
      [
        'network',
        'The warehouse has one internet link. A recent outage lasted four hours; scanner behavior during disconnection is unknown.',
        'Lead engineer',
      ],
      [
        'budget',
        'Migration funding is $90,000 and recurring spend must remain below $6,000/month including connectivity and licenses.',
        'CFO',
      ],
    ],
    evidence: [
      [
        'migration',
        'Dependency inventory',
        'available',
        'Synthetic inventory: order app, SQL Server, license daemon, nightly ERP export. Vendor confirmation of license portability is outstanding.',
      ],
      [
        'network',
        'Scanner latency and offline test',
        'measurement_required',
        'Test the warehouse workflow over representative WAN latency and a four-hour disconnect before selecting a cutover plan.',
      ],
    ],
    constraints: [
      'Facility closure is fixed.',
      'Preserve warehouse operations and supported licensing.',
    ],
    patterns: [
      [
        'Rehost supported dependencies in stages',
        'Viable after license portability, connectivity and rollback are demonstrated.',
      ],
      [
        'Retain an edge component while migrating the central platform',
        'Viable if local continuity is necessary and the extra operating cost fits the cap.',
      ],
    ],
    flags: [
      ['migration', 'A VM image does not prove a license will survive relocation.'],
      ['network', 'Moving a local dependency across a WAN changes the warehouse failure modes.'],
    ],
    criteria: [
      'Map dependencies before selecting services.',
      'Separate deadline migration from later modernization.',
      'Define rehearsal, rollback and business acceptance.',
    ],
  },
  {
    id: 'tenant-boundaries',
    title: 'One customer saw another customer’s file',
    company: 'Boardroom Docs',
    level: 3,
    industry: 'Legal SaaS',
    size: 70,
    engineers: 9,
    category: 'Security & tenancy',
    brief:
      'A customer received a document belonging to another organization. We have contained the incident, but our enterprise customers need a convincing isolation plan before they renew.',
    known: [
      'Customers share a document collaboration product.',
      'An access-control incident threatens renewals.',
    ],
    skills: ['security', 'iam', 'databases', 'operations'],
    facts: [
      [
        'business',
        'Three renewals worth $450,000 annually depend on evidence that cross-tenant access is prevented.',
        'Business sponsor',
        true,
      ],
      [
        'architecture',
        'All tenants share tables keyed by tenant_id. An export worker accepts a document ID without checking the tenant; object links last seven days.',
        'Lead engineer',
        true,
      ],
      [
        'security',
        'Tenant context comes from a request header in two legacy endpoints. Support staff also have broad database access.',
        'CTO',
      ],
      [
        'team',
        'Nine engineers maintain the product, with no dedicated security engineer. Two can work on isolation this month.',
        'CTO',
      ],
      [
        'budget',
        'A $25,000 remediation budget is available; dedicated databases for every small tenant would triple current hosting spend.',
        'CFO',
      ],
    ],
    evidence: [
      [
        'security',
        'Contained incident reproduction',
        'available',
        'A synthetic tenant A export request can resolve tenant B document metadata when only the document ID is supplied. The endpoint is disabled pending remediation.',
      ],
      [
        'security',
        'Isolation regression suite',
        'measurement_required',
        'Exercise synchronous APIs, worker jobs, signed links and support tools with adversarial tenant identifiers.',
      ],
    ],
    constraints: [
      'Prove authorization at each data boundary.',
      'Include background jobs and support access.',
    ],
    patterns: [
      [
        'Shared storage with enforced tenant authorization and defense in depth',
        'Viable when tenant context is trusted, checks cover every path, and isolation is continuously tested.',
      ],
      [
        'Dedicated storage for selected enterprise tenants',
        'Useful where contracts justify cost, while fixing shared authorization paths for all customers.',
      ],
    ],
    flags: [
      ['security', 'Separate databases do not fix an API that selects the wrong tenant.'],
      ['operations', 'A one-time audit cannot replace regression coverage and access review.'],
    ],
    criteria: [
      'Locate the authorization failure.',
      'Compare isolation guarantees and operating cost.',
      'Define evidence customers can review.',
    ],
  },
  {
    id: 'region-expansion',
    title: 'A new market, the same slow checkout',
    company: 'Orbit Tickets',
    level: 3,
    industry: 'Ticketing',
    size: 120,
    engineers: 14,
    category: 'Global architecture',
    brief:
      'We are launching in a distant market. The demo feels slow there, and sales is asking for infrastructure in every region before launch.',
    known: [
      'The existing market is served from one region.',
      'The overseas launch is in ten weeks.',
    ],
    skills: ['networking', 'caching', 'databases', 'reliability'],
    facts: [
      [
        'business',
        'Only 8% of forecast purchases are in the new market. Overselling a reserved seat is unacceptable.',
        'Business sponsor',
        true,
      ],
      [
        'architecture',
        'A single relational writer owns seat reservations. Static images and four sequential API calls are required to render an event page.',
        'Lead engineer',
      ],
      [
        'network',
        'New-market round-trip latency is 210ms; images account for 70% of page bytes, but checkout needs three writer round trips.',
        'Lead engineer',
      ],
      [
        'database',
        'Reservations require one authoritative inventory decision; conflict resolution for independent regional writes does not exist.',
        'CTO',
        true,
      ],
      ['budget', 'The launch allows $2,000/month extra and four engineer-weeks.', 'CFO'],
    ],
    evidence: [
      [
        'network',
        'Remote browser waterfall',
        'available',
        'Synthetic test: first useful content 3.8s, image transfer 1.9s, checkout 1.2s. All assets currently originate from the application region.',
      ],
      [
        'business',
        'Checkout experience target',
        'measurement_required',
        'Product must validate acceptable checkout delay with representative customers before promising local-region response times.',
      ],
    ],
    constraints: ['Do not oversell seats.', 'Launch within ten weeks.'],
    patterns: [
      [
        'Edge caching and fewer round trips with a single inventory writer',
        'Useful if measured user experience meets launch targets without distributed writes.',
      ],
      [
        'Regional read services with centralized reservations',
        'Useful if read latency remains material and consistency boundaries are explicit.',
      ],
    ],
    flags: [
      ['database', 'Independent regional writes introduce inventory conflicts.'],
      ['budget', 'Duplicating an entire stack may not address the dominant page delay.'],
    ],
    criteria: [
      'Measure where latency accumulates.',
      'Separate read locality from write correctness.',
      'Justify regional cost with customer impact.',
    ],
  },
  {
    id: 'reporting-dispute',
    title: 'Finance and sales disagree on yesterday',
    company: 'Copper Market',
    level: 3,
    industry: 'Marketplace',
    size: 180,
    engineers: 12,
    category: 'Data platforms',
    brief:
      'Our daily revenue reports disagree and the database slows down whenever analysts investigate. We need trustworthy numbers without making checkout worse.',
    known: [
      'Several teams build revenue reports.',
      'Analytics queries share the operational database.',
    ],
    skills: ['databases', 'governance', 'async', 'observability'],
    facts: [
      [
        'business',
        'Finance recognizes settled payments net of refunds; sales counts orders when placed. A next-morning report is sufficient.',
        'Business sponsor',
        true,
      ],
      [
        'architecture',
        'Analysts run joins on the primary order database. A spreadsheet imports payment settlements once daily.',
        'Lead engineer',
      ],
      [
        'database',
        'Long analytical scans overlap checkout peaks. A read replica would reduce contention but would not align the definitions.',
        'Lead engineer',
        true,
      ],
      ['security', 'Analysts need aggregates, not customer addresses or payment tokens.', 'CTO'],
      [
        'budget',
        'The team can allocate $1,200/month and one data engineer to a daily pipeline.',
        'CFO',
      ],
    ],
    evidence: [
      [
        'business',
        'Metric reconciliation sample',
        'available',
        'Synthetic day: placed orders $48,000; settled payments $45,000; refunds $2,000. The two teams label different totals as revenue.',
      ],
      [
        'database',
        'Query contention sample',
        'available',
        'Daily report scans 80 million rows; checkout p95 rises from 180ms to 950ms during the scan. Correlation requires a controlled test.',
      ],
    ],
    constraints: [
      'Agree on metric definitions.',
      'Keep personal data out of general analytics access.',
    ],
    patterns: [
      [
        'Daily curated analytical store',
        'Appropriate when next-day freshness suffices and reconciliation has an owner.',
      ],
      [
        'Read replica with governed reporting views',
        'Appropriate for a smaller interim workload if replica load and lag remain acceptable.',
      ],
    ],
    flags: [
      ['business', 'A new data platform cannot resolve an undefined business metric.'],
      ['security', 'Copying every operational column expands unnecessary data access.'],
    ],
    criteria: [
      'Establish metric ownership.',
      'Match pipeline freshness to business use.',
      'Plan reconciliation, backfills and access controls.',
    ],
  },
  {
    id: 'capacity-contract',
    title: 'A discount with a three-year promise',
    company: 'Metric Grove',
    level: 3,
    industry: 'Analytics SaaS',
    size: 85,
    engineers: 10,
    category: 'FinOps',
    brief:
      'Finance wants to commit to a large infrastructure discount this month. Engineering expects the product architecture to change next quarter. Help us decide how much certainty we can actually buy.',
    known: ['Infrastructure spend is growing.', 'A long-term commitment has been proposed.'],
    skills: ['finops', 'compute', 'commitments', 'business-value'],
    facts: [
      [
        'business',
        'The largest customer accounts for 35% of usage and renews in four months.',
        'Business sponsor',
        true,
      ],
      [
        'architecture',
        'Always-on query nodes coexist with bursty ingestion workers. A managed query service is being evaluated.',
        'Lead engineer',
      ],
      [
        'budget',
        'Current compute spend is $18,000/month. A hypothetical offer discounts an eligible committed baseline by 30%, but unused commitments remain payable.',
        'CFO',
        true,
      ],
      [
        'traffic',
        'Only $7,000/month of current usage has remained stable over six months; peaks are customer-specific.',
        'Lead engineer',
      ],
      [
        'migration',
        'The proposed managed query service would not consume the same commitment category.',
        'CTO',
      ],
    ],
    evidence: [
      [
        'budget',
        'Synthetic utilization ledger',
        'available',
        'Six-month stable eligible baseline $7,000/month; variable usage $4,000–$15,000/month. Offer details are fictional inputs, not live provider pricing.',
      ],
      [
        'migration',
        'Managed query evaluation',
        'measurement_required',
        'Benchmark cost and performance before treating the migration forecast as either certain or impossible.',
      ],
    ],
    constraints: [
      'Account for unused commitments.',
      'Preserve the ability to change architecture.',
    ],
    patterns: [
      [
        'Commit only a conservative stable baseline',
        'Useful if downside scenarios still consume the committed capacity.',
      ],
      [
        'Delay commitment until renewal and benchmark evidence',
        'Useful when flexibility is worth more than the near-term discount.',
      ],
    ],
    flags: [
      ['budget', 'A discounted unit price can still increase total cost when usage falls.'],
      ['migration', 'A commitment can outlive the architecture it finances.'],
    ],
    criteria: [
      'Model renewal and migration scenarios.',
      'Separate stable and variable consumption.',
      'Explain the financial value of reversibility.',
    ],
  },
  {
    id: 'regional-recovery',
    title: 'Can the business survive losing a region?',
    company: 'Clear Ledger',
    level: 4,
    industry: 'Financial operations',
    size: 350,
    engineers: 24,
    category: 'Disaster recovery',
    brief:
      'A major customer asks how we would recover from a regional outage. Our sales team promised continuity, but nobody has tested the entire recovery path.',
    known: [
      'The service processes business payment instructions.',
      'A continuity review is due in eight weeks.',
    ],
    skills: ['disaster-recovery', 'reliability', 'databases', 'operations'],
    facts: [
      [
        'business',
        'The negotiated targets are recovery within one hour and at most five minutes of lost unconfirmed work; acknowledged instructions must reconcile without duplicate execution.',
        'Business sponsor',
        true,
      ],
      [
        'architecture',
        'Application infrastructure is reproducible, but database backups, secrets and deployment artifacts are stored in the primary region.',
        'Lead engineer',
        true,
      ],
      [
        'recovery',
        'A database-only restore took 43 minutes in a small test. DNS, secrets and external partner allowlists were excluded.',
        'CTO',
      ],
      [
        'team',
        'Four platform engineers cover operations; only one has executed the recovery script.',
        'CTO',
      ],
      [
        'budget',
        'Finance allows $8,000/month additional resilience cost with an annual full rehearsal.',
        'CFO',
      ],
    ],
    evidence: [
      [
        'recovery',
        'Partial restore record',
        'available',
        'Synthetic test: 43-minute database restore on one-quarter production volume. Application launch and reconciliation were not timed.',
      ],
      [
        'recovery',
        'End-to-end regional exercise',
        'measurement_required',
        'Include lost connectivity, unavailable artifacts, partner access, promotion, transaction reconciliation and controlled failback.',
      ],
    ],
    constraints: [
      'Do not claim targets from a partial test.',
      'Prevent duplicate payment effects.',
    ],
    patterns: [
      [
        'Warm standby with tested replication and reconciliation',
        'Useful if measured promotion and transaction recovery meet the agreed objectives.',
      ],
      [
        'Cross-region backups with automated restoration',
        'Defensible if a full-scale rehearsal proves the longer restore path meets the business tolerance.',
      ],
    ],
    flags: [
      ['recovery', 'Replication alone does not provide application recovery.'],
      ['database', 'Uncontrolled promotion can create two active writers.'],
    ],
    criteria: [
      'Inventory all recovery dependencies.',
      'Specify fencing, reconciliation and failback.',
      'Measure objectives end to end.',
    ],
  },
  {
    id: 'shared-platform',
    title: 'Six teams, six ways to ship',
    company: 'Harbor Systems',
    level: 4,
    industry: 'Enterprise software',
    size: 420,
    engineers: 65,
    category: 'Platform engineering',
    brief:
      'Teams keep rebuilding deployment tools. Leadership wants a shared platform, while product teams fear a central queue that slows every release.',
    known: [
      'Six teams own independently deployed products.',
      'Delivery practices vary considerably.',
    ],
    skills: ['managed-services', 'containers', 'cicd', 'operations', 'iac'],
    facts: [
      [
        'business',
        'Onboarding a new service takes a median of twelve days; most delay is access approval and environment setup.',
        'Business sponsor',
        true,
      ],
      [
        'architecture',
        'Products use managed application hosting, containers and two VM services. Only one workload needs custom scheduling.',
        'Lead engineer',
      ],
      [
        'team',
        'Three engineers can staff a platform team. They cannot provide round-the-clock operations for a new cluster fleet.',
        'CTO',
        true,
      ],
      [
        'deployment',
        'Teams already own pipelines; differences mostly concern secrets, telemetry and approval templates.',
        'Lead engineer',
      ],
      [
        'budget',
        'The initiative has six months to demonstrate a 50% reduction in onboarding lead time.',
        'CFO',
      ],
    ],
    evidence: [
      [
        'deployment',
        'Onboarding value-stream sample',
        'available',
        'Ten services: median 12 days; 7 days approval waiting, 3 days environment work, 2 days application work.',
      ],
      [
        'team',
        'Golden-path pilot',
        'measurement_required',
        'Pilot with two voluntary teams and measure adoption, support burden and lead time before mandating migration.',
      ],
    ],
    constraints: [
      'Three platform engineers.',
      'Measure developer outcomes rather than infrastructure adoption.',
    ],
    patterns: [
      [
        'Self-service templates over existing managed runtimes',
        'Useful when repeated setup and approval work dominate delivery delay.',
      ],
      [
        'A shared container platform for demonstrated workload needs',
        'Useful when requirements and staffing justify the control-plane and operational responsibilities.',
      ],
    ],
    flags: [
      ['team', 'Centralizing every release can replace local toil with a platform queue.'],
      ['architecture', 'A cluster does not remove access-approval delays by itself.'],
    ],
    criteria: [
      'Treat teams as platform customers.',
      'Choose an incremental adoption path.',
      'Define ownership and measurable developer outcomes.',
    ],
  },
  {
    id: 'event-contracts',
    title: 'An order means three different things',
    company: 'Relay Commerce',
    level: 4,
    industry: 'Commerce operations',
    size: 260,
    engineers: 32,
    category: 'Event-driven systems',
    brief:
      'Orders sometimes ship before payment clears, and teams blame each other’s integrations. We need a dependable process as more partners join.',
    known: [
      'Orders pass through payment, inventory and shipping services.',
      'Teams release those services independently.',
    ],
    skills: ['async', 'databases', 'reliability', 'observability'],
    facts: [
      [
        'business',
        'Shipment must follow confirmed payment and reserved stock; a delayed order is preferable to an unpaid shipment.',
        'Business sponsor',
        true,
      ],
      [
        'architecture',
        'Services publish an OrderUpdated event with mutable fields. A database update and event publication are separate operations.',
        'Lead engineer',
        true,
      ],
      [
        'recovery',
        'Consumers retry without stable operation IDs. A replay last month created duplicate shipping labels.',
        'Lead engineer',
      ],
      [
        'team',
        'Each service has an owner, but no team owns end-to-end order reconciliation.',
        'CTO',
      ],
      [
        'budget',
        'Two teams can spend six weeks on correctness; a full rewrite is outside the quarter’s budget.',
        'CFO',
      ],
    ],
    evidence: [
      [
        'recovery',
        'Synthetic order timeline',
        'available',
        'Order row committed 10:01:02; publisher crashed before payment event; shipping consumed stale status after retry and created two labels.',
      ],
      [
        'observability',
        'Replay and crash exercise',
        'measurement_required',
        'Inject failures between commit and publish, replay events and verify business invariants across all consumers.',
      ],
    ],
    constraints: [
      'Preserve payment and inventory invariants.',
      'Repair incrementally across independent teams.',
    ],
    patterns: [
      [
        'Transactional outbox and idempotent consumers with explicit contracts',
        'Useful for reliable publication and retry while maintaining independent services.',
      ],
      [
        'An explicit order workflow coordinator',
        'Useful where business transitions need centralized visibility and compensating actions.',
      ],
    ],
    flags: [
      ['recovery', 'Broker delivery guarantees do not imply exactly-once external effects.'],
      ['team', 'A workflow without an owner leaves reconciliation unresolved.'],
    ],
    criteria: [
      'State invariants and event semantics.',
      'Design replay and compensation.',
      'Assign end-to-end operational ownership.',
    ],
  },
  {
    id: 'residency-boundary',
    title: 'The contract says the data must stay',
    company: 'Civic Records',
    level: 4,
    industry: 'Public-sector SaaS',
    size: 160,
    engineers: 18,
    category: 'Data governance',
    brief:
      'A public-sector customer requires its records to stay within an approved geography. Our product team says the database already does, but the security review is still blocked.',
    known: [
      'The customer has a contractual residency requirement.',
      'The primary database is already in the approved geography.',
    ],
    skills: ['security', 'networking', 'governance', 'operations'],
    facts: [
      [
        'business',
        'The contract covers records, backups and support exports. Counsel must interpret exceptions before launch; this scenario is not legal advice.',
        'Business sponsor',
        true,
      ],
      [
        'architecture',
        'Database storage is local, but logs, backups and support attachments flow to shared global tools.',
        'Lead engineer',
        true,
      ],
      [
        'security',
        'Request logs contain names and document excerpts. External support contractors can download attachments.',
        'CTO',
      ],
      [
        'recovery',
        'Existing cross-region backups leave the approved geography. A compliant recovery location has not been selected.',
        'Lead engineer',
      ],
      [
        'budget',
        'The contract can support $4,000/month extra; a full isolated product fork would exceed its margin.',
        'CFO',
      ],
    ],
    evidence: [
      [
        'security',
        'Data-flow inventory',
        'available',
        'Synthetic flows include primary rows, object files, request logs, backups, support exports and telemetry. Three downstream processors have unverified storage locations.',
      ],
      [
        'recovery',
        'Approved-location recovery plan',
        'measurement_required',
        'Confirm contractual scope with the responsible reviewer, then test recovery and access paths in approved locations.',
      ],
    ],
    constraints: [
      'Validate contractual interpretation with accountable specialists.',
      'Cover derived copies and support workflows.',
    ],
    patterns: [
      [
        'A regional tenant boundary with controlled downstream processing',
        'Useful if all covered data paths, access and recovery remain within the approved scope.',
      ],
      [
        'A dedicated regional deployment',
        'Useful if stronger separation is required and lifecycle costs are supportable.',
      ],
    ],
    flags: [
      ['security', 'Database placement alone does not establish residency of all covered data.'],
      [
        'recovery',
        'Removing noncompliant backups without a replacement creates an unexamined recovery gap.',
      ],
    ],
    criteria: [
      'Map complete data flows.',
      'Separate technical evidence from contractual sign-off.',
      'Balance isolation and maintainability.',
    ],
  },
  {
    id: 'acquisition-integration',
    title: 'Two companies need one customer view',
    company: 'Bridgeworks Group',
    level: 4,
    industry: 'Business services',
    size: 600,
    engineers: 28,
    category: 'Integration & migration',
    brief:
      'We acquired a competitor and promised account managers a unified customer view in ninety days. Both engineering teams are worried that merging their systems will interrupt billing.',
    known: [
      'Two products maintain separate customer and billing systems.',
      'A unified view is promised within ninety days.',
    ],
    skills: ['migration', 'security', 'databases', 'async', 'modernization'],
    facts: [
      [
        'business',
        'The immediate goal is read-only account visibility; unified billing is not required this quarter.',
        'Business sponsor',
        true,
      ],
      [
        'architecture',
        'One product uses numeric customer IDs and the other uses email as a key. Both integrate with different payment providers.',
        'Lead engineer',
      ],
      [
        'database',
        'About 12% of customers appear in both systems, but shared email domains do not reliably identify the same legal entity.',
        'Lead engineer',
        true,
      ],
      [
        'security',
        'The acquired system has broader account-manager permissions. Combining records must not broaden existing access silently.',
        'CTO',
      ],
      [
        'budget',
        'A $75,000 integration budget covers the first release; replacement of both billing engines is not funded.',
        'CFO',
      ],
    ],
    evidence: [
      [
        'database',
        'Identity matching sample',
        'available',
        'Synthetic sample: 500 likely matches, 70 ambiguous legal entities, 18 shared mailbox collisions. Human review is needed for ambiguous links.',
      ],
      [
        'security',
        'Cross-system access test',
        'measurement_required',
        'Validate source entitlements and ambiguous identity cases before allowing merged record access.',
      ],
    ],
    constraints: ['Keep both billing flows operational.', 'Deliver a read-only capability first.'],
    patterns: [
      [
        'Federated read model with explicit identity mapping',
        'Useful when visibility is needed before consolidation and provenance remains visible.',
      ],
      [
        'Incremental canonical customer registry',
        'Useful if identity ownership and review workflows can be established without replacing billing.',
      ],
    ],
    flags: [
      ['database', 'Email equality is not proof of legal-entity equality.'],
      ['security', 'A combined view must not union all source privileges.'],
    ],
    criteria: [
      'Challenge the assumed scope of integration.',
      'Handle identity uncertainty explicitly.',
      'Define migration and permission boundaries.',
    ],
  },
  {
    id: 'support-assistant',
    title: 'Fast answers that customers can trust',
    company: 'DeskSpring',
    level: 5,
    industry: 'Customer support SaaS',
    size: 110,
    engineers: 14,
    category: 'AI & retrieval',
    brief:
      'Our support agents waste time searching documentation. A prototype assistant answers quickly, but occasionally quotes another customer’s private material. We need a safe way to assess whether it is worth shipping.',
    known: [
      'The prototype searches public and tenant-specific documents.',
      'Agents review responses before sending them.',
    ],
    skills: ['ai-infrastructure', 'rag', 'ai-security', 'mlops', 'business-value'],
    facts: [
      [
        'business',
        'Success means a 20% reduction in handling time without worsening correction rates; autonomous customer replies are out of scope.',
        'Business sponsor',
        true,
      ],
      [
        'architecture',
        'Documents share a vector index. Tenant filtering currently happens after retrieval, and cached responses use only the question as key.',
        'Lead engineer',
        true,
      ],
      [
        'quality',
        'A hand-picked demo set scored well, but no held-out evaluation includes private documents, stale answers or unanswerable questions.',
        'CTO',
      ],
      [
        'security',
        'Permissions can be revoked immediately; index refresh runs nightly and cached answers live for six hours.',
        'Lead engineer',
      ],
      [
        'budget',
        'The pilot budget is $1,500/month for 20 agents, with token usage and quality tracked per accepted answer.',
        'CFO',
      ],
    ],
    evidence: [
      [
        'security',
        'Synthetic leakage reproduction',
        'available',
        'Tenant A and tenant B ask the same question; the shared response cache returns text grounded in tenant A private documents.',
      ],
      [
        'quality',
        'Held-out pilot evaluation',
        'measurement_required',
        'Build permission, abstention, freshness and factuality cases; measure handling time with representative agents and human review.',
      ],
    ],
    constraints: [
      'Enforce permissions before retrieval and at response delivery.',
      'Keep human review during the pilot.',
    ],
    patterns: [
      [
        'Permission-aware retrieval assistant with source citations and scoped caching',
        'Useful if isolation, revocation and grounded-answer evaluation pass.',
      ],
      [
        'Improved search with curated answers before generation',
        'Useful if simpler retrieval produces sufficient time savings with lower risk.',
      ],
    ],
    flags: [
      ['security', 'Post-retrieval filtering and shared answer caching can expose tenant data.'],
      ['quality', 'A convincing demo is not a representative quality evaluation.'],
    ],
    criteria: [
      'Define an outcome-based AI pilot.',
      'Test access boundaries and abstention.',
      'Compare generation with a simpler search improvement.',
    ],
  },
  {
    id: 'inference-margin',
    title: 'Our most popular feature loses money',
    company: 'Draftline',
    level: 5,
    industry: 'AI productivity',
    size: 65,
    engineers: 10,
    category: 'AI economics',
    brief:
      'Customers love our document assistant, but every heavy user erodes our margin. Product wants cheaper models, while sales worries the experience will collapse.',
    known: [
      'The feature summarizes and compares customer documents.',
      'Usage is concentrated among a minority of subscribers.',
    ],
    skills: ['ai-infrastructure', 'ai-cost', 'finops', 'performance', 'mlops'],
    facts: [
      [
        'business',
        'A subscription earns $40/month. The heaviest 10% of users cost $65/month in inference alone; median users cost $6.',
        'Business sponsor',
        true,
      ],
      [
        'architecture',
        'Every request sends the full document history to the largest configured model, including repeated unchanged content.',
        'Lead engineer',
      ],
      [
        'inference',
        'Input tokens represent 78% of inference spend. Forty percent of requests repeat a previously analyzed document.',
        'Lead engineer',
        true,
      ],
      [
        'quality',
        'Legal comparisons require stronger factual fidelity than short summaries. Current telemetry does not distinguish these tasks.',
        'CTO',
      ],
      [
        'budget',
        'The target is positive contribution margin per segment, not simply the lowest cost per request.',
        'CFO',
      ],
    ],
    evidence: [
      [
        'inference',
        'Synthetic usage ledger',
        'available',
        '1,000 users: median cost $6, top decile $65; input share 78%; repeat-document requests 40%. Figures are fictional, not model price quotes.',
      ],
      [
        'quality',
        'Task-stratified model comparison',
        'measurement_required',
        'Compare quality, abstention, latency and cost per accepted result separately for summaries and high-risk comparisons.',
      ],
    ],
    constraints: [
      'Preserve quality where errors carry higher customer cost.',
      'Measure full cost per successful task.',
    ],
    patterns: [
      [
        'Context reduction and task-aware model routing',
        'Useful if held-out evaluation establishes safe routing thresholds and escalation.',
      ],
      [
        'Usage controls and asynchronous batch processing',
        'Useful when product can explain fair-use limits and delayed tasks remain valuable.',
      ],
    ],
    flags: [
      ['quality', 'A cheaper model can cost more if users retry or need manual correction.'],
      ['security', 'A response cache must preserve tenant permissions and document versions.'],
    ],
    criteria: [
      'Segment demand and quality requirements.',
      'Model margin and retry cost.',
      'Define rollout and rollback metrics.',
    ],
  },
  {
    id: 'gpu-choice',
    title: 'Should we own the machines behind the model?',
    company: 'Vision Forge',
    level: 5,
    industry: 'Industrial AI',
    size: 190,
    engineers: 22,
    category: 'AI infrastructure',
    brief:
      'Our inspection model is moving from experiments into production. The team is split between a hosted API and dedicated accelerators, and the factory needs a predictable service.',
    known: [
      'The model classifies images from production lines.',
      'Plants have different operating schedules.',
    ],
    skills: ['ai-infrastructure', 'compute', 'ai-cost', 'finops', 'reliability'],
    facts: [
      [
        'business',
        'A missed result can pause a line; acceptable p95 response time is 400ms during shifts. Images can be buffered briefly but not for hours.',
        'Business sponsor',
        true,
      ],
      [
        'architecture',
        'The prototype uses a hosted endpoint. Four plants send bursts at shift starts; image upload adds 120–300ms depending on connectivity.',
        'Lead engineer',
      ],
      [
        'inference',
        'Average accelerator demand is only 18% of peak. A smaller quantized model has not been validated on rare defects.',
        'Lead engineer',
        true,
      ],
      [
        'team',
        'Two ML engineers maintain the model, but neither owns 24-hour hardware operations.',
        'CTO',
      ],
      [
        'budget',
        'The comparison must include idle capacity, redundancy, model updates and on-call work within $12,000/month.',
        'CFO',
      ],
    ],
    evidence: [
      [
        'traffic',
        'Shift traffic sample',
        'available',
        'Synthetic trace: bursts 300 images/s for ten minutes; baseline 20/s; overnight near zero. Network time is measured separately from inference.',
      ],
      [
        'quality',
        'Rare-defect and capacity test',
        'measurement_required',
        'Evaluate each model/runtime on rare defects and realistic burst traffic, including cold starts and network failures.',
      ],
    ],
    constraints: ['Meet a plant-level latency target.', 'Account for operations and redundancy.'],
    patterns: [
      [
        'Managed inference with bounded capacity and buffering',
        'Useful if cold-start, network and quota behavior meet measured line requirements.',
      ],
      [
        'Edge inference with centralized model management',
        'Useful if network dependence is unacceptable and model distribution and local operations are supportable.',
      ],
    ],
    flags: [
      ['inference', 'Average utilization hides burst capacity and cold-start requirements.'],
      ['quality', 'Quantization savings require validation on consequential rare defects.'],
    ],
    criteria: [
      'Measure end-to-end latency.',
      'Compare total operating cost at realistic utilization.',
      'Plan degraded operation and model rollout.',
    ],
  },
  {
    id: 'agent-authority',
    title: 'The assistant wants permission to act',
    company: 'Ops Lantern',
    level: 5,
    industry: 'IT operations',
    size: 230,
    engineers: 30,
    category: 'AI agents & control',
    brief:
      'Our incident assistant summarizes alerts well. Management now wants it to fix incidents automatically, but operations is worried about handing it production credentials.',
    known: [
      'The assistant currently reads alerts and runbooks.',
      'A pilot for automated remediation is proposed.',
    ],
    skills: ['ai-infrastructure', 'ai-security', 'operations', 'mlops', 'reliability'],
    facts: [
      [
        'business',
        'The pilot may restart a stateless test worker; changes to customer data or production networks require an accountable human approval.',
        'Business sponsor',
        true,
      ],
      [
        'architecture',
        'The prototype uses one broad service credential and ingests logs containing user-controlled text.',
        'Lead engineer',
        true,
      ],
      [
        'security',
        'Runbook retrieval and tool execution share the same prompt context. No separate policy layer validates tool arguments.',
        'CTO',
      ],
      [
        'recovery',
        'Repeated restart actions can amplify an upstream incident. There is no idempotency key, action budget or kill switch.',
        'Lead engineer',
      ],
      [
        'budget',
        'Two engineers have four weeks to demonstrate reduced triage time with a bounded set of actions.',
        'CFO',
      ],
    ],
    evidence: [
      [
        'security',
        'Synthetic adversarial log sample',
        'available',
        'A log entry contains text instructing the assistant to ignore policy and change a network rule. The test must prove log content cannot authorize that action.',
      ],
      [
        'recovery',
        'Tool safety exercise',
        'measurement_required',
        'Test denied actions, duplicate requests, budget exhaustion, stale approval, tool failures and immediate shutdown.',
      ],
    ],
    constraints: [
      'Tool authority is enforced outside the language model.',
      'Start with a narrow reversible action scope.',
    ],
    patterns: [
      [
        'Read-only assistance plus human-approved typed actions',
        'Useful when approval binds to exact arguments and external policy enforces permissions.',
      ],
      [
        'Deterministic remediation for known signals with AI explanation',
        'Useful when a small set of proven runbooks covers the valuable action space.',
      ],
    ],
    flags: [
      ['security', 'Instructions inside logs are data and cannot grant production authority.'],
      ['recovery', 'An unconstrained retry loop can worsen an outage.'],
    ],
    criteria: [
      'Define authority and approval boundaries.',
      'Compare agentic behavior with deterministic automation.',
      'Specify audit, action budgets and emergency stop.',
    ],
  },
  {
    id: 'model-change',
    title: 'The model improved, but the product got worse',
    company: 'Signal Atlas',
    level: 5,
    industry: 'Research software',
    size: 145,
    engineers: 19,
    category: 'AI evaluation & delivery',
    brief:
      'We changed the model behind our research assistant. Benchmark scores improved, yet customers report missing citations and slower answers. We need a release process that reflects how people actually use the product.',
    known: [
      'The assistant produces cited research summaries.',
      'A model update caused conflicting quality signals.',
    ],
    skills: ['ai-infrastructure', 'mlops', 'cicd', 'observability'],
    facts: [
      [
        'business',
        'Researchers value verifiable citations over fluent prose. A confidently wrong source can invalidate hours of review.',
        'Business sponsor',
        true,
      ],
      [
        'architecture',
        'A retrieval pipeline supplies excerpts to a model. Prompt and model versions changed together, without a canary or recorded configuration per answer.',
        'Lead engineer',
        true,
      ],
      [
        'quality',
        'The internal benchmark scores style and exact-answer similarity; it does not verify that citations support claims or cover long documents.',
        'CTO',
      ],
      [
        'observability',
        'Median latency rose from 4s to 7s and p95 from 12s to 31s. Customer feedback is not linked to input or version.',
        'Lead engineer',
      ],
      [
        'budget',
        'The team can label 300 representative examples this month; unrestricted manual review of every answer is unaffordable.',
        'CFO',
      ],
    ],
    evidence: [
      [
        'quality',
        'Synthetic regression sample',
        'available',
        'Old/new model: style score 72/84, supported-claim rate 91%/79%, p95 latency 12s/31s. Sample is exploratory and must be expanded.',
      ],
      [
        'deployment',
        'Versioned canary evaluation',
        'measurement_required',
        'Hold retrieval and prompt fixed, compare models on stratified held-out tasks, then canary with latency and citation rollback gates.',
      ],
    ],
    constraints: [
      'Preserve traceable configuration per answer.',
      'Measure citation support and tail latency.',
    ],
    patterns: [
      [
        'Versioned offline evaluation plus gated canary release',
        'Useful when representative regressions and rollback signals are defined before rollout.',
      ],
      [
        'Task-specific routing with a stable fallback',
        'Useful if different workloads demonstrably benefit from different models and routing can be evaluated.',
      ],
    ],
    flags: [
      ['quality', 'A benchmark improvement is not proof of product improvement.'],
      [
        'deployment',
        'Changing prompt, retrieval and model together hides the cause of a regression.',
      ],
    ],
    criteria: [
      'Align evaluation with user consequences.',
      'Control variables and prevent evaluation leakage.',
      'Define observable release and rollback gates.',
    ],
  },
];

export const legacyScenarios: Scenario[] = [...seeds, ...advancedSeeds].map(createScenario);
export const activeScenarios: Scenario[] = [...commonCloudSeeds, ...cloudArchitectureSeeds].map(
  createScenario,
);
// Reserved content stays persisted and usable by historical cases; the public library only lists active cases.
export const reservedScenarios: Scenario[] = consultingCatalog(legacyScenarios);
export const activeScenarioIds = new Set(activeScenarios.map((s) => s.id));
export const scenarios: Scenario[] = [...activeScenarios, ...reservedScenarios];
