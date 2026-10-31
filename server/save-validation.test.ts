import assert from "node:assert/strict";
import test from "node:test";
import type { PlannerAnalysis, PmDraft } from "../src/domain/planner.js";
import { PLANNER_EVIDENCE_BASE_LIMITATION } from "../src/domain/planner.js";
import { assertReviewedManualReferences, parseSaveBody } from "./save-validation.js";

const ids = {
  operation: "11111111-1111-4111-8111-111111111111",
  analysis: "22222222-2222-4222-8222-222222222222",
  location: "33333333-3333-4333-8333-333333333333",
  area: "44444444-4444-4444-8444-444444444444",
  source: "55555555-5555-4555-8555-555555555555",
  asset: "66666666-6666-4666-8666-666666666666",
  pm: "77777777-7777-4777-8777-777777777777",
  otherSource: "88888888-8888-4888-8888-888888888888",
  manualSource: "99999999-9999-4999-8999-999999999999",
  manualDocument: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  siblingPm: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
};

function validManual() {
  return {
    id: ids.manualSource,
    documentId: ids.manualDocument,
    kind: "manual" as const,
    title: "QA manual",
    fileName: "qa-synthetic.pdf",
    contentType: "application/pdf",
    byteSize: 629,
    sha256: "a".repeat(64),
    pageCount: 1,
    extractionMethod: "pdf-text" as const,
    locatorRange: { kind: "page" as const, first: 1, last: 1 },
    applicability: "applicable" as const,
    applicabilityDetails: "Synthetic QA only.",
    limitations: ["Synthetic content."],
    reviewedAt: "2026-10-31T12:00:00.000Z",
  };
}

function validBody() {
  const pm: PmDraft = {
    id: ids.pm,
    title: "QA PM",
    assetId: ids.asset,
    frequency: "Not established",
    durationMinutes: "5",
    operatingState: "stopped",
    safetyPrecautions: "Planner review required",
    unresolvedSafetyAcknowledged: false,
    taskSteps: ["Planner-authored synthetic step"],
    finalVerification: "Record result",
    evidenceSourceIds: [ids.source],
    status: "draft",
    createdAt: "2026-10-31T12:00:00.000Z",
  };
  const analysis: PlannerAnalysis = {
    id: ids.analysis,
    rowVersion: 1,
    locationId: ids.location,
    areaId: ids.area,
    equipmentName: "Synthetic QA equipment",
    originalEquipmentName: "",
    manufacturer: "",
    model: "",
    plannerNotes: "Synthetic data only.",
    plannerEvidence: {
      id: ids.source,
      kind: "plannerData",
      title: "QA source",
      locator: "Synthetic notes",
      applicability: "applicable",
      applicabilityDetails: "QA only",
      limitations: [PLANNER_EVIDENCE_BASE_LIMITATION],
      reviewedAt: "2026-10-31T12:00:00.000Z",
    },
    manualDocuments: [],
    evidenceDecision: "continue_with_limitations",
    assets: [{ id: ids.asset, kind: "equipment", name: "Synthetic QA equipment", sourceTerm: "", confirmed: true }],
    pm,
    stage: 3,
    createdAt: "2026-10-31T12:00:00.000Z",
    updatedAt: "2026-10-31T12:00:00.000Z",
  };
  return { operationId: ids.operation, expectedRowVersion: 1, analysis };
}

test("accepts a PM reference to the reviewed source on its analysis", () => {
  const parsed = parseSaveBody(validBody());
  assert.deepEqual(parsed.analysis.pm?.evidenceSourceIds, [ids.source]);
});

test("accepts a PM reference to a reviewed manual attached to the same analysis", () => {
  const body = validBody();
  body.analysis.manualDocuments = [validManual()];
  body.analysis.pm!.evidenceSourceIds = [ids.manualSource];
  assert.deepEqual(parseSaveBody(body).analysis.pm?.evidenceSourceIds, [ids.manualSource]);
});

test("rejects a PM reference to a manual that is not attached to the analysis", () => {
  const body = validBody();
  body.analysis.manualDocuments = [validManual()];
  body.analysis.pm!.evidenceSourceIds = [ids.otherSource];
  assert.throws(() => parseSaveBody(body), /may reference only a source attached/i);
});

test("accepts only manual references returned by the reviewed owner-scoped database query", () => {
  assert.doesNotThrow(() => assertReviewedManualReferences([ids.manualSource], [ids.manualSource]));
  assert.throws(() => assertReviewedManualReferences([ids.manualSource], []), /review each manual source/i);
  assert.throws(() => assertReviewedManualReferences([ids.manualSource], [ids.otherSource]), /review each manual source/i);
});

test("rejects a malformed planner source ID", () => {
  const body = validBody();
  body.analysis.plannerEvidence!.id = "not-a-uuid";
  assert.throws(() => parseSaveBody(body), /planner source record is invalid/i);
});

test("rejects a PM reference to a different source", () => {
  const body = validBody();
  body.analysis.pm!.evidenceSourceIds = [ids.otherSource];
  assert.throws(() => parseSaveBody(body), /may reference only a source attached/i);
});

test("rejects duplicate PM source references", () => {
  const body = validBody();
  body.analysis.pm!.evidenceSourceIds = [ids.source, ids.source];
  assert.throws(() => parseSaveBody(body), /references must be unique/i);
});

test("accepts separate PM drafts with independent version histories", () => {
  const body = validBody();
  const sibling = { ...body.analysis.pm!, id: ids.siblingPm, title: "QA sibling PM" };
  body.analysis.additionalPms = [{ pm: sibling, pmVersions: [] }];
  const parsed = parseSaveBody(body);
  assert.equal(parsed.analysis.pm?.id, ids.pm);
  assert.equal(parsed.analysis.additionalPms?.[0].pm.id, ids.siblingPm);
});

test("rejects a sibling PM that exceeds the 15-step cap", () => {
  const body = validBody();
  const sibling = { ...body.analysis.pm!, id: ids.siblingPm, taskSteps: Array.from({ length: 14 }, (_, index) => `Synthetic step ${index + 1}`) };
  body.analysis.additionalPms = [{ pm: sibling, pmVersions: [] }];
  assert.throws(() => parseSaveBody(body), /keep the pm to 15 steps or fewer/i);
});

test("rejects duplicate PM IDs across the analysis plan list", () => {
  const body = validBody();
  body.analysis.additionalPms = [{ pm: { ...body.analysis.pm! }, pmVersions: [] }];
  assert.throws(() => parseSaveBody(body), /pm ids must be unique/i);
});

test("rejects continuing without a saved source review", () => {
  const body = validBody();
  body.analysis.plannerEvidence!.reviewedAt = undefined;
  assert.throws(() => parseSaveBody(body), /review the planner source before continuing/i);
});

test("rejects a later workflow stage without the explicit limitation decision", () => {
  const body = validBody();
  body.analysis.evidenceDecision = "not_decided";
  assert.throws(() => parseSaveBody(body), /source review decision must be saved/i);
});
