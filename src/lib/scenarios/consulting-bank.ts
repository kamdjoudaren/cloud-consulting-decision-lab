import type { Scenario, Evidence, HiddenFact, CompanyProfile, Stakeholder } from '../types';
import type { LabConfig, LabTruth } from '../lab/schema';

type Family = LabConfig['family'];
type Stage = LabConfig['peStage'];
type Metrics = NonNullable<Evidence['metrics']>;
const modes = ['guided', 'standard', 'hard', 'expert'] as const;
const terms: Record<string, string[]> = {
  business: ['revenue', 'ARR', 'customer', 'growth', 'thesis', 'objectif', 'revenu'],
  economics: [
    'unit economics',
    'transactions',
    'volume',
    'cost per',
    'margin',
    'COGS',
    'economics',
    'marge',
  ],
  budget: ['cost', 'spend', 'AWS', 'bill', 'CUR', 'budget', 'cost explorer', 'facture', 'cout'],
  architecture: [
    'architecture',
    'database',
    'RDS',
    'EKS',
    'platform',
    'capacity',
    'scale',
    'load test',
  ],
  recovery: ['DR', 'restore', 'RTO', 'RPO', 'outage', 'recovery', 'backup', 'panne'],
  security: ['IAM', 'security', 'access', 'identity', 'permissions', 'securite'],
  contract: ['contract', 'commitment', 'license', 'transfer', 'standalone', 'TSA', 'Savings Plans'],
  inference: ['AI', 'model', 'token', 'retry', 'inference', 'GPU', 'quality'],
  team: ['team', 'owner', 'engineers', 'operations', 'capacity', 'equipe'],
};
const finance = (
  cloudBefore: number,
  cloudAfter: number,
  unitsBefore: number,
  unitsAfter: number,
  revenueBefore: number,
  revenueAfter: number,
  cogsBefore: number,
  cogsAfter: number,
): Metrics => ({
  cloudBefore,
  cloudAfter,
  unitsBefore,
  unitsAfter,
  revenueBefore,
  revenueAfter,
  cogsBefore,
  cogsAfter,
});
function financialCSV(m: Metrics) {
  const rows = [
    `metric,prior year,current year`,
    `AWS spend USD,${m.cloudBefore},${m.cloudAfter}`,
    `Completed transactions,${m.unitsBefore},${m.unitsAfter}`,
    `Recognized revenue USD,${m.revenueBefore},${m.revenueAfter}`,
    `Total COGS USD,${m.cogsBefore},${m.cogsAfter}`,
  ];
  if (m.attempts !== undefined) rows.push(`AI attempts,,${m.attempts}`);
  if (m.successfulTasks !== undefined) rows.push(`Successful AI tasks,,${m.successfulTasks}`);
  if (m.retries !== undefined) rows.push(`AI retries,,${m.retries}`);
  if (m.aiVariableCost !== undefined) rows.push(`Variable inference cost USD,,${m.aiVariableCost}`);
  if (m.humanReviewRate !== undefined) rows.push(`Human review rate,,${m.humanReviewRate}`);
  if (m.allocatedBefore !== undefined)
    rows.push(`Allocated run-rate USD,${m.allocatedBefore},${m.allocatedAfter ?? ''}`);
  if (m.standaloneBefore !== undefined)
    rows.push(`Standalone run-rate USD,${m.standaloneBefore},${m.standaloneAfter ?? ''}`);
  if (m.tsaMonthly !== undefined) rows.push(`TSA monthly USD,,${m.tsaMonthly}`);
  if (m.separationSpend !== undefined) rows.push(`Separation spend USD,,${m.separationSpend}`);
  rows.push(
    'Definition,Comparable full years; identical transaction definition; COGS includes cloud and vendor costs,Finance approved synthetic ledger',
  );
  return rows.join('\n');
}

const chapterPlan = [
  ['Kickoff', 'Frame the technology workstream and record the investment or operating question.'],
  [
    'Data room',
    'Request financial and technical documents; distinguish missing evidence from a negative finding.',
  ],
  ['CTO interview', 'Test management’s growth and architecture claims.'],
  ['Engineering interview', 'Seek operational detail and reconcile conflicting statements.'],
  ['Cloud economics', 'Calculate a comparable unit-cost baseline and the cost of growth.'],
  ['Capacity and resilience', 'Identify validation needed before supporting a scalability claim.'],
  ['Finance bridge', 'Separate recurring opportunity, implementation cash and capacity recovery.'],
  ['Draft findings', 'Prioritize findings by materiality, confidence and owner.'],
  ['Management response', 'Address counter-evidence and revise the proposed plan.'],
  [
    'IC / operating committee',
    'Defend a conditional recommendation and document what could change it.',
  ],
];

const preserveLegacyStakeholderIds = new Set(['aws-growth-55']);

function profileFor(
  family: Family,
  topic: string,
  stage: Stage,
  sourceIndustry?: string,
): CompanyProfile {
  if (sourceIndustry && family === 'Cloud')
    return {
      industry: sourceIndustry,
      businessModel: 'Cloud-native product with a material technology constraint',
      customerType: 'Digital customers with reliability expectations',
      revenueModel: 'Subscription, transaction or usage-based revenue',
      growthStage: 'Product and platform scaling',
      regulatoryContext: 'Customer SLA and operational resilience',
      transactionContext: 'Technology consulting decision',
    };
  if (sourceIndustry && family === 'FinOps')
    return {
      industry: sourceIndustry,
      businessModel: 'Cloud operating model with measurable workload units',
      customerType: 'Customers whose usage drives variable infrastructure',
      revenueModel: 'Subscription, transaction or usage-based pricing',
      growthStage: 'Scaling operations',
      regulatoryContext: 'Allocation, audit and retention requirements',
      transactionContext: 'Operating forecast and cost ownership',
    };
  if (family === 'M&A / Carve-Out')
    return {
      industry: 'Enterprise Software',
      businessModel: 'Divisional platform separating from a parent',
      customerType: 'Enterprise customers with continuity obligations',
      revenueModel: 'Contracted subscription and transition services',
      growthStage: 'Transition / standalone build',
      regulatoryContext: 'Customer data, access and contract separation controls',
      transactionContext:
        stage === 'Day 1' ? 'Carve-out Day 1 readiness' : 'Integration and synergy planning',
    };
  if (family === 'AI / MLOps')
    return {
      industry: 'AI SaaS',
      businessModel: 'Workflow software with variable model inference cost',
      customerType: 'Knowledge workers and enterprise operations teams',
      revenueModel: 'Subscription with usage-sensitive AI features',
      growthStage: 'High-growth product expansion',
      regulatoryContext: 'Data rights, retention and model auditability',
      transactionContext: 'Operating plan and AI margin credibility',
    };
  if (family === 'Buy-Side DD' || family === 'Mega-Case')
    return {
      industry: topic === 'security' ? 'FinTech' : 'B2B SaaS',
      businessModel: 'Recurring enterprise software with a technology growth thesis',
      customerType: 'Mid-market and enterprise buyers',
      revenueModel: 'Annual subscription with usage or tier expansion',
      growthStage: stage === 'Screening' ? 'Growth diligence' : 'Scale-up under transaction review',
      regulatoryContext:
        topic === 'security'
          ? 'Auditability, access and resilience obligations'
          : 'Enterprise SLA and customer data controls',
      transactionContext: `${family} · ${stage}`,
    };
  if (family === 'Value Creation')
    return {
      industry:
        topic === 'security'
          ? 'Cybersecurity'
          : topic === 'inference'
            ? 'AI SaaS'
            : 'Vertical SaaS',
      businessModel: 'PE-owned recurring software with an operating improvement plan',
      customerType: 'Contracted business customers',
      revenueModel: 'Subscription with expansion and support services',
      growthStage: 'Post-close execution',
      regulatoryContext: 'Customer trust and measurable control operation',
      transactionContext: '100-Day Plan and verified value realization',
    };
  if (family === 'Sell-Side')
    return {
      industry: topic === 'recovery' ? 'Healthcare' : 'Enterprise Software',
      businessModel: 'Seller preparing a technology evidence narrative',
      customerType: 'Enterprise buyers and renewal cohorts',
      revenueModel: 'Subscription with implementation and support',
      growthStage: 'Exit readiness',
      regulatoryContext: 'Buyer diligence, SLA disclosure and data protection',
      transactionContext: 'Sell-side evidence response',
    };
  if (family === 'FinOps')
    return {
      industry:
        topic === 'business' ? 'Marketplace' : topic === 'inference' ? 'AI SaaS' : 'B2B SaaS',
      businessModel: 'Cloud operating model with measurable workload units',
      customerType: 'Customers whose usage drives variable infrastructure',
      revenueModel: 'Subscription, transaction or usage-based pricing',
      growthStage: 'Scaling operations',
      regulatoryContext: 'Allocation, audit and retention requirements',
      transactionContext: 'Operating forecast and cost ownership',
    };
  return {
    industry:
      topic === 'security'
        ? 'Cybersecurity'
        : topic === 'recovery'
          ? 'Payments'
          : topic === 'traffic'
            ? 'E-commerce'
            : 'Developer Tools',
    businessModel: 'Cloud-native product with a material technology constraint',
    customerType: 'Digital customers with reliability expectations',
    revenueModel: 'Subscription, transaction or usage-based revenue',
    growthStage: 'Product and platform scaling',
    regulatoryContext:
      topic === 'security'
        ? 'Access and data protection controls'
        : 'Customer SLA and operational resilience',
    transactionContext: 'Technology consulting decision',
  };
}

function stakeholderPack(family: Family, topic: string): Stakeholder[] {
  const packs: Record<Family, Stakeholder[]> = {
    Cloud: [
      {
        name: 'Maya Patel',
        role: 'VP Engineering',
        concern: 'Delivery speed and platform reliability',
        objective: 'Keep product delivery moving with a reversible technical choice',
        incentive: 'Protect roadmap commitments',
        confidence: 'medium',
      },
      {
        name: 'Luis Romero',
        role: 'SRE Lead',
        concern: 'Observed failure modes and on-call load',
        objective: 'Make production behavior measurable before changing it',
        incentive: 'Reduce operational surprises',
        confidence: 'high',
      },
      {
        name: 'Dana Brooks',
        role: 'Product Leader',
        concern: 'Customer experience and conversion',
        objective: 'Protect the customer outcome during the change',
        incentive: 'Maintain adoption and renewals',
        confidence: 'medium',
      },
    ],
    FinOps: [
      {
        name: 'Omar Haddad',
        role: 'FinOps Lead',
        concern: 'Allocation, unit economics and ownership',
        objective: 'Make the useful cost denominator visible to each team',
        incentive: 'Turn recommendations into owned actions',
        confidence: 'high',
      },
      {
        name: 'Leah Wong',
        role: 'FP&A Director',
        concern: 'Forecast accuracy and cash timing',
        objective: 'Reconcile planning assumptions to the ledger',
        incentive: 'Keep the operating forecast credible',
        confidence: 'medium',
      },
      {
        name: 'Elena Ruiz',
        role: 'Product Operations',
        concern: 'Customer and workload definitions',
        objective: 'Ensure cost changes preserve the service customers buy',
        incentive: 'Protect product outcomes',
        confidence: 'medium',
      },
    ],
    'AI / MLOps': [
      {
        name: 'Jon Bell',
        role: 'Head of ML',
        concern: 'Quality, latency and model behavior',
        objective: 'Improve successful outcomes without hiding regressions',
        incentive: 'Ship useful models with evidence',
        confidence: 'medium',
      },
      {
        name: 'Rina Das',
        role: 'AI Product Leader',
        concern: 'Adoption and customer value',
        objective: 'Measure the feature customers actually use',
        incentive: 'Support expansion and retention',
        confidence: 'medium',
      },
      {
        name: 'Marcus Lee',
        role: 'Finance Director',
        concern: 'Contribution margin and provider cost',
        objective: 'Connect variable inference cost to successful work',
        incentive: 'Protect margin credibility',
        confidence: 'high',
      },
    ],
    'Buy-Side DD': [
      {
        name: 'Elliot Grant',
        role: 'PE Principal',
        concern: 'Investment thesis and downside risk',
        objective: 'Identify material technology findings before the IC',
        incentive: 'Protect the underwriting case',
        confidence: 'medium',
      },
      {
        name: 'Maya Chen',
        role: 'Seller CTO',
        concern: 'Growth credibility and roadmap',
        objective: 'Explain what the platform can support with evidence',
        incentive: 'Present the company fairly',
        confidence: 'medium',
      },
      {
        name: 'Ruth Adler',
        role: 'Portfolio CFO',
        concern: 'Normalized economics and cost-to-fix',
        objective: 'Separate actual cash effects from estimates',
        incentive: 'Keep the deal model defensible',
        confidence: 'high',
      },
    ],
    'Value Creation': [
      {
        name: 'Claire Morgan',
        role: 'Operating Partner',
        concern: 'Execution by Day 30 and Day 100',
        objective: 'Turn findings into owned initiatives and gates',
        incentive: 'Deliver measurable post-close progress',
        confidence: 'medium',
      },
      {
        name: 'Victor Hale',
        role: 'Portfolio CTO',
        concern: 'Engineering capacity and customer guardrails',
        objective: 'Sequence work the team can actually deliver',
        incentive: 'Avoid roadmap and reliability damage',
        confidence: 'medium',
      },
      {
        name: 'Nia Brooks',
        role: 'Portfolio CFO',
        concern: 'Verified value and offsets',
        objective: 'Sign off only on measured comparable outcomes',
        incentive: 'Prevent double-counted benefit',
        confidence: 'high',
      },
    ],
    'Sell-Side': [
      {
        name: 'Helen Ward',
        role: 'Seller CEO',
        concern: 'Credible growth and exit narrative',
        objective: 'Answer buyer questions without hiding material gaps',
        incentive: 'Protect transaction credibility',
        confidence: 'medium',
      },
      {
        name: 'Owen Price',
        role: 'Seller CTO',
        concern: 'Technical evidence and remediation',
        objective: 'Distinguish tested capability from roadmap intent',
        incentive: 'Represent the technology accurately',
        confidence: 'medium',
      },
      {
        name: 'Mina Patel',
        role: 'Finance Director',
        concern: 'Standalone economics and disclosure',
        objective: 'Reconcile allocated and buyer-relevant cost',
        incentive: 'Avoid surprises in diligence',
        confidence: 'high',
      },
    ],
    'M&A / Carve-Out': [
      {
        name: 'Tess Alvarez',
        role: 'Separation Lead',
        concern: 'Day 1 continuity and dependencies',
        objective: 'Inventory what must work when the asset stands alone',
        incentive: 'Avoid customer disruption at close',
        confidence: 'high',
      },
      {
        name: 'Ravi Singh',
        role: 'Integration Lead',
        concern: 'Sequence and synergy timing',
        objective: 'Prioritize safe integration after continuity',
        incentive: 'Deliver synergy without destabilizing products',
        confidence: 'medium',
      },
      {
        name: 'Grace Chen',
        role: 'TSA Manager',
        concern: 'Transition services and stranded cost',
        objective: 'Make exit dependencies and timing explicit',
        incentive: 'End the TSA on a measurable plan',
        confidence: 'high',
      },
    ],
    'Mega-Case': [
      {
        name: 'Julian Park',
        role: 'PE Partner',
        concern: 'IC confidence and downside case',
        objective: 'Challenge what the evidence supports and what remains conditional',
        incentive: 'Protect the investment thesis',
        confidence: 'medium',
      },
      {
        name: 'Ana Martins',
        role: 'Portfolio CTO',
        concern: 'Architecture, resilience and capacity',
        objective: 'Prioritize technical risks the team can validate',
        incentive: 'Protect customers and execution focus',
        confidence: 'medium',
      },
      {
        name: 'Faye Okoro',
        role: 'Portfolio CFO',
        concern: 'Margin, cash timing and value',
        objective: 'Translate findings without over-crediting savings',
        incentive: 'Make the plan finance-verifiable',
        confidence: 'high',
      },
      {
        name: 'Theo Jones',
        role: 'Operating Partner',
        concern: 'Owners, gates and post-close action',
        objective: 'Turn findings into a sequenced workstream',
        incentive: 'Deliver value with accountable owners',
        confidence: 'medium',
      },
    ],
  };
  return packs[family].map((p) => ({
    ...p,
    possibleDisagreement:
      topic === 'budget'
        ? 'May use a different cost denominator or period.'
        : topic === 'recovery'
          ? 'May distinguish technical availability from customer recovery.'
          : 'May prioritize a different operational outcome.',
  }));
}

function metricFocusFor(
  family: Family,
  topic: string,
): { business: string[]; financial: string[]; focus: string[] } {
  if (topic === 'recovery')
    return {
      business: ['SLA exposure', 'Renewal concentration', 'Recovery success'],
      financial: ['ARR at risk', 'Expected loss', 'Cost-to-Fix'],
      focus: ['RTO', 'RPO', 'p95/p99', 'Expected loss'],
    };
  if (topic === 'inference' || topic === 'quality')
    return {
      business: ['Successful AI tasks', 'Human-review rate', 'Customer adoption'],
      financial: ['Contribution Margin', 'Cost per successful task', 'Variable inference cost'],
      focus: ['Retry rate', 'Latency', 'Model quality', 'Cost per successful outcome'],
    };
  if (topic === 'deployment')
    return {
      business: ['Release throughput', 'Customer-impacting changes', 'Support tickets'],
      financial: ['EBITDA capacity', 'Implementation cash', 'Cost-to-Fix'],
      focus: ['Deployment frequency', 'Lead time', 'Change failure rate', 'MTTR'],
    };
  if (family === 'M&A / Carve-Out')
    return {
      business: ['Day 1 continuity', 'Customer renewals', 'TSA exit'],
      financial: ['Allocated run-rate', 'Standalone run-rate', 'One-time separation cash'],
      focus: ['TSA cost', 'Stranded cost', 'Replacement cost', 'Transition overlap'],
    };
  if (family === 'Value Creation')
    return {
      business: ['Execution milestones', 'Customer guardrail', 'Owner accountability'],
      financial: ['Identified value', 'Verified recurring cash', 'FCF timing'],
      focus: ['Benefit stage', 'Payback', 'Finance sign-off', 'Cost-to-Fix'],
    };
  if (family === 'Buy-Side DD' || family === 'Mega-Case')
    return {
      business: ['Growth plan credibility', 'Customer risk', 'Thesis dependency'],
      financial: ['Gross Margin', 'Normalized EBITDA', 'FCF / Cost-to-Fix'],
      focus: ['Materiality', 'Confidence', 'Cost-to-Fix', 'Downside case'],
    };
  return {
    business: ['Customer impact', 'Useful workload volume', 'Operational ownership'],
    financial: ['Gross Margin', 'Cost-to-Serve', 'FCF timing'],
    focus: ['Cost per useful unit', 'Utilization', 'Forecast error', 'Payback'],
  };
}

function coachingFor(family: Family, topic: string): string[] {
  const shared = [
    'What evidence would distinguish the leading explanation from its alternative?',
    'Who owns the baseline, and what would turn an estimate into verified value?',
  ];
  if (topic === 'recovery')
    return [
      'A successful backup proves what exactly? Ask for restore scope, RTO and RPO evidence.',
      ...shared,
    ];
  if (topic === 'inference' || topic === 'quality')
    return [
      'Does cheaper inference create cheaper successful outcomes? Include retries, review and quality.',
      ...shared,
    ];
  if (family === 'Value Creation')
    return [
      'Has this benefit been identified, validated, implemented, realized or verified?',
      ...shared,
    ];
  if (family === 'Buy-Side DD' || family === 'Mega-Case')
    return [
      'Is this an interesting technical issue or a material investment-thesis risk? Quantify cost-to-fix and confidence.',
      ...shared,
    ];
  return ['What denominator represents useful business output?', ...shared];
}

function challengesFor(family: Family, topic: string): LabTruth['challengeQuestions'] {
  if (family === 'Sell-Side')
    return [
      {
        audience: 'Seller CEO',
        question:
          'Why should the company disclose this limitation if remediation is already planned?',
      },
      {
        audience: 'Buyer CTO',
        question: 'Which source record supports the growth or reliability claim?',
      },
      {
        audience: 'Finance Director',
        question: 'Which costs are standalone, transitional or stranded?',
      },
    ];
  if (family === 'M&A / Carve-Out')
    return [
      {
        audience: 'Separation Lead',
        question: 'What must work on Day 1, and what can safely wait?',
      },
      {
        audience: 'TSA Manager',
        question: 'When does the transition cost end and what evidence proves it?',
      },
      {
        audience: 'Integration Lead',
        question: 'Which synergy is conditional on customer or contract approval?',
      },
    ];
  if (family === 'Buy-Side DD' || family === 'Mega-Case')
    return [
      {
        audience: 'PE Partner',
        question: 'Why is this material to the investment thesis and what is the downside case?',
      },
      {
        audience: 'CTO',
        question: 'What performance or recovery guardrail would make you reverse the decision?',
      },
      {
        audience: 'CFO',
        question: 'Which dollars leave the P&L, when, and with what verification?',
      },
    ];
  if (family === 'Value Creation')
    return [
      {
        audience: 'Operating Partner',
        question: 'Who owns execution by Day 30 and what gate proves progress?',
      },
      { audience: 'Portfolio CFO', question: 'Which value is identified versus verified cash?' },
      { audience: 'Portfolio CTO', question: 'What customer guardrail stops the initiative?' },
    ];
  if (topic === 'inference' || topic === 'quality')
    return [
      {
        audience: 'Head of ML',
        question: 'What quality threshold protects customers while changing model cost?',
      },
      { audience: 'Product Leader', question: 'What is the successful outcome denominator?' },
      {
        audience: 'Finance Director',
        question: 'How do retries and human review change contribution margin?',
      },
    ];
  return [
    { audience: 'CFO', question: 'Which dollars actually change the P&L next year?' },
    {
      audience: 'CTO',
      question: 'What production guardrail makes you stop or reverse this change?',
    },
    { audience: 'Product Leader', question: 'Which customer outcome proves the decision matters?' },
  ];
}

export function configure(
  s: Scenario,
  family: Family,
  peStage: Stage,
  extra: Partial<LabConfig> = {},
): Scenario {
  const primaryTopic =
    s.hiddenFacts.find((f) => f.critical)?.topic || s.hiddenFacts[0]?.topic || 'business';
  const profile = profileFor(family, primaryTopic, peStage, s.industry);
  const stakeholders = preserveLegacyStakeholderIds.has(s.id)
    ? s.stakeholders
    : stakeholderPack(family, primaryTopic);
  const metrics = metricFocusFor(family, primaryTopic);
  const sourceScenario = {
    ...s,
    stakeholders,
    profile,
    metricFocus: metrics.focus,
    financialArchetype: s.financialArchetype || archetypeFor({ family, topic: primaryTopic }),
  };
  const provenanceEvidence = s.evidenceAvailable.map((e) => ({
    ...e,
    date: e.date || '2026-01-15',
    period: e.period || 'FY2025 / current planning period',
    scope: e.scope || `${profile.industry} · ${family} workstream`,
    owner: e.owner || e.source || 'Workstream owner',
    confidence: e.confidence || (e.status === 'available' ? 'medium' : 'low'),
    provenance:
      e.provenance ||
      (e.topic === 'economics'
        ? 'finance-reconciled'
        : e.status === 'measurement_required'
          ? 'estimated'
          : 'engineering-observed'),
    definition:
      e.definition ||
      (e.topic === 'economics'
        ? 'Comparable period and useful unit are stated in the source record.'
        : 'Read the scope and limitations before relying on this record.'),
  }));
  const depthEvidence: Evidence[] =
    s.level >= 2
      ? [
          {
            id: `${s.id}-operational`,
            topic: primaryTopic === 'recovery' ? 'recovery' : 'observability',
            keywords: ['incident', 'p95', 'p99', 'SLO', 'operational', 'observed', 'validation'],
            title:
              primaryTopic === 'recovery'
                ? 'Recovery and incident history'
                : 'Operational metrics and limitation log',
            status: 'approximate',
            format: 'memo',
            content: `Observed workstream note for ${profile.industry}: ${s.hiddenFacts.find((f) => f.critical)?.text || 'The critical signal needs a scoped measurement.'}\n\nThe record is directionally useful but incomplete by customer segment and peak period. Request the underlying trace, incident window or rehearsal before treating it as a verified result.`,
            source: 'Engineering observed · partial operational extract',
            factIds: [],
            date: '2025-12-20',
            period: 'Selected recent incidents',
            scope: `${profile.industry} production sample`,
            owner: 'Operations',
            confidence: 'medium',
            provenance: 'engineering-observed',
            definition: 'Partial operational sample; not a full-period service-level report.',
          },
          {
            id: `${s.id}-commercial`,
            topic: 'business',
            keywords: ['customer', 'renewal', 'ARR', 'conversion', 'SLA', 'commercial', 'revenue'],
            title: 'Customer and commercial impact extract',
            status: 'approximate',
            format: 'memo',
            content: `Commercial extract for ${profile.customerType}: customer impact is not uniformly measured across cohorts. Reconcile the business definition with the technical event before quantifying ARR, renewal or conversion exposure.`,
            source: 'Customer Success · partial cohort extract',
            factIds: [],
            date: '2026-01-05',
            period: 'Last two renewal cohorts',
            scope: profile.customerType,
            owner: 'Customer Success',
            confidence: 'low',
            provenance: 'management-provided',
            definition: 'Cohort sample; excludes customers without linked event telemetry.',
          },
        ]
      : [];
  const contractEvidence: Evidence[] =
    s.level >= 4
      ? [
          {
            id: `${s.id}-contract`,
            topic: 'contract',
            keywords: ['contract', 'commitment', 'vendor', 'TSA', 'license', 'transfer'],
            title: 'Vendor and operating commitment schedule',
            status: 'available',
            format: 'memo',
            content: `Commitment schedule for ${family}: vendor terms, transferability and exit dates require owner confirmation. Separate recurring run-rate, transition overlap and one-time implementation cash.`,
            source: 'Procurement and Finance · contract register',
            factIds: [],
            date: '2025-11-30',
            period: 'Current active contracts',
            scope: profile.transactionContext,
            owner: 'Procurement',
            confidence: 'medium',
            provenance: 'third-party',
            definition:
              'Contract summary; legal terms must be checked before a transaction decision.',
          },
        ]
      : [];
  const evidenceAvailable = [...provenanceEvidence, ...depthEvidence, ...contractEvidence];
  const lab: LabConfig = {
    version: 2,
    family,
    peStage,
    context:
      peStage === 'None'
        ? `${profile.industry} technology consulting`
        : `${family} · ${peStage} · ${profile.industry}`,
    awsServices: ['Compute', 'Databases', 'Observability'],
    finopsConcepts: ['Unit economics', 'Cost ownership'],
    mlopsConcepts: family === 'AI / MLOps' ? ['Cost per successful outcome', 'Evaluation'] : [],
    businessMetrics: metrics.business,
    financialMetrics: metrics.financial,
    peConcepts: peStage === 'None' ? [] : ['Materiality', 'Cost-to-Fix', 'Investment Thesis'],
    deliverables:
      family === 'M&A / Carve-Out'
        ? ['Day 1 dependency map', 'Standalone cost bridge', 'TSA exit plan']
        : family === 'Sell-Side'
          ? ['Buyer evidence index', 'Disclosure heatmap', 'Remediation narrative']
          : family === 'Value Creation'
            ? ['100-Day value ledger', 'Owner and gate register', 'Finance verification pack']
            : family === 'AI / MLOps'
              ? ['AI unit economics brief', 'Evaluation and guardrail plan', 'Executive one-pager']
              : [
                  'Executive one-pager',
                  'Financial bridge',
                  ...(s.level >= 4 ? ['DD findings', 'Risk register', '100-Day Plan'] : []),
                ],
    assistanceCompatibility: [...modes],
    chapters: [],
    ...extra,
  };
  const factTopics = [...new Set(s.hiddenFacts.map((f) => f.topic))];
  const knowledge = stakeholders.map((p) => {
    const role = p.role.toLowerCase();
    const topics = /cfo|finance/.test(role)
      ? ['budget', 'business', 'economics', 'contract']
      : /engineer|sre/.test(role)
        ? factTopics.filter((t) => !['budget', 'business', 'economics'].includes(t))
        : /cto/.test(role)
          ? factTopics.filter((t) => t !== 'budget')
          : ['business', 'team', 'contract'];
    return {
      name: p.name,
      topics: topics.length ? topics : ['business'],
      objective: p.concern,
      unknowns: 'Other functions own their source data; ask the responsible stakeholder.',
      bias: /cfo/.test(role)
        ? 'Needs a reconciled cash and margin baseline.'
        : 'Prioritizes the risks and outcomes owned by this role.',
      style: 'cautious' as const,
      evidenceIds: evidenceAvailable.filter((e) => topics.includes(e.topic)).map((e) => e.id),
    };
  });
  const truth: LabTruth = {
    rootCause: s.hiddenFacts
      .filter((f) => f.critical)
      .map((f) => f.text)
      .join(' '),
    falseLeads: s.redFlags.map((f) => f.description),
    expectedFindings: [
      {
        id: 'context-fit',
        finding: s.evaluationCriteria[0],
        evidenceIds: evidenceAvailable.slice(0, 1).map((e) => e.id),
        keywords: [
          s.hiddenFacts.find((f) => f.critical)?.topic || 'business',
          'evidence',
          'validate',
          'uncertain',
        ],
      },
    ],
    contradictions: [],
    knowledge,
    coaching: coachingFor(family, primaryTopic),
    debrief: `${s.evaluationCriteria.join(' ')} ${s.redFlags.map((f) => f.description).join(' ')}`,
    challengeQuestions: challengesFor(family, primaryTopic),
  };
  if (s.level >= 2)
    truth.expectedFindings.push({
      id: 'operational-finding',
      finding:
        'The observed signal needs an operational owner, a measurable guardrail and a period-specific validation plan.',
      evidenceIds: [`${s.id}-operational`, `${s.id}-commercial`],
      keywords: [primaryTopic, 'owner', 'guardrail', 'measure'],
    });
  return {
    ...sourceScenario,
    lab,
    truth,
    evidenceAvailable: evidenceAvailable.map((e) => ({
      ...e,
      source: e.source || 'Synthetic management data room',
      format: e.format || 'memo',
      factIds: e.factIds || s.hiddenFacts.filter((f) => f.topic === e.topic).map((f) => f.id),
    })),
  };
}

interface CaseBrief {
  id: string;
  title: string;
  company: string;
  level: number;
  family: Family;
  stage: Stage;
  brief: string;
  business: string;
  architecture: string;
  issue: [string, string];
  economics: string;
  team: string;
  document: string;
  financial: Metrics;
  root: string;
  hypothesis: string;
  action: string;
  guardrail: string;
  services: string[];
  contradiction?: [string, string];
}

/*
 * The reference bank is deliberately data driven. These expansion seeds are
 * compact authoring records, not UI-generated filler: each one changes the
 * decision context, technical signal, competing explanation and evidence
 * question while sharing the same validated delivery pipeline. Keeping the
 * records here makes a 120–160 case curriculum maintainable and reviewable.
 */
type ExpansionSeed = {
  id: string;
  title: string;
  family: Family;
  stage: Stage;
  level: number;
  topic: string;
  brief: string;
  signal: string;
  root: string;
  services: string[];
  financialArchetype?: keyof typeof financialArchetypes;
};

type FinancialArchetype = {
  cloudBefore: number;
  cloudAfter: number;
  unitsBefore: number;
  unitsAfter: number;
  revenueBefore: number;
  revenueAfter: number;
  cogsBefore: number;
  cogsAfter: number;
};

const financialArchetypes: Record<string, FinancialArchetype> = {
  'healthy-scaling-saas': {
    cloudBefore: 3_000_000,
    cloudAfter: 4_650_000,
    unitsBefore: 100_000_000,
    unitsAfter: 220_000_000,
    revenueBefore: 12_000_000,
    revenueAfter: 22_800_000,
    cogsBefore: 4_800_000,
    cogsAfter: 7_068_000,
  },
  'margin-compression-saas': {
    cloudBefore: 3_000_000,
    cloudAfter: 4_650_000,
    unitsBefore: 100_000_000,
    unitsAfter: 110_000_000,
    revenueBefore: 12_000_000,
    revenueAfter: 13_000_000,
    cogsBefore: 4_800_000,
    cogsAfter: 6_500_000,
  },
  'high-growth-cloud-efficient': {
    cloudBefore: 5_800_000,
    cloudAfter: 7_100_000,
    unitsBefore: 90_000_000,
    unitsAfter: 210_000_000,
    revenueBefore: 32_000_000,
    revenueAfter: 48_000_000,
    cogsBefore: 10_560_000,
    cogsAfter: 14_400_000,
  },
  'finops-waste': {
    cloudBefore: 2_400_000,
    cloudAfter: 3_300_000,
    unitsBefore: 70_000_000,
    unitsAfter: 78_000_000,
    revenueBefore: 18_000_000,
    revenueAfter: 19_500_000,
    cogsBefore: 7_200_000,
    cogsAfter: 8_970_000,
  },
  'ai-variable-cost-pressure': {
    cloudBefore: 2_100_000,
    cloudAfter: 3_000_000,
    unitsBefore: 8_000_000,
    unitsAfter: 13_000_000,
    revenueBefore: 16_000_000,
    revenueAfter: 21_000_000,
    cogsBefore: 5_600_000,
    cogsAfter: 9_660_000,
  },
  'enterprise-reliability-risk': {
    cloudBefore: 4_200_000,
    cloudAfter: 4_900_000,
    unitsBefore: 48_000_000,
    unitsAfter: 55_000_000,
    revenueBefore: 52_000_000,
    revenueAfter: 57_000_000,
    cogsBefore: 18_200_000,
    cogsAfter: 21_090_000,
  },
  'post-close-value-creation': {
    cloudBefore: 3_000_000,
    cloudAfter: 3_500_000,
    unitsBefore: 80_000_000,
    unitsAfter: 100_000_000,
    revenueBefore: 24_000_000,
    revenueAfter: 29_000_000,
    cogsBefore: 9_600_000,
    cogsAfter: 10_730_000,
  },
  'carveout-standalone': {
    cloudBefore: 6_800_000,
    cloudAfter: 8_100_000,
    unitsBefore: 120_000_000,
    unitsAfter: 128_000_000,
    revenueBefore: 85_000_000,
    revenueAfter: 89_000_000,
    cogsBefore: 32_300_000,
    cogsAfter: 38_270_000,
  },
  'integration-synergy': {
    cloudBefore: 4_100_000,
    cloudAfter: 4_700_000,
    unitsBefore: 100_000_000,
    unitsAfter: 124_000_000,
    revenueBefore: 70_000_000,
    revenueAfter: 82_000_000,
    cogsBefore: 28_000_000,
    cogsAfter: 31_160_000,
  },
  'low-growth-cash-generation': {
    cloudBefore: 2_700_000,
    cloudAfter: 2_850_000,
    unitsBefore: 65_000_000,
    unitsAfter: 67_000_000,
    revenueBefore: 62_000_000,
    revenueAfter: 64_000_000,
    cogsBefore: 21_700_000,
    cogsAfter: 22_720_000,
  },
  'high-growth-negative-fcf': {
    cloudBefore: 6_000_000,
    cloudAfter: 9_000_000,
    unitsBefore: 100_000_000,
    unitsAfter: 180_000_000,
    revenueBefore: 30_000_000,
    revenueAfter: 48_000_000,
    cogsBefore: 12_900_000,
    cogsAfter: 22_080_000,
  },
  'usage-based-saas': {
    cloudBefore: 1_800_000,
    cloudAfter: 3_600_000,
    unitsBefore: 40_000_000,
    unitsAfter: 100_000_000,
    revenueBefore: 10_000_000,
    revenueAfter: 26_000_000,
    cogsBefore: 4_200_000,
    cogsAfter: 9_880_000,
  },
  'transaction-platform': {
    cloudBefore: 2_200_000,
    cloudAfter: 3_100_000,
    unitsBefore: 180_000_000,
    unitsAfter: 260_000_000,
    revenueBefore: 25_000_000,
    revenueAfter: 35_000_000,
    cogsBefore: 8_000_000,
    cogsAfter: 11_900_000,
  },
};

function archetypeFor(
  seed: Pick<ExpansionSeed, 'family' | 'topic'>,
): keyof typeof financialArchetypes {
  if (seed.topic === 'inference' || seed.topic === 'quality') return 'ai-variable-cost-pressure';
  if (seed.topic === 'recovery' || seed.topic === 'security' || seed.topic === 'observability')
    return 'enterprise-reliability-risk';
  if (seed.topic === 'contract' && seed.family === 'M&A / Carve-Out') return 'carveout-standalone';
  if (seed.topic === 'contract' && seed.family === 'Value Creation')
    return 'post-close-value-creation';
  if (seed.topic === 'contract') return 'integration-synergy';
  if (seed.topic === 'migration' && ['M&A / Carve-Out', 'Sell-Side'].includes(seed.family))
    return 'carveout-standalone';
  if (seed.family === 'Value Creation') return 'post-close-value-creation';
  if (seed.family === 'Buy-Side DD' || seed.family === 'Mega-Case')
    return seed.topic === 'budget' ? 'margin-compression-saas' : 'high-growth-negative-fcf';
  if (seed.family === 'FinOps')
    return seed.topic === 'business' ? 'transaction-platform' : 'finops-waste';
  if (seed.topic === 'traffic' || seed.topic === 'capacity') return 'high-growth-cloud-efficient';
  if (seed.topic === 'database') return 'usage-based-saas';
  return 'healthy-scaling-saas';
}

const expansion = (
  family: Family,
  stage: Stage,
  level: number,
  rows: [string, string, string, string, string, string, string[]][],
): ExpansionSeed[] =>
  rows.map(([id, title, topic, brief, signal, root, services]) => ({
    id,
    title,
    family,
    stage,
    level,
    topic,
    brief,
    signal,
    root,
    services,
  }));

const expansionSeeds: ExpansionSeed[] = [
  ...expansion('Cloud', 'None', 1, [
    [
      'cloud-ec2-sizing',
      'The EC2 fleet doubled. Did demand?',
      'capacity',
      'EC2 spend doubled after a product launch, and the COO wants a resizing plan.',
      'Average CPU is 18%, but memory and deployment windows are not measured by service.',
      'CPU headroom alone cannot establish waste; memory, peak behavior and release risk decide whether resizing is safe.',
      ['EC2', 'Auto Scaling', 'CloudWatch'],
    ],
    [
      'cloud-autoscaling',
      'Autoscaling is ready for a traffic shape we have not measured',
      'traffic',
      'The team proposes aggressive autoscaling before the seasonal campaign.',
      'The load profile is spiky and the scale-out alarm lags the queue by nine minutes.',
      'The customer risk is reaction time and queue depth, not simply the instance count.',
      ['Auto Scaling', 'SQS', 'CloudWatch'],
    ],
    [
      'cloud-ecs-migration',
      'Containers before the migration deadline',
      'migration',
      'A legacy service must move off a hosting contract in four months without disrupting renewals.',
      'The service has hidden cron jobs and a deployment rollback that has never been rehearsed.',
      'Migration readiness depends on dependency inventory and rollback evidence, not container choice alone.',
      ['ECS', 'Fargate', 'Migration Hub'],
    ],
    [
      'cloud-eks-platform',
      'The Kubernetes platform nobody owns',
      'team',
      'A growing SaaS company is considering EKS to standardize teams and deployments.',
      'Three engineers share on-call duties and there is no platform SLO or upgrade budget.',
      'The operating model is the constraint; EKS may increase execution risk before it creates option value.',
      ['EKS', 'Kubernetes', 'CloudWatch'],
    ],
    [
      'cloud-lambda-burst',
      'Serverless burst, permanent cost?',
      'traffic',
      'A public API has unpredictable peaks and a proposal recommends Lambda everywhere.',
      'Cold starts affect only one endpoint, while the largest bill comes from synchronous downstream calls.',
      'The right boundary is workload-specific; replacing compute does not remove downstream latency or cost.',
      ['Lambda', 'API Gateway', 'X-Ray'],
    ],
    [
      'cloud-serverless-margin',
      'The serverless margin bridge',
      'budget',
      'A transaction product grew quickly on managed services and its Gross Margin is now under pressure.',
      'Invocation cost is stable per transaction, but retries and oversized payloads grew with a new partner.',
      'The margin issue is retry and payload behavior, not proof that serverless is uneconomic.',
      ['Lambda', 'SQS', 'CloudWatch'],
    ],
    [
      'cloud-rds-read',
      'Read replicas or a query review?',
      'database',
      'Customer dashboards slow down during month-end reporting.',
      'Read traffic is concentrated in four unbounded queries and the writer has spare CPU.',
      'A query and workload fix may be cheaper and safer than adding replicas without measuring freshness needs.',
      ['RDS', 'Performance Insights', 'ElastiCache'],
    ],
    [
      'cloud-aurora-writer',
      'Aurora capacity meets a forecast, not a workload',
      'database',
      'Management promises 4× growth after a major contract win.',
      'The writer reaches 82% connections at 1.7× load and the forecast excludes batch jobs.',
      'Growth credibility requires a representative load test and connection design before a capacity claim.',
      ['Aurora', 'RDS Proxy', 'CloudWatch'],
    ],
    [
      'cloud-dynamodb-hotkey',
      'The hot partition behind checkout errors',
      'database',
      'Checkout errors appeared after a new promotion increased one tenant’s traffic.',
      'A single partition key receives 64% of writes during the campaign window.',
      'Partition distribution and idempotency are the technical levers; adding provisioned capacity alone may not help.',
      ['DynamoDB', 'CloudWatch', 'SQS'],
    ],
    [
      'cloud-s3-lifecycle',
      'Storage grew quietly for three years',
      'budget',
      'The board sees S3 growth and asks whether archival can lower COGS.',
      'Object access patterns are unknown and legal retention differs by customer segment.',
      'Lifecycle changes need access and retention evidence; deleting or archiving blindly can create compliance and retrieval risk.',
      ['S3', 'S3 Glacier', 'Macie'],
    ],
    [
      'cloud-cloudfront-latency',
      'A latency complaint that may be origin-bound',
      'traffic',
      'International customers report slower pages after a new market launch.',
      'Edge cache hit rate is 82%, but the p95 tail comes from an uncached API origin.',
      'CloudFront can help static delivery, while the material tail requires origin and API evidence.',
      ['CloudFront', 'Route 53', 'X-Ray'],
    ],
    [
      'cloud-elasticache-session',
      'Caching without a consistency contract',
      'architecture',
      'The product team wants ElastiCache to remove database load before an enterprise launch.',
      'Session invalidation is undefined and stale entitlements would create a contractual issue.',
      'The business guardrail is entitlement correctness; cache economics are secondary until consistency is designed.',
      ['ElastiCache', 'RDS', 'CloudWatch'],
    ],
    [
      'cloud-api-quota',
      'The quota that looks like a scaling failure',
      'traffic',
      'Partner onboarding is blocked by intermittent API errors during batch imports.',
      'The service is below CPU limits but receives API Gateway quota responses from one account.',
      'Quota ownership and admission control explain the failure better than additional compute.',
      ['API Gateway', 'Lambda', 'Service Quotas'],
    ],
    [
      'cloud-nat-egress',
      'NAT charges after a network redesign',
      'budget',
      'Cloud spend rose after private subnets were introduced for a regulated workload.',
      'NAT data processing is 38% of the increase; package mirrors and endpoints were not evaluated.',
      'The opportunity is a measured egress path redesign with security validation, not a blanket public-subnet move.',
      ['NAT Gateway', 'VPC', 'VPC Endpoints'],
    ],
    [
      'cloud-cross-az',
      'The cross-AZ bill nobody allocated',
      'budget',
      'A multi-AZ service protects availability but finance cannot explain its data transfer cost.',
      'Chatty synchronous calls cross zones on every request and no team owns the allocation.',
      'Resilience and transfer economics must be balanced with a workload-aware topology and ownership model.',
      ['EC2', 'RDS', 'VPC'],
    ],
    [
      'cloud-multi-az',
      'Availability target versus recovery evidence',
      'recovery',
      'An enterprise customer requires 99.95% availability and the team proposes another AZ.',
      'The current backup restore has not been timed and the application has a single deployment dependency.',
      'Additional zones do not substitute for tested recovery and dependency isolation.',
      ['RDS', 'Route 53', 'AWS Backup'],
    ],
    [
      'cloud-multi-region',
      'Global active-active before the business case',
      'recovery',
      'The CEO asks for multi-region before entering two new countries.',
      'Customer data residency, write conflict handling and a tested RPO are undefined.',
      'The decision boundary is residency and recovery evidence; geography alone does not justify active-active complexity.',
      ['Route 53', 'Aurora Global Database', 'S3'],
    ],
    [
      'cloud-route53-failover',
      'A failover record without a failover test',
      'recovery',
      'The company advertises disaster recovery readiness to an enterprise buyer.',
      'Route 53 health checks exist, but DNS, secrets and database promotion are not rehearsed together.',
      'The claim is unverified until an end-to-end recovery exercise measures RTO and RPO.',
      ['Route 53', 'RDS', 'Secrets Manager'],
    ],
    [
      'cloud-queue-backpressure',
      'The queue is healthy while customers wait',
      'traffic',
      'Order processing appears reliable but customers report delayed confirmations.',
      'Queue depth is stable because consumers throttle at a downstream API limit.',
      'A green queue metric can hide business latency; measure end-to-end completion and dependency quotas.',
      ['SQS', 'Lambda', 'CloudWatch'],
    ],
    [
      'cloud-event-driven',
      'Events reduce coupling, or move it?',
      'architecture',
      'A monolith team proposes event-driven workflows to accelerate product releases.',
      'Events are not versioned and duplicate delivery is handled differently by each consumer.',
      'Event architecture creates operational and data-contract work that must be funded and observed.',
      ['EventBridge', 'SQS', 'SNS'],
    ],
    [
      'cloud-vpc-segmentation',
      'Security segmentation and developer flow',
      'security',
      'A regulated customer requires stronger network isolation without slowing releases.',
      'The proposed account split has no ownership map and would duplicate shared services.',
      'Segmentation should reduce material exposure while preserving an operable delivery path.',
      ['VPC', 'Transit Gateway', 'Network Firewall'],
    ],
    [
      'cloud-iam-growth',
      'IAM sprawl before a diligence meeting',
      'security',
      'The target claims least privilege but has grown from 40 to 400 roles.',
      'Unused permissions and shared break-glass credentials are not periodically reviewed.',
      'Access risk is an evidence and operating-maturity finding, not a reason to replace the entire platform.',
      ['IAM', 'IAM Access Analyzer', 'CloudTrail'],
    ],
    [
      'cloud-kms-rotation',
      'Encryption keys and the recovery window',
      'security',
      'A customer requests customer-managed keys and documented rotation.',
      'Some backups and analytics exports have unclear key ownership and restore dependencies.',
      'Security controls must include recoverability and ownership, not only the encryption checkbox.',
      ['KMS', 'S3', 'AWS Backup'],
    ],
    [
      'cloud-observability-blindspot',
      'The dashboard says green',
      'observability',
      'The CTO believes incidents are declining because the dashboard is green.',
      'Only averages are tracked; p99 latency and customer error budgets are absent.',
      'Observability quality determines whether the reliability claim can be trusted.',
      ['CloudWatch', 'X-Ray', 'OpenSearch'],
    ],
    [
      'cloud-terraform-drift',
      'Infrastructure as code with manual exceptions',
      'deployment',
      'The platform team promises repeatable environments for a new region.',
      'Terraform state differs from production after emergency console changes and no drift gate exists.',
      'The delivery risk is untracked configuration drift and ownership, not the choice of IaC tool.',
      ['Terraform', 'CloudFormation', 'Config'],
    ],
  ]),
  ...expansion('FinOps', 'None', 1, [
    [
      'finops-idle-ecs',
      'Idle services after the launch',
      'budget',
      'A launch ended but the ECS fleet remained at peak size.',
      'Night and weekend utilization is below 10%, while one batch job still needs a larger window.',
      'Scheduling can create recurring value if the batch guardrail and ownership are explicit.',
      ['ECS', 'Auto Scaling', 'Cost Explorer'],
    ],
    [
      'finops-ebs-waste',
      'Volumes without a workload owner',
      'budget',
      'EBS spend rose faster than customer volume.',
      'Thirty percent of unattached volumes have no owner or deletion ticket.',
      'The opportunity is identifiable but deletion requires retention and recovery evidence.',
      ['EBS', 'AWS Backup', 'Config'],
    ],
    [
      'finops-snapshot-retention',
      'Snapshots that outlive the product',
      'recovery',
      'A backup policy creates a growing snapshot estate.',
      'Retention differs by account and restore tests cover only one tier.',
      'Cost reduction must preserve the documented RPO and a tested restore path.',
      ['EBS', 'RDS', 'AWS Backup'],
    ],
    [
      'finops-nat-egress',
      'Data transfer swallowed the forecast',
      'budget',
      'The FinOps forecast missed a new analytics workload’s NAT processing.',
      'Cross-zone and internet egress are mixed in one uncategorized line.',
      'Allocation and a measured private endpoint design are prerequisites to a credible opportunity.',
      ['NAT Gateway', 'VPC Endpoints', 'Cost Categories'],
    ],
    [
      'finops-cloudwatch',
      'Logs as an unowned product cost',
      'observability',
      'CloudWatch costs doubled while support tickets stayed flat.',
      'Debug logs are retained for two years without a tiered access requirement.',
      'Retention and sampling can lower cost, but incident response evidence must remain intact.',
      ['CloudWatch', 'S3', 'OpenSearch'],
    ],
    [
      'finops-unused-ips',
      'Addresses with no service behind them',
      'budget',
      'A network inventory identifies unused public addresses.',
      'The inventory is stale and two addresses belong to a pending migration.',
      'The gross opportunity needs ownership confirmation before removal.',
      ['VPC', 'Config', 'Service Catalog'],
    ],
    [
      'finops-rds-rightsize',
      'Rightsizing a database with a peak',
      'database',
      'RDS cost is the largest controllable line in the portfolio.',
      'Average CPU is low but monthly close reaches memory and I/O limits.',
      'Rightsizing on averages could damage the close window; use peak-aware unit economics.',
      ['RDS', 'Performance Insights', 'Cost Explorer'],
    ],
    [
      'finops-eks-requests',
      'Kubernetes requests three times usage',
      'capacity',
      'EKS capacity is blamed for a margin decline.',
      'CPU requests are 3× observed use, but memory p99 is 80% of request and pods have no disruption budget.',
      'Requests need workload-level evidence and reliability guardrails before reduction.',
      ['EKS', 'CloudWatch', 'Compute Optimizer'],
    ],
    [
      'finops-commitment-coverage',
      'A commitment proposal before the baseline',
      'contract',
      'Finance wants a Savings Plan to improve next year’s forecast.',
      'Coverage is 58%, utilization 71%, and a migration may change the service mix.',
      'Commitment value depends on stable eligible usage and transfer assumptions.',
      ['Savings Plans', 'Cost Explorer', 'Organizations'],
    ],
    [
      'finops-commitment-utilization',
      'Discount coverage hides idle capacity',
      'contract',
      'The dashboard reports 92% commitment coverage.',
      'Utilization is 63% because a discontinued workload still anchors the commitment.',
      'Coverage alone is not savings; utilization and workload durability determine value.',
      ['Savings Plans', 'Cost Explorer', 'Budgets'],
    ],
    [
      'finops-forecast-error',
      'The forecast missed growth and waste',
      'budget',
      'The board lost confidence in the cloud forecast after three misses.',
      'The forecast uses last month’s spend and ignores committed growth and anomaly bands.',
      'Forecast quality requires business drivers, confidence ranges and ownership.',
      ['Cost Explorer', 'Budgets', 'Cost Anomaly Detection'],
    ],
    [
      'finops-tagging',
      'Allocation before optimization',
      'budget',
      'Teams argue about spend because 45% is unallocated.',
      'Tag coverage is high on EC2 but low on shared data and network services.',
      'Ownership and allocation are prerequisites to deciding which spend is avoidable.',
      ['Resource Groups', 'Cost Categories', 'Organizations'],
    ],
    [
      'finops-showback',
      'Showback changes behavior only with a unit',
      'business',
      'The CFO wants teams to reduce cloud spend through showback.',
      'Reports show totals by account but no customer, transaction or service unit.',
      'A total bill cannot guide product trade-offs; define useful units and decision owners.',
      ['Cost Categories', 'CUR', 'QuickSight'],
    ],
    [
      'finops-anomaly',
      'An anomaly alert after the invoice',
      'budget',
      'A new model endpoint created a large unexpected bill.',
      'Alerts fire on account totals with a 48-hour delay and no service owner routing.',
      'Detection must connect to a response playbook and business context.',
      ['Cost Anomaly Detection', 'Budgets', 'SNS'],
    ],
    [
      'finops-customer-unit',
      'Cost per tenant is not cost per value',
      'business',
      'The SaaS team wants to publish cost per customer.',
      'Tenant sizes and support loads vary by 20× and shared platform cost is omitted.',
      'A useful unit needs a stable denominator and an allocation method that teams trust.',
      ['CUR', 'Athena', 'QuickSight'],
    ],
    [
      'finops-marginal-growth',
      'The marginal cost of the next customer',
      'economics',
      'Sales expects a low-cost expansion into a new segment.',
      'The first 100 customers require a data pipeline and support tier not in the average.',
      'Average cost hides step functions; model marginal cost and capacity thresholds.',
      ['Lambda', 'RDS', 'Cost Explorer'],
    ],
    [
      'finops-capacity-contract',
      'Reserved capacity after a business change',
      'contract',
      'A portfolio company has a three-year commitment after a product pivot.',
      'The eligible service mix fell 30% and transferability is unclear after acquisition.',
      'Standalone economics and contract terms must be reconciled before claiming savings.',
      ['Savings Plans', 'RDS', 'Organizations'],
    ],
  ]),
  ...expansion('AI / MLOps', 'None', 2, [
    [
      'ai-api-model',
      'The API model bill follows prompts, not customers',
      'inference',
      'AI spend rose 80% while customer count grew 20%.',
      'Context length and retries grew after a support workflow change.',
      'Cost per successful task needs token, retry and outcome evidence.',
      ['Bedrock', 'CloudWatch', 'S3'],
    ],
    [
      'ai-bedrock-routing',
      'Routing models without a quality gate',
      'inference',
      'The product proposes a smaller model for margin expansion.',
      'The small model is cheaper but fails on two enterprise task classes.',
      'Routing should follow stratified quality and contribution-margin evidence.',
      ['Bedrock', 'SageMaker', 'CloudWatch'],
    ],
    [
      'ai-gpu-utilization',
      'The GPU endpoint is idle between peaks',
      'inference',
      'Self-hosted inference is framed as cheaper than an API provider.',
      'GPU utilization averages 22% and the latency SLO requires warm capacity.',
      'The comparison needs utilization, peak reservation and successful-outcome cost.',
      ['SageMaker', 'EKS', 'CloudWatch'],
    ],
    [
      'ai-idle-endpoint',
      'An endpoint left on for a pilot',
      'budget',
      'A discontinued AI pilot still generates monthly infrastructure spend.',
      'The endpoint has no production traffic, but its model artifact is needed for audit.',
      'Decommissioning must preserve evidence and retention while removing runtime cost.',
      ['SageMaker', 'S3', 'CloudTrail'],
    ],
    [
      'ai-token-growth',
      'Context growth breaks the margin forecast',
      'inference',
      'The AI feature forecast assumes token cost per request stays flat.',
      'Average context grew 3× as customers added documents and retrieval results.',
      'A margin plan needs context controls, caching and successful-task measurement.',
      ['Bedrock', 'OpenSearch', 'CloudWatch'],
    ],
    [
      'ai-batching',
      'Batching versus latency promise',
      'inference',
      'Engineering wants batching to reduce inference cost.',
      'Batching lowers cost 28% in offline tests but breaches the p95 interaction target.',
      'The trade-off belongs in a workload-specific SLA and routing policy.',
      ['SageMaker', 'SQS', 'CloudWatch'],
    ],
    [
      'ai-cache',
      'Caching answers without stale-policy evidence',
      'quality',
      'A response cache could cut repeated AI calls.',
      'The product has no policy for source changes or customer-specific permissions.',
      'Cache value is conditional on correctness, freshness and data boundaries.',
      ['ElastiCache', 'Bedrock', 'KMS'],
    ],
    [
      'ai-rag',
      'RAG quality improved, support did not',
      'quality',
      'The team claims retrieval augmented generation solved hallucinations.',
      'Citation presence rose while unsupported answers remain high on long documents.',
      'Evaluation must measure supported claims and customer outcomes, not citation count alone.',
      ['OpenSearch', 'S3', 'Bedrock'],
    ],
    [
      'ai-vector-db',
      'Vector database choice before workload evidence',
      'architecture',
      'A vector database migration is proposed for scale.',
      'Embedding volume is small; query latency is dominated by document preprocessing.',
      'The architecture decision should follow measured bottlenecks and operating capacity.',
      ['OpenSearch', 'S3', 'Lambda'],
    ],
    [
      'ai-retries',
      'Retries turn a quality issue into a cost issue',
      'inference',
      'AI vendor costs grew faster than requests.',
      '18% of requests retry after timeouts and duplicate full context.',
      'Reliability and cost are linked; fix timeout and idempotency before model changes.',
      ['Bedrock', 'SQS', 'X-Ray'],
    ],
    [
      'ai-evaluation',
      'Offline score without customer relevance',
      'quality',
      'Management cites a benchmark gain to support launch.',
      'The benchmark lacks the top three customer workflows and has no holdout set.',
      'A release claim needs representative evaluation, canary gates and rollback.',
      ['SageMaker', 'S3', 'CloudWatch'],
    ],
    [
      'ai-drift',
      'Model drift hidden by aggregate accuracy',
      'quality',
      'A fraud model continues to meet its headline accuracy target.',
      'Segment recall fell for a fast-growing customer cohort.',
      'Monitoring must follow customer and risk segments, not only aggregate accuracy.',
      ['SageMaker', 'Model Monitor', 'CloudWatch'],
    ],
    [
      'ai-human-review',
      'Automation savings with a manual review queue',
      'team',
      'The AI team forecasts support headcount avoidance.',
      'Review volume rises with low-confidence outputs and no staffing baseline exists.',
      'Capacity recovery is not immediate EBITDA; measure workload, quality and redeployment.',
      ['Bedrock', 'SQS', 'QuickSight'],
    ],
    [
      'ai-vendor-concentration',
      'One model provider in the critical path',
      'contract',
      'An enterprise buyer asks about AI vendor dependency.',
      'Fallback exists on paper but has not passed quality, latency or data-rights review.',
      'Vendor risk is a resilience and contract finding with a cost-to-fix, not a binary migration.',
      ['Bedrock', 'SageMaker', 'KMS'],
    ],
  ]),
  ...expansion('Buy-Side DD', 'Initial DD', 2, [
    [
      'buy-saas-scalability',
      'Can the growth plan survive peak tenants?',
      'traffic',
      'The target forecasts 70% growth from enterprise tenants.',
      'The last load test covered web CPU but not tenant-specific database fan-out.',
      'Growth capacity is not established until representative tenant workloads pass.',
      ['EKS', 'RDS', 'CloudWatch'],
    ],
    [
      'buy-tech-debt',
      'Technical debt hidden in release cadence',
      'deployment',
      'The investment thesis assumes faster product delivery after close.',
      'Deployments require manual database steps and rollback takes two hours.',
      'Execution risk is a cost-to-fix and roadmap dependency, not a generic modernization slogan.',
      ['CodePipeline', 'RDS', 'CloudFormation'],
    ],
    [
      'buy-cyber-baseline',
      'Security claims versus operating evidence',
      'security',
      'The target claims enterprise-grade controls.',
      'MFA exceptions, key rotation and incident exercises are inconsistently documented.',
      'Control maturity and remediation cost affect customer retention and diligence confidence.',
      ['IAM', 'KMS', 'CloudTrail'],
    ],
    [
      'buy-dr-test',
      'DR policy without a measured restore',
      'recovery',
      'The target promises a four-hour RTO to buyers.',
      'Backups exist, but the last end-to-end restore was 14 months ago.',
      'Recovery readiness is unproven until the runbook, dependencies and RPO are tested.',
      ['AWS Backup', 'RDS', 'Route 53'],
    ],
    [
      'buy-key-person',
      'The platform depends on two people',
      'team',
      'The target says operations are automated.',
      'Two engineers hold the only deployment and incident knowledge.',
      'Key-person risk changes execution confidence and the first 100-day staffing plan.',
      ['EKS', 'Terraform', 'CloudWatch'],
    ],
    [
      'buy-standalone-cost',
      'Cloud cost after separation',
      'contract',
      'Reported Gross Margin includes shared parent commitments.',
      'Standalone identity, security and observability costs are omitted from the plan.',
      'Standalone economics require a transparent bridge and transition assumptions.',
      ['Organizations', 'IAM', 'Cost Categories'],
    ],
    [
      'buy-ai-margin',
      'AI contribution margin under a growth case',
      'inference',
      'The target reports strong AI feature adoption.',
      'Cost per successful task rises with long contexts and retries.',
      'Feature economics need outcome and retention evidence, not token cost alone.',
      ['Bedrock', 'OpenSearch', 'CloudWatch'],
    ],
    [
      'buy-sla-evidence',
      'SLA claims with incomplete incident data',
      'observability',
      'The target says its enterprise SLA is consistently met.',
      'Customer-impacting errors are not linked to contract periods or regions.',
      'SLA credibility needs reconciled incident, latency and credit evidence.',
      ['CloudWatch', 'X-Ray', 'Route 53'],
    ],
    [
      'buy-vendor-lockin',
      'Commitments that do not follow the asset',
      'contract',
      'A cloud commitment is part of the seller’s margin story.',
      'Transferability and termination costs are absent from the data room.',
      'The deal model needs a standalone commitment scenario and downside case.',
      ['Savings Plans', 'Organizations', 'Cost Explorer'],
    ],
    [
      'buy-data-rights',
      'AI data rights in the diligence room',
      'security',
      'The target plans to train on customer documents.',
      'Consent, retention and provider terms differ across customer contracts.',
      'Data rights are a growth and transaction risk requiring contract evidence.',
      ['S3', 'KMS', 'Macie'],
    ],
    [
      'buy-migration-cost',
      'The migration estimate has no dependency map',
      'migration',
      'Management budgets a one-year platform migration.',
      'Data conversion, dual-run and customer testing are excluded.',
      'Cost-to-fix and execution risk need a sequenced plan with customer gates.',
      ['DMS', 'S3', 'RDS'],
    ],
    [
      'buy-observability',
      'Operational maturity behind the ARR multiple',
      'observability',
      'The target expects premium valuation from reliable enterprise service.',
      'No service ownership map connects SLOs to customer contracts.',
      'The quality of growth depends on operating evidence, not dashboard volume.',
      ['CloudWatch', 'X-Ray', 'SNS'],
    ],
    [
      'buy-rpo-risk',
      'The RPO in the sales deck',
      'recovery',
      'A regulated vertical is a key upside case.',
      'Replication is asynchronous and the actual data-loss window is not measured.',
      'Regulatory expansion requires tested recovery and a credible downside case.',
      ['Aurora', 'S3', 'AWS Backup'],
    ],
    [
      'buy-release-risk',
      'Roadmap growth versus release safety',
      'deployment',
      'The plan doubles release frequency after acquisition.',
      'Change failure rate is unknown and emergency fixes bypass review.',
      'Release acceleration needs a baseline, ownership and rollback guardrails.',
      ['CodePipeline', 'CloudFormation', 'CloudWatch'],
    ],
    [
      'buy-multi-tenant',
      'Tenant isolation before a large contract',
      'security',
      'The largest prospect requires strong tenant separation.',
      'A shared database uses application filters without independent audit evidence.',
      'Isolation risk affects win probability and remediation cost.',
      ['RDS', 'KMS', 'CloudTrail'],
    ],
    [
      'buy-data-transfer',
      'Margin expansion depends on egress assumptions',
      'budget',
      'The model assumes a stable cloud cost ratio as data products grow.',
      'Cross-region replication and analytics egress are outside the forecast.',
      'The base case needs marginal transfer cost and architecture constraints.',
      ['S3', 'VPC', 'CloudFront'],
    ],
    [
      'buy-platform-capacity',
      'Five times capacity, one point in the test',
      'capacity',
      'Management claims the platform can support five times current revenue.',
      'The test saturated database connections at 2.4× and measured only the web tier.',
      'The growth thesis must separate tested capacity from extrapolation.',
      ['EKS', 'RDS', 'CloudWatch'],
    ],
    [
      'buy-commitment',
      'A commitment purchased for the wrong mix',
      'contract',
      'The target’s reported savings include a long-term commitment.',
      'A planned product exit changes eligible compute usage next quarter.',
      'Normalized economics need a commitment unwind and standalone forecast.',
      ['Savings Plans', 'EC2', 'Cost Explorer'],
    ],
    [
      'buy-management-claim',
      'When management is right for the wrong reason',
      'business',
      'The CTO says the bill rose because customers doubled.',
      'Transactions grew only 12% and a shared analytics environment is always on.',
      'The correct diligence finding is mixed: healthy growth plus avoidable capacity.',
      ['CUR', 'EC2', 'Cost Explorer'],
    ],
    [
      'buy-integration-readiness',
      'The integration plan starts before identity inventory',
      'migration',
      'The buyer expects a rapid operating model integration.',
      'Identity providers and privileged access reviews have different owners.',
      'Day-one readiness depends on access continuity and a sequenced integration plan.',
      ['IAM Identity Center', 'Organizations', 'CloudTrail'],
    ],
  ]),
  ...expansion('Value Creation', '100-Day Plan', 3, [
    [
      'vc-ec2-schedule',
      'Turn idle compute into a governed initiative',
      'budget',
      'The board expects a measurable first-100-day margin initiative.',
      'Non-production EC2 runs continuously and teams disagree about shutdown windows.',
      'The initiative needs owner, baseline, schedule, customer guardrail and Finance verification.',
      ['EC2', 'Auto Scaling', 'Cost Explorer'],
    ],
    [
      'vc-rds-pilot',
      'Database rightsizing with a peak guardrail',
      'database',
      'A portfolio company wants savings without risking month-end close.',
      'Average utilization is low but peak I/O is material and not tagged to finance.',
      'A reversible pilot can validate savings while protecting the close window.',
      ['RDS', 'Performance Insights', 'CloudWatch'],
    ],
    [
      'vc-storage',
      'Storage lifecycle as a value bridge',
      'budget',
      'The operating partner asks for a 100-day storage opportunity.',
      'Old objects are expensive, but retention classes and retrieval demand are unclear.',
      'Value is conditional on retention evidence and measured retrieval impact.',
      ['S3', 'S3 Glacier', 'Macie'],
    ],
    [
      'vc-network',
      'Network savings with security intact',
      'security',
      'A portfolio company wants to reduce NAT and transfer cost.',
      'Private endpoints could lower processing, but route ownership is fragmented.',
      'The plan must preserve segmentation and prove the comparable run-rate.',
      ['NAT Gateway', 'VPC Endpoints', 'Network Firewall'],
    ],
    [
      'vc-finops-operating-model',
      'Who owns cloud value?',
      'team',
      'FinOps recommendations are repeatedly identified but not implemented.',
      'Teams lack a benefit owner, KPI and monthly governance cadence.',
      'Operating model and accountability are the value-creation constraint.',
      ['Cost Categories', 'Budgets', 'QuickSight'],
    ],
    [
      'vc-release-automation',
      'Engineering capacity without a headcount claim',
      'deployment',
      'The board wants faster delivery and lower support burden.',
      'Manual release steps consume engineer time but payroll will not decline.',
      'Recovered capacity is valuable but must remain separate from verified cash savings.',
      ['CodePipeline', 'CodeBuild', 'CloudWatch'],
    ],
    [
      'vc-support-deflection',
      'AI support savings need a quality ledger',
      'quality',
      'The company forecasts support cost reduction from an assistant.',
      'Deflection is measured, but reopen rate and customer satisfaction are not.',
      'The benefit needs outcome quality and workload evidence before entering the plan.',
      ['Bedrock', 'SQS', 'QuickSight'],
    ],
    [
      'vc-ai-routing',
      'AI margin expansion by routing',
      'inference',
      'The product team proposes a smaller model for low-risk tasks.',
      'The task classifier has no false-negative guardrail for high-risk customers.',
      'Routing value depends on evaluation coverage and customer-risk controls.',
      ['Bedrock', 'SageMaker', 'CloudWatch'],
    ],
    [
      'vc-observability',
      'Reliability work as downside protection',
      'observability',
      'Incident load threatens enterprise expansion.',
      'No owner connects p95 latency to renewal risk or remediation cost.',
      'Reliability is a value-protection initiative with explicit validation and timing.',
      ['CloudWatch', 'X-Ray', 'Route 53'],
    ],
    [
      'vc-iam-remediation',
      'Access remediation with an accountable owner',
      'security',
      'A board risk register includes excessive production access.',
      'Privileged roles are shared across contractors and no quarterly review exists.',
      'Risk reduction needs a remediation owner, evidence and a customer-impact guardrail.',
      ['IAM', 'Access Analyzer', 'CloudTrail'],
    ],
    [
      'vc-backup-rehearsal',
      'Recovery rehearsal before the next renewal',
      'recovery',
      'A key customer asks for tested RTO and RPO.',
      'Backup jobs are green but restore dependencies are undocumented.',
      'The first 100 days should buy evidence and recovery confidence, not a DR slogan.',
      ['AWS Backup', 'RDS', 'Route 53'],
    ],
    [
      'vc-data-contracts',
      'Events need contracts before scale',
      'architecture',
      'A platform program wants event-driven integration for product expansion.',
      'Consumers handle schema changes differently and no owner funds compatibility.',
      'The initiative is a data-contract and observability program before a service migration.',
      ['EventBridge', 'SQS', 'Schema Registry'],
    ],
    [
      'vc-commitment',
      'Savings Plan value after a portfolio carve-out',
      'contract',
      'The portfolio company inherited a commitment with uncertain utilization.',
      'Forecast usage is lower after a product exit and transfer rules are unknown.',
      'Value must use a standalone usage forecast and a verified utilization baseline.',
      ['Savings Plans', 'Cost Explorer', 'Organizations'],
    ],
    [
      'vc-tenant-unit',
      'From bill reduction to cost-to-serve',
      'business',
      'The operating partner wants a product-level cost baseline.',
      'Shared platform and support effort are absent from cost per customer.',
      'A useful unit enables trade-offs and prevents superficial cost cutting.',
      ['CUR', 'Athena', 'QuickSight'],
    ],
    [
      'vc-migration',
      'A migration initiative with customer gates',
      'migration',
      'A platform migration promises lower run-rate and faster delivery.',
      'Dual-running and customer certification costs are missing from the plan.',
      'Sequence the migration with measurable gates and separate one-time cash from recurring benefit.',
      ['DMS', 'ECS', 'RDS'],
    ],
    [
      'vc-database-capacity',
      'Growth enablement before margin expansion',
      'capacity',
      'Enterprise growth depends on a database redesign.',
      'The redesign has a $2M estimate but no representative workload or owner.',
      'Growth enablement and cost-to-fix belong in the plan with confidence and downside timing.',
      ['Aurora', 'RDS Proxy', 'CloudWatch'],
    ],
    [
      'vc-forecast-governance',
      'The benefit register is not a ledger',
      'budget',
      'The board sees $2M of opportunities across three workstreams.',
      'Several rows describe the same savings through Gross Margin and EBITDA views.',
      'Unique benefit keys and Finance sign-off prevent double counting.',
      ['Cost Categories', 'Budgets', 'QuickSight'],
    ],
  ]),
  ...expansion('Sell-Side', 'Sell-Side DD', 3, [
    [
      'sell-reliability-claim',
      'Support the SLA claim with source records',
      'observability',
      'The seller highlights reliability as a differentiator.',
      'Incident severity, customer credits and p95 latency are not reconciled by period.',
      'The response should disclose evidence limits and a practical remediation path.',
      ['CloudWatch', 'X-Ray', 'Route 53'],
    ],
    [
      'sell-margin-quality',
      'Explain cloud margin expansion credibly',
      'budget',
      'Management reports improving Gross Margin as cloud spend rises.',
      'Useful transactions grew faster than spend, but COGS includes an unallocated vendor line.',
      'The claim is directionally plausible but needs comparable allocation and caveats.',
      ['CUR', 'Cost Explorer', 'Cost Categories'],
    ],
    [
      'sell-ai-readiness',
      'AI roadmap before the buyer asks',
      'inference',
      'The seller positions an AI feature as a growth catalyst.',
      'Quality evaluation and provider terms are incomplete for enterprise use.',
      'A credible story separates roadmap upside from validated unit economics and rights.',
      ['Bedrock', 'SageMaker', 'KMS'],
    ],
    [
      'sell-dr-readiness',
      'Recovery evidence in the data room',
      'recovery',
      'A buyer requests proof of continuity for regulated customers.',
      'The runbook exists but no recent restore covers the analytics dependency.',
      'Provide measured evidence, gap, cost-to-fix and timing without overclaiming.',
      ['AWS Backup', 'RDS', 'S3'],
    ],
    [
      'sell-security',
      'Security posture and remediation disclosure',
      'security',
      'The seller wants to avoid a red flag in the technology report.',
      'Access review and key rotation exceptions are open with no due dates.',
      'Transparent prioritization protects credibility better than unsupported certification language.',
      ['IAM', 'KMS', 'CloudTrail'],
    ],
    [
      'sell-standalone',
      'Standalone cloud economics for the buyer',
      'contract',
      'Reported cost benefits rely on parent shared services.',
      'Identity, logging and network controls need new standalone contracts.',
      'A normalized bridge must show stranded, replacement and transition costs.',
      ['Organizations', 'VPC', 'Cost Explorer'],
    ],
    [
      'sell-scalability',
      'The growth forecast needs a test plan',
      'capacity',
      'Management claims the platform is ready for international growth.',
      'The last representative test predates the latest data model.',
      'The seller can support the claim only with a scoped validation plan and confidence range.',
      ['EKS', 'RDS', 'CloudWatch'],
    ],
    [
      'sell-technical-debt',
      'Technical debt before exit',
      'deployment',
      'The company wants to present a clean product-engineering story.',
      'Manual changes and undocumented dependencies raise execution risk after close.',
      'The disclosure should state cost-to-fix and operational dependency without inflating value.',
      ['Terraform', 'CodePipeline', 'Config'],
    ],
  ]),
  ...expansion('M&A / Carve-Out', 'Day 1', 4, [
    [
      'ma-identity-day1',
      'Identity continuity on Day 1',
      'security',
      'A carve-out must operate independently on close.',
      'Shared identity groups and break-glass accounts have no tested separation runbook.',
      'Day-one continuity requires access inventory, owner and rollback plan.',
      ['IAM Identity Center', 'Organizations', 'CloudTrail'],
    ],
    [
      'ma-network-standalone',
      'A standalone network with stranded cost',
      'migration',
      'The buyer needs a secure AWS landing zone after separation.',
      'Transit Gateway routes and DNS dependencies remain in the seller account.',
      'Standalone cost includes overlap and migration sequencing, not just new instances.',
      ['Transit Gateway', 'Route 53', 'VPC'],
    ],
    [
      'ma-data-migration',
      'Data migration versus customer cutover',
      'migration',
      'Customer data must move to a new account before a contractual date.',
      'The migration has no reconciliation or customer rollback criterion.',
      'Data integrity and customer continuity are gates before speed or savings.',
      ['DMS', 'S3', 'RDS'],
    ],
    [
      'ma-tsa',
      'The TSA that hides the cloud bill',
      'contract',
      'A transition services agreement supports the first six months.',
      'Shared logging, support and commitment costs are bundled without usage drivers.',
      'A transparent TSA schedule separates standalone run-rate and exit dependencies.',
      ['Organizations', 'CloudWatch', 'Cost Categories'],
    ],
    [
      'ma-shared-platform',
      'Shared platform after the acquisition',
      'architecture',
      'Two products want to consolidate observability and deployment tooling.',
      'Their release calendars and data classifications differ materially.',
      'Read-only integration may create value before a risky platform merge.',
      ['CloudWatch', 'CodePipeline', 'KMS'],
    ],
    [
      'ma-addon-identity',
      'Identity synergy needs enterprise consent',
      'security',
      'An add-on acquisition assumes one customer identity plane.',
      'Five enterprise contracts require approval before federation changes.',
      'Synergy is conditional, delayed and customer-dependent.',
      ['IAM Identity Center', 'Cognito', 'CloudTrail'],
    ],
    [
      'ma-license-commitment',
      'A license commitment follows neither company',
      'contract',
      'Integration economics include a vendor license saving.',
      'The contract is non-cancellable for 18 months and transfer approval is pending.',
      'The saving belongs in a downside-aware synergy register, not Day 1 cash.',
      ['Organizations', 'Cost Explorer', 'Savings Plans'],
    ],
    [
      'ma-cutover-rehearsal',
      'The cutover plan has no rehearsal',
      'recovery',
      'The integration date is fixed by a customer renewal cycle.',
      'Rollback dependencies and monitoring ownership are not tested in a full rehearsal.',
      'A cutover gate should measure recovery and customer impact before consolidation.',
      ['Route 53', 'RDS', 'CloudWatch'],
    ],
  ]),
  ...expansion('Mega-Case', 'IC', 5, [
    [
      'mega-margin-rescue',
      'AI margin rescue under an IC deadline',
      'inference',
      'An AI SaaS target promises 80% Gross Margin before the investment committee.',
      'Retries, context growth and provider commitments make the bridge uncertain.',
      'Some routing and FinOps value is plausible, but the margin target remains conditional on quality and workload evidence.',
      ['Bedrock', 'EKS', 'RDS'],
    ],
    [
      'mega-global-saas',
      'Global SaaS expansion and recovery design',
      'recovery',
      'A target expects international growth and a premium exit multiple.',
      'Residency, active-active writes and RTO evidence are unresolved.',
      'Growth capacity and recovery risk must be separated from the upside forecast.',
      ['Aurora Global Database', 'Route 53', 'S3'],
    ],
    [
      'mega-fintech-dd',
      'FinTech scale, controls and unit economics',
      'security',
      'A regulated FinTech target reports strong growth and low cost-to-serve.',
      'Audit evidence, database peaks and support cost are fragmented across teams.',
      'The IC case needs a conditional growth thesis, control remediation and measurable cost-to-fix.',
      ['RDS', 'KMS', 'CloudTrail'],
    ],
    [
      'mega-carveout',
      'A standalone cloud carve-out in ten workstreams',
      'migration',
      'A carve-out must reach Day 1 independence while preserving renewals.',
      'Identity, network, data migration and TSA costs are interdependent.',
      'The plan should sequence continuity first and treat savings as staged, not automatic.',
      ['Organizations', 'DMS', 'Transit Gateway'],
    ],
    [
      'mega-ecommerce',
      'Peak commerce before a holiday launch',
      'traffic',
      'An e-commerce target forecasts a holiday volume spike and margin expansion.',
      'Queue backpressure, database connections and customer conversion are not tested together.',
      'The investment decision requires a representative test and a reversible capacity plan.',
      ['EKS', 'RDS', 'CloudFront'],
    ],
    [
      'mega-healthcare',
      'Healthcare modernization with data boundaries',
      'security',
      'A healthcare platform wants faster analytics without weakening data controls.',
      'Residency, retention and workload isolation are partly undocumented.',
      'Modernization value is conditional on patient-data controls, recovery and operating capacity.',
      ['S3', 'KMS', 'Lake Formation'],
    ],
    [
      'mega-platform-integration',
      'Two acquisitions, one platform thesis',
      'architecture',
      'The sponsor expects shared platform synergies after two acquisitions.',
      'Tenant models, identity policies and licenses conflict across products.',
      'Sequence customer-safe integration and track each synergy once with a dated owner.',
      ['ECS', 'RDS', 'EventBridge'],
    ],
    [
      'mega-exit-readiness',
      'Exit readiness with a technical debt register',
      'deployment',
      'A PE-owned SaaS company prepares for exit in 18 months.',
      'Manual releases, recovery gaps and unverified cost opportunities compete for the same team.',
      'Credible exit readiness prioritizes evidence, cost-to-fix and verified value over a polished claim.',
      ['CodePipeline', 'AWS Backup', 'Cost Explorer'],
    ],
  ]),
];

function expandedBrief(seed: ExpansionSeed, index: number): CaseBrief {
  const financialArchetype = seed.financialArchetype || archetypeFor(seed);
  const financial = financialArchetypes[financialArchetype];
  const profile = profileFor(seed.family, seed.topic, seed.stage);
  return {
    id: seed.id,
    title: seed.title,
    company: `${profile.industry} Practice ${String(index + 1).padStart(2, '0')}`,
    level: seed.level,
    family: seed.family,
    stage: seed.stage,
    brief:
      seed.brief.length >= 50
        ? seed.brief
        : `${seed.brief} Investigate the evidence before choosing an action.`,
    business: `${seed.brief} The decision must protect customer outcomes and a measurable business target while separating signal from assumption.`,
    architecture: `The current ${seed.services.join(', ')} path has a ${seed.topic} constraint. Inspect workload, ownership and operating maturity before choosing a replacement.`,
    issue: [seed.topic, seed.signal],
    economics: `The comparable ledger reconciles cloud spend, useful volume, revenue and COGS. The headline claim may combine growth, waste and timing; use the source records before booking value.`,
    team: `A named ${seed.family} owner exists, but delivery capacity and cross-functional dependencies need confirmation before commitment.`,
    document: `Source record: ${seed.signal} Measurements are partial and the proposed validation has not been executed. Reconcile period, scope, owner and customer guardrails before treating it as proof.`,
    financial,
    root: seed.root,
    hypothesis: `The observed ${seed.topic} may reflect a mix of workload growth, operating design and measurement limits; compare the source record with a bounded alternative.`,
    action: `Run a bounded validation for ${seed.topic}, assign an owner and record the metric that would change the recommendation.`,
    guardrail: `Do not claim realized cash value or customer safety until the ${seed.topic} evidence is measured and Finance or the business owner signs off.`,
    services: seed.services,
  };
}
function author(b: CaseBrief): Scenario {
  const profile = profileFor(b.family, b.issue[0], b.stage);
  const scale: Record<Family, [number, number]> = {
    Cloud: [65, 9],
    FinOps: [120, 14],
    'AI / MLOps': [95, 18],
    'Buy-Side DD': [280, 34],
    'Value Creation': [150, 16],
    'Sell-Side': [210, 27],
    'M&A / Carve-Out': [600, 52],
    'Mega-Case': [420, 42],
  };
  const [companySize, engineeringTeamSize] = scale[b.family];
  const fact = (topic: string, text: string, source: string, critical = false): HiddenFact => ({
    id: `${b.id}-${topic}`,
    topic,
    text,
    source,
    critical,
    keywords: terms[topic] || [topic],
  });
  const hiddenFacts = [
    fact('business', b.business, 'Business sponsor'),
    fact('architecture', b.architecture, 'CTO'),
    { ...fact(b.issue[0], b.issue[1], 'Lead engineer', true), id: `${b.id}-signal` },
    fact('economics', b.economics, 'CFO', true),
    fact('team', b.team, 'CTO'),
  ];
  if (!hiddenFacts.some((f) => f.topic === 'budget'))
    hiddenFacts.push(
      fact(
        'budget',
        'Use the reconciled finance ledger and quantify implementation cost separately. These are fictional planning amounts, not vendor quotes.',
        'CFO',
      ),
    );
  const evidenceAvailable: Evidence[] = [
    {
      id: `${b.id}-finance`,
      topic: 'economics',
      keywords: [...terms.economics, ...terms.budget],
      title: 'Comparable finance and workload ledger.csv',
      status: 'available',
      content: financialCSV(b.financial),
      format: 'csv',
      source: 'CFO · reconciled full-year ledger',
      metrics: b.financial,
      factIds: [`${b.id}-economics`, `${b.id}-business`],
    },
    {
      id: `${b.id}-technical`,
      topic: b.issue[0],
      keywords: [
        ...(terms[b.issue[0]] || [b.issue[0]]),
        'engineering',
        'technical',
        'incident',
        'test',
        'report',
      ],
      title: 'Engineering evidence and limitations',
      status: 'available',
      content: b.document,
      format: 'memo',
      source: 'Lead engineer · synthetic operational record',
      factIds: [`${b.id}-signal`, `${b.id}-architecture`],
    },
    {
      id: `${b.id}-validation`,
      topic: 'validation',
      keywords: ['validation', 'pilot', 'measurement', 'controlled', 'experiment', 'rehearsal'],
      title: 'Outstanding validation request',
      status: 'measurement_required',
      content: `${b.action} Guardrail: ${b.guardrail}. This plan has not been executed; do not treat it as measured evidence.`,
      source: 'Workstream owner',
      factIds: [],
    },
    {
      id: `${b.id}-management`,
      topic: 'business',
      keywords: ['management', 'forecast', 'board', 'thesis', 'plan', 'claim', 'deck'],
      title: 'Management plan and assumptions',
      status: 'available',
      content: `${b.business}\n${b.hypothesis}\nThis is a management statement; reconcile it against independent records.`,
      source: 'Management interview',
      factIds: [`${b.id}-business`],
    },
  ];
  const financeTitle =
    b.family === 'FinOps'
      ? 'Cloud cost allocation and unit ledger.csv'
      : b.family === 'AI / MLOps'
        ? 'Inference cost and successful-outcome ledger.csv'
        : b.family === 'M&A / Carve-Out'
          ? 'Allocated versus standalone cost bridge.csv'
          : b.family === 'Value Creation'
            ? 'Benefit register and realization ledger.csv'
            : b.family === 'Sell-Side'
              ? 'Normalized cost and disclosure bridge.csv'
              : b.family === 'Buy-Side DD' || b.family === 'Mega-Case'
                ? 'P&L, ARR and diligence bridge.csv'
                : 'Comparable finance and workload ledger.csv';
  evidenceAvailable[0].title = financeTitle;
  evidenceAvailable[0].source =
    b.family === 'FinOps'
      ? 'FinOps and FP&A · allocation-reconciled ledger'
      : b.family === 'M&A / Carve-Out'
        ? 'Finance and separation lead · standalone bridge'
        : 'CFO · reconciled full-year ledger';
  evidenceAvailable[1].title =
    b.family === 'AI / MLOps'
      ? 'Model quality, latency and inference operations memo'
      : b.family === 'M&A / Carve-Out'
        ? 'Dependency inventory and cutover readiness memo'
        : b.family === 'Sell-Side'
          ? 'Buyer diligence technical evidence memo'
          : 'Production test and limitation memo';
  if (b.family === 'AI / MLOps' || b.issue[0] === 'inference' || b.issue[0] === 'quality') {
    const attempts = Math.max(1, Math.round(b.financial.unitsAfter));
    evidenceAvailable[0].metrics = {
      ...evidenceAvailable[0].metrics!,
      attempts,
      successfulTasks: Math.round(attempts * 0.82),
      retries: Math.round(attempts * 0.18),
      aiVariableCost: Math.round(b.financial.cogsAfter * 0.29),
      humanReviewRate: 0.12,
    };
    evidenceAvailable[0].content = financialCSV(evidenceAvailable[0].metrics);
  }
  if (b.family === 'M&A / Carve-Out') {
    evidenceAvailable[0].metrics = {
      ...evidenceAvailable[0].metrics!,
      allocatedBefore: b.financial.cloudBefore,
      allocatedAfter: b.financial.cloudAfter,
      standaloneBefore: Math.round(b.financial.cloudBefore * 1.18),
      standaloneAfter: Math.round(b.financial.cloudAfter * 1.16),
      tsaMonthly: 60000,
      separationSpend: 600000,
    };
    evidenceAvailable[0].content = financialCSV(evidenceAvailable[0].metrics);
  }
  let s = configure(
    {
      id: b.id,
      title: b.title,
      company: b.company,
      level: b.level,
      industry: profile.industry || 'B2B SaaS',
      companySize,
      engineeringTeamSize,
      category: b.family,
      duration: b.family === 'Mega-Case' ? 180 : b.level <= 2 ? 35 : 70,
      businessBrief: b.brief,
      knownFacts: [
        'The mandate is to investigate before recommending a technology change.',
        'All company records and amounts are synthetic training material.',
      ],
      skillTags: ['discovery', 'tradeoffs', 'finops', 'business-value', 'communication', 'adr'],
      stakeholders: [
        {
          name: 'Alex Morgan',
          role: 'Business sponsor',
          concern: 'Customer outcomes and credibility of the operating plan',
        },
        {
          name: 'Priya Shah',
          role: 'CTO',
          concern: 'Platform feasibility and engineering capacity',
        },
        {
          name: 'Sam Chen',
          role: 'Lead engineer',
          concern: 'Observed behavior, failure modes and practical validation',
        },
        {
          name: 'Jordan Ellis',
          role: 'CFO',
          concern: 'Comparable unit economics and verified cash impact',
        },
      ],
      hiddenFacts,
      evidenceAvailable,
      constraints: [b.team, b.guardrail],
      acceptableArchitecturePatterns: [
        { name: 'Maintain the baseline pending targeted validation', validWhen: b.hypothesis },
        { name: 'Execute a bounded improvement with measured guardrails', validWhen: b.action },
      ],
      redFlags: [
        { id: `${b.id}-flag-1`, topic: b.issue[0], description: b.guardrail },
        {
          id: `${b.id}-flag-2`,
          topic: 'economics',
          description:
            'Do not equate theoretical opportunity, engineering capacity and verified recurring savings.',
        },
      ],
      evaluationCriteria: [
        'Distinguish competing explanations using comparable evidence.',
        'Connect technology to a material business outcome without claiming certainty.',
        'Define an owned, reversible action and a verification method.',
      ],
      financialContext: b.economics,
      architectureContext: b.architecture,
      possibleQuestionTopics: [...new Set(hiddenFacts.map((f) => f.topic))],
    },
    b.family,
    b.stage,
    { awsServices: b.services },
  );
  s.truth!.rootCause = b.root;
  const expectedFindings = [
    {
      id: 'material-finding',
      finding: b.root,
      evidenceIds: [`${b.id}-finance`, `${b.id}-technical`],
      keywords: [
        ...(terms[b.issue[0]] || [b.issue[0]]).slice(0, 4),
        'unit',
        'uncertain',
        'validation',
      ],
    },
  ];
  if (b.level >= 2)
    expectedFindings.push({
      id: 'operational-finding',
      finding: `The ${b.issue[0]} signal has an operational consequence that needs an owner and a measurable guardrail.`,
      evidenceIds: [`${b.id}-technical`, `${b.id}-operational`],
      keywords: [...(terms[b.issue[0]] || [b.issue[0]]), 'owner', 'guardrail', 'measure'],
    });
  if (b.level >= 3)
    expectedFindings.push({
      id: 'materiality-finding',
      finding: `The decision has a materiality and timing question: cost-to-fix, customer exposure and value realization must be separated.`,
      evidenceIds: [
        `${b.id}-finance`,
        `${b.id}-commercial`,
        ...(b.level >= 4 ? [`${b.id}-contract`] : []),
      ],
      keywords: ['materiality', 'cost-to-fix', 'timing', 'value', 'cash'],
    });
  if (b.family === 'Mega-Case')
    expectedFindings.push({
      id: 'ic-downside-finding',
      finding:
        'The investment or operating recommendation remains conditional under a downside case until the staged workstream evidence is reconciled.',
      evidenceIds: [`${b.id}-finance`, `${b.id}-technical`, `${b.id}-commercial`],
      keywords: ['downside', 'conditional', 'thesis', 'uncertain', 'evidence'],
    });
  s.truth!.expectedFindings = expectedFindings;
  s.truth!.debrief = `What mattered: ${b.root} What did not: the headline alone. Best evidence: the finance and engineering records, with partial commercial and contract context where available. ${b.action} ${b.guardrail} This remains a synthetic, conditional conclusion that should change when the stated validation result changes.`;
  if (b.contradiction)
    s.truth!.contradictions.push({
      id: `${b.id}-contradiction`,
      claim: b.contradiction[0],
      counterEvidenceId: `${b.id}-technical`,
      resolution: b.contradiction[1],
    });
  if (b.family === 'Mega-Case') {
    s.lab!.chapters = chapterPlan.map(([title, task], i) => ({
      id: `day-${i + 1}`,
      title: `Day ${i + 1} · ${title}`,
      task,
    }));
    s.evidenceAvailable[1].chapter = 3;
    s.evidenceAvailable.push({
      id: `${b.id}-response`,
      topic: 'management',
      keywords: ['management response', 'pushback', 'reconcile'],
      title: 'Management response to preliminary concerns',
      status: 'available',
      chapter: 8,
      requires: [`${b.id}-technical`],
      content: `Management agrees the supplied measurement is real but disputes extrapolating it to all workloads. ${b.team} Provide a phased plan and state what would change your conclusion.`,
      source: 'Management response meeting',
      factIds: [],
    });
  }
  return s;
}

const briefs: CaseBrief[] = [
  {
    id: 'aws-growth-55',
    title: 'AWS spend rose 55%. Is that bad?',
    company: 'Northstar Metrics',
    level: 1,
    family: 'FinOps',
    stage: 'None',
    brief:
      'Our AWS bill increased 55%. The CFO says cloud is destroying Gross Margin, while the CTO says the platform is serving more customers. Help us decide what to investigate before cutting capacity.',
    business:
      'Revenue rose from $12M to $20M. Management wants to know whether growth is becoming cheaper to serve.',
    architecture:
      'ECS workers process transactions, RDS stores results, and S3 retains source files. No platform migration is approved.',
    issue: [
      'architecture',
      'The workload definition is unchanged. p95 latency remains 280ms and the error rate 0.2%; no evidence currently supports a capacity cut.',
    ],
    economics:
      'Annual AWS spend rose from $3M to $4.65M while completed transactions doubled from 100M to 200M. Total COGS rose from $4.8M to $7M. Compare unit costs and Gross Margin before judging efficiency.',
    team: 'Two of twelve engineers can support a two-week measurement exercise.',
    document:
      'Comparable workload: prior/current p95 280/280ms; errors 0.2%/0.2%; no material incident. Sample excludes a planned new analytics feature, so do not extrapolate its cost.',
    financial: finance(3e6, 4.65e6, 100e6, 200e6, 12e6, 20e6, 4.8e6, 7e6),
    root: 'In this variant, spend rises but cost per transaction falls 22.5% and Gross Margin improves from 60% to 65%. The CFO’s initial diagnosis is not supported by this baseline.',
    hypothesis: 'Higher absolute spend could indicate waste, greater useful volume, or both.',
    action:
      'Reconcile workload mix and monitor cost per completed transaction before considering a pilot reduction.',
    guardrail: 'Protect p95 latency and error rate; future workloads require their own forecast.',
    services: ['ECS', 'RDS', 'S3', 'Cost Explorer'],
  },
  {
    id: 'dd-growth-claim',
    title: 'Can the platform support the deal plan?',
    company: 'Atlas Workflow',
    level: 1,
    family: 'Buy-Side DD',
    stage: 'Screening',
    brief:
      'The deal team’s plan assumes rapid customer growth. Management says autoscaling will handle it. You have been asked to identify what evidence would make that claim credible.',
    business:
      'The plan assumes threefold transaction volume over two years, without a matching increase in engineering cost.',
    architecture:
      'EC2 Auto Scaling handles web traffic; all writes use one RDS writer and a third-party identity API.',
    issue: [
      'architecture',
      'The only load test reached 1.3× current peak. Database connections reached 92%; the identity provider quota was not exercised.',
    ],
    economics:
      'A compute budget is included in the plan, but no database remediation or external quota increase is funded.',
    team: 'One platform engineer maintains capacity plans; the database specialist is a contractor.',
    document:
      'Load test: 1.3× peak, RDS connections 92%, web CPU 38%; test users bypassed identity verification. No 3× workload result exists.',
    financial: finance(1e6, 1.2e6, 30e6, 42e6, 8e6, 10e6, 3.2e6, 3.8e6),
    root: 'Autoscaling compute does not establish end-to-end capacity. The growth claim remains unvalidated, rather than proven false.',
    hypothesis: 'Management may be right, but the present test is incomplete.',
    action: 'Request a representative end-to-end test including the writer and partner quota.',
    guardrail: 'Do not label a scaling claim high confidence without representative evidence.',
    services: ['EC2', 'Auto Scaling', 'RDS', 'Service Quotas'],
    contradiction: [
      'The platform supports 3× growth.',
      'The measured workload reached only 1.3× and excluded a critical dependency.',
    ],
  },
  {
    id: 'dd-dr-proof',
    title: 'The backup is green. Is the business recoverable?',
    company: 'Pillar Billing',
    level: 2,
    family: 'Buy-Side DD',
    stage: 'Initial DD',
    brief:
      'Management presents green backup dashboards during diligence. The buyer asks whether billing would actually resume after a serious outage.',
    business:
      'Enterprise billing closes monthly; losing acknowledged billing entries would require reconciliation with customers.',
    architecture: 'RDS backups run nightly; secrets and build artifacts remain in the same region.',
    issue: [
      'recovery',
      'No end-to-end restore has been performed. The stated four-hour RTO excludes secret recovery and partner credentials.',
    ],
    economics:
      'A proposed $120,000 recovery program is one-time cash spend, not recurring cloud savings.',
    team: 'The lead engineer alone knows the restore procedure; two colleagues can join a rehearsal.',
    document:
      'Backup jobs successful 30/30 days. Restore report: unavailable. Runbook has no artifact rebuild, credential recovery, reconciliation or failback steps.',
    financial: finance(8e5, 9e5, 20e6, 24e6, 7e6, 8e6, 2.8e6, 3.1e6),
    root: 'Backups exist, but business recovery and key-person continuity remain unverified.',
    hypothesis:
      'Green backups may be reliable inputs to a recovery process that has not been tested.',
    action:
      'Scope a restore rehearsal, cost the missing dependencies and assign two trained owners.',
    guardrail: 'Do not count remediation spend twice or claim the RTO has been met.',
    services: ['RDS', 'AWS Backup', 'Secrets Manager'],
  },
  {
    id: 'dd-ai-margin',
    title: 'The AI roadmap meets the margin forecast',
    company: 'Lumen Assist',
    level: 3,
    family: 'Buy-Side DD',
    stage: 'Confirmatory DD',
    brief:
      'The target’s plan promises more AI usage and a rising Gross Margin. The deal team wants to understand whether those assumptions can hold together.',
    business:
      'Management forecasts an AI attach-rate increase from 20% to 60% of customers while pricing remains fixed.',
    architecture: 'Every task uses a large model; retries re-send full document context.',
    issue: [
      'inference',
      'Successful tasks average 1.8 attempts. A reported cost per call omits retries and human correction.',
    ],
    economics:
      'Current AI costs are $1.4M annually; finance forecasts only 20% cost growth while usage triples. No routing benchmark supports this forecast.',
    team: 'Three ML engineers can evaluate routing, but training a new foundation model is out of scope.',
    document:
      'Synthetic inference sample: 10,000 successful tasks, 18,000 API calls, 1,200 human corrections; invoice $9,000 plus review cost $3,600. Cost/successful task $1.26, not $0.50/call.',
    financial: finance(1.8e6, 2.2e6, 40e6, 60e6, 15e6, 21e6, 6e6, 9e6),
    root: 'The forecast omits retries, human review and usage mix; AI contribution margin needs a task-level sensitivity.',
    hypothesis:
      'Routing may improve economics, but a smaller model can increase retries or correction cost.',
    action: 'Benchmark accepted outcomes, review effort and tail latency across task types.',
    guardrail: 'Do not substitute cost per token for cost per successful outcome.',
    services: ['Bedrock', 'S3', 'CloudWatch'],
  },
  {
    id: 'dd-sla-reconcile',
    title: 'Two versions of uptime',
    company: 'Harbor API',
    level: 4,
    family: 'Buy-Side DD',
    stage: 'Confirmatory DD',
    brief:
      'The management deck reports 99.99% uptime. Enterprise customers mention repeated workflow delays. Determine whether this discrepancy is material to the growth plan.',
    business:
      'Four enterprise customers account for 45% of ARR and seek workflow completion guarantees at renewal.',
    architecture: 'An HTTP API accepts jobs into SQS; workers call partner systems.',
    issue: [
      'recovery',
      'HTTP availability was 99.99%, but end-to-end completion availability was 99.82%; definitions differ rather than necessarily proving deception.',
    ],
    economics:
      'Potential SLA credits are $180,000 annually under proposed contracts; the larger retention effect is uncertain.',
    team: 'SRE owns API uptime but no team owns completed-workflow SLOs.',
    document:
      'Management uptime definition: successful HTTP response. Incident definition: order delivered within five minutes. January workflow downtime 78 minutes; API downtime 4 minutes. Partner throttling explains much of the gap.',
    financial: finance(2e6, 2.6e6, 50e6, 70e6, 18e6, 22e6, 6.3e6, 8.1e6),
    root: 'Conflicting service definitions must be reconciled before underwriting enterprise commitments or treating the gap as fraud.',
    hypothesis:
      'The reported infrastructure metric can be correct while customer outcomes still fail.',
    action:
      'Define customer SLIs, quantify contract exposure, assign an end-to-end owner and validate partner capacity.',
    guardrail:
      'Separate known credits from speculative churn and avoid adding both as certain loss.',
    services: ['SQS', 'CloudWatch', 'API Gateway'],
    contradiction: [
      'The deck claims 99.99% uptime.',
      'The incident log measures a different service boundary at 99.82%.',
    ],
  },
  {
    id: 'dd-vendor-transfer',
    title: 'Does the discount survive the acquisition?',
    company: 'VectorDesk',
    level: 4,
    family: 'Buy-Side DD',
    stage: 'Signing / Closing',
    brief:
      'The target’s cloud cost forecast relies on the parent company’s discounts and licenses. The deal team asks which costs will remain after closing.',
    business: 'The buyer is acquiring a subsidiary, not the parent procurement agreement.',
    architecture:
      'Workloads run in shared AWS Organizations accounts with parent identity and monitoring services.',
    issue: [
      'contract',
      'The supplied contract summary does not confirm transfer of the shared discount or third-party database license. Procurement and counsel must verify terms.',
    ],
    economics:
      'Current allocated AWS cost is $2.1M. Undiscounted equivalent usage is $2.8M; standalone support and security add a modeled $250,000 annually.',
    team: 'A separation lead has six months; identity and billing owners belong to the seller.',
    document:
      'Synthetic allocation: $2.1M charged to target, $700k parent discount, $250k shared support omitted. Portability and replacement pricing remain unconfirmed assumptions.',
    financial: finance(1.8e6, 2.1e6, 40e6, 55e6, 16e6, 20e6, 6e6, 7e6),
    root: 'Allocated cost is not standalone cost. The normalized run-rate depends on contract portability and replacement shared services.',
    hypothesis:
      'Some discounts may remain; treating all as either lost or transferable is premature.',
    action:
      'Build a range with procurement-confirmed contracts, separation costs and accountable owners.',
    guardrail: 'Do not present contract interpretation as a technical certainty.',
    services: ['AWS Organizations', 'IAM Identity Center', 'Savings Plans'],
  },
  {
    id: 'vc-400k',
    title: '$400,000 found. How much value is real?',
    company: 'Cedar Software',
    level: 1,
    family: 'Value Creation',
    stage: '100-Day Plan',
    brief:
      'A recently acquired SaaS business spends $3M a year on AWS. A tool identifies $400,000 of possible savings. The Operating Partner asks what should enter the Value Creation Plan.',
    business:
      'The first 100 days should establish a measured margin improvement without harming customers.',
    architecture:
      'EC2 services and RDS are sized for an old forecast. Recommendations combine compute and database changes.',
    issue: [
      'architecture',
      'Only $160,000 of the recommendations has been load-tested; none has yet been implemented in production.',
    ],
    economics:
      'Theoretical recurring savings are $400,000; implementation is estimated at $60,000 with $20,000/year extra monitoring. Current revenue $15M, total COGS $6M.',
    team: 'Platform lead owns the pilot; Finance must validate the post-change run-rate.',
    document:
      'Opportunity register: $400k identified; $160k technically validated; $0 implemented; $0 realized; $0 verified. Pilot excludes peak month. Implementation estimate $60k; recurring monitoring offset $20k.',
    financial: finance(2.7e6, 3e6, 80e6, 100e6, 12e6, 15e6, 5.4e6, 6e6),
    root: 'An identified opportunity is not verified EBITDA. Gross Margin and EBITDA views share the same dollars, while implementation affects cash timing.',
    hypothesis:
      'The eventual saving may be smaller after growth, offsets and performance guardrails.',
    action:
      'Stage a reversible pilot, record the benefit once and verify Finance’s comparable run-rate.',
    guardrail: 'Do not label $400k as realized or multiply it into an exact enterprise value.',
    services: ['EC2', 'RDS', 'Compute Optimizer'],
  },
  {
    id: 'vc-kubernetes-capacity',
    title: 'Unused requests, unavailable savings',
    company: 'Oak Platform',
    level: 2,
    family: 'Value Creation',
    stage: '100-Day Plan',
    brief:
      'An EKS report shows requests three times actual usage. Finance expects an immediate reduction in the AWS invoice. Engineering warns that most nodes are committed.',
    business: 'The plan targets margin expansion and enough capacity for two new customers.',
    architecture: 'EKS pods reserve excess memory and CPU on committed nodes.',
    issue: [
      'architecture',
      'Lower requests can free cluster capacity, but the node commitment remains payable for nine months.',
    ],
    economics:
      'A $700,000 annualized capacity opportunity is not an immediate cash saving; $120,000 of uncommitted burst spend may be reduced after testing.',
    team: 'Platform team can pilot one service each week; service owners set latency and availability limits.',
    document:
      'EKS observed CPU 30% of requested; memory p99 75% of requested. Committed node floor $1.1M/year through month 9; burst nodes $120k/year. Reducing all requests by 67% would violate memory headroom.',
    financial: finance(1.5e6, 1.8e6, 60e6, 90e6, 12e6, 16e6, 4.8e6, 6.2e6),
    root: 'Capacity recovery, avoided future growth spend and cash savings have distinct timing and economics.',
    hypothesis: 'CPU oversizing may coexist with appropriate memory requests.',
    action:
      'Tune per-resource requests, validate customer guardrails and align node changes with commitment expiry.',
    guardrail: 'Do not book committed idle capacity as current-year cash savings.',
    services: ['EKS', 'EC2', 'Savings Plans'],
  },
  {
    id: 'vc-delivery-capacity',
    title: 'Faster releases without imaginary headcount savings',
    company: 'Reed Services',
    level: 3,
    family: 'Value Creation',
    stage: 'Hold Period',
    brief:
      'Developers spend a third of their time on manual deployment work. The CEO wants automation savings included in EBITDA. Product wants to use the time for the roadmap.',
    business:
      'The roadmap has two delayed customer commitments; no headcount reduction is approved.',
    architecture:
      'Manual deployments, configuration drift and environment setup consume engineering time.',
    issue: [
      'team',
      'Time diaries estimate 3,000 hours/year of recoverable work. The same engineers remain employed and will build product features.',
    ],
    economics:
      'The automation program costs $150,000 once and $30,000/year. Released capacity has value but does not automatically lower payroll.',
    team: 'Engineering manager owns a two-team pilot and tracks lead time, failure rate and recovered hours.',
    document:
      'Synthetic diary: 3,000 annual hours on releases; payroll budget unchanged. Customer roadmap benefit unquantified. Deployment failure baseline 14%; lead time 8 days.',
    financial: finance(1e6, 1.3e6, 20e6, 28e6, 10e6, 13e6, 4e6, 4.8e6),
    root: 'Automation initially recovers capacity; cash value requires a distinct, evidenced headcount avoidance or commercial outcome.',
    hypothesis:
      'Faster delivery may help growth, but the same hours cannot be booked twice as payroll savings and new product revenue.',
    action:
      'Measure throughput and failure reduction, classify capacity separately and track any later verified avoidance.',
    guardrail:
      'Do not transform engineering hours into immediate EBITDA without an actual budget change.',
    services: ['CodePipeline', 'Terraform', 'CloudFormation'],
  },
  {
    id: 'vc-ai-quality',
    title: 'Cheaper tokens, more expensive answers',
    company: 'Juniper AI',
    level: 4,
    family: 'Value Creation',
    stage: '100-Day Plan',
    brief:
      'A model switch reduced the API bill, but support tickets and correction work increased. The Operating Partner wants the true economics of the change.',
    business:
      'The feature is sold as reliable document extraction; customers pay per accepted result.',
    architecture:
      'A lower-cost model replaced the previous one without task-stratified evaluation.',
    issue: [
      'inference',
      'API cost/result fell $0.12 to $0.07; retry rate doubled and human correction cost/result rose $0.03 to $0.11.',
    ],
    economics:
      'For accepted results, total variable cost rose from $0.15 to $0.18. Usage and customer mix are comparable; long-term retention impact remains unknown.',
    team: 'ML lead and support operations jointly own a rollback and evaluation plan.',
    document:
      'Accepted outcomes: old/new sample 50,000 each. API all-attempt cost $6,000/$3,500; human corrections $1,500/$5,500. Total $7,500/$9,000. Latency p95 4s/7s.',
    financial: finance(2e6, 2.3e6, 30e6, 50e6, 18e6, 24e6, 7.2e6, 10.8e6),
    root: 'The model change lowered token costs but worsened cost per accepted outcome and latency.',
    hypothesis: 'Routing may preserve savings on easy tasks while escalating difficult tasks.',
    action:
      'Restore guardrails, segment tasks, benchmark total successful-outcome cost and stage the next rollout.',
    guardrail:
      'Keep quality, retries and review labor in the same contribution-margin calculation.',
    services: ['Bedrock', 'CloudWatch', 'S3'],
  },
  {
    id: 'exit-scalability',
    title: 'Prove scalability before buyers ask',
    company: 'Beacon Commerce',
    level: 4,
    family: 'Sell-Side',
    stage: 'Exit Readiness',
    brief:
      'The company plans a sale next year. Management wants to say the platform is ready for growth, but buyers will ask for evidence beyond an architecture diagram.',
    business: 'The forecast doubles enterprise volume and promises a higher service tier.',
    architecture: 'RDS handles a concentrated write workload; web instances autoscale.',
    issue: [
      'architecture',
      'Last year’s load test used a read-heavy mix and did not reproduce enterprise writes.',
    ],
    economics:
      'The proposed remediation and testing program is $450,000–$700,000 once; no approved case proves all work is necessary.',
    team: 'CTO owns evidence readiness; two engineers and a database specialist can run the test program.',
    document:
      'Last load test: 80% reads versus forecast 65% writes; dataset one-fifth production size. Queue lag and partner quotas excluded. No rollback rehearsal documented.',
    financial: finance(2e6, 2.5e6, 60e6, 90e6, 20e6, 27e6, 7e6, 9.5e6),
    root: 'The seller needs representative proof and honest remediation disclosure, not an unqualified capacity claim.',
    hypothesis: 'Existing capacity might suffice, but the available test does not establish it.',
    action:
      'Build a signed evidence index, run representative load tests and report assumptions and unresolved constraints.',
    guardrail: 'Never hide a known limitation or present planned remediation as completed.',
    services: ['RDS', 'Auto Scaling', 'SQS'],
  },
  {
    id: 'exit-normalization',
    title: 'A clean run-rate with a messy history',
    company: 'Maple Reports',
    level: 3,
    family: 'Sell-Side',
    stage: 'Sell-Side DD',
    brief:
      'Finance wants to present a normalized cloud cost after a migration. A buyer will need to reconcile the claimed savings with invoices and duplicated environments.',
    business: 'Exit materials should explain sustainable costs and distinguish temporary overlap.',
    architecture:
      'The legacy and new stacks ran in parallel for four months; the old database still supports two customers.',
    issue: [
      'contract',
      'A prepaid legacy license has six months left. Decommissioning depends on customer migrations that are not scheduled.',
    ],
    economics:
      'Management excludes all $600,000 legacy costs as one-time. Only $350,000 was temporary migration overlap; remaining support persists until the two customers move.',
    team: 'Customer success controls migration dates; engineering cannot unilaterally close the old stack.',
    document:
      'Synthetic ledger: $350k overlap, $150k residual hosting/support, $100k prepaid license. Two customer migration approvals outstanding. Invoices reconcile to ledger.',
    financial: finance(2.6e6, 3e6, 50e6, 62e6, 17e6, 21e6, 6.8e6, 8.1e6),
    root: 'Normalization must separate temporary overlap, unavoidable residual run-rate and cash prepayments.',
    hypothesis:
      'Part of management’s adjustment is justified; rejecting or accepting the full amount would both be wrong.',
    action:
      'Publish a transparent reconciliation and an owned customer-dependent decommission plan.',
    guardrail:
      'Do not exclude future recurring costs merely because management intends to remove them.',
    services: ['RDS', 'EC2', 'Cost Explorer'],
  },
  {
    id: 'carveout-day-one',
    title: 'Standalone on Day 1',
    company: 'Cobalt Systems',
    level: 4,
    family: 'M&A / Carve-Out',
    stage: 'Day 1',
    brief:
      'A division must leave the seller’s shared cloud environment. The transition agreement expires in six months, and the buyer needs a credible standalone cost and continuity plan.',
    business: 'Customer access must continue through identity and network separation.',
    architecture:
      'Shared AWS Organizations, identity provider, central logging, transit gateway and CI runners serve the division.',
    issue: [
      'security',
      'Service credentials depend on parent identity; DNS ownership and KMS key access are not inventoried.',
    ],
    economics:
      'Allocated run-rate $1.6M excludes $400k shared services and $250k discount benefit. A $600k separation program may overlap a transition fee.',
    team: 'Separation lead needs named seller counterparts and a tested access transition before cutover.',
    document:
      'Dependency inventory: 14 parent roles, 7 shared keys, 3 DNS zones, 2 transit routes. Standalone replacements lack signed owners. TSA fee $60k/month until exit.',
    financial: finance(1.4e6, 1.6e6, 35e6, 42e6, 12e6, 14e6, 4.5e6, 5.1e6),
    root: 'Identity and encryption dependencies create Day 1 risk, while allocated costs understate standalone economics.',
    hypothesis:
      'A staged transition can reduce risk, but an extended TSA changes cash costs and timing.',
    action:
      'Inventory dependencies, assign ownership, rehearse cutover and model base/downside TSA duration.',
    guardrail:
      'Include stranded cost, replacements and overlap without assuming all commitments transfer.',
    services: ['AWS Organizations', 'IAM', 'KMS', 'Transit Gateway', 'Route 53'],
  },
  {
    id: 'addon-synergy',
    title: 'The synergy that depends on two migrations',
    company: 'Summit Group',
    level: 3,
    family: 'M&A / Carve-Out',
    stage: 'Add-On Acquisition',
    brief:
      'The acquisition case assumes a shared platform will save $900,000 a year. Engineering finds different customer models and licenses. Determine what can safely enter the integration plan.',
    business: 'The first year must preserve renewals and avoid interrupting either billing system.',
    architecture:
      'Two SaaS products use different tenant models, billing providers and identity policies.',
    issue: [
      'contract',
      'One license is non-cancellable for eighteen months. Identity migration requires enterprise customer approval.',
    ],
    economics:
      'The $900k target combines $500k hosting and $400k team capacity. Integration costs $700k once; payroll does not decline.',
    team: 'One integration manager coordinates both engineering teams and customer success.',
    document:
      'Synergy register: hosting $500k requires migration; capacity $400k is redeployment, not payroll reduction; license commitment $180k/year remains 18 months. Five enterprise identity approvals are pending.',
    financial: finance(2.1e6, 2.4e6, 70e6, 100e6, 19e6, 26e6, 7.6e6, 9.9e6),
    root: 'Hosting savings are conditional and delayed; recovered team capacity is not an additional cash synergy.',
    hypothesis:
      'Read-only integration may deliver customer value before costly platform consolidation.',
    action:
      'Sequence a limited integration, customer permissions and contract expiry; track separate value categories.',
    guardrail: 'Do not book the full synergy in year one or double-count engineer capacity.',
    services: ['IAM Identity Center', 'RDS', 'EventBridge'],
  },
  {
    id: 'mega-ai-acquisition',
    title: 'Ten days inside an AI SaaS acquisition',
    company: 'Aster Intelligence',
    level: 5,
    family: 'Mega-Case',
    stage: 'IC',
    brief:
      'An AI SaaS target reports $32M ARR, 48% growth and 67% Gross Margin. Management targets 78% and claims 5× platform capacity. Lead the technology workstream and defend what the evidence supports.',
    business:
      'The thesis depends on enterprise adoption, sustainable AI margins and credible growth capacity.',
    architecture:
      'EKS, RDS, S3 and an external model API support document workflows; retries repeat full context.',
    issue: [
      'architecture',
      'A 2.4× load test saturated database connections. EKS requests exceed CPU use by 3×, but memory headroom is much narrower. DR was never exercised end to end.',
    ],
    economics:
      'AWS spend is $5.8M and AI vendor costs $3.1M. Total COGS $10.56M yields 67% Gross Margin on $32M recognized revenue in this fictional simplified ledger. Retry rate is 18%; the margin target assumes savings not yet validated.',
    team: 'Four platform and three ML engineers share operations; two enterprise commitments already consume the quarter’s roadmap.',
    document:
      'Load test: failure at 2.4×, connection pool saturated. Model calls: 18% retries, no routing eval. EKS CPU requests/usage 3×, memory p99/requests 80%. DR runbook untested. Management 5× claim extrapolates web CPU only.',
    financial: finance(4.1e6, 5.8e6, 100e6, 165e6, 21.6e6, 32e6, 7.56e6, 10.56e6),
    root: 'Unit cloud economics can improve while capacity, AI quality economics and recovery remain material thesis risks. The 78% margin target requires separate evidence and execution assumptions.',
    hypothesis:
      'Some FinOps value is plausible, but it does not validate the database growth claim or the full margin expansion.',
    action:
      'Prioritize a bounded FinOps pilot, representative data-layer test, AI evaluation and recovery rehearsal with owners and cost ranges.',
    guardrail:
      'Do not let a strong efficiency finding offset an unresolved customer or growth-critical risk.',
    services: ['EKS', 'RDS', 'S3', 'Bedrock', 'CloudWatch'],
    contradiction: [
      'The platform supports 5× growth.',
      'The representative test failed at 2.4×; the 5× claim measures web CPU alone.',
    ],
  },
  {
    id: 'mega-margin-program',
    title: 'From diligence findings to verified value',
    company: 'Evergreen SaaS',
    level: 4,
    family: 'Mega-Case',
    stage: '100-Day Plan',
    brief:
      'After acquisition, the board expects a margin program without delaying enterprise launches. Lead the first 100 days, test diligence assumptions, and explain what value has actually been realized.',
    business:
      'The board expects a $1.2M annual benefit while enterprise growth requires database and reliability investment.',
    architecture:
      'Mixed EKS and EC2 services depend on a single RDS writer; delivery remains partly manual.',
    issue: [
      'architecture',
      'Only $350k of the $1.2M opportunity is validated. Another $450k is committed capacity and $400k is estimated engineering time.',
    ],
    economics:
      'Implementation costs $300k once; monitoring and recovery add $100k/year. The proposed plan assumes all benefits begin on Day 1, which is not realistic.',
    team: 'CTO, Finance and an Operating Partner jointly own gates at Day 30, Day 100, month 6 and year 1.',
    document:
      'Diligence register: $350k validated reversible savings; $450k capacity committed until month 8; $400k redeployed engineer time. No verified Finance sign-off exists. Recovery investment competes for the same platform team.',
    financial: finance(3e6, 3.5e6, 100e6, 140e6, 22e6, 28e6, 8.8e6, 10.5e6),
    root: 'The board’s total mixes cash savings, deferred avoidance and capacity. A credible plan needs sequencing, offsets, ownership and Finance verification.',
    hypothesis:
      'A smaller verified first-year benefit can be more credible than a large unexecutable headline.',
    action:
      'Build initiatives with unique benefit keys, baseline, owner, timing, guardrails and realized evidence; revisit the plan at each governance gate.',
    guardrail:
      'Do not move an initiative to verified without measured outcomes and Finance sign-off.',
    services: ['EKS', 'EC2', 'RDS', 'Cost Explorer'],
  },
];

export function consultingCatalog(original: Scenario[]): Scenario[] {
  const upgrades: Record<string, [Family, Stage]> = {
    'lost-sales': ['Cloud', 'None'],
    'weekend-outage': ['Cloud', 'None'],
    'developers-overloaded': ['Cloud', 'None'],
    'deployment-dread': ['Cloud', 'None'],
    'morning-slowdown': ['Cloud', 'None'],
    'archive-attic': ['FinOps', 'None'],
    'quiet-servers': ['FinOps', 'None'],
    'invisible-transfer': ['FinOps', 'None'],
    'capacity-contract': ['FinOps', 'None'],
    'support-assistant': ['AI / MLOps', 'None'],
    'inference-margin': ['AI / MLOps', 'None'],
    'model-change': ['AI / MLOps', 'None'],
  };
  const migrated = original.map((s) => (upgrades[s.id] ? configure(s, ...upgrades[s.id]) : s));
  const authored = [
    ...briefs.map(author),
    ...expansionSeeds.map((seed, index) => author(expandedBrief(seed, index))),
  ];
  const first = authored[0];
  const waste = structuredClone(first);
  waste.evidenceAvailable[0].metrics = finance(3e6, 4.65e6, 100e6, 110e6, 12e6, 13e6, 4.8e6, 6.5e6);
  waste.evidenceAvailable[0].content = financialCSV(waste.evidenceAvailable[0].metrics);
  waste.hiddenFacts.find((f) => f.topic === 'economics')!.text =
    'Spend rose 55%, completed transactions only 10%, and total COGS reached $6.5M on $13M revenue. The workload mix is comparable.';
  waste.hiddenFacts.find((f) => f.topic === 'business')!.text =
    'Revenue rose from $12M to $13M. Management wants to know why useful volume is growing much slower than cloud spend.';
  waste.evidenceAvailable[3].content =
    'Management expects higher usage but the actual ledger reports only 10% transaction growth. Validate the current baseline before extrapolating.';
  waste.hiddenFacts.find((f) => f.topic === 'architecture')!.text =
    'An abandoned analytics environment still runs continuously. p95 and customer error rates remain stable. Validate removal dependencies before shutting it down.';
  waste.hiddenFacts.find((f) => f.id === 'aws-growth-55-signal')!.text =
    'The resource inventory identifies abandoned analytics capacity. Its owner and removal dependencies are not yet confirmed; stable latency does not prove shutdown is safe.';
  waste.evidenceAvailable[1].content =
    'Comparable workload and stable latency. Resource inventory identifies an abandoned analytics environment; ownership and deletion dependencies are not verified.';
  waste.truth!.rootCause =
    'In this variant, spend outgrows useful volume and unit cost rises about 40.9%. Gross Margin falls from 60% to 50%. The CFO has a valid concern; removal still requires an owner and validation.';
  waste.truth!.debrief =
    waste.truth!.rootCause +
    ' Compare equivalent units, validate ownership, and separate identified savings from verified value.';
  waste.truth!.expectedFindings[0].finding = waste.truth!.rootCause;
  first.variants = [first, waste].map((s, i) => ({
    id: i ? 'unproductive-capacity' : 'healthy-growth',
    hiddenFacts: s.hiddenFacts,
    evidenceAvailable: s.evidenceAvailable,
    truth: s.truth!,
  }));
  return [...authored, ...migrated];
}
