# PlannerMC architecture planning

**Status:** scoped documentation task  
**Date:** 2026-10-29

## Objective

Turn the completed public product recon and current PlannerMC MVP specification into a reviewable architecture proposal for the existing product scope.

## Scope

- Record the stack already proposed in `specs/001-plannermc-mvp/plan.md`, including its unresolved conditions.
- Define a relational PostgreSQL schema proposal and a route catalog for the PlannerMC flows.
- Set out ownership checks, transaction boundaries, async work, known risks, and a thin vertical-slice build order.
- Preserve MacroCap Operations as the requested visual reference for the later design step.

## Out of scope

- Changing the product spec, constitution, or technical plan.
- Choosing deployment, AI/OCR/search/voice vendors, data retention terms, file limits, account-provisioning operations, or recovery objectives that remain open as Q1–Q6.
- Implementing application code, connecting to private vendor systems, or testing a running product.
- Adding scheduling, inventory, procurement, CMMS writeback, or other items excluded from the MVP.

## Acceptance criteria

- `replica/architecture.md` records the proposed stack, responsibilities, API flows, risks, and staged build order.
- `replica/schema.sql` gives a concrete PostgreSQL schema proposal aligned to the local spec and distinguishes enforceable SQL constraints from domain-layer checks.
- `.scratch/plannermc-architecture/map.md` records sources, decisions, and unresolved questions.
- The work issue is resolved with a concise pointer to the deliverables.
