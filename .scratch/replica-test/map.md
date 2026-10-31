# PlannerMC replica-test map

Scope: QA the authenticated planner-data slice and carry forward earlier build/backend evidence without conflating the runs.
For: Maintenance Planner.
Date: 2026-10-31.

## Decisions-so-far

- `/replica-build` and `/replica-backend` have resolved tracker items.
- The next skill step is `/replica-test` because the workflow uses the Fastify/Supabase data layer.
- Authenticated manual QA covered the negative and edge cases for intake, API failure/recovery, two-tab stale writes, and the incomplete-approval guard; detailed evidence and limits are recorded in [test-plan](../../replica/test-plan.md).
- Three synthetic analyses remain in the development workspace; the PM remains labeled QA-only and in Draft. No QA records were deleted. Empty-analysis persistence and losing unsaved intake on reload remain product questions in [bugs](../../replica/bugs.md).
- Tracking issue resolved for the manual negative/edge scope. The real expired JWT was rejected at the save API boundary; browser auto-refresh behavior remains a documented limit: [01-planner-data-flow-qa](issues/01-planner-data-flow-qa.md).

## Fog

- A synthetic invalid bearer and a genuine expired signed JWT were rejected with HTTP 401 at the save API; the browser client's auto-refresh/sign-in transition remains untested. The incomplete-approval guard passed; its button remains enabled as a UX follow-up. Valid approval and clipboard behavior are outside this negative/edge-case scope.
- Automated Playwright and axe coverage now exercises the local prototype source-to-draft flow, required intake validation, incomplete-approval rejection, valid approval, and clipboard copy. Hosted auth refresh and valid approval/copy remain unverified.
- Automated QA found two reproducible S2/S3 issues in the PM editor: the handoff preview lacked keyboard focus, and overlapping timers could hide a newer save confirmation. Both fixes and regression checks are recorded in [bugs](../../replica/bugs.md).
