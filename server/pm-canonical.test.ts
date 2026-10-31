import assert from "node:assert/strict";
import test from "node:test";
import { canonicalFieldEvidence } from "./pm-canonical.js";

test("field citation read-back comparison ignores JSON object key ordering", () => {
  const request = {
    frequency: [{ sourceId: "source-1", locator: "Frequency section" }],
    "taskStep:0": [{ sourceId: "source-2", locator: "Step paragraph" }],
  };
  const postgresJsonbReadBack = JSON.parse('{"taskStep:0":[{"locator":"Step paragraph","sourceId":"source-2"}],"frequency":[{"locator":"Frequency section","sourceId":"source-1"}]}');
  assert.equal(
    JSON.stringify(canonicalFieldEvidence(request)),
    JSON.stringify(canonicalFieldEvidence(postgresJsonbReadBack)),
  );
});
