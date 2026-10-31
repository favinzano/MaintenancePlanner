# PlannerMC feature coverage and comparison limits

Assessment date: 2026-10-31

Assessment basis: `replica/features.csv`, the PlannerMC MVP specification, the current implementation notes, and QA evidence in `replica/test-plan.md`.

## Result

**PlannerMC MVP scope coverage: 66.7 / 100.** This score measures implementation coverage against the nine rows marked `plannermc_spec=yes` in the feature matrix. It is not a parity score against iMPS, Prometheus GWOS-AI, or another original application.

All nine scored requirements are marked `must`. Four are complete, four are partial, and one is not implemented. The `replica-diff` parity tool assigns weight 3 to each must-have and counts `yes` as full credit, `partial` as half credit, and `no` as zero: 18 of 27 possible points, or 66.7%. The tool therefore reports **not shippable against the tracked MVP scope**, because five must-haves remain incomplete. This is separate from production readiness.

The reproducible tool input is [`diffs/plannermc-scope.csv`](diffs/plannermc-scope.csv), regenerated from the current PlannerMC rows in [`features.csv`](features.csv). Its `original=yes` field is a tool-compatible inclusion flag for PlannerMC's own required scope. It does not claim an original vendor has these features.

## Requirement coverage

| MVP requirement | Status | Evidence and remaining gap |
| --- | --- | --- |
| Analyze one equipment with location and area | Partial | Intake and persistence are implemented in authenticated development. Locations and areas use synthetic seed data; operational catalog provisioning is not implemented. |
| Use manuals, external research, or planner data as PM sources | Partial | Planner notes and the manual flow exist. PDF/DOCX/image extraction ran locally; a synthetic PDF was saved, read back, reopened, reviewed, and referenced in a PM. New uploads currently fail closed because byte/page limits are unset. External research and technical generation are deferred. |
| Preserve source provenance, evidence references, and limitations | Partial | Planner/manual source metadata, applicability, locators, review state, and limitations persist; reviewed references appear in PM preview and copy. Extracted manual text remains in the browser. Field-level citations and external-source references are absent. |
| Propose direct sub-assets under equipment | Yes | The equipment root and its direct children can be edited, individually confirmed, and saved. Deeper hierarchy is not supported. |
| Generate an English PM with safety, operating state, actions, and final verification | Partial | The editor supports planner-authored fields for these elements. It does not generate or technically validate PM content. Generation is deferred under ADR 0002. |
| Enforce a 15-step limit and ask before splitting | Yes | At the cap, the planner can enter overflow actions, choose a boundary, review both resulting procedures and their counts, and explicitly confirm saving two independent drafts. Cancel and over-limit cases are covered by F04. Each proposal creates two PMs; an approved revision cannot be split in this build. |
| Review, edit, approve, and retain dated PM versions | Yes | Local-prototype Playwright coverage and hosted `plannermc-dev` QA passed for revision draft reload, required summary, consecutive approval numbering, retained snapshots, read-back, identical retry, and stale-tab conflict. Production remains unconfigured and untested. |
| Support Spanish/English text and voice conversation | No | Text conversation and language preference are absent. Speech input/output are deferred under ADR 0002. |
| Copy the PM manually to the selected CMMS | Yes | The full PM and individual steps can be copied through the local clipboard. PlannerMC does not write to a CMMS. |

## Highest-ranked gaps

The parity tool orders incomplete rows by priority and completion credit. That list is a ranking aid, not a dependency-aware implementation plan.

1. **Bilingual text and voice conversation.** No conversation UI or language preference exists. Speech capabilities remain deferred by ADR 0002; resolving the provider, privacy, and retention decisions is a prerequisite to implementation.
2. **Operational location and area catalog.** Current development values are synthetic. Select the operational source and provisioning process under the open catalog decision before replacing them.
3. **PM content generation.** The current approved workflow is planner-authored. Generation remains deferred by ADR 0002 and needs a separate data-handling/provider decision before implementation.
4. **Manual upload limits and production readiness.** Uploads fail closed until representative files, byte/page limits, database capacity, backups, retention, and restore behavior are reviewed. Field-level evidence citations and external source references also remain absent.

## Comparison with external products

The project has not selected one original application for a clone-to-original comparison. `features.csv` combines published evidence for Innovapptive iMPS and Prometheus GWOS-AI with PlannerMC's own specification. The vendor evidence is not an observed product walkthrough and does not establish feature absence when marked `no evidence`.

There are no workflow screenshots in `replica/screens/`. The MacroCap Labs sign-in image at `design/source-sign-in.png` is a branding reference, not a matching workflow screen. Therefore:

- No layout score or screenshot diff is supported.
- No original-versus-clone behavior differences can be verified.
- The existing images in `clone-screens/` document PlannerMC screens only.

The current QA evidence is summarized in [`test-plan.md`](test-plan.md). It records local extraction for all four approved manual formats, authenticated development save/read-back for a synthetic PDF, responsive checks, the automated file-chooser path, and cross-account download denial. The Windows shell file dialog itself was not observed because Playwright supplied the file through `FileChooser.setFiles`.

## Recommended next build slice

The planner-confirmed PM split proposal is implemented and verified for initial drafts. The next flow step is `/replica-diff` to review the updated gap ranking before selecting another build slice.

Production uploads remain gated by capacity, numeric limits, backups, retention, and a restore test.

## Run boundary

This assessment includes the hosted development QA, the full local Playwright suite, and the focused PM split test recorded in the 2026-10-31 build log and `test-plan.md`. The result remains implementation coverage against PlannerMC's own MVP requirements, not a vendor application comparison. Production behavior was not tested.
