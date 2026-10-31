import assert from "node:assert/strict";
import test from "node:test";
import {
  createAnalysis,
  createEmptyPm,
  createPmSplitDrafts,
  discardPmDraft,
  removePmTaskStepEvidence,
  renderPmText,
} from "./planner.js";

test("deleting an initial PM draft removes only that plan and returns to assets when it was the last plan", () => {
  const analysis = createAnalysis();
  analysis.assets = [{ id: "asset-1", kind: "equipment", name: "Synthetic pump", sourceTerm: "", confirmed: true }];
  const pm = { ...createEmptyPm(analysis), id: "pm-draft-1", title: "Synthetic draft" };
  analysis.pm = pm;
  analysis.stage = 3;

  const next = discardPmDraft(analysis, pm.id, "2026-10-31T12:00:00.000Z");

  assert.equal(next.pm, undefined);
  assert.equal(next.stage, 2);
  assert.deepEqual(next.assets, analysis.assets);
  assert.deepEqual(next.manualDocuments, analysis.manualDocuments);
  assert.equal(next.id, analysis.id);
});

test("deleting a revision draft restores the latest approved snapshot and retains all history", () => {
  const analysis = createAnalysis();
  const approved = {
    ...createEmptyPm(analysis),
    id: "pm-revision-1",
    title: "Approved synthetic PM",
    status: "approved" as const,
    approvedAt: "2026-10-30T12:00:00.000Z",
    revisionNumber: 0,
  };
  const history = [{
    id: "version-1",
    revisionNumber: 0,
    approvedAt: approved.approvedAt!,
    changeSummary: null,
    pm: approved,
  }];
  analysis.pm = {
    ...approved,
    status: "draft",
    approvedAt: undefined,
    revisionNumber: undefined,
    baseRevisionNumber: 0,
    changeSummary: "Unapproved changes",
    title: "Edited synthetic draft",
  };
  analysis.pmVersions = history;

  const next = discardPmDraft(analysis, analysis.pm.id, "2026-10-31T12:00:00.000Z");

  assert.equal(next.pm?.status, "approved");
  assert.equal(next.pm?.title, "Approved synthetic PM");
  assert.equal(next.pm?.revisionNumber, 0);
  assert.deepEqual(next.pmVersions, history);
});

test("deleting a primary initial draft promotes another saved PM plan", () => {
  const analysis = createAnalysis();
  const first = { ...createEmptyPm(analysis), id: "pm-first" };
  const second = { ...createEmptyPm(analysis), id: "pm-second", title: "Remaining PM" };
  analysis.pm = first;
  analysis.additionalPms = [{ pm: second, pmVersions: [] }];

  const next = discardPmDraft(analysis, first.id, "2026-10-31T12:00:00.000Z");

  assert.equal(next.pm?.id, second.id);
  assert.deepEqual(next.additionalPms, []);
});

test("approved PMs cannot be deleted as drafts", () => {
  const analysis = createAnalysis();
  const pm = { ...createEmptyPm(analysis), status: "approved" as const };
  analysis.pm = pm;
  assert.throws(() => discardPmDraft(analysis, pm.id), /Only a saved PM draft can be deleted/);
});

test("PM split keeps citations with their matching task steps", () => {
  const analysis = createAnalysis();
  analysis.plannerEvidence = {
    ...analysis.plannerEvidence!,
    applicability: "applicable",
    reviewedAt: "2026-10-31T12:00:00.000Z",
  };
  const pm = {
    ...createEmptyPm(analysis),
    title: "Synthetic citation test",
    taskSteps: Array.from({ length: 13 }, (_, index) => `Synthetic planner step ${index + 1}`),
    fieldEvidence: {
      frequency: [{ sourceId: analysis.plannerEvidence.id, locator: "Planner notes" }],
      "taskStep:1": [{ sourceId: analysis.plannerEvidence.id, locator: "First section" }],
      "taskStep:8": [{ sourceId: analysis.plannerEvidence.id, locator: "Second section" }],
    },
  };
  const [first, second] = createPmSplitDrafts(pm, 6, ["Additional synthetic planner action"]);
  assert.deepEqual(first.fieldEvidence["taskStep:1"], pm.fieldEvidence["taskStep:1"]);
  assert.equal(first.fieldEvidence["taskStep:8"], undefined);
  assert.deepEqual(second.fieldEvidence["taskStep:2"], pm.fieldEvidence["taskStep:8"]);
  assert.deepEqual(first.fieldEvidence.frequency, second.fieldEvidence.frequency);
});

test("removing a task step removes only its citation and reindexes later citations", () => {
  const first = [{ sourceId: "source-1", locator: "step one" }];
  const third = [{ sourceId: "source-2", locator: "step three" }];
  const removed = [{ sourceId: "source-1", locator: "removed" }];
  const next = removePmTaskStepEvidence({ "taskStep:0": first, "taskStep:1": removed, "taskStep:2": third, frequency: first }, 1);
  assert.deepEqual(next["taskStep:0"], first);
  assert.deepEqual(next["taskStep:1"], third);
  assert.notDeepEqual(next["taskStep:1"], removed);
  assert.deepEqual(next.frequency, first);
});

test("PM copy places citations next to the exact fields they identify", () => {
  const analysis = createAnalysis();
  const source = {
    ...analysis.plannerEvidence!,
    title: "Synthetic planner source",
    locator: "Planner note 4",
    applicability: "applicable" as const,
    reviewedAt: "2026-10-31T12:00:00.000Z",
  };
  analysis.plannerEvidence = source;
  const pm = {
    ...createEmptyPm({ ...analysis, plannerEvidence: source }),
    title: "Synthetic PM",
    frequency: "Planner-entered interval",
    durationMinutes: "5",
    operatingState: "stopped" as const,
    safetyPrecautions: "Planner-entered safety note",
    taskSteps: ["Planner-authored action"],
    finalVerification: "Record synthetic result",
    evidenceSourceIds: [source.id],
    fieldEvidence: {
      frequency: [{ sourceId: source.id, locator: "Frequency line" }],
      durationMinutes: [{ sourceId: source.id, locator: "Duration line" }],
      operatingState: [{ sourceId: source.id, locator: "State line" }],
      safetyPrecautions: [{ sourceId: source.id, locator: "Safety line" }],
      "taskStep:0": [{ sourceId: source.id, locator: "Action line" }],
      finalVerification: [{ sourceId: source.id, locator: "Verification line" }],
    },
  };
  const text = renderPmText(analysis, pm);
  assert.match(text, /Frequency: Planner-entered interval\n  Evidence for frequency: Synthetic planner source · Frequency line/);
  assert.match(text, /Estimated duration: 5 minutes\n  Evidence for estimated duration: Synthetic planner source · Duration line/);
  assert.match(text, /2\. Planner-authored action\n  Evidence for task step 1: Synthetic planner source · Action line/);
  assert.match(text, /Verify and record: Record synthetic result\n  Evidence for final verification: Synthetic planner source · Verification line/);
});
