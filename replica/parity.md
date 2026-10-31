# PlannerMC feature coverage and comparison limits

Assessment date: 2026-10-31

Assessment basis: `replica/features.csv`, the PlannerMC MVP specification, the current implementation notes, and QA evidence in `replica/test-plan.md`.

## Result

**PlannerMC MVP scope coverage: 66.7 / 100.** This score measures implementation coverage against the nine rows marked `plannermc_spec=yes` in the feature matrix. It is not a parity score against iMPS, Prometheus GWOS-AI, or another original application.

All nine scored requirements are marked `must`. Four are complete, four are partial, and one is not implemented. The `replica-diff` parity tool assigns weight 3 to each must-have and counts `yes` as full credit, `partial` as half credit, and `no` as zero: 18 of 27 possible points, or 66.7%. The tool therefore reports **not shippable against the tracked MVP scope**, because five must-haves remain incomplete. This is separate from production readiness.

The reproducible tool input is [`diffs/plannermc-scope.csv`](diffs/plannermc-scope.csv), regenerated from the nine PlannerMC requirements in [`features.csv`](features.csv). `features.csv` is the broader vendor-evidence matrix and does not use the parity tool's input schema. The scope matrix sets `original=yes` as a tool-compatible inclusion flag for PlannerMC's own requirements; it does not claim an original vendor has these features. Running the tool against this scoped matrix returned 66.7, four of nine must-haves done, and five must-haves incomplete.

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

These are the parity tool's five incomplete must-haves, in its priority order. This ranking is a guide; dependencies and the accepted data policy still determine which slice can be implemented next.

1. **Bilingual text and voice conversation — not implemented.** Text conversation, language preference, and speech are absent. Speech recognition/synthesis are deferred under [ADR 0002](../docs/adr/0002-local-manual-extraction.md); architecture Q1–Q3/Q5 also leave hosting, provider/data handling, and audio retention decisions open.
2. **Single-equipment intake with operational location and area — partial.** The authenticated intake works, but its current location and area catalog is synthetic. Catalog source and provisioning remain open under Q4.
3. **PM content generation — partial.** The editor supports planner-authored fields but does not generate or technically validate instructions. Generation remains deferred under ADR 0002 pending a data-handling/provider decision.
4. **Manual, OEM, external-research, or planner sources — partial.** Planner notes and local manual extraction exist. Uploads fail closed until numeric limits are configured; external research remains deferred.
5. **Source provenance and evidence references — partial.** Source metadata, locators, review state, and limitations persist, but PM fields do not have field-level citations and external-source references are absent.

## Layout and behavior comparison

No layout score is available: `replica/screens/` contains no matching original workflow captures, and no original application has been selected for a screen-by-screen comparison. Existing `clone-screens/` images document PlannerMC only. The MacroCap sign-in image is a brand reference, not a workflow match.

No original-versus-clone behavior diff is claimed. There is no paired original walkthrough to compare clicks, errors, retained state, or email behavior. Vendor feature evidence in `features.csv` comes from published descriptions and is not direct observation. PlannerMC's own verified behavior is recorded in [`test-plan.md`](test-plan.md).

## Comparison with external products

The project has not selected one original application for a clone-to-original comparison. `features.csv` combines published evidence for Innovapptive iMPS and Prometheus GWOS-AI with PlannerMC's own specification. The vendor evidence is not an observed product walkthrough and does not establish feature absence when marked `no evidence`.

There are no workflow screenshots in `replica/screens/`. The MacroCap Labs sign-in image at `design/source-sign-in.png` is a branding reference, not a matching workflow screen. Therefore:

- No layout score or screenshot diff is supported.
- No original-versus-clone behavior differences can be verified.
- The existing images in `clone-screens/` document PlannerMC screens only.

The current QA evidence is summarized in [`test-plan.md`](test-plan.md). It records local extraction for all four approved manual formats, authenticated development save/read-back for a synthetic PDF, responsive checks, the automated file-chooser path, and cross-account download denial. The Windows shell file dialog itself was not observed because Playwright supplied the file through `FileChooser.setFiles`.

## Recommended next build slice

**[Inference] Recommended next build slice: add field-level evidence citations to PM fields using only already reviewed planner/manual sources.** This advances a current must-have without choosing an external generation, research, or speech provider. Keep the language/voice, operational-catalog, generation, and production-upload decisions visible as dependencies; do not infer citations or technical support from a source when none is recorded.

Production uploads remain gated by capacity, numeric limits, backups, retention, and a restore test.

## Run boundary

This assessment was generated with the local `replica-diff` parity script against `diffs/plannermc-scope.csv` and includes the hosted development QA, full local Playwright suite, and focused PM split test recorded in the 2026-10-31 build log and `test-plan.md`. It measures PlannerMC implementation coverage, not comparison with a vendor application. Production behavior was not tested.
