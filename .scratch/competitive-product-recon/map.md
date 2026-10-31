# Recon map: iMPS y GWOS-AI para PlannerMC

Scope: capacidades de planificación y preparación de mantenimiento descritas oficialmente, comparadas con la especificación PlannerMC; MacroCap Operations se usa como referencia visual indicada por el usuario.
For: Maintenance Planner de PlannerMC.
Date: 2026-10-29.

## Sources

| # | Source | URL | Notes |
| --- | --- | --- | --- |
| 1 | Innovapptive iMPS | https://www.innovapptive.com/software/planning-and-scheduling-software | Página oficial de producto y flujo de seis etapas; declaraciones de proveedor. |
| 2 | Prometheus-AI capabilities | https://www.prometheusgroup.com/ai-capabilities | Página oficial sobre GWOS-AI, comandos en lenguaje natural, planificación y aprendizaje. |
| 3 | GWOS-AI for Oracle | https://www.prometheusgroup.com/solutions/planning-and-scheduling-oracle | Guía de planificación, Scheduler, Shift Updater y sincronización Oracle descrita por el proveedor. |
| 4 | Planning & Scheduling for SAP | https://www.prometheusgroup.com/solutions/planning-and-scheduling | Dashboard, Scheduler, Shift Updater, Order Planner, Work Package Manager y Material Shopping Cart. |
| 5 | MacroCap Operations | https://ops.macrocaplabs.com/production-operations/daily-overview | Vista de Daily Overview observada en una sesión ya abierta del navegador; solo se conservaron detalles visuales. |
| 6 | Logo MacroCap Labs | https://ops.macrocaplabs.com/macrocap-labs-logo-auth-384-v2.avif | Logo visto en la página de acceso, alt MacroCap Labs, 224×71 px. |
| 7 | Especificación PlannerMC | specs/001-plannermc-mvp/spec.md | Base normativa local para la comparación. |
| 8 | Constitución PlannerMC | docs/constitution.md | Restricciones del proyecto sobre stack, lógica, persistencia e idioma. |

## Core loop

- **iMPS, según Innovapptive:** demanda desde ERP/EAM y señales de mantenimiento → paquete de trabajo con evidencia → readiness y restricciones → recomendación de programación → aprobación/despacho → feedback de ejecución.
- **GWOS-AI, según Prometheus:** revisar backlog y trabajos fechados → planificar PM y correctivos → asignar y optimizar por crew/location → actualizar disponibilidad y programación → incorporar resultados de ejecución.
- **PlannerMC, según su spec:** recibir manual, investigación o datos del planner → registrar límites y procedencia → proponer equipo/assets y PM en inglés → obtener decisiones y aprobación del planner → conservar versiones y permitir copia manual al CMMS.

## Screens

| ID | Screen | Route / how to reach | Purpose | Key components | States seen |
| --- | --- | --- | --- | --- | --- |
| S01 | MacroCap Operations sign-in | /sign-in?next=..., redirección observada en navegador sin sesión | Acceso al portal | Logo MacroCap Labs, campos Username/Password, botón Sign in, Forgot password?, cambio de tema | Vista oscura; campos vacíos; no se inició sesión |
| S02 | MacroCap Production Operations / Daily Overview | /production-operations/daily-overview, vista en navegador con sesión existente | Resumen diario de producción | Barra superior, navegación lateral, selector semanal/diario, KPI cards, gauge, gráficas, tablas y filtros | Tema oscuro; overview cargado; solo se anotó diseño, no datos |
| V01 | iMPS public product page | URL en Sources #1 | Describir el flujo y agentes | Ilustraciones y capacidades descritas por el proveedor | Material de marketing; no se observó una sesión del producto |
| V02 | GWOS-AI public product pages | URLs en Sources #2–4 | Describir módulos y capacidades | Descripciones de módulos; una página menciona Gantt y recursos | Material de marketing; no se observó una sesión del producto |

## Flows

F01 iMPS: preparar y programar trabajo listo

Demand intake → evidence-backed package → readiness gate → constraints → scheduler approval → dispatch → execution feedback

Exact screen sequence and click count: no observado.

F02 GWOS-AI: guiar la planificación y equilibrar la programación

Review backlog → insert fixed-date work → plan PM and corrective work → optimize by crew/location → update availability → learn from completion

Exact screen sequence and click count: no observado.

F03 PlannerMC: producir una PM lista para revisar y copiar

Equipment and evidence → authorized analysis → asset hierarchy → PM proposal → review/technical input → approval/version → manual CMMS copy

Source: PlannerMC spec; no UI implementation observed.

## Components

| Component | Variants / appearance | States | Used on |
| --- | --- | --- | --- |
| MacroCap wordmark | Logo image with cyan MacroCap and green LABS; no ™/® character seen in the two views | Image and compact application icon observed | S01, S02 |
| Navigation | Dark vertical sidebar with thin outline icons; headings group production, executive operations, operator logs, and maintenance | Expanded section and collapsed child navigation visible | S02 |
| Top bar | Breadcrumb, action button, location selector, account, notifications, pinned notes and theme toggle | Default dark theme | S02 |
| Date controls | Previous/next period, date picker, This week, Today, weekday tiles | Selected day indicated by yellow Today badge | S02 |
| KPI card | Small pictogram, metric name, large value and secondary label | Seven cards visible | S02 |
| Status / chart colors | Blue-gray, green, pale violet, yellow, and muted rose signals | Several chart series and status badges visible | S02 |
| Data table | Dense columns, per-column menus, filters/search, export action | Loaded rows; no filtering action performed | S02 |

## Inferred data model

- iMPS: WorkDemand, AssetHistory, WorkPackage, Operation, Material, Trade, Permit, ReadinessBlocker (owner and due date), ScheduleConstraint, Assignment, ExecutionResult. Evidence: vendor page #1. Confidence: medium, inferred from product descriptions.
- GWOS-AI: WorkOrder, TaskTemplate, BOM/Material, Inventory, Labor/Craft/Crew, Availability, ScheduleAssignment, WorkPackageDocument, ExecutionActual. Evidence: vendor pages #2–4. Confidence: medium, inferred from product descriptions.
- PlannerMC: Asset, OriginalDocument, Source, ProposedAsset, PM, PMVersion, PlannerDecision, TechnicalValidation, UserPreferences. Evidence: local spec. Confidence: high as specified, not as implemented.

Relationships and fields beyond the cited descriptions are hypotheses, not vendor schema. No private model, API, or database was inspected.

## Feature matrix

See [features.csv](./features.csv). The columns are adapted for two reference vendors and one local specification. They are not compatible with the replica skill's single original/clone parity script.

## Out of scope

- Reconstructing proprietary iMPS or GWOS-AI screens, source code, private APIs or customer-specific configuration.
- Treating vendor performance claims as independently confirmed results.
- Capturing the values or identities displayed in the user's authenticated MacroCap Operations session.
- Adding scheduling, procurement, inventory or ERP/CMMS writeback to PlannerMC's MVP; those are outside its current spec.
- Replacing MacroCap's actual logo with a hand-drawn approximation. The user requested the existing brand reference for the later PlannerMC design.

## Comparative assessment

[Inference] **iMPS** is the closest reference for the evidence-backed work-package and readiness portions of industrial planning. Its published output is a schedule-ready work package built around existing work orders, asset history, materials, trades and permits. PlannerMC's output is a planner-reviewed preventive maintenance procedure derived from manuals, research or operational input. The workflows touch, but their input, result, and decision boundary differ.

[Inference] **GWOS-AI** is the stronger reference for planning UX around work orders, task templates, material lookup, crew availability, Gantt scheduling and ERP-connected execution. PlannerMC does not currently schedule work orders or write to a CMMS. The cited pages do not establish that GWOS-AI generates manual-grounded PM procedures with PlannerMC's 15-step, bilingual voice/text, provenance and versioning requirements.

[Inference] **MacroCap Operations** contributes the visual direction requested by the user. It is not treated as a functional benchmark for maintenance PM authoring. Its observed daily dashboard does show an operations-oriented layout with dense metrics, location context, charts, status signals and tables.

## Size

No implementation size assigned. This is a comparative recon, not a clone specification; the live workflows of iMPS and GWOS-AI were not available for screen-by-screen inspection. PlannerMC's implementation planning remains in specs/001-plannermc-mvp/plan.md with technical decisions still marked there.

## Known limits / fog

- iMPS and GWOS-AI capabilities here are vendor-described; no product account, interactive demo or independent performance evidence was inspected.
- No exact click paths, screen states, validation errors or responsive behavior were observed for iMPS/GWOS-AI.
- MacroCap's light theme was available as a control but was not inspected. Only the dark theme is documented.
- The observed font is Geist Variable; the source icon library was not verified.
- The logo AVIF contains compression/antialiasing. Its representative cyan/green pixel values below are approximate samples, not official brand-guideline values.

## Notes

- The feature matrix compares capability statements with PlannerMC's current MVP. It does not establish product parity or operational performance.
- Product page text is vendor-authored. Where a page does not describe a feature, the matrix uses no evidence rather than asserting that the product lacks the feature.
- MacroCap visual tokens were read from the public sign-in page. The authenticated dashboard was used only to observe layout and icon treatment; its displayed operational values were excluded.
- Root GLOSSARY.md, GLOSSARY-MAP.md and docs/adr/ files were not present in the workspace file inventory.

## Decisions-so-far

- Keep iMPS and GWOS-AI as functional references and MacroCap Operations as the user-directed visual reference.
- Use the existing MacroCap Labs logo and visible identity during PlannerMC design work. Do not rename PlannerMC from this recon.
- Keep this work documentary. No changes to the MVP scope or implementation are part of step 1.
- Continue to the design stage after review of this recon.

## Fog

- Product behavior inside authenticated iMPS and GWOS-AI environments remains unobserved.
- Official performance and ROI claims have not been independently verified.
- MacroCap light-theme colors, official brand guidelines, icon package, and licensing/hosting terms for the font and logo remain unverified.
- Exact integration direction and writeback behavior can vary by the specific ERP/EAM deployment; the vendor pages do not establish one uniform contract for all supported systems.
