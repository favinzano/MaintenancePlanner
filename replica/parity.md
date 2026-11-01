# PlannerMC feature coverage and comparison limits

Assessment date: 2026-11-01

Assessment basis: `replica/features.csv`, the PlannerMC MVP specification, the current implementation notes, and QA evidence in `replica/test-plan.md`.

Refresh: rerun on 2026-11-01 after the full local E2E suite passed 12/12 and a TLS-verified, read-only development database measurement. The parity tool still returns 77.8/100: five of nine must-haves complete and four partial. The QA-08 accessibility fix does not change product-scope coverage. OPS-derived location/area values remain verified in the development workspace. The es/en preference is implemented, but text conversation and speech remain absent.

## Result

**PlannerMC MVP scope coverage: 77.8 / 100.** This score measures implementation coverage against the nine rows marked `plannermc_spec=yes` in the feature matrix. It is not a parity score against iMPS, Prometheus GWOS-AI, or another original application.

All nine scored requirements are marked `must`. Five are complete and four are partial. The `replica-diff` parity tool assigns weight 3 to each must-have and counts `yes` as full credit, `partial` as half credit, and `no` as zero: 21 of 27 possible points, or 77.8%. The tool therefore reports **not shippable against the tracked MVP scope**, because four must-haves remain incomplete. This is separate from production readiness.

The reproducible tool input is [`diffs/plannermc-scope.csv`](diffs/plannermc-scope.csv), derived from the nine PlannerMC requirements in [`features.csv`](features.csv). `features.csv` is the broader vendor-evidence matrix and does not use the parity tool's input schema. The scope matrix sets `original=yes` as a tool-compatible inclusion flag for PlannerMC's own requirements; it does not claim an original vendor has these features. Running the tool against this scoped matrix returned 77.8, five of nine must-haves done, and four must-haves incomplete. The matrix notes include field-level citations, although that requirement remains partial because external-source references are deferred.

## Requirement coverage

| MVP requirement | Status | Evidence and remaining gap |
| --- | --- | --- |
| Analyze one equipment with location and area | Yes | Authenticated intake reads a workspace-scoped catalog. The OPS-derived development catalog was provisioned transactionally, read back from PostgreSQL, and verified in the authenticated selectors; the two synthetic sample locations remain in development. |
| Use manuals, external research, or planner data as PM sources | Partial | Planner notes and the manual flow exist. PDF/DOCX/image extraction ran locally; a synthetic PDF was saved, read back, reopened, reviewed, and referenced in a PM. New uploads currently fail closed because byte/page limits are unset. External research and technical generation are deferred. |
| Preserve source provenance, evidence references, and limitations | Partial | Planner/manual source metadata, applicability, locators, review state, and limitations persist. Reviewed applicable sources can be linked to individual PM fields and appear in preview/copy and retained snapshots. Extracted manual text remains in the browser. External-source references are absent while research is deferred. |
| Propose direct sub-assets under equipment | Yes | The equipment root and its direct children can be edited, individually confirmed, and saved. Deeper hierarchy is not supported. |
| Generate an English PM with safety, operating state, actions, and final verification | Partial | The editor supports planner-authored fields for these elements. It does not generate or technically validate PM content. Generation is deferred under ADR 0002. |
| Enforce a 15-step limit and ask before splitting | Yes | At the cap, the planner can enter overflow actions, choose a boundary, review both resulting procedures and their counts, and explicitly confirm saving two independent drafts. Cancel and over-limit cases are covered by F04. Each proposal creates two PMs; an approved revision cannot be split in this build. |
| Review, edit, approve, and retain dated PM versions | Yes | Local-prototype Playwright coverage and hosted `plannermc-dev` QA passed for revision draft reload, required summary, consecutive approval numbering, retained snapshots, read-back, identical retry, and stale-tab conflict. Production remains unconfigured and untested. |
| Support Spanish/English text and voice conversation | Partial | The authenticated planner can persist an `en` or `es` conversation-language preference, verified by a separate read-back and reload. Text conversation and speech input/output are absent; speech is deferred under ADR 0002. |
| Copy the PM manually to the selected CMMS | Yes | The full PM and individual steps can be copied through the local clipboard. PlannerMC does not write to a CMMS. |

## Weakest areas

The parity tool ranks only the nine PlannerMC must-haves, not out-of-scope vendor features. Scores below are the tool's weighted results for each area.

| Area | Score | Counted requirements |
| --- | ---: | ---: |
| Conversation | 50.0 | 1 |
| Asset intake | 100.0 | 1 |
| Sources | 50.0 | 2 |
| PM authoring | 75.0 | 2 |
| Assets | 100.0 | 1 |
| Review | 100.0 | 1 |
| Output | 100.0 | 1 |

## Remaining gaps in build order

These are the parity tool's four incomplete must-haves, in its priority order. The ranking identifies scope gaps, not immediately executable tickets; the gates below come from the accepted architecture and product decisions.

1. **Bilingual text and voice conversation — partial.** The `en`/`es` preference is stored for the authenticated planner and survives reload. Text prompts/responses and speech are absent. Speech is deferred under [ADR 0002](../docs/adr/0002-local-manual-extraction.md). A complete conversation flow depends on Q1 hosting/browser support, Q2 provider and data handling, and Q5 audio/transcript retention; Q3 limits also apply to any audio transfer.
2. **PM content generation — partial.** The editor supports planner-authored fields but does not generate or technically validate instructions. Generation remains deferred under ADR 0002 until Q2 provider/data-handling policy and an authorized validation corpus are resolved.
3. **Manual, OEM, external-research, or planner sources — partial.** Planner notes and local manual extraction exist. New uploads fail closed until Q3 byte/page limits and capacity are measured; production also needs the documented backup and restore gates. External research remains deferred under Q2.
4. **Source provenance and evidence references — partial.** Field-level citations link PM fields to reviewed applicable planner/manual sources. External-source references depend on Q2 research policy and remain absent. A citation records planner selection; it does not establish technical correctness.

**Q4 implementation status:** the operator-managed provisioning method is accepted under [ADR 0003](../docs/adr/0003-operator-managed-workspace-catalog.md). Issue 08 implements the local CLI and workspace-scoped intake reader. Four OPS-derived locations and 16 areas are now provisioned and verified in the sole configured development workspace. The two synthetic sample locations remain; no production readiness is inferred.

## Development manual-capacity baseline

On 2026-11-01, a TLS-verified PostgreSQL session against the repository-mapped `plannermc-dev` project ran inside a `READ ONLY` transaction. `pg_database_size(current_database())` returned 12,375,731 bytes (about 11.8 MiB). `public.original_documents` contained one record totaling 629 bytes, and its table plus indexes occupied 65,536 bytes. The existing QA record is the synthetic 629-byte PDF documented in `test-plan.md`; it is not a representative maintenance manual. No file contents, credentials, or user data were read by this measurement.

Supabase's current published Free-plan database-size quota is 500 MB per project; its docs distinguish that quota from the 2 GB provisioned disk on Free projects. Original manuals are stored in PostgreSQL `BYTEA`, so database-size usage is relevant, while the file-storage quota does not describe this table. See [Supabase billing quotas](https://supabase.com/docs/guides/platform/billing-on-supabase) and [database size vs. disk usage](https://supabase.com/docs/guides/platform/database-size). The measured development size is a baseline only. It does not establish the project's current billing plan, remaining disk headroom, manual extraction performance, or safe per-file/page/total limits.

### Local PDF profiling on 2026-11-01

The user-provided local archive contained 20 PDFs and no DOCX or image files. The PDFs were 344,937–2,951,262 bytes and 3–25 pages, with 173 pages total. PDF.js found no selectable text on any page; all 173 pages therefore followed the scanned-page OCR branch. All 20 PDFs opened successfully for page and text-presence inspection.

Three representative PDFs were processed sequentially through PlannerMC's existing browser extraction function in isolated Chromium. The 6-page, 885,297-byte sample took 19.6 seconds; the 11-page, 2,951,262-byte largest-file sample took 39.1 seconds; and the 25-page, 1,103,087-byte largest-page-count sample took 33.4 seconds. The sum was 92.1 seconds for 42 OCR pages. Chromium's `performance.memory.usedJSHeapSize` reached 193,775,703 bytes (about 184.8 MiB) during the run. This JS-heap reading is not total browser-process memory and does not reliably represent WebAssembly/native allocations. One HTTP request outside the allow-listed local origin was blocked; the browser allowed no outside-origin requests, reported no page errors, and made no Supabase call. Temporary sanitized copies were deleted after profiling; the user-provided archive remained unchanged.

This supports a PDF-specific development candidate, not a limit across every approved format. [Inference] A 4 MiB per-file ceiling would provide about 42% headroom over the largest supplied PDF; a 25-page ceiling covers the largest supplied document; a 100 MiB total-originals cap would reserve most of the published 500 MB Free-plan database quota. These values are not activated because the shared per-file ceiling also applies to DOCX and images, which were not present. Confirm whether the development pilot needs those formats or provide representative local samples before enabling uploads.

The tracked follow-up is [issue 10](../.scratch/replica-build/issues/10-manual-capacity-bounds.md). Keep samples outside version control, and do not send manual bytes or extracted text to an external service.

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
| Intake and catalog | No original flow selected or observed | Authenticated development intake; OPS-derived catalog values were verified in the app | N/A |
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

**[Inference] Continue with `/replica-build` for an unblocked remaining gap after product scope is chosen.** The Q4 provisioning and authenticated selector checks passed. Conversation, voice, and PM generation remain gated or deferred under ADR 0002; the next implementation slice should not claim those capabilities until their provider and data-handling boundaries are resolved. Field citations record planner selection and do not establish technical correctness.

Production uploads remain gated by capacity, numeric limits, backups, retention, and a restore test. Development upload limits also remain unset: the only live manual is a 629-byte synthetic QA fixture, not a representative maintenance document.

## Run boundary

The parity score was rerun with the local `replica-diff` script against `diffs/plannermc-scope.csv` on 2026-11-01 after the 12/12 E2E rerun. The manual-capacity baseline is a separate, TLS-verified, strictly read-only query against the development project; no rows were changed. The live catalog PostgreSQL and authenticated UI checks are carried forward from their separately recorded QA pass. The score measures PlannerMC implementation coverage, not comparison with a vendor application. Production behavior was not tested.
