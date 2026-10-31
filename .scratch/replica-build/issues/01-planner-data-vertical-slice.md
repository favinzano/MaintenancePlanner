# Build the PlannerMC planner-data vertical slice

Type: task
Status: resolved
Triage: ready-for-agent
Blocked by: none

## Request

Implement the first vertical slice in the [replica-build feature specification](../spec.md).

## Scope

Preserve `/design`; implement a planner-led workflow at `/` using the agreed MacroCap Labs design system, a replaceable local data adapter, the existing PlannerMC product scope, feature-matrix progress, a build log, and a screenshot.

## Comments

- 2026-10-31: Claimed for implementation. The existing app is a visual gallery and the workspace has no Git metadata. Production account/provider/storage decisions remain open; the implementation will use clearly labeled local prototype behavior only.

## Answer

Implemented the planner-data workflow at `/`: intake, visible source limitations and explicit continuation, direct-child asset selection, editable PM draft, local save/read-back and resume, initial approval, and clipboard handoff. The workflow uses synthetic catalog values and explicitly reports that sign-in, external evidence/generation, and CMMS writeback are not connected. `/design` remains available. Updated the feature matrix and saved screen captures under `replica/clone-screens/`. Build and manual browser flow are recorded in [build-log.md](../../../replica/build-log.md). Next step: `/replica-backend`.
