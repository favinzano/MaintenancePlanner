# Automate the PlannerMC source-to-PM flow

Type: task
Status: resolved
Triage: ready-for-agent
Blocked by: none

## Request

Add repeatable browser coverage for the implemented PlannerMC workflow, including runtime error checks and accessibility scans on each visited screen.

## Scope

- Use isolated local-prototype mode and synthetic QA data only.
- Automate the happy path from workspace to PM draft and reload.
- Automate required intake validation and rejection of incomplete approval.
- Automate valid approval and clipboard copy using local synthetic data.
- Run axe on each workflow screen and fail tests on browser console errors or HTTP 5xx responses.
- Preserve the existing hosted manual QA results as separate evidence.

## Comments

- 2026-10-31: Claimed after the user requested `/replica-test`; the prior ticket covers manual edge and negative checks only.

## Answer

Added an isolated Playwright suite for the F01 source-to-PM flow, empty intake validation, incomplete-approval rejection, valid local approval, and clipboard copy. Each visited screen receives an axe scan, and the tests fail on console errors, page errors, or HTTP 5xx responses. The full suite passed 4/4 after fixing the keyboard-focusable PM preview and preventing stale notice timers from dismissing newer save confirmations. Tests use local prototype storage and synthetic data; hosted auth refresh and valid hosted approval/copy remain outside this pass. Results: [test-plan](../../../replica/test-plan.md), reproduced issues: [bugs](../../../replica/bugs.md).
