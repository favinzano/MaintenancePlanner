# PlannerMC QA for the current development slice

## Scope

Review the authenticated workspace and the implemented planner-data flow using the local app and the hosted development project. Use the existing manual workflow record and backend smoke report as prior evidence; do not treat those checks as a new run.

This pass covers the authenticated workspace, starting an analysis, and required-field validation. Follow-up coverage includes evidence decisions, asset confirmation, PM editing/approval/copy, reload recovery, keyboard and mobile use, session expiry, and multi-account behavior.

## Boundaries

- No production project or external CMMS is in scope.
- Manual upload, OCR, external research, technical-content generation, and voice are not implemented in this slice.
- Do not submit operational maintenance content as test data.
- Record test-created development data explicitly and ask before deleting it.

## Acceptance

- Record each case with its method, result, and evidence source.
- Report only reproduced bugs. Unverified concerns go under `To check`.
- Keep existing build and backend evidence distinct from this pass.
