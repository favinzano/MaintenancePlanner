# PlannerMC feature coverage and comparison limits

Assessment date: 2026-11-01

Assessment basis: `replica/features.csv`, the PlannerMC MVP specification, the current implementation notes, and QA evidence in `replica/test-plan.md`.

Refresh: reviewed on 2026-11-01 after issue 08 (workspace catalog provisioning). The PlannerMC-only matrix remains 66.7/100: four of nine must-haves complete, four partial, and one not implemented. Issue 08 adds the provisioning method, but the first row remains partial until real workspace location/area values are supplied and verified. Source provenance remains partial while external-source references are deferred.

## Result

**PlannerMC MVP scope coverage: 66.7 / 100.** This score measures implementation coverage against the nine rows marked `plannermc_spec=yes` in the feature matrix. It is not a parity score against iMPS, Prometheus GWOS-AI, or another original application.

All nine scored requirements are marked `must`. Four are complete, four are partial, and one is not implemented. The `replica-diff` parity tool assigns weight 3 to each must-have and counts `yes` as full credit, `partial` as half credit, and `no` as zero: 18 of 27 possible points, or 66.7%. The tool therefore reports **not shippable against the tracked MVP scope**, because five must-haves remain incomplete. This is separate from production readiness.

The reproducible tool input is [`diffs/plannermc-scope.csv`](diffs/plannermc-scope.csv), derived from the nine PlannerMC requirements in [`features.csv`](features.csv). `features.csv` is the broader vendor-evidence matrix and does not use the parity tool's input schema. The scope matrix sets `original=yes` as a tool-compatible inclusion flag for PlannerMC's own requirements; it does not claim an original vendor has these features. Running the tool against this scoped matrix returned 66.7, four of nine must-haves done, and five must-haves incomplete. The matrix notes include field-level citations, although that requirement remains partial because external-source references are deferred.

## Requirement coverage

| MVP requirement | Status | Evidence and remaining gap |
| --- | --- | --- |
| Analyze one equipment with location and area | Partial | Intake and workspace-scoped catalog reading are implemented. An operator-only transactional manifest provisioner now has automated coverage. The active development catalog still uses synthetic seed data; intended site values have not been supplied or loaded. |
| Use manuals, external research, or planner data as PM sources | Partial | Planner notes and the manual flow exist. PDF/DOCX/image extraction ran locally; a synthetic PDF was saved, read back, reopened, reviewed, and referenced in a PM. New uploads currently fail closed because byte/page limits are unset. External research and technical generation are deferred. |
| Preserve source provenance, evidence references, and limitations | Partial | Planner/manual source metadata, applicability, locators, review state, and limitations persist. Reviewed applicable sources can be linked to individual PM fields and appear in preview/copy and retained snapshots. Extracted manual text remains in the browser. External-source references are absent while research is deferred. |
| Propose direct sub-assets under equipment | Yes | The equipment root and its direct children can be edited, individually confirmed, and saved. Deeper hierarchy is not supported. |
| Generate an English PM with safety, operating state, actions, and final verification | Partial | The editor supports planner-authored fields for these elements. It does not generate or technically validate PM content. Generation is deferred under ADR 0002. |
| Enforce a 15-step limit and ask before splitting | Yes | At the cap, the planner can enter overflow actions, choose a boundary, review both resulting procedures and their counts, and explicitly confirm saving two independent drafts. Cancel and over-limit cases are covered by F04. Each proposal creates two PMs; an approved revision cannot be split in this build. |
| Review, edit, approve, and retain dated PM versions | Yes | Local-prototype Playwright coverage and hosted `plannermc-dev` QA passed for revision draft reload, required summary, consecutive approval numbering, retained snapshots, read-back, identical retry, and stale-tab conflict. Production remains unconfigured and untested. |
| Support Spanish/English text and voice conversation | No | Text conversation and language preference are absent. Speech input/output are deferred under ADR 0002. |
| Copy the PM manually to the selected CMMS | Yes | The full PM and individual steps can be copied through the local clipboard. PlannerMC does not write to a CMMS. |

## Weakest areas

The parity tool ranks only the nine PlannerMC must-haves, not out-of-scope vendor features. Scores below are the tool's weighted results for each area.

| Area | Score | Counted requirements |
| --- | ---: | ---: |
| Conversation | 0.0 | 1 |
| Asset intake | 50.0 | 1 |
| Sources | 50.0 | 2 |
| PM authoring | 75.0 | 2 |
| Assets | 100.0 | 1 |
| Review | 100.0 | 1 |
| Output | 100.0 | 1 |

## Top five gaps in build order

These are the parity tool's five incomplete must-haves, in its priority order. The ranking identifies scope gaps, not five immediately executable tickets; the gates below come from the accepted architecture and product decisions.

1. **Bilingual text and voice conversation — not implemented.** Text conversation, language preference, and speech are absent. Speech is deferred under [ADR 0002](../docs/adr/0002-local-manual-extraction.md). A complete conversation flow depends on Q1 hosting/browser support, Q2 provider and data handling, and Q5 audio/transcript retention; Q3 limits also apply to any audio transfer. This bundled feature is not ready to implement as specified.
2. **Single-equipment intake with operational location and area — partial.** Authenticated intake and the Q4 operator-provisioning method are implemented. The current location/area catalog remains synthetic because no real site catalog has been provided or loaded.
3. **PM content generation — partial.** The editor supports planner-authored fields but does not generate or technically validate instructions. Generation remains deferred under ADR 0002 until Q2 provider/data-handling policy and an authorized validation corpus are resolved.
4. **Manual, OEM, external-research, or planner sources — partial.** Planner notes and local manual extraction exist. New uploads fail closed until Q3 byte/page limits and capacity are measured; production also needs the documented backup and restore gates. External research remains deferred under Q2.
5. **Source provenance and evidence references — partial.** Field-level citations link PM fields to reviewed applicable planner/manual sources. External-source references depend on Q2 research policy and remain absent. A citation records planner selection; it does not establish technical correctness.

**Q4 implementation status:** the operator-managed provisioning method is accepted under [ADR 0003](../docs/adr/0003-operator-managed-workspace-catalog.md), and issue 08 implements the local CLI plus workspace-scoped intake reader. The real location/area values must come from the intended workspace; they are not available in the current repository, so no operational values have been fabricated. Coverage remains partial until those values are supplied, provisioned, and verified against the intended workspace.

## Layout and behavior comparison

No layout score is available. `replica/screens/` has zero reference screenshots, and no original application has been selected for screen-by-screen comparison. The existing captures document PlannerMC only. Their native PNG dimensions are not a paired-viewport comparison.

| PlannerMC screen | Clone capture | Original capture | Layout score |
| --- | --- | --- | --- |
| S01 entry | `S01-entry.png` (1440×1000) | None | N/A |
| S02 intake | `S02-intake.png` (1425×1197) | None | N/A |
| S03 evidence | `S03-evidence.png` (1425×1114) | None | N/A |
| S04 assets | `S04-assets.png` (1425×1008) | None | N/A |
| S05 PM editor/review | Multiple desktop and mobile states | None | N/A |
| S06 PM split proposal | Desktop/mobile captures | None | N/A |
| S07 PM draft deletion | Desktop/mobile captures | None | N/A |

No original-versus-clone behavior diff is claimed. There is no paired original walkthrough to compare clicks, errors, retained state, or email behavior. Vendor feature evidence in `features.csv` comes from published descriptions, not direct observation. PlannerMC's own verified behavior is recorded in [`test-plan.md`](test-plan.md).

| Flow | Original behavior observed | PlannerMC evidence | Difference |
| --- | --- | --- | --- |
| Intake and catalog | No original flow selected or observed | Authenticated development intake; catalog values are synthetic | N/A |
| Evidence and manual review | No original flow selected or observed | Planner/manual evidence flow and local extraction QA | N/A |
| Assets and PM authoring | No original flow selected or observed | Direct-child assets, PM drafts, citations, and split proposal are documented | N/A |
| Approval, revisions, and deletion | No original flow selected or observed | Local and synthetic development lifecycle QA is documented | N/A |
| Copy to CMMS | No original flow selected or observed | Clipboard-only output; no CMMS write | N/A |

## Comparison with external products

The project has not selected one original application for a clone-to-original comparison. `features.csv` combines published evidence for Innovapptive iMPS and Prometheus GWOS-AI with PlannerMC's own specification. The vendor evidence is not an observed product walkthrough and does not establish feature absence when marked `no evidence`.

There are no workflow screenshots in `replica/screens/`. The MacroCap Labs sign-in image at `design/source-sign-in.png` is a branding reference, not a matching workflow screen. Therefore:

- No layout score or screenshot diff is supported.
- No original-versus-clone behavior differences can be verified.
- The existing images in `clone-screens/` document PlannerMC screens only.

The current QA evidence is summarized in [`test-plan.md`](test-plan.md). It records local extraction for all four approved manual formats, authenticated development save/read-back for a synthetic PDF, responsive checks, the automated file-chooser path, and cross-account download denial. The Windows shell file dialog itself was not observed because Playwright supplied the file through `FileChooser.setFiles`.

## Recommended next workflow step

**[Inference] Continue with `/replica-test` for the Q4 provisioning slice.** Automated unit tests cover manifest validation, explicit target confirmation, transactions, rollback, idempotent upserts, post-commit read-back, and workspace-scoped catalog loading. A live PostgreSQL integration run remains outstanding because the local database is not available in this environment. After integration QA, obtain the intended workspace's real location/area values before provisioning them. The top-ranked conversation feature and PM generation remain gated by provider/data-handling decisions; research and voice remain deferred under ADR 0002. Field citations record planner selection and do not establish technical correctness.

Production uploads remain gated by capacity, numeric limits, backups, retention, and a restore test.

## Run boundary

The parity score was rerun with the local `replica-diff` script against `diffs/plannermc-scope.csv` on 2026-11-01. Feature statuses and QA statements are taken from the current matrix, build log, and `test-plan.md`; browser/API QA was not rerun for this report refresh. It measures PlannerMC implementation coverage, not comparison with a vendor application. Production behavior was not tested.
