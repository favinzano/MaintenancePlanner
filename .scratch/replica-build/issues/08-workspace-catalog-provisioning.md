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

## Answer

Implementation and automated acceptance are complete. `npm run test:catalog-provisioning` passed 10/10 and `npm run build` passed. A live PostgreSQL integration test could not be run because no local database service was available; the hosted development project was not modified. Real location/area values were not present in the repository and have not been fabricated or loaded. Production was not accessed. The feature matrix remains partial until the intended workspace catalog is supplied and verified.
