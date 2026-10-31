# ADR 0001: Supabase Auth and PostgreSQL for the MVP

- **Status:** Accepted
- **Date:** 2026-10-31
- **Decision owners:** Product owner

## Context

PlannerMC needs individual planner accounts, persistent records, preservation of original manuals, and a way to verify writes by reading saved data. The existing planner-data slice uses browser-local storage and sample catalog values. It is a prototype, not the approved persistence model.

## Decision

Use managed Supabase for the MVP, with PostgreSQL as the source of truth and Supabase Auth for email-and-password authentication. Fastify remains the only application route for PlannerMC operations. It verifies the Supabase identity and enforces ownership on every read and write. Privileged Supabase keys and database credentials remain on the server.

Store original manuals as PostgreSQL `BYTEA` with metadata and hashes. Verify a manual write by reading the saved record and comparing its bytes, digest, and link to the analysis.

Accounts are individual and invitation-only. Public registration and a user-administration interface are out of scope. An authorized operator provisions accounts and handles recovery through Supabase Auth. Email delivery for invitations and recovery must be configured before production use.

Before production uploads are enabled, select a Supabase plan with database backups, set the maximum file size and backup retention, and complete a restore test. No production project, plan, file limit, backup retention, or restoration result is established by this ADR.

## Consequences

- The application profile identity maps to `auth.users.id`; PlannerMC does not store password hashes or duplicate authentication credentials.
- Browser clients authenticate with Supabase Auth but call Fastify for PlannerMC data. The browser does not connect directly to PostgreSQL or write PlannerMC tables through Supabase APIs.
- Fastify validates the Supabase access token and derives the user and workspace from server-side profile data. Request bodies cannot choose trusted ownership identifiers.
- Manual bytes stored in PostgreSQL are covered by database backups. This design does not use Supabase Storage for originals.
- The app's own hosting location, target browser/device matrix, production project, SMTP provider, catalog-provisioning procedure, exact limits, backup retention, and recovery targets remain to be selected or completed where noted in the plan.
- A successful database write is reported complete only after a separate read-back verifies the expected record.

## Alternatives considered

- **Self-managed PostgreSQL and application-owned authentication:** rejected for the MVP because it adds password, session, email, and backup operations that Supabase Auth and managed Postgres already provide.
- **Direct browser access to PlannerMC tables:** rejected because the approved application boundary keeps PlannerMC operations behind Fastify, where domain checks and write verification run.
- **Supabase Storage for manuals:** rejected for the initial design because originals are stored as `BYTEA` in PostgreSQL and included in the database restore boundary.

## References

- [Supabase Auth password authentication](https://supabase.com/docs/guides/auth/passwords)
- [Supabase JWT verification with `getClaims`](https://supabase.com/docs/reference/javascript/auth-getclaims)
- [Supabase invited users](https://supabase.com/docs/guides/auth/users)
- [Supabase database backups](https://supabase.com/docs/guides/platform/backups)
