# Authoring consulting simulations

Current product focus: the public library contains 48 architecture-first cases from `cloud-common.ts` and `cloud-architecture.ts`, using the classic discovery-to-ADR workflow. The 158-case consulting bank described below is retained in reserve. See [Cloud portfolio](CLOUD_PORTFOLIO.md) for active/reserved catalog rules and the current learning path.

The learner investigates a business situation, rather than selecting an AWS answer. Start with competing explanations, a consequential decision, and records that distinguish those explanations. A defensible outcome can be to keep the current architecture or defer a change.

## Files and contracts

- `src/lib/scenarios/consulting-bank.ts`: authored case briefs, the shared content builder, and curated upgrades. Content belongs here or in additional imported family modules, never in a scenario-specific React branch.
- `src/lib/scenarios/seeds.ts`: preserves the 25 original cases and assembles the catalog. There are 158 distinct scenarios, including 145 upgraded references: Cloud 30, FinOps 22, AI/MLOps 17, Buy-Side 25, Value Creation 21, Sell-Side 10, M&A 10, Mega-Case 10.
- `src/lib/lab/schema.ts`: runtime schemas for configuration, private truth, consulting drafts and simulation state. `src/lib/types.ts` extends the original scenario and evidence contracts.
- `src/lib/lab/engine.ts`: validation, variant selection, role-scoped interviews and evidence release.
- `src/lib/lab/workflow.ts`, `scoring.ts`, `economics.ts`: progression, transparent rubric and financial calculations.

The catalog can be split into family modules as it grows beyond this initial 120–160-case bank. Generated mock/live variations currently use the original scenario contract and classic workflow; curate and validate their consulting configuration before promoting them into the reference catalog.

## Add a case

Add a `CaseBrief` to `briefs` (or use `configure` on a complete original `Scenario`). Give it a stable unique ID, plausible brief, business stakes, architecture, observed technical signal, comparable economics, team constraints, technical source record, alternative hypothesis, bounded action and guardrail. Explain what a junior might wrongly infer and when doing nothing is defensible.

The builder supplies two independent source records, a management claim and an explicitly unexecuted validation plan. Replace or extend these with case-specific evidence where necessary. Do not present the builder's generic text as sufficient for a deep mega-case: author its conflicting measurements, ownership, timing and dependencies explicitly.

Set `lab.version = 2`, `family`, `peStage`, concept tags, deliverable suggestions and supported assistance modes. Set private `truth.rootCause`, `falseLeads`, `expectedFindings`, `contradictions`, `knowledge`, coaching, debrief and challenge questions. Findings identify supporting document IDs and semantic indicator words; they are not an architecture answer key.

Validate the original shape with `scenarioSchema.parse(scenario)` and the full extension with `validateSimulation(scenario)`. The former deliberately handles the classic generation contract; the latter validates private configuration and cross-references. Run `npm test` and `npm run typecheck` after content edits.

## Evidence and interviews

Every document has a unique ID, topic, matching keywords, title, status, content and source. Optional `format` supports memo/CSV-style rendering and downloads. `factIds` records which private facts it establishes. A `measurement_required` record is a plan, not evidence that a test passed. Metrics use comparable full-year USD and useful completed output; document other units explicitly.

Add `chapter` (zero-based) and `requires: [documentId]` for staged access. Document prerequisites must exist and cannot cycle. Facts attached to later chapters cannot leak through an early interview. Requests return the highest matching eligible record; there is no unrestricted hidden data-room endpoint. Requested records become available for citations and exports.

Add stakeholders to `scenario.stakeholders` and private `truth.knowledge`. Give each person permitted topics, objectives, unknowns, bias, style and evidence ownership. Interviews answer only within that person's topics, return at most two relevant facts and remember previous disclosures. Hard/expert modes require more precise questions. The current implementation uses deterministic matching, not unrestricted conversational intelligence; writing precise keywords matters.

## Difficulty, assistance and PE context

Difficulty changes the required work, independently of assistance:

| Level                            | Required depth                                                                                           |
| -------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 1 Guided beginner                | Discovery, core technical/economic causal chain, two options, engineer/CFO explanation and one challenge |
| 2 Junior                         | Same compact path, with ambiguity supplied by scenario content                                           |
| 3 Consultant                     | Adds explicit assumptions/unknowns, change conditions, validation and an accepted ADR; three challenges  |
| 4 Technology DD / Value Creation | Adds Operating Partner/IC communication and a structured deliverable                                     |
| 5 Expert / IC challenge          | Advanced workstream with contradictory evidence and executive pressure supplied by content               |

Guided offers contextual coaching and glossary; standard keeps it on demand; hard charges two points per requested hint (maximum ten); expert disables contextual hints and hides domain tags in the case. Assistance can change at the brief before coaching is used. PE beginner cases remain freely available.

PE stage is context, not difficulty. Use buy-side findings to test thesis assumptions, cost-to-fix and confidence. Use post-close initiatives for accountable execution and verification. Sell-side cases must reconcile claims with source evidence and disclose limitations. Integration/carve-out cases distinguish standalone costs, TSA timing, stranded cost and conditional synergies. Avoid asking the technologist to produce a company valuation.

Mega-cases use ten configured chapters. Their source records and management response unlock later. Chapter notes preserve the learner's investigation; all chapters must be completed before review. These are simulated workstream stages, not ten real elapsed days.

## Technology → Value and financial boundaries

A finding connects technical signal → operations → customer → business metric → financial metric → forecast/value consequence → action and confidence. Materiality needs an explanation, not just a color. Cost-to-fix, probability, timing, management dependency and validation remain explicit.

Cloud spend growth and unit cost growth are different. The first reference has two frozen variants with the same brief: useful growth versus unproductive capacity. Never conclude from the bill alone.

Initiatives separate recurring savings, one-time savings, cost avoidance, capacity, revenue and risk reduction. Each has a unique benefit key, owner, baseline, target, cost, recurring offset, start month, KPI, evidence and value-realization stage. Duplicate benefits are excluded from totals and flagged. Verified cash requires evidence and Finance sign-off. Capacity, avoidance and revenue opportunity do not become cash savings automatically. First-year cash is an illustrative timed planning estimate, not reported FCF. Any valuation multiple is a sensitivity, never exact realized value.

## Hidden variants and migration

Variants replace `hiddenFacts`, `evidenceAvailable` and `truth` together. Keep the public brief invariant when testing competing diagnoses, reconcile all affected numbers/claims and validate every variant. Selection happens once, server-side, when a case starts. The chosen private scenario is stored in append-only `case_truth`; subsequent requests never reroll it.

Before catalog refresh, SQLite snapshots existing sessions' original scenarios. Older drafts retain their 15-step workflow and eight-dimensional rubric. New sessions use upgraded configuration. Accepted ADRs, first/final snapshots and historical evaluations remain available; catalog updates never rewrite a started case. Public API objects use allow-lists; private root causes are exposed only as intended post-evaluation debrief content.

## Scoring and verification

The v2 rubric has ten dimensions totaling 100: discovery, evidence, technical reasoning, economics, business, Technology → Value, trade-offs, uncertainty, executive communication and defense. Beginner weights emphasize inquiry and reasoning. Advanced weights increase the causal bridge. The score uses source coverage, comparable numeric reconciliation, causal completeness, options, uncertainty and source-backed defenses. Critical misses block publication regardless of total score.

This is a transparent deterministic formative rubric with limited keyword indicators, not a semantic guarantee. Repeated jargon or form completion cannot prove professional judgment. Live-provider review remains optional; the v2 numeric evaluator remains deterministic and does not use the classic eight-dimensional semantic evaluator. No live API key is required.

`tests/lab.test.ts` covers privacy, frozen truth, migration, evidence restrictions, financial boundaries and full case progression. Browser tests cover the guided vertical slice, filters, mobile learning and legacy regression. Exports include Markdown, source records, finance bridge CSV, findings, risk register and 100-Day Plan in a dependency-free ZIP. `/learn` preserves attempt scores, assistance, weaknesses and a recommended path.
