# PlannerMC parity assessment

Date: 2026-10-31
Build assessed: current PlannerMC workspace and the current tracked feature matrix.

## Result

**PlannerMC tracked-scope coverage: 55.6 / 100.** The score covers the nine rows marked `plannermc_spec=yes` in `replica/features.csv`. All nine are must-haves: two are complete, six are partial, and one is not implemented. The calculation uses three points per must-have, full credit for `yes`, half credit for `partial`, and no credit for `no`.

This is the feature score for the selected PlannerMC scope. A combined feature-and-layout score is not calculated because there are no comparable original workflow captures.

The parity tool classifies this scope as **not shippable** because seven tracked must-haves are incomplete. This is a scope-coverage result, not a production-readiness or vendor-comparison verdict.

The reproducible input at [`diffs/plannermc-scope.csv`](diffs/plannermc-scope.csv) was regenerated from the current feature matrix. Its `original=yes` values only make the filtered PlannerMC scope rows count in the tool; they do not identify a source vendor or assert product parity.

## Feature coverage

| PlannerMC feature group | Status | Current evidence and remaining work |
| --- | --- | --- |
| Single-equipment intake with location and area | Partial | One equipment can be analyzed; the current location and area catalog is synthetic rather than provisioned operational data. |
| Manual/OEM documents, external research, or planner data as PM sources | Partial | Planner-provided information is now a reviewed source record that can be referenced by a PM. Manual upload, external research, and technical generation are not implemented. |
| Source provenance, evidence references, and visible limitations | Partial | Planner source details, review status, PM-level references, and limitations are persisted. Field-level citations and external source references are not implemented. |
| Direct sub-assets under equipment | Yes | The equipment root and direct children can be edited and confirmed individually; deeper hierarchy is not available. |
| English PM procedure with safety, operating state, actions, and final check | Partial | The planner authors the procedure. The editor provides these fields, but technical content is not generated or validated. |
| 15-step limit and ask before splitting | Partial | The editor counts the opening statement and final verification toward 15. PM splitting is not implemented. |
| Review, edit, approve, and retain dated PM versions | Partial | Draft editing, save/read-back, and initial approval exist. Dated revision history is not implemented. |
| Bilingual Spanish/English text and voice conversation | No | Text/voice conversation and language preference are not implemented in this slice. |
| Copy PM manually to the selected CMMS | Yes | The PM and individual steps can be copied for manual paste; PlannerMC does not contact a CMMS. |

## Highest-ranked gaps

The parity tool ranks incomplete rows by priority, completion credit, area, and feature name. This ranking is not a dependency-aware delivery plan.

1. Bilingual Spanish/English conversation by text and voice.
2. Operational location and area data for single-equipment intake.
3. Generated English PM procedures.
4. A planner decision and split proposal when a PM exceeds 15 steps.
5. Dated revisions after approval.

Other incomplete must-haves are manual/OEM source intake, external research, and field-level evidence references.

## Competitor comparison limits

`replica/features.csv` has separate evidence columns for iMPS and Prometheus GWOS-AI. It does not describe one original application. A `no evidence` entry means the current matrix has no supporting evidence; it does not show that a vendor lacks the capability. A single-vendor or combined-vendor parity score cannot be calculated from this matrix.

## Layout comparison

No layout scores were calculated. The skill requires each original and clone capture to show the same screen and state at a matching viewport. No original workflow captures or selected single original application are available in `replica/screens/`. The image at `replica/design/source-sign-in.png` documents the requested MacroCap Labs branding; it is not a matching PlannerMC workflow screen. No layout diff images were produced.

The existing clone capture images have these recorded dimensions and layout-comparison status:

| PlannerMC screen and state | Clone capture | Dimensions | Layout score |
| --- | --- | ---: | --- |
| S01 entry | `clone-screens/S01-entry.png` | 1440 × 1000 | Not scored: matching original unavailable |
| S02 intake | `clone-screens/S02-intake.png` | 1425 × 1197 | Not scored: matching original unavailable |
| S03 evidence | `clone-screens/S03-evidence.png` | 1425 × 1114 | Not scored: matching original unavailable |
| S04 assets | `clone-screens/S04-assets.png` | 1425 × 1008 | Not scored: matching original unavailable |
| S05 empty PM editor | `clone-screens/S05-pm-editor-empty.png` | 1425 × 1906 | Not scored: matching original unavailable |
| S05 PM draft | `clone-screens/S05-pm-draft.png` | 1425 × 1996 | Not scored: matching original unavailable |
| S05 approved PM | `clone-screens/S05-pm-approved.png` | 1425 × 2032 | Not scored: matching original unavailable |
| S05 approved PM, mobile | `clone-screens/S05-pm-approved-mobile.png` | 375 × 3609 | Not scored: matching original unavailable |

The skill's target viewports are 1440 × 900 desktop and 390 × 844 mobile. Future comparisons need fresh captures of both apps at matching viewports and equivalent states.

## Behavior comparison

There is no selected original application's walkthrough or state evidence, so behavior differences cannot be scored. The following records summarize PlannerMC evidence only; they do not imply that a vendor product behaves the same way.

| Flow | Original application evidence | PlannerMC evidence | Comparison result |
| --- | --- | --- | --- |
| Workspace entry and intake | No single original app or walkthrough supplied | Authenticated entry/intake and required-field checks are recorded in `test-plan.md` (F01-H1, F01-H3, F01-N1, F01-N2). | Unscored against an original |
| Reviewed planner source through PM draft | No original workflow evidence | Automated local-prototype case F01-A1 passed; the reviewed source reference and limitations remained visible after save and reload. | Unscored against an original |
| Asset proposal and confirmation | No original workflow evidence | The current slice supports a root asset and direct children; the tested source-to-PM path traversed asset confirmation. | Unscored against an original |
| PM review, approval, and copy | No original workflow evidence | Incomplete approval was rejected; valid approval and clipboard copy passed in isolated local-prototype case F01-A4. Hosted approval/copy was not verified in this pass. | Unscored against an original |

No fix-or-keep decisions are made from these rows because there is no supported original behavior to compare against. [Inference] Use the feature gaps above as the current build priorities.

## Recommended next build slice

The source-to-PM-reference path is now implemented, so the earlier recommendation to build that path is no longer current. [Inference] The next architecture milestone is manual source intake and extraction locators, followed by external research support. Resolve the Q2 decisions on external providers and data-transfer policy and the Q3 decisions on upload formats and file-size/page limits before implementing those capabilities. This recommendation is not an approved implementation ticket.

## Run boundary

This update recalculated feature coverage from the current tracked matrix. It did not run browser/API QA or claim new implementation evidence.
