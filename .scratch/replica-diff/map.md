# PlannerMC replica-diff map

Scope: assess current implementation coverage against the PlannerMC MVP scope and identify evidence gaps for comparison with iMPS and Prometheus GWOS-AI.
For: Maintenance Planner.
Date: 2026-10-31.

## Sources

| Source | Use |
| --- | --- |
| `replica/features.csv` | Existing competitor evidence and PlannerMC scope matrix. |
| `specs/001-plannermc-mvp/spec.md` | Approved product scope and acceptance criteria. |
| `replica/build-log.md` | Implemented and partial features in the current slice. |
| `replica/test-plan.md` | QA limits and current manual evidence. |
| Installed `replica-diff` skill | Scoring/report workflow. |

## Decisions-so-far

- This matrix has two competitor evidence columns and a PlannerMC scope column; it does not identify one original application. No single-app competitive parity score will be claimed.
- Report a weighted coverage score only for rows marked `plannermc_spec=yes`; label it as PlannerMC MVP scope coverage, not product-to-product parity.
- Keep `no evidence` distinct from evidence that a competitor does not have a capability.
- There are clone workflow screenshots but no reference application screenshots under `replica/screens/`; visual layout parity is therefore unscored.
- The malformed quoting in the dated PM version feature row was corrected so standard CSV readers can parse the matrix.
- Scope-only weighted coverage is 55.6/100 across nine tracked PlannerMC MVP feature groups; two groups are complete, six partial, and one unimplemented. See [parity assessment](../../replica/parity.md).
- The first recommended build slice follows source intake through evidence provenance to an editable PM proposal. This is a dependency-based recommendation, not an approved implementation ticket.
- Completed the `/replica-diff` analysis and resolved [issue 01](issues/01-plannermc-feature-and-layout-diff.md). The next flow step is `/replica-build`.

## Fog

- Competitor evidence is a synthesis of earlier research and does not establish complete feature inventories or screen-by-screen behavior for either vendor.
- No production readiness or deployment verdict is in scope for this comparison.
