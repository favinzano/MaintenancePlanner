# Build the reviewed planner-source to PM-draft flow

Type: task
Status: resolved
Triage: ready-for-agent
Blocked by: none

## Request

Continue `/replica-build` with the user-approved source → reviewed evidence → editable PM draft slice.

## Scope

- Structure the existing planner-provided information as a source record with a reference label, locator, applicability, limitations, and review timestamp.
- Persist and read back the record in local prototype mode and through the authenticated Fastify/PostgreSQL path.
- Let the planner choose whether that reviewed source is referenced by the PM draft and preserve the reference in the PM preview and copied text.
- Keep PM content planner-authored and editable. Show when no source reference is attached.
- Update the feature matrix, build log, map, and a current workflow capture.

## Boundaries

- No manual file upload, OCR, external research, or generated technical instructions in this slice. Q2/Q3 provider and file-limit decisions remain open.
- Do not add a production size limit or send planner data to an external provider.
- Keep the operator responsible for reviewing source details and deciding whether to continue with visible limitations.
- Preserve existing analyses and PM versions.

## Acceptance

- A planner can review and save the source metadata for planner-provided information.
- The PM draft can include a clear reference to that source and its locator, applicability, and limitations.
- The server rejects malformed or mismatched source references and verifies the saved result by read-back.
- Manual/external-source and technical-generation gaps remain labeled partial.

## Comments

- Implemented the planner source record, review gate, PM-level reference, local normalization, authenticated API validation/persistence/read-back, and additive migration `supabase/migrations/20261031120000_planner_source_metadata.sql`.
- The additive migration is applied to `plannermc-dev`; read-only schema inspection confirmed the six metadata columns and migration-history entry.
- `npm run test:server-validation` passed 6/6 cases; `npm run build` passed. Browser/API QA saved the source, read it back, attached it to a PM draft, reloaded the app, and verified the reference remained. The incomplete approval attempt remained a draft and displayed its validation blockers.
- The current PM/reference screenshot was captured and shown inline during the browser review; the browser tool did not provide a repository image path. The synthetic QA development analysis now contains the saved source and draft PM.

## Answer

Implemented the reviewed planner-source to PM-draft flow. The server validates the planner source and limits PM references to the reviewed source on the same analysis; owner-scoped source and PM writes passed live read-back. Automated validation cases cover malformed IDs, cross-source IDs, duplicate references, and missing review. Manual/OEM upload, OCR, external research, generated technical content, and field-level citations remain outside this slice.
