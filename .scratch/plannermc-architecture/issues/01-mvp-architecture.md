# Propose MVP architecture, schema, and API

Type: task
Status: resolved
Triage: ready-for-agent
Blocked by: none

## Request

Prepare the next `replica-architect` flow deliverables for PlannerMC using the completed recon and current MVP documents.

## Scope

See [feature specification](../spec.md). Preserve unresolved plan decisions and do not implement the product.

## Comments

- 2026-10-29: Claimed to prepare the architecture proposal, SQL schema, API route map, risks, and build sequence.

## Answer

Completed the architecture proposal in [replica/architecture.md](../../../replica/architecture.md) and the relational schema proposal in [replica/schema.sql](../../../replica/schema.sql). The architecture contains 18 proposed PostgreSQL tables and 28 proposed API routes, carries forward the stack in technical-plan decisions D1–D4/D9, and preserves Q1–Q6 as unresolved. It defines ownership checks, transaction/read-back behavior, the main risks, and a planner-data vertical slice followed by the remaining MVP flows.

Tracking map: [map.md](../map.md). The next flow step is `/replica-design`; use [replica/brand-reference.md](../../../replica/brand-reference.md) for the user-directed MacroCap visual reference.
