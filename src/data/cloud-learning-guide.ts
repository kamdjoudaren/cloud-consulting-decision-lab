// Cloud-only learning content. The original consulting glossary remains in learning-guide.ts.
export const learningPath = [
 ['A','Client discovery: ECS or EC2','cloud-ecs-or-ec2'],
 ['B','Containers and compute ownership','cloud-ecs-fargate-capacity'],
 ['C','Data and database decisions','cloud-rds-or-ec2'],
 ['D','Private networking','cloud-private-access'],
 ['E','Identity and access','cloud-secrets-or-roles'],
 ['F','Resilience and recovery','cloud-region-recovery'],
 ['G','Migration strategy','cloud-rehost-or-replatform'],
 ['H','Infrastructure and delivery','cloud-terraform-adoption'],
 ['I','Cloud data pipelines','cloud-batch-or-stream'],
 ['J','AI solution design','cloud-rag-or-finetuning'],
];
export const glossary = [
 ['EC2 / ECS / Fargate','EC2 provides virtual machines. ECS orchestrates containers. ECS can use EC2 capacity or Fargate, which removes direct host management.','Compare ECS on Fargate, ECS on EC2 and an application deployed directly to EC2 against actual workload needs.'],
 ['Functional and nonfunctional requirements','Describe what the application must do and how well it must do it: latency, availability, security and recovery.','Ask which users are affected, what interruption they tolerate and what evidence supports each target.'],
 ['RTO / RPO','RTO is tolerated recovery time; RPO is tolerated data loss measured in time.','Time a complete restore, including access, DNS and application checks.'],
 ['p95 / p99','Tail-latency percentiles describe the experience of slower requests.','Measure peak traffic and cold starts instead of relying on an average.'],
 ['Idempotency','Repeated execution of the same logical request must not create duplicate business effects.','Persist a payment request key before retrying an external charge.'],
 ['Consistency','Specify when readers must see committed writes and what happens during network failure.','A stale catalog view may be acceptable while stock reservation must remain correct.'],
 ['Least privilege','Give each identity only the permissions needed for its responsibilities.','Separate CI identity from the application role and test denied actions.'],
 ['Infrastructure as Code','Version and review the desired infrastructure state and its changes.','Review replacement plans before importing an existing production database.'],
 ['Total cost of ownership','Consider infrastructure, transfer, backups, tooling, migration and operational effort.','A cheaper instance may require more patching and incident work.'],
 ['ADR','An architecture decision record captures context, options, the decision and its consequences.','Record why ECS on EC2 is justified by host requirements and what would permit a future move.'],
 ['Proof of concept','A bounded experiment tests an uncertain assumption with a measurable acceptance criterion.','Replay peak traffic and a worker crash before declaring a queue-based design reliable.'],
 ['Portfolio case study','A concise record of your reasoning and evidence, clearly labeled as a simulated case.','Include the client problem, discovery, requirements, diagram, alternatives, ADR, validation plan and limitations.'],
].map(([term,definition,example]) => ({term,definition,example,analogy:'Connect the technical choice to a measurable client requirement.'}));
export const driverMaps = [
 {metric:'Latency',drivers:'Request path, database queries, caching, cold starts and network distance.',check:'Use a representative peak workload and report tail latency.'},
 {metric:'Availability',drivers:'Failure domains, dependencies, retries, failover and recovery.',check:'Exercise failure; do not infer recovery from configuration alone.'},
 {metric:'Operating cost',drivers:'Compute utilization, storage, network transfer, managed services and on-call effort.',check:'State assumptions and distinguish estimated from measured cost.'},
 {metric:'Data trust',drivers:'Freshness, deduplication, access control, lineage and reconciliation.',check:'Replay late and duplicate events and compare with the authoritative source.'},
];

