# ADR 0003: Operator-managed workspace location and area catalog

- **Status:** Accepted
- **Date:** 2026-11-01
- **Decision owners:** Product owner delegated the catalog-provisioning slice to the assistant

## Context

The MVP requires each analysis to select a preconfigured location and area. It does not include catalog administration UI. Synthetic local values support development, but a real workspace must receive its own catalog before operational intake.

## Decision

- An authorized operator provisions locations and areas using `npm run catalog:provision` and a JSON manifest. The CLI is a server-side bootstrap tool, not a browser route.
- The manifest names one workspace and gives each English location name with at least one English area name. The operator confirms the same workspace ID and target environment on the command line.
- Provisioning validates the entire manifest before writes, checks the workspace in PostgreSQL, and applies all entries within one transaction.
- Location names are case-insensitive unique within a workspace. Area names are case-insensitive unique within a location. Matching entries are upserted in place so their IDs remain stable. Entries absent from a manifest are preserved; provisioning does not delete or deactivate rows.
- The command performs a separate post-commit read-back of every requested location and area before reporting success. If read-back fails after commit, the same manifest can be rerun safely.
- A dry run checks the target workspace without writing. Remote database use requires a verified CA and an explicit `--allow-remote`; production also requires an explicit `--confirm-production` flag and a matching `PLANNERMC_ENVIRONMENT` value. These flags do not establish production readiness or authorize a production write by themselves.
- Authenticated users continue to read only their assigned workspace catalog through the existing Fastify `/api/workspace` path. Analysis writes continue validating that the selected area belongs to the selected location and workspace.
- The committed example manifest contains synthetic local values only. Real site values must come from the intended workspace owner/operator.

## Consequences

- No catalog editor, public route, or user-controlled workspace selector is added.
- An omitted entry remains available to existing and new analyses. Renaming a location/area through a case-insensitive match preserves its row ID; removals and retirement require a separate reviewed lifecycle decision.
- The migration fails before creating unique indexes if legacy duplicate names need operator review.
- The application can be tested with synthetic catalog data without claiming that it contains a real site's locations and areas.

## References

- [Supabase development and catalog provisioning instructions](../../supabase/README.md)
- [Workspace catalog name-key migration](../../supabase/migrations/20261101120000_workspace_catalog_name_keys.sql)
