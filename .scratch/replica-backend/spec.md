# PlannerMC Supabase backend slice

## Goal

Replace the local-only persistence and entry behavior for the existing planner-data workflow with a deployable Fastify API backed by Supabase Auth and PostgreSQL, while retaining an explicit local prototype mode for offline UI review.

## Scope

- Email-and-password sign-in through Supabase Auth. Do not add public registration or user administration.
- Fastify verifies each Supabase access token and derives the PlannerMC user/workspace from server-side profile data.
- PlannerMC operations go through Fastify. The browser does not query or mutate PlannerMC tables directly.
- Persist the existing planner-data slice: analysis intake, planner-provided evidence/limitation decision, one equipment asset with direct sub-assets, and one draft/initially approved PM.
- Scope all reads and writes to the authenticated profile and workspace.
- Verify writes through a separate read-back. Use row versions to report stale concurrent edits.
- Keep external service credentials on the server. The browser may use only the Supabase publishable key for Auth.
- Include local Supabase configuration/migrations and synthetic development catalog data, distinct from production data.

## Out of scope

- Manual upload, OCR, external research, AI generation, text/voice conversation, CMMS writes, later PM revisions, duplicate detection, production deployment, and production account invitations.
- Selecting production location/area catalogs, file limits, backup retention, recovery targets, SMTP provider, or production Supabase plan.
- Claiming a live Supabase service or production security posture without configuring and exercising a real project.

## Acceptance criteria

1. The app offers email/password sign-in only when Supabase configuration is present, and does not expose a registration action.
2. The local development setup has a migration that links PlannerMC profiles to `auth.users`; it contains no separate password hash.
3. Unauthenticated API operations are rejected. Authenticated API requests cannot choose their own owner or workspace IDs.
4. Planner data is persisted in PostgreSQL and recovered after reloading the app; saved rows are owner/workspace scoped.
5. A save reports success only after a separate database read verifies the saved resource. A stale row version is reported as a conflict.
6. `/design` remains available, and no manual/OCR/provider/CMMS behavior is implied to be active.
7. Build output compiles. Live Supabase behavior remains explicitly unverified unless local or hosted Supabase is configured and exercised.
