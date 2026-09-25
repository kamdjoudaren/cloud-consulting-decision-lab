# Decision Lab upgrade

September 2026 cloud-only pass: 48 dedicated architecture cases are active; the earlier 158-case bank is reserved without deleting historical attempts. PE filters and the PE learning path are no longer presented in the active library. Validation includes 54 unit tests and browser coverage for cloud discovery, portfolio publication, mobile layout and retained legacy case functionality. See [Cloud portfolio](CLOUD_PORTFOLIO.md).

## Audit and migration decisions

- KEEP: Next/React, SQLite/Drizzle aggregates, version checks, public scenario allow-lists, discovery notebook, options, immutable ADRs and reasoning snapshots, local portfolio and Markdown export.
- REFINE: scenario metadata, stakeholder knowledge, evidence matching, difficulty gates, coaching, scoring and progress. Existing rubric remains available for legacy cases.
- MIGRATE: curated scenarios gain optional versioned consulting configuration. A private per-case truth snapshot freezes the selected scenario/variant; existing sessions keep their original scenario before catalog updates. Existing drafts and immutable records are not rewritten.
- DEPRECATE: treating difficulty as a synonym for assistance, and treating field completion as sufficient evidence of sound economic reasoning in upgraded cases.

The previous implementation has 25 scenarios, a fixed 15-step workflow and an eight-dimensional structural rubric. It has no deal room, financial ledger, finding materiality, challenge rounds, or value-realization states. We extend its API, persistence and components rather than build a second application.

## Implementation contract

New simulations use explicit scenario configuration, private truth, evidence dependencies, stakeholder topic permissions, a frozen variant, and a difficulty-specific workflow. The first reference case tests whether rising AWS spend actually indicates worsening economics. The curated initial set covers cloud, FinOps, AI, buy-side DD, value creation, exit readiness, separation/integration and two staged mega-cases. Content stays in data modules, not React conditions.

Financial amounts are fictional USD planning inputs. Recurring savings, one-off savings, avoidance, capacity, revenue and risk reductions remain separate. A multiple-based illustration is never labeled realized enterprise value. No live vendor pricing, investment advice, or transaction valuation is implied.

## Delivered foundation

- 158 catalog scenarios, including 145 upgraded references across all eight requested families; the existing 25 cases are retained, with 12 enriched for new attempts. Family totals are Cloud 30, FinOps 22, AI/MLOps 17, Buy-Side 25, Value Creation 21, Sell-Side 10, M&A 10 and Mega-Case 10.
- Independent difficulty/assistance, frozen private variants, scoped interviews, gated source records and staged workstreams.
- Comparable economics, Technology → Value findings, 100-Day initiatives, audience communication, executive challenges, ten-dimensional feedback and preserved evaluation history.
- Learning path, glossary/driver maps, PE lifecycle filters and Markdown/CSV/ZIP work products.
- Backward-compatible case truth snapshots and unchanged historical drafts, ADRs and reasoning records.

Verification: 50 Vitest tests, four Playwright browser flows, strict TypeScript and production build pass. Integration tests complete the guided case, buy-side mega-case, value creation and exit-readiness paths; browser tests cover the full guided investigation and classic regression, filters, exports and mobile layouts. The existing user case was checked read-only after migration and remains in Discovery.

The numeric v2 rubric and stakeholder/evidence engine are deterministic. Optional live review is not verified by these mock-mode tests. The bank now sits within the requested initial scale; each entry is a structured reference seed using shared validated behavior, and the authoring guide describes how to deepen or split family modules without adding UI branches. See [scenario authoring](SCENARIO_AUTHORING.md) for expansion contracts and known scoring limits.
