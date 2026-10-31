# QA the authenticated PlannerMC planner-data flow

Type: task
Status: resolved
Triage: ready-for-agent
Blocked by: none

## Request

Follow the `/replica-test` stage for the current PlannerMC build, using the current recon and keeping prior evidence separate from new checks.

## Scope

Review the authenticated development workspace and safely test the planner-data flow through PM draft persistence. Use only explicitly labeled synthetic content. Prepare a case plan and report only reproduced defects. Do not test features that the current build explicitly labels unavailable.

## Comments

- 2026-10-31: User authorized synthetic QA data in the development workspace. Reused the initially empty record as `QA Sample Pump 001`, reviewed the stated limitations, confirmed one asset, saved a QA-only PM as Draft, and reloaded the page. Save/read-back confirmations were visible; no separate SQL query was run. The PM remains in the development workspace. No approval, clipboard write, or deletion was performed.
- 2026-10-31: User asked to complete the remaining negative and edge cases before proceeding. Checked missing planner notes, reload during intake, rapid repeated start, 60-character input at a 390 px viewport, keyboard-only submission, API network failure and recovery, invalid-bearer rejection, a genuine expired signed JWT at the save endpoint, two-tab stale-write handling, and approval without reviewer acknowledgement. The temporary Auth identity was deleted and the project's JWT lifetime was restored to 3600 seconds. Results and limitations are in `replica/test-plan.md`. Three synthetic planner analyses remain in development; no planner records were deleted. Valid approval and clipboard behavior were not tested.

## Answer

Resolved for the manual negative and edge-case QA scope on 2026-10-31. Missing-note validation, mobile width, keyboard submission, network error and recovery, invalid-bearer rejection, genuine expired-JWT rejection at the save endpoint, double-start behavior, stale-tab conflict and recovery, and the incomplete-approval guard passed with the limits documented in [test-plan.md](../../../replica/test-plan.md). The expired-token check ran at the API boundary; the browser client's automatic refresh/sign-in transition was not exercised. The PM remains Draft, the temporary Auth identity was deleted, the JWT lifetime was restored, and no planner data was deleted or clipboard write made. No confirmed product bug was reproduced. Valid approval, clipboard behavior, automated Playwright coverage, and an axe scan are outside this negative/edge-case scope. Product decisions remain for empty-analysis persistence and warning about unsaved intake data on reload.
