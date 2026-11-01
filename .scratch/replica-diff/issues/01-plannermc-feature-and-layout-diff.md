# Assess PlannerMC implementation coverage and comparison evidence

Type: research
Status: resolved
Triage: ready-for-agent
Blocked by: none

## Request

Run the `/replica-diff` stage for the existing PlannerMC build. Use current project evidence, preserve the two-competitor distinction, and avoid unsupported visual or competitive parity claims.

## Scope

Prepare the feature coverage and layout comparison report, repair only the matrix syntax needed to parse its current rows, and identify the next in-scope build priorities.

## Comments

- 2026-10-31: Started after manual negative and edge-case QA was resolved. Workspace already contained uncommitted implementation and backend changes; preserve them.
- 2026-10-31 refresh after the planner-source-to-PM-reference slice: regenerated the normalized nine-row input from the current feature matrix and reran the parity tool. Coverage remains 55.6/100 (two complete, six partial, one incomplete). Updated the report; no comparable original workflow captures exist, so layout and behavior remain unscored. [Inference] The next architecture milestone is manual source intake and extraction locators, followed by external research, gated by Q2 provider/data-transfer decisions and Q3 upload-format/file-limit decisions. No browser/API QA was run in this refresh.
- 2026-11-01 refresh after issue 07 (PM draft deletion): reran the installed parity tool and updated the report. The current result is 66.7/100 (four complete, four partial, one not implemented). The score is PlannerMC MVP scope coverage, not vendor-product parity. There are no original workflow captures, selected original app, or original walkthrough; layout and behavior remain unscored. The current top-ranked gaps and Q4 catalog-provisioning candidate are recorded in `replica/parity.md`. This refresh did not rerun browser/API QA or change product code.
- 2026-11-01 refresh after issues 08–09 and automated QA: reran the installed parity tool; the result is 77.8/100 (five complete, four partial). The full local E2E suite passed 12/12 after fixing QA-08, with no change to feature-matrix statuses. The Q4 catalog is implemented; no remaining feature ticket is ready until manual-capacity measurements or deferred provider/data-handling decisions are resolved. Original-versus-clone layout and behavior remain unscored because there are no original captures or walkthrough.
- 2026-11-01 follow-up: completed a TLS-verified, read-only query against the repository-mapped development project. Database size was 12,375,731 bytes; the only `original_documents` row is the 629-byte synthetic QA PDF and the relation size is 65,536 bytes. This is a development baseline, not representative manual evidence or a capacity limit. Tracked the next bounded action as `/replica-build` issue 10, which needs locally profiled representative manuals.

## Answer

Resolved on 2026-10-31. Corrected the malformed CSV quoting and used the installed parity tool on a derived input containing only the nine `plannermc_spec=yes` feature groups. PlannerMC tracked-scope coverage is 55.6/100 (two complete, six partial, one not implemented). This is not a competitor parity score: the source matrix covers two vendors and does not identify a single original app. No visual score was produced because `replica/screens/` has no reference captures for comparable screens and states. Details, gap ranking, and a recommended first build slice are in [parity.md](../../../replica/parity.md).

Refreshed on 2026-10-31 after the planner-source-to-PM-reference build slice. Reran the parity tool: the score remains 55.6/100 across nine current in-scope must-haves. Added a per-screen layout table and a behavior-evidence table; both comparison dimensions remain unscored because no matching original workflow screens, single original app, or original walkthrough were supplied. The report records the clone capture dimensions, the current QA evidence, seven incomplete must-haves, and the architecture-gated next slice. This refresh did not run browser/API QA.

Refreshed on 2026-11-01 after issue 07 (PM draft deletion). The installed parity script returned 66.7/100: four of nine must-haves complete, four partial, and one not implemented. The score measures PlannerMC MVP scope coverage, not vendor-product parity. Added per-screen layout availability and behavior-comparison tables; both remain unscored because no original workflow captures, selected original app, or original walkthrough are present. Ranked the five incomplete requirements and documented Q4 catalog provisioning as the recommended next build candidate, subject to obtaining the intended workspace's real location/area values. This was a report refresh only; browser/API QA and product code were not changed.
