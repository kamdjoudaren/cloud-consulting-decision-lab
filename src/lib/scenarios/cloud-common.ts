import type { SeedInput } from './seeds';

// Synthetic client records. Service choices are conditional; no live price quotes.
const cases = [
  {
    id: 'cloud-ecs-or-ec2',
    title: 'ECS or EC2 for an existing web application?',
    category: 'Compute',
    level: 1,
    skills: ['compute', 'containers'],
    company: 'Marché Boréal',
    industry: 'Retail',
    engineers: 4,
    brief:
      'A local retailer needs a reliable home for its web application before a marketing campaign. The manager asks whether ECS or EC2 is the right move.',
    current:
      'Two Linux VMs run a Java API, scheduled exports and local file uploads. Releases require SSH.',
    signal:
      'The API can run in a container, but uploaded files disappear when a VM is replaced; a vendor agent requires host access.',
    observation:
      'Inventory confirms the agent is used only by the export job. Separating uploads and that job changes the hosting constraints.',
    limits:
      'Four engineers; one infrastructure owner; $900/month planning ceiling; campaign in six weeks.',
    options: [
      [
        'ECS on Fargate for the API, with a separate export worker',
        'Uploads are externalized and the host-dependent job is isolated.',
      ],
      [
        'EC2 Auto Scaling, optionally running ECS on EC2',
        'Host-level requirements remain essential and the team can patch and replace instances.',
      ],
    ],
    experiment:
      'Replace an instance during uploads, measure request errors, and compare release and patching effort.',
  },
  {
    id: 'cloud-ecs-fargate-capacity',
    title: 'ECS on Fargate or ECS on EC2?',
    category: 'Containers',
    level: 2,
    skills: ['containers', 'compute'],
    company: 'Quartz Software',
    industry: 'B2B SaaS',
    engineers: 2,
    brief:
      'A software vendor already uses ECS and needs to choose how to run its containers as the service grows.',
    current: 'Twelve container tasks run continuously; demand doubles for two hours each weekday.',
    signal:
      'CPU is steady but a nightly worker needs a specialized host configuration; the API does not.',
    observation:
      'The platform owner spends six hours a month patching hosts. Capacity reports combine the API and specialized worker.',
    limits:
      'Two platform engineers; maintain 99.9% service availability; estimate a full month including idle capacity.',
    options: [
      [
        'Fargate for standard tasks and separate host-dependent capacity',
        'The isolated worker can be operated independently of the application tier.',
      ],
      [
        'ECS on EC2 with managed scaling',
        'Host requirements or measured utilization justify maintaining the instance fleet.',
      ],
    ],
    experiment:
      'Benchmark both workload classes, drain a host and compare full monthly operating costs.',
  },
  {
    id: 'cloud-lambda-or-ecs',
    title: 'Lambda or ECS for document processing?',
    category: 'Compute',
    level: 2,
    skills: ['compute', 'async'],
    company: 'Assurance Horizon',
    industry: 'Insurance',
    engineers: 3,
    brief:
      'An insurance broker wants customers to upload documents and receive an extraction result without waiting on a web request.',
    current:
      'PDF processing takes 30 seconds normally, but scanned bundles take 24 minutes; uploads arrive in bursts.',
    signal:
      'The selected standard Lambda execution model has a 15-minute invocation limit, below the longest bundle duration. The median alone hides this constraint; changing execution models requires a separate compatibility review.',
    observation:
      'Jobs are restartable only at document boundaries. A progress record exists but retries currently create duplicate outputs.',
    limits:
      'Results within an hour; durable uploads; peak 400 bundles/hour; one operations engineer.',
    options: [
      [
        'Queue-triggered ECS workers',
        'Long tasks use checkpointing, bounded concurrency and idempotent output writes.',
      ],
      [
        'Lambda for short tasks with long bundles routed to another worker',
        'Routing is measurable and splitting the workload does not create fragile coordination.',
      ],
    ],
    experiment:
      'Replay the longest bundles, interrupt a worker and prove completion without duplicate outputs.',
  },
  {
    id: 'cloud-ec2-auto-scaling',
    title: 'More EC2 instances or a larger instance?',
    category: 'Scalability',
    level: 1,
    skills: ['scalability', 'compute'],
    company: 'Billetterie Rive',
    industry: 'Ticketing',
    engineers: 4,
    brief:
      'A ticketing site slows down when a popular event goes on sale. The founder suggests buying a larger server.',
    current: 'One EC2 instance handles web traffic and keeps login sessions on local disk.',
    signal:
      'CPU reaches 90%, but adding a second instance logs users out because sessions are not shared.',
    observation:
      'Traffic rises from 40 to 600 requests/second in two minutes; startup takes four minutes.',
    limits:
      'Checkout p95 under 800 ms; no lost carts; predictable launch schedule; $600/month extra budget.',
    options: [
      [
        'Scale out behind a load balancer',
        'Sessions and uploads are externalized and capacity is ready before the surge.',
      ],
      [
        'Scale up as a bounded interim step',
        'Measured headroom covers the event and the single-instance failure risk is accepted.',
      ],
    ],
    experiment:
      'Load-test the event ramp, terminate an instance and verify cart and session continuity.',
  },
  {
    id: 'cloud-static-site-hosting',
    title: 'S3 and CloudFront or an application server?',
    category: 'Web delivery',
    level: 1,
    skills: ['storage', 'networking'],
    company: 'Fondation Élan',
    industry: 'Nonprofit',
    engineers: 2,
    brief:
      'A nonprofit needs a fast public information site with occasional event registration and a very small support budget.',
    current:
      'Most pages are static; volunteers update content weekly. Registration submits to an existing external service.',
    signal:
      'The proposed CMS server is needed for editing, not serving dynamic content to visitors.',
    observation:
      'A proof of concept exports static pages; preview authentication and publishing permissions are not yet configured.',
    limits:
      'Two volunteer maintainers; $100/month target; accessible pages; updates published in under ten minutes.',
    options: [
      [
        'Static export with S3 and CloudFront',
        'The publishing workflow meets editing and preview requirements securely.',
      ],
      [
        'Managed CMS hosting',
        'Live personalization or editing needs outweigh the maintenance and cost of dynamic hosting.',
      ],
    ],
    experiment:
      'Publish and roll back an update, test registration and verify that unpublished content remains private.',
  },
  {
    id: 'cloud-batch-spot',
    title: 'Spot capacity or On-Demand for batch work?',
    category: 'Compute',
    level: 2,
    skills: ['compute', 'reliability'],
    company: 'Studio Luciole',
    industry: 'Media',
    engineers: 5,
    brief: 'A media company must finish nightly transcoding by 7 a.m. while reducing idle compute.',
    current: 'A queue feeds EC2 workers; individual videos take 10 to 90 minutes.',
    signal:
      'Workers write output only at the end; an interruption loses the entire job and the final hour has no spare capacity.',
    observation:
      'A representative replay with interruptions missed the deadline even though average hourly cost fell.',
    limits:
      'Six-hour batch window; no missing videos; checkpoint implementation can take two weeks.',
    options: [
      [
        'Spot workers with checkpointing and an On-Demand fallback',
        'Checkpoint cost and fallback capacity preserve the completion deadline.',
      ],
      [
        'Scheduled On-Demand worker pool',
        'Predictable completion is worth the higher baseline until interruption tolerance is implemented.',
      ],
    ],
    experiment:
      'Inject interruptions near the deadline and compare completed-job cost, not instance-hour cost.',
  },
  {
    id: 'cloud-eks-or-ecs',
    title: 'EKS or ECS for a growing platform?',
    category: 'Containers',
    level: 3,
    skills: ['containers', 'operations'],
    company: 'Plateforme Atlas',
    industry: 'Software',
    engineers: 2,
    brief:
      'Three product teams want a shared container platform and disagree about adopting Kubernetes.',
    current:
      'Fifteen services need HTTP routing, secrets and rolling releases; a purchased analytics operator supports Kubernetes.',
    signal:
      'Only the analytics product needs the operator. Migrating every service would add cluster upgrades and policy ownership.',
    observation:
      'Two engineers have operated ECS; neither has owned Kubernetes production incidents. The vendor offers a managed analytics service.',
    limits:
      'Three-month delivery deadline; on-call coverage by two engineers; a written exit strategy for the analytics vendor.',
    options: [
      [
        'ECS for applications with managed analytics',
        'The vendor option meets data boundaries and avoids operating a separate cluster.',
      ],
      [
        'EKS for workloads that require Kubernetes',
        'Operator requirements are validated and funded skills, upgrades and incident ownership exist.',
      ],
    ],
    experiment:
      'Deploy one representative service and the operator; rehearse upgrade, rollback and node failure.',
  },
  {
    id: 'cloud-managed-app-platform',
    title: 'Managed application platform or custom infrastructure?',
    category: 'Platform design',
    level: 1,
    skills: ['managed-services', 'compute'],
    company: 'Portail Nova',
    industry: 'Startup',
    engineers: 2,
    brief:
      'A two-person startup must launch a customer portal without spending its entire sprint on infrastructure.',
    current: 'A standard Python web app uses PostgreSQL, sends email and runs a nightly report.',
    signal:
      'The report needs private database access, while the frontend prototype uses public connectivity for convenience.',
    observation: 'The team has CI tests but no patching rota or infrastructure recovery runbook.',
    limits:
      'Two engineers; four-week launch; modest traffic; encrypted customer data; $350/month planning target.',
    options: [
      [
        'Managed application hosting with managed database',
        'Private connectivity, worker execution and backups satisfy the portal requirements.',
      ],
      [
        'EC2 with automated provisioning',
        'A required runtime feature is unsupported by the managed platform and operations are explicitly owned.',
      ],
    ],
    experiment:
      'Deploy, restore data, rotate credentials and roll back a broken release with one engineer.',
  },
  {
    id: 'cloud-rds-or-ec2',
    title: 'RDS PostgreSQL or PostgreSQL on EC2?',
    category: 'Database architecture',
    level: 2,
    skills: ['databases', 'managed-services'],
    company: 'Distribution Laurent',
    industry: 'Distribution',
    engineers: 4,
    brief:
      'A distributor wants to move its order database off an aging office server and asks how much control it needs in the cloud.',
    current:
      'PostgreSQL stores 400 GB; two extensions and a nightly operating-system script support reporting.',
    signal:
      'One extension and the script need compatibility checks; choosing managed hosting does not automatically preserve them.',
    observation:
      'The current restore takes six hours and depends on a single administrator. Most queries use standard SQL.',
    limits: 'RTO two hours; RPO fifteen minutes; database maintenance cannot depend on one person.',
    options: [
      [
        'RDS PostgreSQL',
        'Extension compatibility and reporting replacement are proven, with rehearsed managed recovery.',
      ],
      [
        'PostgreSQL on EC2',
        'Essential host features cannot be replaced and backup, failover and patch ownership are funded.',
      ],
    ],
    experiment:
      'Restore a masked copy, execute extension tests and time a complete recovery with a second engineer.',
  },
  {
    id: 'cloud-aurora-or-rds',
    title: 'Aurora or standard RDS for a SaaS database?',
    category: 'Database architecture',
    level: 3,
    skills: ['databases', 'scalability'],
    company: 'Orbite SaaS',
    industry: 'B2B SaaS',
    engineers: 5,
    brief:
      'A SaaS team expects growth and wants to justify a database platform change before renewing its operating budget.',
    current:
      'RDS PostgreSQL serves 90% reads; dashboards scan large tables on the primary during business hours.',
    signal:
      'Peak latency follows two reporting queries; the team has not tested indexes or read isolation.',
    observation:
      'A masked benchmark with one new index reduces query time from 12 seconds to 300 ms, but write overhead is unmeasured.',
    limits: '99.95% target; predictable monthly spend; migration downtime below twenty minutes.',
    options: [
      [
        'Tune RDS and move suitable reads to a replica',
        'Measured changes meet workload and recovery targets without a platform migration.',
      ],
      [
        'Migrate to Aurora',
        'Representative load and failover tests show enough benefit to justify compatibility and migration work.',
      ],
    ],
    experiment:
      'Compare the same dataset and read/write mix, including failover time, query plans and full cost.',
  },
  {
    id: 'cloud-dynamodb-or-postgres',
    title: 'DynamoDB or PostgreSQL for customer preferences?',
    category: 'Database architecture',
    level: 2,
    skills: ['databases', 'scalability'],
    company: 'Mobile Mistral',
    industry: 'Mobile services',
    engineers: 4,
    brief:
      'A mobile product needs a preference service and is debating whether a relational database is necessary.',
    current:
      'Most reads fetch settings by user ID; support also searches accounts by region and subscription tier.',
    signal:
      'The support query is mandatory, but no one has defined its freshness or access pattern.',
    observation:
      'Only 2% of requests come from support. A separate search view could lag five minutes if product approves it.',
    limits:
      '15,000 preference reads/second at launch events; per-user updates; support search under five minutes old.',
    options: [
      [
        'DynamoDB with designed indexes or a separate support view',
        'Access patterns and conditional updates are explicit and hot keys are tested.',
      ],
      [
        'PostgreSQL with suitable indexing and read scaling',
        'Flexible support queries and transactional relationships justify relational operations.',
      ],
    ],
    experiment:
      'Test skewed user traffic, conditional updates and the support query under the same load.',
  },
  {
    id: 'cloud-rds-multi-az',
    title: 'Multi-AZ or a read replica?',
    category: 'Reliability',
    level: 1,
    skills: ['databases', 'reliability'],
    company: 'Réservations Lagon',
    industry: 'Travel',
    engineers: 3,
    brief:
      'A booking company wants its database to survive a zone failure and also make reports faster.',
    current:
      'One database serves transactions and daily reports; the team proposes adding a replica for both goals.',
    signal:
      'The proposed replica configuration is not a tested automatic failover mechanism. Availability and read scaling are different requirements.',
    observation:
      'Reports tolerate ten-minute lag; new bookings do not. Application retry behavior during failover is unknown.',
    limits:
      'Restore booking writes within ten minutes; reports may be stale; budget for one resilience improvement first.',
    options: [
      [
        'Managed Multi-AZ availability with separate reporting strategy',
        'The selected deployment mode and application reconnect behavior meet the availability goal.',
      ],
      [
        'Read replica for reports plus a separately validated recovery plan',
        'Business explicitly accepts that the replica alone does not establish the failover guarantee.',
      ],
    ],
    experiment:
      'Simulate primary failure, measure reconnect time and report lag, and verify acknowledged bookings.',
  },
  {
    id: 'cloud-redis-cache',
    title: 'Redis cache or database query tuning?',
    category: 'Caching',
    level: 2,
    skills: ['caching', 'databases'],
    company: 'Support Aube',
    industry: 'Customer support',
    engineers: 4,
    brief:
      'A support dashboard takes several seconds to display customer records, and the team wants to add Redis.',
    current: 'Five SQL queries run sequentially per page; most users search different customers.',
    signal:
      'The slowest query lacks an index. A cache trial has only a 9% hit rate and serves stale account status.',
    observation:
      'An indexed query is faster in staging, but the dataset is one tenth of production and write cost has not been measured.',
    limits:
      'Account suspension visible within five seconds; customer p95 under 500 ms; no new on-call system without a demonstrated benefit.',
    options: [
      [
        'Tune queries and parallelize independent reads',
        'Production-like testing proves latency and write overhead acceptable.',
      ],
      [
        'Use a narrowly scoped cache',
        'Repeated reads, invalidation and permission checks support a measurable benefit.',
      ],
    ],
    experiment:
      'Benchmark the production query distribution and test status changes through warm cache entries.',
  },
  {
    id: 'cloud-object-or-file',
    title: 'S3 or EFS for a shared document workspace?',
    category: 'Storage',
    level: 2,
    skills: ['storage', 'migration'],
    company: 'Atelier Ligne',
    industry: 'Design',
    engineers: 4,
    brief:
      'A design studio wants several workers to process the same project files without copying entire directories.',
    current:
      'A legacy tool expects file paths, file locking and rename operations; new processors use object APIs.',
    signal:
      'The legacy tool cannot use object storage directly and relies on locking across processes.',
    observation:
      'A sync script causes conflicting edits because two workers copy and overwrite the same version.',
    limits:
      'Preserve concurrent-edit correctness; 8 TB working set; batch jobs must finish overnight.',
    options: [
      [
        'Shared file storage for the legacy tool with object storage for final assets',
        'File semantics and performance are verified on the real workload.',
      ],
      [
        'Adapt the tool to versioned object workflows',
        'Application changes can remove shared mutable files and define conflict resolution.',
      ],
    ],
    experiment:
      'Run concurrent edits, worker crashes and large-directory scans; compare correctness and throughput.',
  },
  {
    id: 'cloud-disk-performance',
    title: 'More EBS capacity or a different data path?',
    category: 'Storage',
    level: 2,
    skills: ['storage', 'performance'],
    company: 'Rapports Cèdre',
    industry: 'Analytics',
    engineers: 3,
    brief:
      'A reporting application stalls during imports even though the team keeps adding disk capacity.',
    current:
      'EC2 imports CSV files into a local database and creates temporary sort files on the same EBS volume.',
    signal:
      'Queue depth rises during concurrent sorts while CPU is idle; the team has not separated IOPS, throughput and capacity measurements.',
    observation:
      'Imported files are sequential but sorting generates random IO. Increasing space alone did not change the observed limit.',
    limits:
      'Nightly load within ninety minutes; retain source files durably; avoid undocumented local state.',
    options: [
      [
        'Provision and isolate storage performance for the current workload',
        'Measured IOPS and throughput needs fit a tested volume and instance configuration.',
      ],
      [
        'Move ingestion and analytics to managed services',
        'Transformation compatibility and operational savings justify changing the pipeline.',
      ],
    ],
    experiment:
      'Measure IO size, queue depth and end-to-end import time with representative concurrent jobs.',
  },
  {
    id: 'cloud-cloudfront-or-regional',
    title: 'CloudFront or another application region?',
    category: 'Web delivery',
    level: 2,
    skills: ['networking', 'performance'],
    company: 'Campus Azur',
    industry: 'Education',
    engineers: 4,
    brief:
      'Customers far from the main region complain that a learning portal is slow. Management proposes a second region.',
    current: 'Videos and images share the same origin as personalized course progress APIs.',
    signal:
      'Static media accounts for 85% of transferred bytes; personal progress cannot use a shared public cache.',
    observation:
      'Synthetic tests show 1.8 seconds for media delivery and 250 ms for authenticated API requests.',
    limits:
      'Private course access; signed media links; minimal operations overhead; launch to a second market in one month.',
    options: [
      [
        'CloudFront for eligible media with protected origin access',
        'Authorization, expiry and invalidation preserve private content boundaries.',
      ],
      [
        'Regional application expansion',
        'Measurements show uncached interactions still fail the agreed latency target.',
      ],
    ],
    experiment:
      'Measure regional p95 by content class and test expired links and cross-user access.',
  },
  {
    id: 'cloud-api-gateway-or-alb',
    title: 'API Gateway or an Application Load Balancer?',
    category: 'API architecture',
    level: 2,
    skills: ['networking', 'security'],
    company: 'Logistique Flèche',
    industry: 'Logistics',
    engineers: 5,
    brief:
      'A logistics firm is exposing APIs to partner companies and wants a controlled public entry point.',
    current: 'Container services provide order tracking; internal users also use a web frontend.',
    signal:
      'Partners need per-client usage limits and an onboarding process; a load balancer alone does not define those controls.',
    observation:
      'Partner A sends bursts ten times higher than normal. Authentication and quotas are currently implemented inconsistently in services.',
    limits:
      '300 ms target excluding partner networks; auditable access; no shared partner credentials.',
    options: [
      [
        'API Gateway for the partner API',
        'Required auth, quota and request behavior fit the chosen API type and measured cost.',
      ],
      [
        'ALB with an application API-control layer',
        'The team can own equivalent controls and the request profile favors direct load balancing.',
      ],
    ],
    experiment: 'Test token revocation, burst isolation, large requests and downstream timeouts.',
  },
  {
    id: 'cloud-nat-or-endpoints',
    title: 'NAT Gateway or private service endpoints?',
    category: 'Networking',
    level: 2,
    skills: ['networking', 'finops'],
    company: 'Analytique Rivage',
    industry: 'Analytics',
    engineers: 4,
    brief:
      'A private analytics workload has a surprisingly high network bill. The team wants to reduce it without breaking outbound connectivity.',
    current: 'Workers read large S3 objects through NAT and call two external data vendors.',
    signal:
      'S3 traffic and internet vendor traffic are mixed in the same cost category; private AWS access cannot replace vendor internet access.',
    observation:
      'Flow logs identify 80% of bytes as S3 reads; endpoint policies and private DNS have not been evaluated.',
    limits:
      'Workers remain private; vendor APIs remain reachable; changes must preserve per-service access controls.',
    options: [
      [
        'Use an S3 gateway endpoint and keep required internet egress',
        'Routes and endpoint policies allow only the intended buckets.',
      ],
      [
        'Retain NAT while redesigning data locality',
        'A measured locality change solves cross-zone and vendor traffic costs without breaking dependencies.',
      ],
    ],
    experiment:
      'Validate route tables, access denials and billed traffic by destination before and after.',
  },
  {
    id: 'cloud-vpn-or-direct-connect',
    title: 'Site-to-Site VPN or Direct Connect?',
    category: 'Hybrid networking',
    level: 3,
    skills: ['networking', 'reliability'],
    company: 'Usine Nord',
    industry: 'Manufacturing',
    engineers: 3,
    brief:
      'A manufacturer needs cloud access from its plant for production dashboards and nightly data transfers.',
    current: 'The plant sends 600 GB nightly; daytime control systems remain on premises.',
    signal:
      'Dashboard latency is tolerable, but the current ISP occasionally loses connectivity for forty minutes.',
    observation:
      'A dedicated circuit has a procurement lead time longer than the pilot deadline; no backup path is budgeted.',
    limits:
      'Pilot in six weeks; transfer complete by 6 a.m.; production must continue during cloud disconnection.',
    options: [
      [
        'Resilient VPN pilot with local buffering',
        'Measured bandwidth and ISP redundancy satisfy the initial service target.',
      ],
      [
        'Direct Connect with a tested backup path',
        'Steady transfer demand and reliability needs justify procurement and recurring operations.',
      ],
    ],
    experiment:
      'Measure transfer windows and fail over each network path while verifying local buffering.',
  },
  {
    id: 'cloud-peering-or-transit',
    title: 'VPC peering or Transit Gateway?',
    category: 'Networking',
    level: 3,
    skills: ['networking', 'governance'],
    company: 'Groupe Réseau',
    industry: 'Enterprise IT',
    engineers: 4,
    brief:
      'A platform team must connect application networks across business units without creating uncontrolled lateral access.',
    current:
      'Eight VPCs use different accounts; two have overlapping address ranges and a shared inspection requirement.',
    signal:
      'A full peering mesh does not solve overlapping addresses or automatically enforce centralized inspection.',
    observation:
      'Only three service pairs need connectivity; the proposed design connects every VPC to every other.',
    limits:
      'Least-privilege connectivity; documented routing owners; expected growth to twenty VPCs.',
    options: [
      [
        'Transit Gateway with segmented route tables',
        'Address conflicts and inspection paths are resolved and failure domains are tested.',
      ],
      [
        'Selective peering or service-level private connectivity',
        'The small set of flows does not require general network reachability.',
      ],
    ],
    experiment:
      'Trace each allowed and denied flow, test asymmetric routing and rehearse adding an account.',
  },
  {
    id: 'cloud-secrets-or-roles',
    title: 'Static access keys or workload identities?',
    category: 'Identity',
    level: 1,
    skills: ['iam', 'security'],
    company: 'Service Pin',
    industry: 'Software',
    engineers: 3,
    brief:
      'Developers embedded cloud credentials in an application configuration file. The team needs a safer deployment pattern.',
    current: 'The service runs on EC2 and accesses one S3 bucket plus a managed database.',
    signal:
      'The same access key is shared by CI, production and a developer laptop; revocation could interrupt all three.',
    observation:
      'Audit logs cannot attribute individual workloads. The database password is also stored in the repository history.',
    limits:
      'No secrets in source control; production access limited to required paths; rotation without downtime.',
    options: [
      [
        'Workload roles plus a managed secret for database credentials',
        'Each execution context gets separate least-privilege permissions and tested rotation.',
      ],
      [
        'Short-lived federated credentials with a controlled transition',
        'The runtime supports federation and legacy keys can be removed in stages.',
      ],
    ],
    experiment:
      'Revoke old keys, rotate the database secret and prove application continuity and denied excess access.',
  },
  {
    id: 'cloud-landing-zone',
    title: 'One AWS account or a multi-account landing zone?',
    category: 'Governance',
    level: 2,
    skills: ['governance', 'iam'],
    company: 'Nuage Collectif',
    industry: 'Enterprise IT',
    engineers: 4,
    brief:
      'A company is moving three products to AWS and needs to decide how to separate environments before the first production launch.',
    current:
      'Developers currently share one account for experiments, test data and customer-facing services.',
    signal:
      'One admin role can delete both backups and production resources; billing has no reliable product ownership.',
    observation:
      'Only one product needs regulated-data controls. Creating dozens of accounts without automation would exceed team capacity.',
    limits:
      'Separate production blast radius; central audit trail; simple account provisioning; four-person platform team.',
    options: [
      [
        'Small multi-account foundation with guardrails',
        'Identity, logging, billing and recovery are automated before expanding account count.',
      ],
      [
        'Temporary shared nonproduction account with isolated production',
        'The transition plan limits shared privileges and has a dated path to stronger separation.',
      ],
    ],
    experiment:
      'Test least privilege, central log retention, budget ownership and recovery from an account-level mistake.',
  },
  {
    id: 'cloud-private-api',
    title: 'PrivateLink or a public authenticated API?',
    category: 'Security architecture',
    level: 3,
    skills: ['networking', 'security'],
    company: 'API Passerelle',
    industry: 'B2B SaaS',
    engineers: 5,
    brief:
      'An enterprise customer requests private access to a SaaS API while other customers use its public endpoint.',
    current:
      'A shared multi-tenant API authenticates users and performs tenant authorization in application code.',
    signal:
      'Private connectivity does not replace tenant authorization. The customer also needs a solution for DNS and endpoint ownership.',
    observation:
      'Their network forbids general outbound internet access; their cloud account can host an endpoint but overlaps your IP space.',
    limits: 'Preserve tenant isolation; no broad network peering; support both access models.',
    options: [
      [
        'Private service access with unchanged application authorization',
        'Endpoint provisioning, DNS and support ownership are agreed and tested.',
      ],
      [
        'Public API through the customer-approved egress path',
        'The customer accepts authenticated internet access and their security controls permit it.',
      ],
    ],
    experiment:
      'Try cross-tenant tokens through both paths and verify endpoint deletion and DNS failure behavior.',
  },
  {
    id: 'cloud-waf-or-app-fix',
    title: 'WAF rule or application-side protection?',
    category: 'Security architecture',
    level: 2,
    skills: ['security', 'reliability'],
    company: 'Portail Clair',
    industry: 'Public services',
    engineers: 4,
    brief:
      'A public portal is receiving abusive traffic and legitimate customers are seeing errors. The team proposes blocking entire countries.',
    current:
      'The login endpoint and a computationally expensive search endpoint share application capacity.',
    signal:
      'Most load comes from authenticated search automation; geography is not a reliable abuse signal.',
    observation:
      'WAF logs include false positives from a mobile network. Application logs lack per-account request metrics.',
    limits:
      'Avoid blocking legitimate users; preserve login availability; auditable emergency changes.',
    options: [
      [
        'Targeted edge rules plus application quotas',
        'Measured patterns distinguish abusive requests and rule rollback is immediate.',
      ],
      [
        'Isolate expensive work and enforce account-level budgets',
        'Resource ownership and asynchronous limits protect the core service.',
      ],
    ],
    experiment:
      'Replay mixed legitimate and abusive traffic; measure false positives and core endpoint availability.',
  },
  {
    id: 'cloud-terraform-adoption',
    title: 'Terraform import or rebuild the environment?',
    category: 'Infrastructure as code',
    level: 2,
    skills: ['iac', 'operations'],
    company: 'Infrastructure Forge',
    industry: 'Enterprise IT',
    engineers: 1,
    brief:
      'A small team wants repeatable cloud environments after years of manual console changes.',
    current:
      'Production has manually created networks, security groups and a database containing live customer records.',
    signal:
      'The draft Terraform plan replaces the database because the declared settings do not match deployed state.',
    observation:
      'State locking and separate environments are not configured. Staging does not reproduce production dependencies.',
    limits: 'No production data loss; reviewable plans; one engineer owns the first migration.',
    options: [
      [
        'Import and reconcile existing resources incrementally',
        'State, drift and lifecycle protection are reviewed before applying changes.',
      ],
      [
        'Build a parallel environment and migrate',
        'The team can validate cutover and restore without exceeding service interruption limits.',
      ],
    ],
    experiment:
      'Review a no-replacement plan, inject drift and restore state in an isolated rehearsal.',
  },
  {
    id: 'cloud-blue-green-canary',
    title: 'Blue-green or canary deployments?',
    category: 'Release architecture',
    level: 3,
    skills: ['cicd', 'reliability'],
    company: 'Clinique Avenir',
    industry: 'Healthcare',
    engineers: 5,
    brief:
      'A healthcare scheduling team wants safer releases after a bug affected every user at once.',
    current:
      'A container service supports 20 clinics and shares one database; releases change both code and schema.',
    signal:
      'Traffic splitting alone cannot undo a destructive schema migration or repair already-written invalid records.',
    observation:
      'Two clinics can volunteer for early rollout, but monitoring only reports average response time.',
    limits: 'No appointment loss; rollback under five minutes; feature-specific error detection.',
    options: [
      [
        'Canary release with compatible schema and cohort metrics',
        'Early cohorts reveal meaningful signals and writes remain backward-compatible.',
      ],
      [
        'Blue-green deployment with explicit data transition gates',
        'The extra environment is affordable and switching traffic does not hide shared-state risk.',
      ],
    ],
    experiment:
      'Inject a faulty release, verify cohort alerts and rehearse traffic rollback with new writes present.',
  },
  {
    id: 'cloud-observability-stack',
    title: 'CloudWatch or a separate observability platform?',
    category: 'Observability',
    level: 1,
    skills: ['observability', 'operations'],
    company: 'Commerce Signal',
    industry: 'E-commerce',
    engineers: 4,
    brief:
      'A team has many dashboards but still learns about outages from customers. It wants to buy a new monitoring platform.',
    current:
      'Metrics, logs and traces use inconsistent request identifiers; alerts trigger on host CPU.',
    signal:
      'Recent incidents were failed payments with normal CPU. No dashboard tracks successful customer transactions.',
    observation:
      'Engineers need forty minutes to correlate an error across three services. Log volume contains unnecessary personal data.',
    limits:
      'Detect failed checkout within five minutes; keep sensitive data out of logs; sustainable alert volume.',
    options: [
      [
        'Improve native monitoring with service-level signals',
        'Correlation IDs, redaction and customer-outcome alerts resolve the actual gap.',
      ],
      [
        'Adopt a centralized observability platform',
        'Integration and cross-cloud needs justify migration and measured operating cost.',
      ],
    ],
    experiment:
      'Replay a failed transaction and measure detection, diagnosis, redaction and alert usefulness.',
  },
  {
    id: 'cloud-monolith-or-services',
    title: 'Modular monolith or microservices?',
    category: 'Modernization',
    level: 3,
    skills: ['modernization', 'async'],
    company: 'Produit Modulo',
    industry: 'Software',
    engineers: 8,
    brief:
      'A development team wants faster releases and proposes splitting its application into twelve services.',
    current:
      'Eight engineers maintain one application and database; three modules change together for most features.',
    signal:
      'Release delays are dominated by manual testing, not build time. The proposed split adds distributed transactions for core workflows.',
    observation: 'Only image processing has independent scaling needs and a clean data boundary.',
    limits:
      'Reduce release lead time; no additional full-time operations hire; maintain order consistency.',
    options: [
      [
        'Modular monolith with automated release controls',
        'Module boundaries and tests reduce coordination without unnecessary network dependencies.',
      ],
      [
        'Extract one independently scalable service',
        'The boundary has clear ownership, independent data and a reliable integration contract.',
      ],
    ],
    experiment:
      'Measure deployment lead time and simulate dependency failure on the proposed extracted boundary.',
  },
  {
    id: 'cloud-rehost-or-replatform',
    title: 'Rehost, replatform or refactor first?',
    category: 'Migration strategy',
    level: 3,
    skills: ['migration', 'modernization'],
    company: 'Commandes Héritage',
    industry: 'Distribution',
    engineers: 5,
    brief:
      'A company must exit a data center in four months while keeping an internal order platform available.',
    current:
      'Twenty VMs include a web tier, SQL database, file shares and a licensed reporting server.',
    signal:
      'The reporting license and a hardcoded local file path block a uniform lift-and-shift plan.',
    observation:
      'Dependency mapping finds a nightly process owned by another department. No cloud restore rehearsal exists.',
    limits:
      'Four-month deadline; two-hour cutover window; limited application development capacity.',
    options: [
      [
        'Rehost compatible workloads and replatform selected dependencies',
        'Dependencies, licensing and temporary operating costs are explicitly accepted.',
      ],
      [
        'Refactor a bounded application slice before migration',
        'The slice removes a proven blocker without jeopardizing the exit deadline.',
      ],
    ],
    experiment:
      'Run a migration wave rehearsal covering data consistency, external dependencies and rollback timing.',
  },
  {
    id: 'cloud-strangler-api',
    title: 'Replace the whole platform or migrate one route at a time?',
    category: 'Modernization',
    level: 4,
    skills: ['modernization', 'migration'],
    company: 'Boutique Transition',
    industry: 'Retail',
    engineers: 6,
    brief: 'A retailer wants to modernize a legacy checkout without stopping seasonal sales.',
    current:
      'A legacy application owns orders and inventory; a new service can handle product search.',
    signal:
      'Both proposed systems want to write order status, creating conflicting sources of truth during migration.',
    observation:
      'Read-only search can be extracted immediately, but checkout requires a single authoritative writer.',
    limits:
      'No duplicate orders; eight-week first milestone; rollback without losing recent purchases.',
    options: [
      [
        'Strangler migration around read-only capabilities first',
        'Routing and ownership are explicit and old/new responses can be compared.',
      ],
      [
        'Coordinated replacement of a bounded write domain',
        'A tested write cutover and reconciliation plan can preserve one source of truth.',
      ],
    ],
    experiment:
      'Shadow reads, compare results and rehearse writer cutover with orders arriving during the transition.',
  },
  {
    id: 'cloud-batch-or-stream',
    title: 'Nightly batch or real-time streaming?',
    category: 'Data architecture',
    level: 2,
    skills: ['async', 'databases'],
    company: 'Données Comptoir',
    industry: 'Retail',
    engineers: 2,
    brief:
      'A retail analytics team asks for real-time dashboards, but the cloud team needs to establish what freshness actually matters.',
    current:
      'Orders export nightly as CSV; stock alerts and executive dashboards share the same requested data pipeline.',
    signal:
      'Stock alerts need data within two minutes, while executives only review yesterday’s results.',
    observation:
      'Late refunds can modify prior-day totals; the prototype stream counts every duplicate event as a new sale.',
    limits:
      'Trustworthy daily totals; two-minute operational alerts; two data engineers; bounded replay costs.',
    options: [
      [
        'Batch reporting plus a narrow operational stream',
        'Different freshness needs have separate pipelines with reconciled definitions.',
      ],
      [
        'Unified streaming with durable replay',
        'Operational capacity supports ordering, late data, deduplication and reconciliation.',
      ],
    ],
    experiment:
      'Replay duplicates, delayed refunds and a consumer outage; compare totals with the source ledger.',
  },
  {
    id: 'cloud-lake-or-warehouse',
    title: 'Data lake or data warehouse for reporting?',
    category: 'Data architecture',
    level: 2,
    skills: ['storage', 'databases'],
    company: 'Vision Partagée',
    industry: 'Business services',
    engineers: 3,
    brief:
      'A mid-sized company needs shared reporting across sales and support and is deciding what to build first.',
    current:
      'Structured CRM exports and large raw support files are stored in team-specific locations.',
    signal:
      'Finance requires stable business definitions; simply storing everything in object storage will not produce trusted reporting tables.',
    observation:
      'Only three analysts need SQL dashboards today, while raw files must remain available for future reprocessing.',
    limits:
      'Daily refresh; row-level access; reproducible transformations; a six-week first delivery.',
    options: [
      [
        'Warehouse reporting with a retained raw object-storage zone',
        'Stable models meet current SQL needs and raw inputs remain auditable.',
      ],
      [
        'Lake-based analytical tables with a governed query layer',
        'Schema, access, performance and data ownership are funded rather than deferred.',
      ],
    ],
    experiment:
      'Rebuild one dashboard from raw inputs and validate access controls, lineage and agreed totals.',
  },
  {
    id: 'cloud-glue-or-airflow',
    title: 'Glue workflows or Airflow for data orchestration?',
    category: 'Data pipelines',
    level: 3,
    skills: ['managed-services', 'operations'],
    company: 'Pipeline Matin',
    industry: 'Analytics',
    engineers: 2,
    brief:
      'A data team needs dependable daily pipelines and is debating whether to operate a general orchestration platform.',
    current:
      'Eight AWS transformations and two external APIs must complete before morning reporting.',
    signal:
      'External APIs impose rate limits; rerunning the entire pipeline duplicates rows because loads are not idempotent.',
    observation:
      'Most jobs have simple dependencies, but one backfill requires a per-day checkpoint and manual approval.',
    limits:
      'Finish by 8 a.m.; recover individual partitions; only two data engineers are available for operations.',
    options: [
      [
        'Managed AWS-native orchestration for the current graph',
        'Retries, checkpoints and approvals fit supported patterns without custom scheduler operations.',
      ],
      [
        'Managed Airflow for cross-system orchestration',
        'Complex dependency and backfill needs justify its additional configuration and ownership.',
      ],
    ],
    experiment:
      'Fail one external API, rerun a partition and verify a complete report without duplicated rows.',
  },
  {
    id: 'cloud-azure-data-factory',
    title: 'Azure Data Factory or custom ingestion code?',
    category: 'Data pipelines',
    level: 2,
    skills: ['managed-services', 'migration'],
    company: 'Données Pont',
    industry: 'Business services',
    engineers: 3,
    brief:
      'A company using Azure wants to bring on-premises SQL data into a cloud reporting platform and needs a maintainable ingestion approach.',
    current:
      'A scheduled script exports full tables nightly; the source network cannot accept inbound public connections.',
    signal:
      'A full reload misses the reporting window as data grows. Incremental capture must include deleted records, not just updated timestamps.',
    observation:
      'The source supports change tracking, but its retention window is shorter than a long weekend outage.',
    limits:
      'Private source access; daily reports by 7 a.m.; recover after a four-day outage without silent gaps.',
    options: [
      [
        'Data Factory with a controlled integration runtime and incremental pipeline',
        'Connectivity, delete handling and retention-aware recovery are validated.',
      ],
      [
        'Custom ingestion service with durable checkpoints',
        'Unsupported transformations justify code ownership and reliable source reconciliation.',
      ],
    ],
    experiment:
      'Simulate expired change history, deletes and interrupted loads; reconcile destination counts and values.',
  },
  {
    id: 'cloud-rag-or-finetuning',
    title: 'RAG or fine-tuning for an internal assistant?',
    category: 'AI architecture',
    level: 3,
    skills: ['rag', 'ai-security'],
    company: 'Ingénierie Savoir',
    industry: 'Engineering',
    engineers: 4,
    brief:
      'An engineering company wants an assistant that answers questions from its internal manuals while respecting project permissions.',
    current: 'Manuals change weekly and each employee can access only some project folders.',
    signal:
      'Fine-tuning alone does not provide current document retrieval or enforce per-user document permissions.',
    observation:
      'The prototype retrieves relevant text but indexes all folders into one unrestricted collection.',
    limits:
      'Cite approved sources; propagate access removal promptly; no confidential cross-project answers.',
    options: [
      [
        'Permission-aware retrieval augmented generation',
        'Document freshness, filtering and citations are tested end to end.',
      ],
      [
        'Narrow task-specific model adaptation with a separate retrieval and authorization layer',
        'A measured behavior gap justifies adaptation without using it as a substitute for access controls.',
      ],
    ],
    experiment:
      'Evaluate stale documents, revoked access, adversarial questions and unsupported-answer abstention.',
  },
  {
    id: 'cloud-managed-model-or-gpu',
    title: 'Managed model API or self-hosted inference?',
    category: 'AI infrastructure',
    level: 4,
    skills: ['ai-infrastructure', 'ai-cost'],
    company: 'Synthèse Locale',
    industry: 'AI software',
    engineers: 2,
    brief:
      'A product team is adding summarization and needs to choose an inference hosting strategy without committing to unnecessary infrastructure.',
    current:
      'Demand is 2 requests/second normally and 80/s during imports; documents contain customer data.',
    signal:
      'The available GPU prototype stays allocated overnight and has not been evaluated against the managed model on the same task set.',
    observation:
      'The legal team needs evidence of data handling and retention; latency and answer quality matter more than token price alone.',
    limits:
      'p95 under eight seconds; approved data boundary; no unsupported claims; one ML engineer on call.',
    options: [
      [
        'Managed model API with bounded concurrency',
        'Data terms, quotas and task quality satisfy requirements at measured volume.',
      ],
      [
        'Self-hosted model with autoscaling and operational ownership',
        'Utilization, control needs and evaluation results justify GPU and model lifecycle work.',
      ],
    ],
    experiment:
      'Compare accepted summaries, peak queues, failure behavior, data controls and cost per successful task.',
  },
];

const discoveryKeywords: Record<string, string[]> = {
  compute: ['ecs', 'ec2', 'lambda', 'fargate', 'runtime', 'host', 'serveur', 'calcul'],
  containers: ['ecs', 'eks', 'kubernetes', 'fargate', 'container', 'conteneur', 'host'],
  databases: ['rds', 'aurora', 'dynamodb', 'postgresql', 'query', 'sql', 'requete', 'donnees'],
  networking: ['vpc', 'vpn', 'dns', 'network', 'private', 'reseau', 'connectivite'],
  security: ['authorization', 'permissions', 'access', 'securite', 'acces'],
  iam: ['identity', 'role', 'credentials', 'identite', 'cles', 'permissions'],
  storage: ['s3', 'efs', 'ebs', 'file', 'object', 'stockage', 'fichiers'],
  async: ['queue', 'retry', 'event', 'batch', 'stream', 'reprise', 'evenement'],
  reliability: ['availability', 'failover', 'outage', 'disponibilite', 'panne'],
  migration: ['cutover', 'rollback', 'dependency', 'migration', 'dependance'],
  modernization: ['monolith', 'microservices', 'boundary', 'modernisation'],
  observability: ['logs', 'metrics', 'traces', 'alert', 'monitoring', 'alerte'],
  cicd: ['deployment', 'release', 'rollback', 'deploiement'],
  iac: ['terraform', 'state', 'drift', 'import', 'infrastructure'],
  rag: ['retrieval', 'permission', 'document', 'rag', 'recherche'],
  'ai-infrastructure': ['model', 'inference', 'gpu', 'modele'],
};

export const commonCloudSeeds: SeedInput[] = cases.map((c) => {
  const keywords = [...new Set(c.skills.flatMap((s) => discoveryKeywords[s] || [s]))].slice(0, 18);
  return {
    id: c.id,
    title: c.title,
    company: c.company,
    industry: c.industry,
    level: c.level,
    size: Math.max(20, c.engineers * 12),
    engineers: c.engineers,
    category: c.category,
    brief: c.brief,
    known: [
      'The client needs a justified cloud architecture decision and a feasible transition plan.',
      'Interview the client to establish workload, service targets, budget and operational constraints.',
    ],
    skills: c.skills,
    facts: [
      ['business', c.brief, 'Business sponsor', false, ['objectif', 'client', 'priorite']],
      ['architecture', c.current, 'Lead engineer', false, keywords],
      [
        'requirements',
        c.signal,
        'Lead engineer',
        true,
        [...keywords, 'constraint', 'constraints', 'besoin', 'contrainte'],
      ],
      [
        'operations',
        c.observation,
        'Operations owner',
        true,
        ['production', 'incident', 'operations', 'observation', 'mesure', 'limite'],
      ],
      [
        'budget',
        c.limits +
          ' These are planning constraints; compare actual estimates including operations, data transfer and resilience. No supplier quote has been approved.',
        'Budget owner',
      ],
      [
        'team',
        c.engineers +
          ' engineers maintain the product. Confirm who owns deployment, patching, incidents and recovery before committing to an option. ' +
          c.limits,
        'Engineering manager',
      ],
    ],
    evidence: [
      [
        'architecture',
        c.title + ' — current-system inventory',
        'available',
        c.current,
        ['inventory', 'inventaire', ...keywords],
      ],
      [
        'requirements',
        'Constraint review and workload observations',
        'available',
        c.signal + '\n' + c.observation,
        ['requirements', 'benchmark', 'report', 'mesures', 'contraintes', ...keywords],
      ],
      [
        'budget',
        'Delivery capacity and service-target brief',
        'available',
        c.limits,
        ['budget', 'team', 'sla', 'slo', 'delai', 'equipe'],
      ],
      [
        'validation',
        'Proposed validation and failure rehearsal',
        'measurement_required',
        c.experiment + ' This is an unexecuted test plan, not a measured result.',
        ['validation', 'experiment', 'pilot', 'test', 'rehearsal', 'preuve'],
      ],
    ],
    constraints: [
      c.limits,
      'Keep an explicit rollback or recovery path and name the operating owner.',
    ],
    patterns: c.options as [string, string][],
    flags: [
      ['requirements', 'Ignoring the discovered constraint: ' + c.signal],
      ['operations', 'Treating the proposed validation as completed evidence.'],
    ],
    criteria: [
      'Ask for the workload, constraints and evidence before recommending a service.',
      'Compare the conditional alternatives against the discovered constraint: ' + c.signal,
      'Explain the transition, operational ownership, cost assumptions and validation: ' +
        c.experiment,
    ],
  };
});
