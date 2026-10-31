# PlannerMC bug report

## Fixed

### QA-03: PM preview scroll region could not receive keyboard focus

- Severity: S2
- Flow / case: F01-A1 and F01-A3
- Screen: PM editor
- Build: dirty `main` worktree  Browser / device: Playwright Chromium, local prototype mode

Steps
1. Open any PM editor with the handoff preview visible.
2. Run the axe accessibility scan, or tab through the page to the scrollable preview.

Expected: The scrollable preview can receive keyboard focus and be navigated by keyboard.

Actual: axe 4.14.0 reported `scrollable-region-focusable` with serious impact. The preview container had `overflow-y-auto` but no focusability or accessible region name.

Evidence: The first automated run failed this rule in both PM screen scans. After adding a named, focusable region, the targeted test passed.

Status: Fixed in commit `be07314`.

### QA-04: Older save notices could hide a newer confirmation

- Severity: S3
- Flow / case: F01-A1
- Screen: PM editor
- Build: dirty `main` worktree  Browser / device: Playwright Chromium, local prototype mode

Steps
1. Complete intake, save the evidence review and save the asset selection.
2. Enter the PM editor and select **Save draft** while earlier save notices are still within their display period.

Expected: The latest save/read-back confirmation remains visible for its display period.

Actual: The expected PM draft confirmation was absent by the time the automated check ran. Earlier notice timers cleared the notice state without checking which message they belonged to.

Evidence: The first automated run failed to find the PM draft confirmation after the save action. The regression check now observes the `role=status` message and verifies the reloaded draft. The full suite passed after the timer fix.

Status: Fixed in commit `be07314`.

## Other reproduced checks

The required intake fields block an empty submission, and the approval guard rejected incomplete PM approval while preserving Draft. No other confirmed product bugs were reproduced in this automated pass.

## Responsive manual intake QA

### QA-05: Manual intake responsive E2E

- Severity: untriaged; verification gap, not a reproduced product bug
- Flow / case: F02-E2
- Screen: Evidence / Manual documents
- Build: `main`  Browser / device: Chromium 159.0.8136.0 supplied for this workspace, Playwright

Steps
1. Run the manual intake layout test at 390×844 and 1440×1000 CSS px.

Expected: The Evidence screen has no horizontal overflow and no axe violations at either size.

Actual: Pass. Mobile (390×844 CSS px) and desktop (1440×1000 CSS px) had no horizontal overflow or axe violations. The test observed no console/page errors or HTTP 5xx responses.

Evidence: Playwright output for `e2e/manual-intake-layout.spec.ts`, 1 passed.

Status: Passed 2026-10-31. No UI defect was reproduced.

## Manual intake authorization and selection QA

### QA-06: Browser file chooser selection and local extraction

- Severity: no product defect reproduced; OS dialog visual coverage remains limited
- Flow / case: F02-E3
- Screen: Evidence / Manual documents
- Build: `main`  Browser / device: Chromium 159.0.8136.0, authenticated temporary development account

Steps
1. With upload limits set only in temporary local processes, open an authenticated synthetic analysis.
2. Click **Choose a manual to extract locally**.
3. Select the synthetic 629-byte PDF through the browser FileChooser.

Expected: The chosen file is parsed locally. The original is not sent to the API unless **Save original** is selected.

Actual: The visible label opened a FileChooser event. Chromium selected the synthetic PDF, and PlannerMC displayed one extracted page and the expected SHA-256 prefix. Network capture showed no request to the document upload endpoint. The temporary account had zero manual-document rows.

Evidence: Browser accessibility snapshot and API network list from the 2026-10-31 QA pass; see `replica/test-plan.md` and `replica/build-log.md`.

Status: Application file selection and local extraction passed. Playwright handled the chooser with `FileChooser.setFiles`; Windows dialog rendering and keyboard navigation within the dialog were not tested.

### QA-07: Manual download denied to a second account

- Severity: negative security check passed; no defect reproduced
- Flow / case: F02-N2
- Screen: Authenticated document API
- Build: `main`  Browser / device: Fastify API and Supabase `plannermc-dev`

Steps
1. Create a confirmed temporary Auth identity without sending an invitation.
2. Provision its profile in the same workspace as the synthetic QA manual's owner.
3. Sign in, load the account's workspace, and request the other owner's document ID.

Expected: The valid second account can use its workspace but cannot retrieve the other owner's manual.

Actual: Workspace read returned HTTP 200. Manual download returned HTTP 404 with the generic unavailable message. The API upload configuration remained disabled.

Evidence: Controlled API result recorded in the 2026-10-31 `replica/build-log.md` entry.

Status: Passed 2026-10-31. Temporary Auth identity, profile, and all QA rows were removed.

## To check

### QA-01: Empty analyses are persisted before intake details

- Severity: untriaged; not classified as a bug yet
- Flow / case: F01-H2
- Screen: Intake
- Build: dirty `main` worktree  Browser / device: Chrome, current development session

Steps
1. Open the authenticated Work planning page.
2. Select **Start an analysis**.

Expected: The intended draft-creation behavior should be clear before an empty record is persisted.

Actual: The intake form opened and the application saved an empty analysis before any equipment details were supplied. During this pass, that same record was reused for clearly labeled synthetic QA content and saved as `QA Sample Pump 001`; no separate empty QA record remains.

Evidence: Browser accessibility snapshots showed the intake form and later the saved QA analysis. `startAnalysis` calls `saveRecord` before entering the form, and the API route verifies the database read-back before returning. The UI displayed save/read-back confirmations. No separate SQL query was performed.

Suspected cause: The current start action creates and persists the analysis immediately.

Status: Product decision needed on whether empty analyses should be persisted before intake details and how abandoned drafts should be handled. This is not classified as a confirmed bug.

### QA-02: Approval action remains enabled without reviewer acknowledgement

- Severity: untriaged; UX follow-up, not a confirmed approval defect
- Flow / case: F01-N3
- Screen: PM draft
- Build: dirty `main` worktree  Browser / device: Chrome, authenticated development session

Steps
1. Open the QA-only PM draft.
2. Leave the reviewer acknowledgement unchecked.
3. Select **Approve PM**.

Expected: The UI should make the required review acknowledgement clear before approval can proceed.

Actual: The action remained enabled. Selecting it displayed the missing acknowledgement and duration errors. The handler returned before saving, and the PM remained Draft.

Evidence: Authenticated browser interaction and code-path review of `approvePm` in `src/PlannerWorkspace.tsx`. No valid approval was performed.

Status: Approval protection passed. Consider disabling the action until required checks pass as a UX improvement; no confirmed approval bypass was reproduced.
