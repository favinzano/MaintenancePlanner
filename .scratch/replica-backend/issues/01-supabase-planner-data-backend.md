# Implement the Supabase-backed planner-data slice

Type: task
Status: resolved
Triage: ready-for-agent
Blocked by: none

## Request

Implement the accepted `/replica-backend` step for the existing planner-data flow using Supabase Auth, Fastify, and PostgreSQL.

## Scope

Follow the [feature specification](../spec.md). Preserve `/design`, retain an explicit local prototype mode, and connect a configured Supabase mode to the Fastify API and PostgreSQL. Limit behavior to the planner-data slice already present.

## Comments

- 2026-10-31: Claimed after the product owner approved the Supabase Auth/PostgreSQL decision. Do not create a production project, invite users, or publish credentials as part of this issue.
- 2026-10-31: Completed the bounded hosted development smoke. Temporary Auth users and planner rows were removed. SMTP invitation delivery remains outside this verification because SMTP is not configured.
- 2026-10-31: A later product-owner request authorized a single development invitation test to the organization owner. The result is tracked separately in [02-dev-auth-invitation-delivery](02-dev-auth-invitation-delivery.md); it does not change this issue's original scope.

## Answer

- Implemented the bounded planner-data slice: Supabase email/password sign-in and invitation setup, Fastify JWT verification, workspace loading, and analysis create/update persistence with ownership checks, idempotency, optimistic versioning, and post-commit read-back.
- Added the local Supabase migration/seed, invitation operator script, environment template, and setup guide. Browser-local prototype mode remains available.
- Created an isolated hosted development project, configured invitation-only email Auth, applied the planner-data migration and synthetic seed, and verified hosted health plus schema/catalog results through Composio.
- With the downloaded Supabase root CA and certificate validation enabled, Fastify connected to hosted PostgreSQL. Two temporary confirmed users passed password sign-in; anonymous access was rejected; authenticated workspace reads were owner-scoped; analysis/assets persisted with read-back; idempotent replay succeeded; cross-account writes and stale versions were rejected.
- Confirmed cleanup removed both test users and all test planner rows. The temporary API process and smoke script were stopped/removed.
- `npm run build`, `node --check scripts/invite-user.mjs`, and `git diff --check` passed. Vite emitted a 590.53 kB bundle-size warning. `npm audit` reported zero vulnerabilities during the initial dependency review.
- At this issue's closure, invitation delivery had not been exercised. The later development invitation test is recorded in issue 02. No production project or production credentials were created.
- No automated test suite was added or run; verification used an ephemeral smoke script.
