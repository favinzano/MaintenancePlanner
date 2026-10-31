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

## Answer

Resolved on 2026-10-31. Corrected the malformed CSV quoting and used the installed parity tool on a derived input containing only the nine `plannermc_spec=yes` feature groups. PlannerMC tracked-scope coverage is 55.6/100 (two complete, six partial, one not implemented). This is not a competitor parity score: the source matrix covers two vendors and does not identify a single original app. No visual score was produced because `replica/screens/` has no reference captures for comparable screens and states. Details, gap ranking, and a recommended first build slice are in [parity.md](../../../replica/parity.md).

Refreshed on 2026-10-31 after the planner-source-to-PM-reference build slice. Reran the parity tool: the score remains 55.6/100 across nine current in-scope must-haves. Added a per-screen layout table and a behavior-evidence table; both comparison dimensions remain unscored because no matching original workflow screens, single original app, or original walkthrough were supplied. The report records the clone capture dimensions, the current QA evidence, seven incomplete must-haves, and the architecture-gated next slice. This refresh did not run browser/API QA.
