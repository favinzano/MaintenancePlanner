import assert from "node:assert/strict";
import test from "node:test";
import {
  createAnalysis,
  createEmptyPm,
  createPmSplitDrafts,
  removePmTaskStepEvidence,
  renderPmText,
} from "./planner.js";

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
