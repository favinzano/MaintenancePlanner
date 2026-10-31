# PlannerMC parity assessment

Date: 2026-10-31
Build assessed: current PlannerMC workspace and the tracked feature matrix.

## Result

**PlannerMC tracked-scope coverage: 55.6 / 100.** The score covers the nine rows marked `plannermc_spec=yes` in `replica/features.csv`, each currently marked `must`. Two are complete, six are partial, and one is not implemented. The weighted score uses 3 points per `must`, full credit for `yes`, half credit for `partial`, and no credit for `no`.

This measures progress against the selected PlannerMC MVP feature groups. It is not a measured parity score against Innovapptive iMPS or Prometheus GWOS-AI, and it is not a production-readiness assessment. The implementation completed so far is a bounded vertical slice, not the full MVP. The parity tool therefore reports the tracked MVP as not shippable until its remaining must-have groups are addressed.

The reproducible, normalized input used for this scope-only calculation is [`diffs/plannermc-scope.csv`](diffs/plannermc-scope.csv). Its `original=yes` rows are the features selected by `plannermc_spec=yes`; this input must not be interpreted as a single vendor's feature inventory.

## Feature coverage

| PlannerMC feature group | Status | Current evidence / remaining work |
| --- | --- | --- |
| Single-equipment intake with location and area | Partial | Intake and a synthetic local catalog exist; provisioned operational location and area data are not included. |
| Manual/OEM documents, external research, or planner data as PM sources | Partial | Planner-provided data is supported. Manual upload, external research, and source-grounded PM drafting are not implemented. |
| Source provenance, evidence references, and visible limitations | Partial | Planner-provided details and limitations are visible; field-level evidence references and external citations are not implemented. |
| Direct sub-assets under equipment | Yes | Root and direct children can be edited and confirmed individually. |
| English PM procedure with safety, operating state, actions, and final check | Partial | The planner can author these fields; technical PM generation and validation are not implemented. |
| 15-step limit and ask before splitting | Partial | The editor enforces 15 total steps; splitting an oversized PM is not implemented. |
| Review, edit, approve, and retain dated PM versions | Partial | Draft editing and initial approval exist; dated revision history is not implemented. |
| Bilingual Spanish/English text and voice conversation | No | Text/voice conversation and language preference are not implemented. |
| Copy PM manually to the selected CMMS | Yes | The PM can be copied for the planner to paste into the chosen CMMS; PlannerMC does not write to that system. |

## Competitor and visual comparison limits

The existing matrix contains separate `imps_evidence` and `gwos_ai_evidence` columns, not one `original` application. Its `no evidence` value means the current research matrix has no supporting evidence; it does not establish that a vendor lacks the feature. A defensible score against either vendor, or against their combined offering, cannot be calculated from this matrix as written.

The clone workflow captures exist under `replica/clone-screens/`, but `replica/screens/` contains no original-app captures. The MacroCap sign-in reference in `replica/design/source-sign-in.png` is not the same screen or state as the PlannerMC workflow captures. No layout score or visual diff image was produced.

## Five highest-ranked gaps

The installed parity tool orders these by priority, implementation credit, and feature area. That sorting is a gap ranking, not a dependency-aware delivery plan.

1. Bilingual Spanish/English text and voice conversation.
2. Complete single-equipment intake with location and area data.
3. Generate an English PM procedure from reviewed inputs.
4. Propose a split when a PM would exceed 15 steps.
5. Retain dated PM versions after approval.

The other incomplete must-have groups are manual/OEM source intake and field-level evidence provenance.

## Recommended next build slice

[Inference] Start with the source-to-draft path: accept a manual or planner-provided source, preserve its locator and limitations, and use reviewed evidence to prepare an editable English PM proposal. This addresses the source-intake, provenance, and PM-drafting gaps in one vertical flow while retaining planner review. File limits, external research providers, data retention, and production catalog provisioning remain open architecture decisions and need to be resolved for the corresponding production capabilities.

After this diff, the skill flow returns to `/replica-build` because seven tracked must-have groups remain incomplete.

## QA evidence carried forward

This report reuses the results and limits in [`test-plan.md`](test-plan.md); it does not claim a new QA run. The API rejection of a genuine expired JWT was verified, while the browser's automatic refresh/sign-in transition remains untested. Valid approval and clipboard behavior were not exercised against hosted development. The test plan also records that three synthetic analyses remain in development.

## Input correction

The `Review, edit, approve...` feature name in `replica/features.csv` contained unquoted commas, which caused standard CSV readers to parse it as extra fields. Its quoting was corrected. The existing competitor evidence and implementation status values were otherwise left intact.
