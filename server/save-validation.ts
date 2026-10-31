import { MAX_PM_STEPS, PLANNER_EVIDENCE_BASE_LIMITATION, type EvidenceApplicability, type PlannerAnalysis } from "../src/domain/planner.js";

export type SaveBody = { operationId: string; expectedRowVersion: number; analysis: PlannerAnalysis };

export function assertReviewedManualReferences(referencedIds: readonly string[], verifiedIds: readonly string[]): void {
  const verified = new Set(verifiedIds);
  if (verified.size !== verifiedIds.length || referencedIds.length !== verifiedIds.length ||
      referencedIds.some((id) => !verified.has(id))) {
    throw Object.assign(new Error("Review each manual source and confirm it belongs to this analysis before attaching it to a PM."), { statusCode: 422 });
  }
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function parseSaveBody(body: unknown): SaveBody {
  if (!isRecord(body) || !uuidPattern.test(String(body.operationId)) || !Number.isInteger(body.expectedRowVersion) || !isRecord(body.analysis)) {
    throw Object.assign(new Error("The save request is invalid."), { statusCode: 400 });
  }
  const analysis = body.analysis as unknown as PlannerAnalysis;
  if (!uuidPattern.test(analysis.id) || analysis.rowVersion !== body.expectedRowVersion ||
      !uuidPattern.test(analysis.locationId) || !uuidPattern.test(analysis.areaId) ||
      !Number.isInteger(analysis.stage) || analysis.stage < 0 || analysis.stage > 3 ||
      ![analysis.equipmentName, analysis.originalEquipmentName, analysis.manufacturer, analysis.model,
        analysis.plannerNotes, analysis.createdAt, analysis.updatedAt].every((value) => typeof value === "string") ||
      !Array.isArray(analysis.assets) || !["not_decided", "continue_with_limitations"].includes(analysis.evidenceDecision)) {
    throw Object.assign(new Error("The analysis data is invalid."), { statusCode: 400 });
  }
  const evidence = analysis.plannerEvidence;
  const validApplicabilities: EvidenceApplicability[] = ["applicable", "different_variant", "unknown", "not_applicable"];
  if (!isRecord(evidence) || !uuidPattern.test(String(evidence.id)) || evidence.kind !== "plannerData" ||
      typeof evidence.title !== "string" || typeof evidence.locator !== "string" ||
      !validApplicabilities.includes(evidence.applicability as EvidenceApplicability) ||
      typeof evidence.applicabilityDetails !== "string" || !Array.isArray(evidence.limitations) ||
      !evidence.limitations.every((item) => typeof item === "string" && item.trim().length > 0) ||
      !evidence.limitations.includes(PLANNER_EVIDENCE_BASE_LIMITATION) ||
      (evidence.reviewedAt !== undefined && (typeof evidence.reviewedAt !== "string" || !Number.isFinite(Date.parse(evidence.reviewedAt))))) {
    throw Object.assign(new Error("The planner source record is invalid."), { statusCode: 400 });
  }
  if (analysis.evidenceDecision === "continue_with_limitations" && typeof evidence.reviewedAt !== "string") {
    throw Object.assign(new Error("Review the planner source before continuing with limitations."), { statusCode: 422 });
  }
  if (analysis.stage >= 2 && (analysis.evidenceDecision !== "continue_with_limitations" || typeof evidence.reviewedAt !== "string")) {
    throw Object.assign(new Error("The source review decision must be saved before this workflow stage."), { statusCode: 422 });
  }
  const manualDocuments = Array.isArray(analysis.manualDocuments) ? analysis.manualDocuments : [];
  for (const manual of manualDocuments) {
    if (!isRecord(manual) || manual.kind !== "manual" || !uuidPattern.test(String(manual.id)) ||
        !uuidPattern.test(String(manual.documentId)) || typeof manual.fileName !== "string" ||
        typeof manual.sha256 !== "string" || !/^[a-f0-9]{64}$/i.test(manual.sha256)) {
      throw Object.assign(new Error("A manual source record is invalid."), { statusCode: 400 });
    }
  }
  if (new Set(manualDocuments.map((manual) => (manual as Record<string, unknown>).id)).size !== manualDocuments.length) {
    throw Object.assign(new Error("Manual source IDs must be unique within an analysis."), { statusCode: 400 });
  }
  for (const asset of analysis.assets) {
    if (!isRecord(asset) || !uuidPattern.test(String(asset.id)) ||
        !["equipment", "subasset"].includes(String(asset.kind)) ||
        typeof asset.name !== "string" || typeof asset.sourceTerm !== "string" || typeof asset.confirmed !== "boolean") {
      throw Object.assign(new Error("The asset proposal is invalid."), { statusCode: 400 });
    }
  }
  if (new Set(analysis.assets.map((asset) => asset.id)).size !== analysis.assets.length) {
    throw Object.assign(new Error("Asset IDs must be unique within an analysis."), { statusCode: 400 });
  }
  if (analysis.pm) {
    const pm = analysis.pm as unknown as Record<string, unknown>;
    const validStates = ["running", "stopped", "undetermined"];
    const validStatuses = ["draft", "approved"];
    if (!isRecord(analysis.pm) || !uuidPattern.test(String(pm.id)) || !uuidPattern.test(String(pm.assetId)) ||
        ![pm.title, pm.frequency, pm.durationMinutes, pm.safetyPrecautions, pm.finalVerification, pm.createdAt].every((value) => typeof value === "string") ||
        !validStates.includes(String(pm.operatingState)) || !validStatuses.includes(String(pm.status)) ||
        typeof pm.unresolvedSafetyAcknowledged !== "boolean" || !Array.isArray(pm.taskSteps) ||
        !pm.taskSteps.every((step) => typeof step === "string") ||
        !Array.isArray(pm.evidenceSourceIds) || !pm.evidenceSourceIds.every((id) => typeof id === "string" && uuidPattern.test(id)) ||
        (pm.approvedAt !== undefined && typeof pm.approvedAt !== "string") ||
        (pm.revisionNumber !== undefined && (!Number.isInteger(pm.revisionNumber) || Number(pm.revisionNumber) < 0)) ||
        (pm.baseRevisionNumber !== undefined && (!Number.isInteger(pm.baseRevisionNumber) || Number(pm.baseRevisionNumber) < 0)) ||
        (pm.changeSummary !== undefined && (typeof pm.changeSummary !== "string" || pm.changeSummary.length > 2000))) {
      throw Object.assign(new Error("The PM data is invalid."), { statusCode: 400 });
    }
    if (new Set(pm.evidenceSourceIds as string[]).size !== (pm.evidenceSourceIds as string[]).length) {
      throw Object.assign(new Error("PM evidence references must be unique."), { statusCode: 400 });
    }
    const validSourceIds = new Set([evidence.id, ...manualDocuments.map((manual) => String((manual as Record<string, unknown>).id))]);
    if ((pm.evidenceSourceIds as string[]).some((id) => !validSourceIds.has(id))) {
      throw Object.assign(new Error("A PM may reference only a source attached to this analysis."), { statusCode: 422 });
    }
    if ((pm.evidenceSourceIds as string[]).includes(evidence.id) && typeof evidence.reviewedAt !== "string") {
      throw Object.assign(new Error("Review the planner source before attaching it to a PM."), { statusCode: 422 });
    }
    if (analysis.pm.taskSteps.length + 2 > MAX_PM_STEPS) {
      throw Object.assign(new Error(`Keep the PM to ${MAX_PM_STEPS} steps or fewer.`), { statusCode: 422 });
    }
  }
  return { operationId: String(body.operationId), expectedRowVersion: Number(body.expectedRowVersion), analysis };
}
