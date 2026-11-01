# Provision a workspace location and area catalog

Type: task
Status: resolved
Triage: ready-for-agent
Blocked by: none

## Request

Resolve architecture question Q4 and implement the operator-managed provisioning path for a workspace's preconfigured location and area catalog.

## Scope

- Accept a validated JSON manifest containing one workspace ID and its locations with their areas.
- Add an operator-only command that writes directly to PlannerMC PostgreSQL using server-side credentials; do not add a browser administration route or UI.
- Require explicit environment and workspace confirmation. Require an extra confirmation for production and for remote database targets, with verified TLS for remote PostgreSQL.
- Apply all entries in one transaction, keyed case-insensitively by name within the workspace/location. Repeated runs must retain IDs and update display-name casing without duplicating rows.
- Preserve existing catalog rows omitted from a manifest; this command must not delete or deactivate catalog entries.
- Verify each requested location and area through a separate post-commit read-back.
- Preserve owner/workspace validation in the existing authenticated analysis intake API.
- Use only clearly synthetic examples for local/development verification; do not provision or modify a production catalog.
- Record the Q4 decision in an ADR and update architecture, feature coverage, build log, test plan, and issue map.

## Acceptance

- Invalid UUIDs, empty catalogs, locations without areas, blank names, duplicate case-insensitive names, mismatched manifest/confirmation workspace IDs, environment mismatches, and unapproved remote/production targets fail before writes.
- A missing workspace fails without writes.
- Provisioning is transactional and idempotent, preserves catalog IDs for matching names, and does not remove omitted records.
- Independent read-back confirms every manifest location and area before the command reports completion.
- The intake catalog reader maps only the authenticated user's workspace and its areas.
- Automated tests cover manifest validation, fail-closed environment selection, transaction/rollback, idempotency calls, read-back, and workspace-scoped catalog reading.
- Build succeeds. No production service is accessed or changed.

## Comments

- 2026-11-01: Selected after `/replica-diff`. The user authorized implementing the operator-managed Q4 catalog-provisioning path. The current catalog remains synthetic until real workspace values are supplied.
- 2026-11-01: The user authorized read-only inspection of OPS and completion of the development catalog. OPS showed 4 active location roots with 16 direct Area children. The `plannermc-dev` workspace was the only PlannerMC workspace; its existing synthetic rows were retained. An initially missing name-key migration caused the first provisioning transaction to roll back. After the migration was applied and recorded, the dry-run and live provision completed with TLS and independent read-back. The authenticated intake UI showed the location/area mappings. No QA analysis was saved.

## Answer

Implementation and acceptance are complete for the development catalog. `npm run test:catalog-provisioning` passed 10/10; the live `plannermc-dev` dry-run, transactional provision, post-commit read-back, separate count check, and authenticated selector check passed. The catalog now has 4 OPS-derived locations and 16 corresponding areas, alongside 2 retained synthetic locations and 4 retained synthetic areas. The local manifest is ignored and not committed. The dashboard displayed `main / PRODUCTION`. Supabase documents that the branch selector can display this by default on every project when using dashboard branching without GitHub integration; the label alone does not establish production use. The CLI was explicitly set to `development` and targeted `plannermc-dev`; no separate production project was accessed. Production readiness is not claimed. See [Supabase Dashboard Branching](https://supabase.com/docs/guides/deployment/branching/dashboard).
