# PlannerMC replica-backend map

Scope: authenticated Fastify/PostgreSQL persistence for the implemented planner-data slice.
For: Maintenance Planner.
Date: 2026-10-31.

## Sources

| Source | Use |
| --- | --- |
| `specs/001-plannermc-mvp/spec.md` | Product behavior and acceptance criteria. |
| `specs/001-plannermc-mvp/plan.md` | P2 identity and persistence requirements. |
| `replica/architecture.md` | Approved architecture boundaries and remaining questions. |
| `docs/adr/0001-supabase-auth-and-postgres.md` | Accepted identity, database, and backup decision. |
| `docs/constitution.md` | Domain separation, read-back, and testing requirements. |

## Decisions-so-far

- Use Supabase Auth for individual email/password accounts; invitations and recovery are operator-managed.
- Use Fastify as the only route for PlannerMC data operations; use managed PostgreSQL as the source of truth.
- Keep this slice limited to the current planner-data workflow. Manuals, external providers, voice, PM revision history, and production deployment are later work.
- Hosted development project `plannermc-dev` is provisioned; Auth is invitation-only, the migration and synthetic seed are applied, and health/schema/catalog checks passed. A CA-verified API smoke covered Auth, persistence/read-back, idempotency, owner isolation, and stale-version rejection; its temporary users and rows were removed. Tracking issue is resolved: [01-supabase-planner-data-backend](issues/01-supabase-planner-data-backend.md).
- One development invitation to the organization owner was sent through Supabase Auth and logged as `mail.send` with HTTP 200; the Auth invitation and PlannerMC profile/preferences were verified. Gmail receipt was not checked. Details: [02-dev-auth-invitation-delivery](issues/02-dev-auth-invitation-delivery.md).
- Tracking issue: [01-supabase-planner-data-backend](issues/01-supabase-planner-data-backend.md).

## Fog

- PlannerMC frontend/API production hosting and supported voice browsers/devices.
- Initial production location/area catalog and workspace assignment workflow.
- Production Supabase project/plan, SMTP setup, file limits, backup retention, and recovery targets.
- Choose and configure a custom SMTP provider, then verify invitation delivery to a non-organization test recipient before production use.
