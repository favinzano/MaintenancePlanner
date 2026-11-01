# PlannerMC replica-diff map

Scope: assess current implementation coverage against the PlannerMC MVP scope and identify evidence gaps for comparison with iMPS and Prometheus GWOS-AI.
For: Maintenance Planner.
Date: 2026-11-01.

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
- Earlier scope scores of 55.6/100 and 66.7/100 were superseded after issues 08–09; the current score is 77.8/100 across nine PlannerMC MVP feature groups. See [parity assessment](../../replica/parity.md).
- The source-intake-to-PM-reference and Q4 catalog-provisioning recommendations were implemented in later build issues. No remaining must-have is currently unblocked for implementation; see the latest refresh below.
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

## Refresh on 2026-11-01

- Reran the installed parity tool against `replica/diffs/plannermc-scope.csv`. The result is 66.7/100: four of nine must-haves complete, four partial, and one unimplemented. Issue 07 (PM draft deletion) is covered by the existing review/version-lifecycle row and does not change the feature score.
- Rechecked the comparison inputs. `replica/screens/` contains no original workflow captures; the existing clone captures are PlannerMC-only. Layout and original-versus-clone behavior scores remain unavailable.
- Recorded the five incomplete rows in parity order with their blockers. [Inference] Q4 catalog provisioning is the recommended next `/replica-build` candidate; the existing catalog is explicitly synthetic, and real location/area values must come from the intended workspace.
- This refresh recalculated the feature score and updated the comparison report only; it did not rerun browser/API QA or change product code.

## Refresh after automated QA on 2026-11-01

- Reran the parity tool against `replica/diffs/plannermc-scope.csv`: 77.8/100, five of nine must-haves complete and four partial. The full local E2E suite passed 12/12 after fixing QA-08; this accessibility correction does not change any feature-matrix status.
- The four partial requirements remain conversation/voice, generated PM content, manual/research sources, and external-source provenance. ADR 0002 defers provider-based generation, research, and speech. Manual upload limits remain unset until representative manuals and live development database use are measured; production also requires capacity, backup, retention, and restore criteria.
- No original workflow screenshots or selected original app are available, so layout and behavior comparisons remain unscored. The updated local QA evidence is in [`replica/test-plan.md`](../../replica/test-plan.md).
- Measured the live development database in a TLS-verified `READ ONLY` transaction: database size 12,375,731 bytes; one synthetic QA manual of 629 bytes; `original_documents` table size 65,536 bytes. This completes only the database-use baseline. No representative manual was available, so it does not justify upload limits. Current published Supabase Free-plan database quota is 500 MB; the 2 GB provisioned disk is a separate limit.

## Next flow step

Continue with `/replica-build` issue [10](../replica-build/issues/10-manual-capacity-bounds.md): locally profile representative manuals to set defensible development byte/page/storage limits. The live development DB baseline is now measured, but its only saved manual is a synthetic 629-byte fixture and cannot stand in for real documents. Keep uploads fail-closed and production disabled until the required measurements and recovery gates exist. Research, technical generation, and voice require separate provider and data-handling decisions.
