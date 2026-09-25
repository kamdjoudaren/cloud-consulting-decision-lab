# Cloud architecture practice and portfolio

The active library contains 48 dedicated cloud architecture cases: 12 initial cases and 36 additional client situations. The 158 previous catalog entries remain in source and SQLite as reserved content. Existing cases keep their frozen scenario and responses. Public scenario listings and new mock-generated cases use the active architecture collection; changing filters cannot reveal reserved PE content.

## Suggested portfolio sequence

1. `cloud-ecs-or-ec2`: interview the client, distinguish compute from container orchestration, compare ECS on Fargate, ECS on EC2 and direct EC2 hosting.
2. `cloud-rds-or-ec2`: compatibility, operational responsibility and measured recovery.
3. `cloud-private-access`: trust boundaries, routing, DNS and administrative access.
4. `cloud-region-recovery`: recovery targets, evidence and a failure rehearsal.
5. `cloud-rehost-or-replatform`: a feasible migration wave and rollback strategy.
6. `cloud-batch-or-stream`: data freshness, replay and trustworthy reporting.
7. `cloud-rag-or-finetuning`: document freshness, authorization and evaluation.

For each case, ask questions before recommending a service. Record facts, assumptions and unknowns separately. Prepare a requirements table, an architecture diagram, at least two conditional alternatives, cost assumptions, security and recovery decisions, implementation steps, an ADR and a validation plan. The classic case workflow already supports these artifacts and portfolio export.

Label the portfolio as **simulated architecture case studies**. A planned test is not an executed benchmark. Add a small implementation or reproducible experiment when you have actually performed one; retain the evidence and report its limitations. Select a few strong completed studies rather than presenting all exercises as client experience.

## Internship context

The [PwC Montreal Cloud, Data and AI internship, requisition 753364WD](https://pwc.wd3.myworkdayjobs.com/Global_Campus_Careers/job/Montreal/May-2027---Cloud--Data-and-AI---Summer-Intern---Montreal_753364WD) emphasizes client discussions, translating requirements into designs, cloud/data solutions and reusable artifacts. These exercises are independently authored practice material, not PwC interview questions or endorsed assignments. The posting checked on 24 September 2026 lists a closing date of 25 September 2026 at 11:59 PM EST.

## Catalog maintenance

Service distinctions checked against primary documentation: [ECS and Fargate](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html), [ECS on EC2](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/asg-capacity-providers.html), [Lambda execution time limits](https://docs.aws.amazon.com/lambda/latest/dg/configuration-timeout.html), and [RDS availability deployment modes](https://aws.amazon.com/rds/features/multi-az/). The Lambda exercise explicitly uses standard Lambda execution; managed-instance invocation limits differ. Select the actual deployment model before relying on a limit.

`activeScenarios` in `src/lib/scenarios/seeds.ts` combines `cloud-common.ts` and `cloud-architecture.ts`. `reservedScenarios` retains the earlier bank without deleting it. `getPublicScenarios()` filters persisted records by active IDs or the architecture track assigned to newly generated scenarios. Historical cases remain readable through their original IDs and frozen truth. Re-enable reserved material only with an explicit product decision.
