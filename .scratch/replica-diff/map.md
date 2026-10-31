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

## Refresh on 2026-10-31

- Rebuilt `replica/diffs/plannermc-scope.csv` from the current `plannermc_spec=yes` rows in `replica/features.csv` and reran the installed parity tool. The result remains 55.6/100: two complete, six partial, and one incomplete must-have.
- Updated `replica/parity.md` with current source-record and PM-reference evidence. The earlier source-to-PM recommendation is superseded because that slice is now implemented.
- Added a layout status for each existing clone capture and recorded its dimensions. There are still no matching original workflow screenshots, so every per-screen layout score remains unavailable. The vendor evidence matrix still does not define one original application; behavior comparison remains unscored without an original-app walkthrough.
- [Inference] The next architecture milestone is manual source intake and extraction locators, then external research. Relevant Q2/Q3 provider, data-transfer, file-format, and file-limit decisions remain prerequisites; this is a recommendation, not an approved ticket.
- This refresh recalculated feature coverage and documented existing QA evidence only; it did not run browser/API QA.
