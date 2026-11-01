# PlannerMC replica-test map

Scope: QA the authenticated planner-data slice and carry forward earlier build/backend evidence without conflating the runs.
For: Maintenance Planner.
Date: 2026-11-01.

## Decisions-so-far

- `/replica-build` and `/replica-backend` have resolved tracker items.
- `/replica-test` was completed for the live Q4 catalog slice; the next workflow step is `/replica-diff`.
- Authenticated manual QA covered the negative and edge cases for intake, API failure/recovery, two-tab stale writes, and the incomplete-approval guard; detailed evidence and limits are recorded in [test-plan](../../replica/test-plan.md).
- Three synthetic analyses remain in the development workspace; the PM remains labeled QA-only and in Draft. No QA records were deleted. Empty-analysis persistence and losing unsaved intake on reload remain product questions in [bugs](../../replica/bugs.md).
- Tracking issue resolved for the manual negative/edge scope. The real expired JWT was rejected at the save API boundary; browser auto-refresh behavior remains a documented limit: [01-planner-data-flow-qa](issues/01-planner-data-flow-qa.md).
- F07 live catalog QA passed: the OPS-derived catalog was provisioned to `plannermc-dev` with verified TLS, independently read back, and exposed through authenticated intake selectors. A new intake remained unsaved; synthetic sample locations and areas were preserved.
- `/replica-diff` refreshed coverage after the live catalog QA: 72.2/100, with five of nine PlannerMC must-haves complete. The next flow step was `/replica-build`, which implemented the bounded es/en language preference without enabling external generation or speech.
- F08 preference QA passed: the authenticated `en`/`es` setting persisted across reload in `plannermc-dev`, was restored to English, and the unauthenticated route returned 401. Responsive and keyboard checks passed; see [test-plan](../../replica/test-plan.md).
- Full local E2E regression rerun passed 12/12 on 2026-11-01 with the user-supplied Chromium 159.0.8136.0. The first focused responsive run reproduced QA-08, an axe `region` violation from orphaned screen-reader-only helper text; the helper was removed and the mobile selector uses its visible description. Focused and full reruns passed; see [test-plan](../../replica/test-plan.md) and [bugs](../../replica/bugs.md).

## Fog

- A synthetic invalid bearer and a genuine expired signed JWT were rejected with HTTP 401 at the save API; the browser client's auto-refresh/sign-in transition remains untested. The incomplete-approval guard passed; its button remains enabled as a UX follow-up. Valid approval and clipboard behavior are outside this negative/edge-case scope.
- Automated Playwright and axe coverage now exercises the local prototype source-to-draft flow, required intake validation, incomplete-approval rejection, valid approval, and clipboard copy. Hosted auth refresh and valid approval/copy remain unverified.
- Automated QA found two reproducible S2/S3 issues in the PM editor: the handoff preview lacked keyboard focus, and overlapping timers could hide a newer save confirmation. Both fixes and regression checks are recorded in [bugs](../../replica/bugs.md).
- The latest automated QA reproduced and fixed one S3 accessibility issue (QA-08). E2E ran only against local Vite with synthetic local data; sandbox restrictions required `--no-sandbox` for the supplied Chromium binary. No hosted service was contacted by the suite.
- The Supabase project used for this QA is named `plannermc-dev`; the dashboard showed `main / PRODUCTION`. Supabase documents that this can be the default dashboard-branch label when branching is used without GitHub integration. The CLI was explicitly set to `development`; no separate production project was accessed. The label alone does not establish production use or readiness. See [Supabase Dashboard Branching](https://supabase.com/docs/guides/deployment/branching/dashboard).

## Next flow step

F08's focused unit, authenticated-browser, responsive, and keyboard checks passed. `/replica-diff` refreshed the PlannerMC-only score to 77.8/100. The four remaining must-haves are partial and depend on the deferred data-handling decisions or measured manual capacity; re-enter `/replica-build` when a bounded scope is unblocked.
