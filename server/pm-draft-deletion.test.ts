import assert from "node:assert/strict";
import test from "node:test";
import { parsePmDraftDeletionRequest, planPmDraftDeletion } from "./pm-draft-deletion.js";

const operationId = "243e4567-e89b-42d3-a456-426614174000";

test("parses a scoped draft deletion request", () => {
  assert.deepEqual(parsePmDraftDeletionRequest({ operationId, expectedRowVersion: 4 }), {
    operationId,
    expectedRowVersion: 4,
  });
});

test("rejects malformed deletion requests", () => {
  assert.throws(() => parsePmDraftDeletionRequest(null), /operation ID/);
  assert.throws(() => parsePmDraftDeletionRequest({ operationId: "invalid", expectedRowVersion: 4 }), /request is invalid/);
  assert.throws(() => parsePmDraftDeletionRequest({ operationId, expectedRowVersion: 0 }), /request is invalid/);
  assert.throws(() => parsePmDraftDeletionRequest({ operationId, expectedRowVersion: 1.5 }), /request is invalid/);
});

test("deletes an initial draft PM record without an approved history", () => {
  assert.deepEqual(planPmDraftDeletion({
    draftVersionId: "draft-1",
    currentApprovedVersionId: null,
    approvedVersions: [],
  }), {
    deletePmRecord: true,
    latestApprovedVersionId: null,
    approvedVersionIds: [],
  });
});

test("discards a revision draft while retaining and restoring the latest approved version", () => {
  assert.deepEqual(planPmDraftDeletion({
    draftVersionId: "draft-2",
    currentApprovedVersionId: "version-2",
    approvedVersions: [
      { id: "version-1", revisionNumber: 0 },
      { id: "version-2", revisionNumber: 1 },
    ],
  }), {
    deletePmRecord: false,
    latestApprovedVersionId: "version-2",
    approvedVersionIds: ["version-1", "version-2"],
  });
});

test("rejects deletion when the PM has no draft version", () => {
  assert.throws(() => planPmDraftDeletion({
    draftVersionId: null,
    currentApprovedVersionId: "version-1",
    approvedVersions: [{ id: "version-1", revisionNumber: 0 }],
  }), /Only a saved PM draft/);
});

test("rejects inconsistent approved-version pointers rather than risking history", () => {
  assert.throws(() => planPmDraftDeletion({
    draftVersionId: "draft-2",
    currentApprovedVersionId: null,
    approvedVersions: [{ id: "version-1", revisionNumber: 0 }],
  }), /no current version pointer/);
  assert.throws(() => planPmDraftDeletion({
    draftVersionId: "draft-2",
    currentApprovedVersionId: "version-1",
    approvedVersions: [
      { id: "version-1", revisionNumber: 0 },
      { id: "version-2", revisionNumber: 1 },
    ],
  }), /current approved PM version could not be verified/);
});
