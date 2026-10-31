import "dotenv/config";
import Fastify, { type FastifyRequest } from "fastify";
import { createClient } from "@supabase/supabase-js";
import { createHash, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { Pool, type PoolClient } from "pg";
import { getDocument as getPdfDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { createPlannerEvidence, PLANNER_EVIDENCE_BASE_LIMITATION, pmApprovalIssues, type AssetProposal, type CatalogLocation, type EvidenceApplicability, type PlannerAnalysis, type PmDraft, type PmVersionHistoryEntry } from "../src/domain/planner.js";
import { assertReviewedManualReferences, parseSaveBody, type SaveBody } from "./save-validation.js";
import { MANUAL_CONTENT_TYPES, parseManualUploadDescriptor, readManualUploadConfig, verifyPdfPageCount, type ManualExtractionMethod, type ManualLocatorRange, type ManualUploadDescriptor } from "./manual-validation.js";

type Principal = { userId: string; workspaceId: string };

declare module "fastify" {
  interface FastifyRequest {
    principal: Principal | null;
  }
}

const required = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
};

const supabaseUrl = required("SUPABASE_URL");
const publishableKey = required("SUPABASE_PUBLISHABLE_KEY");
const databaseUrl = new URL(required("DATABASE_URL"));
const localDatabaseHosts = new Set(["localhost", "127.0.0.1", "::1"]);
const databaseHostname = databaseUrl.hostname.replace(/^\[|\]$/g, "");
const isLocalDatabase = localDatabaseHosts.has(databaseHostname);
const databaseSslCaFile = process.env.DATABASE_SSL_CA_FILE;
if (!isLocalDatabase && !databaseSslCaFile) {
  throw new Error("DATABASE_SSL_CA_FILE is required for remote PostgreSQL connections.");
}
databaseUrl.searchParams.delete("sslmode");
const databaseSsl = databaseSslCaFile
  ? { ca: readFileSync(databaseSslCaFile, "utf8"), rejectUnauthorized: true }
  : undefined;
const expectedIssuer = `${supabaseUrl.replace(/\/+$/, "")}/auth/v1`;
const supabaseAuth = createClient(supabaseUrl, publishableKey, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
});
const pool = new Pool({
  connectionString: databaseUrl.toString(),
  ...(databaseSsl ? { ssl: databaseSsl } : {}),
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});
let pmRevisionSchemaPromise: Promise<boolean> | undefined;
function pmRevisionSchemaReady(): Promise<boolean> {
  pmRevisionSchemaPromise ??= pool.query<{ ready: boolean }>(
    `SELECT count(*) = 2 AS ready
       FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'pm_versions'
        AND column_name = ANY($1::text[])`,
    [["change_summary", "base_revision_number"]],
  ).then((result) => Boolean(result.rows[0]?.ready));
  return pmRevisionSchemaPromise;
}
const app = Fastify({ logger: true, bodyLimit: 1_048_576 });
app.decorateRequest("principal", null);
// Limits are evaluated once when the API process starts; unset values keep intake closed.
const manualUploadConfig = readManualUploadConfig(process.env);
app.addContentTypeParser("application/octet-stream", { parseAs: "buffer" }, (_request, body, done) => done(null, body));

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const workflowStages = ["intake", "awaitingReview", "assetsReview", "pmReview"] as const;

function digest(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

async function authenticate(request: FastifyRequest, reply: { code: (n: number) => typeof reply; send: (body: unknown) => unknown }) {
  const header = request.headers.authorization;
  const match = typeof header === "string" ? /^Bearer\s+(.+)$/i.exec(header) : null;
  if (!match) return reply.code(401).send({ message: "Sign in to access this workspace." });

  const { data, error } = await supabaseAuth.auth.getClaims(match[1]);
  const claims = data?.claims as Record<string, unknown> | undefined;
  const userId = claims?.sub;
  if (error || typeof userId !== "string" || !uuidPattern.test(userId) ||
      claims?.role !== "authenticated" || claims?.aud !== "authenticated" || claims?.iss !== expectedIssuer) {
    return reply.code(401).send({ message: "Your session is invalid or expired. Sign in again." });
  }
  const { rows } = await pool.query<{ id: string; workspace_id: string }>(
    "SELECT id, workspace_id FROM public.users WHERE id = $1 LIMIT 1",
    [userId],
  );
  if (!rows[0]) return reply.code(403).send({ message: "This account is not provisioned for a PlannerMC workspace." });
  request.principal = { userId: rows[0].id, workspaceId: rows[0].workspace_id };
}

function principal(request: FastifyRequest): Principal {
  if (!request.principal) throw Object.assign(new Error("Sign in to access this workspace."), { statusCode: 401 });
  return request.principal;
}

async function loadCatalog(owner: Principal): Promise<CatalogLocation[]> {
  const { rows } = await pool.query<{ id: string; name_en: string; area_id: string; area_name: string }>(
    `SELECT l.id, l.name_en, a.id AS area_id, a.name_en AS area_name
       FROM public.locations l
       JOIN public.areas a ON a.location_id = l.id AND a.workspace_id = l.workspace_id
       JOIN public.users u ON u.workspace_id = l.workspace_id
      WHERE u.id = $1 AND l.workspace_id = $2
      ORDER BY l.name_en, a.name_en`,
    [owner.userId, owner.workspaceId],
  );
  const locations = new Map<string, CatalogLocation>();
  for (const row of rows) {
    const location = locations.get(row.id) ?? { id: row.id, name: row.name_en, areas: [] };
    location.areas.push({ id: row.area_id, name: row.area_name });
    locations.set(row.id, location);
  }
  return [...locations.values()];
}

async function loadAnalysis(owner: Principal, analysisId: string): Promise<PlannerAnalysis | null> {
  const { rows } = await pool.query<{
    id: string; location_id: string; area_id: string; processing_stage: string;
    equipment_name: string; original_equipment_name: string; manufacturer: string; model: string;
    planner_notes: string; evidence_decision: PlannerAnalysis["evidenceDecision"];
    row_version: number; created_at: Date; updated_at: Date;
  }>(
    `SELECT id, location_id, area_id, processing_stage, equipment_name,
            original_equipment_name, manufacturer, model, planner_notes,
            evidence_decision, row_version, created_at, updated_at
       FROM public.analyses
      WHERE id = $1 AND owner_id = $2 AND workspace_id = $3`,
    [analysisId, owner.userId, owner.workspaceId],
  );
  const row = rows[0];
  if (!row) return null;

  const assetsResult = await pool.query<{
    id: string; kind: "equipment" | "subAsset"; name_en: string; original_name: string | null; confirmed_at: Date | null;
  }>(
    `SELECT id, kind, name_en, original_name, confirmed_at
       FROM public.assets
      WHERE analysis_id = $1 AND owner_id = $2 AND workspace_id = $3
      ORDER BY CASE WHEN kind = 'equipment' THEN 0 ELSE 1 END, created_at, id`,
    [analysisId, owner.userId, owner.workspaceId],
  );
  const assets: AssetProposal[] = assetsResult.rows.map((asset) => ({
    id: asset.id,
    kind: asset.kind === "equipment" ? "equipment" : "subasset",
    name: asset.name_en,
    sourceTerm: asset.original_name ?? "",
    confirmed: Boolean(asset.confirmed_at),
  }));

  const sourceResult = await pool.query<{
    id: string; title: string; locator: { kind?: unknown; text?: unknown } | null;
    applicability: EvidenceApplicability; applicability_details: string; limitations: string[]; reviewed_at: Date | null;
  }>(
    `SELECT id, title, locator, applicability, applicability_details, limitations, reviewed_at
       FROM public.sources
      WHERE analysis_id = $1 AND owner_id = $2 AND workspace_id = $3 AND kind = 'plannerData'
      LIMIT 1`,
    [analysisId, owner.userId, owner.workspaceId],
  );
  const source = sourceResult.rows[0];
  const plannerEvidence = source ? {
    id: source.id,
    kind: "plannerData" as const,
    title: source.title,
    locator: typeof source.locator?.text === "string" ? source.locator.text : "Planner notes",
    applicability: source.applicability,
    applicabilityDetails: source.applicability_details,
    limitations: Array.isArray(source.limitations) ? source.limitations : [PLANNER_EVIDENCE_BASE_LIMITATION],
    reviewedAt: source.reviewed_at?.toISOString(),
  } : createPlannerEvidence(row.id);

  const manualResult = await pool.query<{
    source_id: string; document_id: string; title: string; file_name: string; content_type: string;
    byte_size: string | number; sha256: string; page_count: number | null; extraction_method: ManualExtractionMethod;
    applicability: EvidenceApplicability; applicability_details: string; limitations: string[]; reviewed_at: Date | null;
    source_locator: Record<string, unknown> | null;
  }>(
    `SELECT s.id AS source_id, d.id AS document_id, s.title, d.file_name, d.content_type,
            d.byte_size, d.sha256, d.page_count, d.extraction_method, s.applicability,
            s.applicability_details, s.limitations, s.reviewed_at, s.locator AS source_locator
       FROM public.sources s
       JOIN public.original_documents d ON d.source_id = s.id
      WHERE s.analysis_id = $1 AND s.owner_id = $2 AND s.workspace_id = $3 AND s.kind = 'manual'
      ORDER BY s.created_at, s.id`,
    [analysisId, owner.userId, owner.workspaceId],
  );
  const manualDocuments = manualResult.rows.map((manual) => ({
    id: manual.source_id,
    documentId: manual.document_id,
    kind: "manual" as const,
    title: manual.title,
    fileName: manual.file_name,
    contentType: manual.content_type,
    byteSize: Number(manual.byte_size),
    sha256: manual.sha256,
    pageCount: manual.page_count,
    extractionMethod: manual.extraction_method,
    locatorRange: readManualLocatorRange(manual.source_locator, manual.page_count, manual.content_type),
    applicability: manual.applicability,
    applicabilityDetails: manual.applicability_details,
    limitations: Array.isArray(manual.limitations) ? manual.limitations : [],
    reviewedAt: manual.reviewed_at?.toISOString(),
  }));

  const hasPmRevisionSchema = await pmRevisionSchemaReady();
  let pm: PmDraft | undefined;
  let pmVersions: PmVersionHistoryEntry[] = [];
  if (hasPmRevisionSchema) {
  const pmResult = await pool.query<{
    pm_id: string; draft_content: PmDraft | null; draft_base_revision_number: number | null;
    draft_change_summary: string | null; approved_content: PmDraft | null;
    approved_revision_number: number | null; approved_at: Date | null; approved_change_summary: string | null;
  }>(
    `SELECT p.id AS pm_id, draft.content AS draft_content,
            draft.base_revision_number AS draft_base_revision_number,
            draft.change_summary AS draft_change_summary,
            approved.content AS approved_content,
            approved.revision_number AS approved_revision_number,
            approved.approved_at, approved.change_summary AS approved_change_summary
       FROM public.pms p
       JOIN public.assets a ON a.id = p.asset_id
       LEFT JOIN public.pm_versions approved ON approved.id = p.current_approved_version_id
       LEFT JOIN LATERAL (
         SELECT content, base_revision_number, change_summary
           FROM public.pm_versions WHERE pm_id = p.id AND status = 'draft' LIMIT 1
       ) draft ON true
      WHERE a.analysis_id = $1 AND p.owner_id = $2 AND p.workspace_id = $3
      ORDER BY p.updated_at DESC LIMIT 1`,
    [analysisId, owner.userId, owner.workspaceId],
  );
  const pmRecord = pmResult.rows[0];
  if (pmRecord) {
    const versionsResult = await pool.query<{
      id: string; revision_number: number; content: PmDraft; change_summary: string | null; approved_at: Date;
    }>(
      `SELECT id, revision_number, content, change_summary, approved_at
         FROM public.pm_versions
        WHERE pm_id = $1 AND owner_id = $2 AND workspace_id = $3 AND status = 'confirmedApproved'
        ORDER BY revision_number ASC`,
      [pmRecord.pm_id, owner.userId, owner.workspaceId],
    );
    pmVersions = versionsResult.rows.map((version) => {
      const approvedAt = version.approved_at.toISOString();
      const snapshot: PmDraft = {
        ...version.content,
        id: version.content.id ?? pmRecord.pm_id,
        status: "approved",
        approvedAt,
        revisionNumber: version.revision_number,
        baseRevisionNumber: undefined,
        changeSummary: version.change_summary ?? "",
        evidenceSourceIds: version.content.evidenceSourceIds ?? [],
      };
      return {
        id: version.id,
        revisionNumber: version.revision_number,
        approvedAt,
        changeSummary: version.change_summary,
        pm: snapshot,
      };
    });
    if (pmRecord.draft_content) {
      pm = {
        ...pmRecord.draft_content,
        id: pmRecord.draft_content.id ?? pmRecord.pm_id,
        status: "draft",
        baseRevisionNumber: pmRecord.draft_base_revision_number ?? undefined,
        changeSummary: pmRecord.draft_change_summary ?? "",
        approvedAt: undefined,
        revisionNumber: undefined,
        evidenceSourceIds: pmRecord.draft_content.evidenceSourceIds ?? [],
      };
    } else if (pmRecord.approved_content) {
      pm = {
        ...pmRecord.approved_content,
        id: pmRecord.approved_content.id ?? pmRecord.pm_id,
        status: "approved",
        approvedAt: pmRecord.approved_at?.toISOString(),
        revisionNumber: pmRecord.approved_revision_number ?? 0,
        baseRevisionNumber: undefined,
        changeSummary: pmRecord.approved_change_summary ?? "",
        evidenceSourceIds: pmRecord.approved_content.evidenceSourceIds ?? [],
      };
    }
  }
  } else {
    const pmResult = await pool.query<{
      pm_id: string; approved_id: string | null; approved_content: PmDraft | null;
      approved_at: Date | null; draft_content: PmDraft | null;
    }>(
      `SELECT p.id AS pm_id, approved.id AS approved_id, approved.content AS approved_content,
              approved.approved_at, draft.content AS draft_content
         FROM public.pms p
         JOIN public.assets a ON a.id = p.asset_id
         LEFT JOIN public.pm_versions approved ON approved.id = p.current_approved_version_id
         LEFT JOIN LATERAL (
           SELECT content FROM public.pm_versions WHERE pm_id = p.id AND status = 'draft' LIMIT 1
         ) draft ON true
        WHERE a.analysis_id = $1 AND p.owner_id = $2 AND p.workspace_id = $3
        ORDER BY p.updated_at DESC LIMIT 1`,
      [analysisId, owner.userId, owner.workspaceId],
    );
    const legacyRecord = pmResult.rows[0];
    if (legacyRecord?.approved_content && legacyRecord.approved_id) {
      const approvedAt = legacyRecord.approved_at?.toISOString() ?? new Date(0).toISOString();
      const approvedPm: PmDraft = {
        ...legacyRecord.approved_content,
        id: legacyRecord.approved_content.id ?? legacyRecord.pm_id,
        status: "approved",
        approvedAt,
        revisionNumber: 0,
        baseRevisionNumber: undefined,
        changeSummary: "",
        evidenceSourceIds: legacyRecord.approved_content.evidenceSourceIds ?? [],
      };
      pmVersions = [{ id: legacyRecord.approved_id, revisionNumber: 0, approvedAt, changeSummary: null, pm: approvedPm }];
    }
    const currentContent = legacyRecord?.draft_content ?? legacyRecord?.approved_content;
    if (currentContent && legacyRecord) {
      pm = {
        ...currentContent,
        id: currentContent.id ?? legacyRecord.pm_id,
        status: legacyRecord.draft_content ? "draft" : "approved",
        approvedAt: legacyRecord.draft_content ? undefined : legacyRecord.approved_at?.toISOString(),
        revisionNumber: legacyRecord.draft_content ? undefined : 0,
        baseRevisionNumber: undefined,
        changeSummary: "",
        evidenceSourceIds: currentContent.evidenceSourceIds ?? [],
      };
    }
  }
  const stageIndex = Math.max(0, workflowStages.indexOf(row.processing_stage as typeof workflowStages[number]));
  return {
    id: row.id,
    rowVersion: row.row_version,
    locationId: row.location_id,
    areaId: row.area_id,
    equipmentName: row.equipment_name,
    originalEquipmentName: row.original_equipment_name,
    manufacturer: row.manufacturer,
    model: row.model,
    plannerNotes: row.planner_notes,
    plannerEvidence,
    manualDocuments,
    evidenceDecision: row.evidence_decision,
    assets,
    pm,
    pmVersions,
    stage: stageIndex,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

async function loadWorkspace(owner: Principal, currentAnalysisId?: string): Promise<{
  analyses: PlannerAnalysis[]; currentAnalysisId: string | null; catalog: CatalogLocation[]; pmRevisionLifecycleEnabled: boolean;
}> {
  const revisionLifecycleEnabled = await pmRevisionSchemaReady();
  const ids = await pool.query<{ id: string }>(
    `SELECT id FROM public.analyses
      WHERE owner_id = $1 AND workspace_id = $2
      ORDER BY updated_at DESC, id`,
    [owner.userId, owner.workspaceId],
  );
  const analyses: PlannerAnalysis[] = [];
  for (const item of ids.rows) {
    const loaded = await loadAnalysis(owner, item.id);
    if (loaded) analyses.push(loaded);
  }
  const selected = currentAnalysisId && analyses.some((item) => item.id === currentAnalysisId)
    ? currentAnalysisId
    : analyses[0]?.id ?? null;
  return { analyses, currentAnalysisId: selected, catalog: await loadCatalog(owner), pmRevisionLifecycleEnabled: revisionLifecycleEnabled };
}

function canonicalAnalysis(analysis: PlannerAnalysis, includeRevisionIntent = false) {
  const pm = analysis.pm ? {
    id: analysis.pm.id,
    title: analysis.pm.title,
    assetId: analysis.pm.assetId,
    frequency: analysis.pm.frequency,
    durationMinutes: analysis.pm.durationMinutes,
    operatingState: analysis.pm.operatingState,
    safetyPrecautions: analysis.pm.safetyPrecautions,
    unresolvedSafetyAcknowledged: analysis.pm.unresolvedSafetyAcknowledged,
    taskSteps: analysis.pm.taskSteps,
    finalVerification: analysis.pm.finalVerification,
    evidenceSourceIds: analysis.pm.evidenceSourceIds,
    status: analysis.pm.status,
    changeSummary: analysis.pm.changeSummary?.trim() ?? "",
    baseRevisionNumber: analysis.pm.status === "draft" || includeRevisionIntent ? analysis.pm.baseRevisionNumber : undefined,
  } : null;
  return {
    id: analysis.id,
    locationId: analysis.locationId,
    areaId: analysis.areaId,
    equipmentName: analysis.equipmentName,
    originalEquipmentName: analysis.originalEquipmentName,
    manufacturer: analysis.manufacturer,
    model: analysis.model,
    plannerNotes: analysis.plannerNotes,
    plannerEvidence: analysis.plannerEvidence,
    evidenceDecision: analysis.evidenceDecision,
    stage: analysis.stage,
    assets: analysis.assets.map((asset) => ({ ...asset })).sort((a, b) => a.id.localeCompare(b.id)),
    pm,
  };
}

async function persistAnalysis(owner: Principal, body: SaveBody, creating: boolean): Promise<{ analysis: PlannerAnalysis; workspace: Awaited<ReturnType<typeof loadWorkspace>> }> {
  const { analysis, expectedRowVersion, operationId } = body;
  if (creating !== (expectedRowVersion === 0)) throw Object.assign(new Error("The analysis version is invalid."), { statusCode: 409 });
  if (analysis.pm) {
    const confirmed = analysis.assets.filter((asset) => asset.confirmed);
    if (!confirmed.some((asset) => asset.id === analysis.pm?.assetId)) {
      throw Object.assign(new Error("The PM must reference an asset confirmed in this analysis."), { statusCode: 422 });
    }
    if (analysis.pm.status === "approved") {
      const issues = pmApprovalIssues(analysis.pm, confirmed);
      if (issues.length) throw Object.assign(new Error(issues.join(" ")), { statusCode: 422 });
    }
  }

  const client: PoolClient = await pool.connect();
  const requestDigest = digest({ analysis: canonicalAnalysis(analysis, true), expectedRowVersion });
  let expectedStored: PlannerAnalysis | null = null;
  let expectedPmVersions: PmVersionHistoryEntry[] | undefined;
  try {
    await client.query("BEGIN");
    const priorOperation = await client.query<{ request_digest: string }>(
      `SELECT request_digest FROM public.operation_receipts
        WHERE owner_id = $1 AND workspace_id = $2 AND operation_id = $3 FOR UPDATE`,
      [owner.userId, owner.workspaceId, operationId],
    );
    if (priorOperation.rows[0]) {
      if (priorOperation.rows[0].request_digest !== requestDigest) {
        throw Object.assign(new Error("This operation ID was already used for a different save."), { statusCode: 409 });
      }
      await client.query("COMMIT");
      const replayed = await loadAnalysis(owner, analysis.id);
      if (!replayed) throw Object.assign(new Error("The saved result could not be verified."), { statusCode: 503 });
      return { analysis: replayed, workspace: await loadWorkspace(owner, analysis.id) };
    }

    const existing = await client.query<{ row_version: number }>(
      `SELECT row_version FROM public.analyses
        WHERE id = $1 AND owner_id = $2 AND workspace_id = $3 FOR UPDATE`,
      [analysis.id, owner.userId, owner.workspaceId],
    );
    if ((existing.rows[0]?.row_version ?? 0) !== expectedRowVersion) {
      throw Object.assign(new Error("This analysis changed in another tab or session. Reload it and review the saved version before continuing."), { statusCode: 409 });
    }
    const area = await client.query(
      `SELECT 1 FROM public.areas
        WHERE id = $1 AND location_id = $2 AND workspace_id = $3`,
      [analysis.areaId, analysis.locationId, owner.workspaceId],
    );
    if (!area.rowCount) throw Object.assign(new Error("The selected location and area are not configured for this workspace."), { statusCode: 422 });

    const nextRowVersion = expectedRowVersion + 1;
    const stage = workflowStages[analysis.stage];
    if (existing.rows[0]) {
      const result = await client.query(
        `UPDATE public.analyses
            SET location_id = $4, area_id = $5, processing_stage = $6,
                equipment_name = $7, original_equipment_name = $8,
                manufacturer = $9, model = $10, planner_notes = $11,
                evidence_decision = $12, row_version = $13, updated_at = now()
          WHERE id = $1 AND owner_id = $2 AND workspace_id = $3
            AND row_version = $14 RETURNING id`,
        [analysis.id, owner.userId, owner.workspaceId, analysis.locationId, analysis.areaId, stage,
          analysis.equipmentName, analysis.originalEquipmentName, analysis.manufacturer, analysis.model,
          analysis.plannerNotes, analysis.evidenceDecision, nextRowVersion, expectedRowVersion],
      );
      if (!result.rowCount) throw Object.assign(new Error("This analysis changed while you were saving. Reload and review the current version."), { statusCode: 409 });
    } else {
      await client.query(
        `INSERT INTO public.analyses
          (id, owner_id, workspace_id, location_id, area_id, processing_stage,
           equipment_name, original_equipment_name, manufacturer, model, planner_notes,
           evidence_decision, row_version)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [analysis.id, owner.userId, owner.workspaceId, analysis.locationId, analysis.areaId, stage,
          analysis.equipmentName, analysis.originalEquipmentName, analysis.manufacturer, analysis.model,
          analysis.plannerNotes, analysis.evidenceDecision, nextRowVersion],
      );
    }

    const priorSource = await client.query<{ id: string }>(
      `SELECT id FROM public.sources
        WHERE analysis_id = $1 AND owner_id = $2 AND workspace_id = $3 AND kind = 'plannerData'
        FOR UPDATE`,
      [analysis.id, owner.userId, owner.workspaceId],
    );
    if (priorSource.rows[0] && priorSource.rows[0].id !== analysis.plannerEvidence?.id) {
      throw Object.assign(new Error("The planner source changed in another session. Reload the analysis and review it before saving."), { statusCode: 409 });
    }
    const sourceIdOwner = await client.query<{ analysis_id: string }>(
      `SELECT analysis_id FROM public.sources WHERE id = $1 FOR UPDATE`,
      [analysis.plannerEvidence?.id],
    );
    if (sourceIdOwner.rows[0] && sourceIdOwner.rows[0].analysis_id !== analysis.id) {
      throw Object.assign(new Error("This planner source identifier is already in use. Reload the analysis and try again."), { statusCode: 409 });
    }
    if (analysis.plannerEvidence) {
      await client.query(
        `INSERT INTO public.sources
          (id, analysis_id, owner_id, workspace_id, kind, original_text, title, locator,
           applicability, applicability_details, limitations, reviewed_at)
         VALUES ($1,$2,$3,$4,'plannerData',$5,$6,$7::jsonb,$8,$9,$10::jsonb,$11)
         ON CONFLICT (analysis_id) WHERE kind = 'plannerData'
         DO UPDATE SET original_text = EXCLUDED.original_text, title = EXCLUDED.title,
           locator = EXCLUDED.locator, applicability = EXCLUDED.applicability,
           applicability_details = EXCLUDED.applicability_details,
           limitations = EXCLUDED.limitations, reviewed_at = EXCLUDED.reviewed_at, updated_at = now()`,
        [analysis.plannerEvidence.id, analysis.id, owner.userId, owner.workspaceId, analysis.plannerNotes,
          analysis.plannerEvidence.title, JSON.stringify({ kind: "plannerNotes", text: analysis.plannerEvidence.locator }),
          analysis.plannerEvidence.applicability, analysis.plannerEvidence.applicabilityDetails,
          JSON.stringify(analysis.plannerEvidence.limitations), analysis.plannerEvidence.reviewedAt ?? null],
      );
    }

    const manualReferenceIds = analysis.pm?.evidenceSourceIds.filter((id) => id !== analysis.plannerEvidence?.id) ?? [];
    if (manualReferenceIds.length) {
      const referenced = await client.query<{ id: string }>(
        `SELECT s.id
           FROM public.sources s
           JOIN public.original_documents d ON d.source_id = s.id
          WHERE s.id = ANY($1::uuid[]) AND s.analysis_id = $2
            AND s.owner_id = $3 AND s.workspace_id = $4
            AND s.kind = 'manual' AND s.reviewed_at IS NOT NULL`,
        [manualReferenceIds, analysis.id, owner.userId, owner.workspaceId],
      );
      assertReviewedManualReferences(manualReferenceIds, referenced.rows.map((row) => row.id));
    }

    const equipment = analysis.assets.find((asset) => asset.kind === "equipment");
    if (analysis.assets.filter((asset) => asset.kind === "equipment").length > 1) {
      throw Object.assign(new Error("An analysis may contain only one equipment asset."), { statusCode: 422 });
    }
    for (const asset of analysis.assets) {
      if (asset.kind === "subasset" && (!equipment || equipment.id === asset.id)) {
        throw Object.assign(new Error("Each direct sub-asset must belong to the equipment root."), { statusCode: 422 });
      }
      const result = await client.query(
        `INSERT INTO public.assets
          (id, analysis_id, owner_id, workspace_id, parent_asset_id, kind,
           location_id, area_id, original_name, name_en, confirmed_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,CASE WHEN $11 THEN now() ELSE NULL END)
         ON CONFLICT (id) DO UPDATE SET
           parent_asset_id = EXCLUDED.parent_asset_id, kind = EXCLUDED.kind,
           location_id = EXCLUDED.location_id, area_id = EXCLUDED.area_id,
           original_name = EXCLUDED.original_name, name_en = EXCLUDED.name_en,
           confirmed_at = CASE WHEN EXCLUDED.confirmed_at IS NULL THEN NULL
                               ELSE COALESCE(public.assets.confirmed_at, EXCLUDED.confirmed_at) END,
           row_version = public.assets.row_version + 1, updated_at = now()
         WHERE public.assets.owner_id = EXCLUDED.owner_id
           AND public.assets.workspace_id = EXCLUDED.workspace_id
           AND public.assets.analysis_id = EXCLUDED.analysis_id
         RETURNING id`,
        [asset.id, analysis.id, owner.userId, owner.workspaceId,
          asset.kind === "equipment" ? null : equipment?.id ?? null,
          asset.kind === "equipment" ? "equipment" : "subAsset", analysis.locationId, analysis.areaId,
          asset.sourceTerm || null, asset.name, asset.confirmed],
      );
      if (!result.rowCount) throw Object.assign(new Error("An asset ID is already in use outside this analysis."), { statusCode: 409 });
    }
    const assetIds = analysis.assets.map((asset) => asset.id);
    await client.query(
      `DELETE FROM public.assets
        WHERE analysis_id = $1 AND owner_id = $2 AND workspace_id = $3
          AND NOT (id = ANY($4::uuid[])) AND kind = 'subAsset'`,
      [analysis.id, owner.userId, owner.workspaceId, assetIds],
    );

    if (analysis.pm) expectedPmVersions = await persistPm(client, owner, analysis);

    await client.query(
      `INSERT INTO public.operation_receipts
        (owner_id, workspace_id, operation_id, request_digest, result_digest,
         resource_kind, resource_id, outcome, result_summary)
       VALUES ($1,$2,$3,$4,$5,'analysis',$6,'completed',$7::jsonb)`,
      [owner.userId, owner.workspaceId, operationId, requestDigest, digest({ id: analysis.id, rowVersion: nextRowVersion }),
        analysis.id, JSON.stringify({ rowVersion: nextRowVersion })],
    );
    await client.query("COMMIT");

    const readBack = await loadAnalysis(owner, analysis.id);
    if (!readBack || JSON.stringify(canonicalAnalysis(readBack)) !== JSON.stringify(canonicalAnalysis(analysis)) ||
        (expectedPmVersions && !samePmHistory(expectedPmVersions, readBack.pmVersions ?? []))) {
      throw Object.assign(new Error("The database write completed, but its read-back did not match. The result is unverified."), { statusCode: 503 });
    }
    expectedStored = readBack;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
  if (!expectedStored) throw Object.assign(new Error("The save could not be verified."), { statusCode: 503 });
  return { analysis: expectedStored, workspace: await loadWorkspace(owner, expectedStored.id) };
}

async function persistPm(client: PoolClient, owner: Principal, analysis: PlannerAnalysis): Promise<PmVersionHistoryEntry[]> {
  if (!(await pmRevisionSchemaReady())) return persistPmLegacy(client, owner, analysis);
  const pm = analysis.pm as PmDraft;
  const existing = await client.query<{ current_approved_version_id: string | null }>(
    `SELECT current_approved_version_id FROM public.pms
      WHERE id = $1 AND owner_id = $2 AND workspace_id = $3 FOR UPDATE`,
    [pm.id, owner.userId, owner.workspaceId],
  );
  const inserted = await client.query(
    `INSERT INTO public.pms (id, asset_id, owner_id, workspace_id)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (id) DO UPDATE SET asset_id = EXCLUDED.asset_id, updated_at = now()
     WHERE public.pms.owner_id = EXCLUDED.owner_id AND public.pms.workspace_id = EXCLUDED.workspace_id
     RETURNING id`,
    [pm.id, pm.assetId, owner.userId, owner.workspaceId],
  );
  if (!inserted.rowCount) throw Object.assign(new Error("This PM belongs to another workspace."), { statusCode: 409 });

  const draftResult = await client.query<{
    id: string; content: PmDraft; base_revision_number: number | null; change_summary: string | null;
  }>(
    `SELECT id, content, base_revision_number, change_summary
       FROM public.pm_versions WHERE pm_id = $1 AND owner_id = $2 AND workspace_id = $3 AND status = 'draft'
       FOR UPDATE`,
    [pm.id, owner.userId, owner.workspaceId],
  );
  const draft = draftResult.rows[0];
  const approvedResult = await client.query<{
    id: string; revision_number: number; content: PmDraft; change_summary: string | null; approved_at: Date;
  }>(
    `SELECT id, revision_number, content, change_summary, approved_at
       FROM public.pm_versions
      WHERE pm_id = $1 AND owner_id = $2 AND workspace_id = $3 AND status = 'confirmedApproved'
      ORDER BY revision_number ASC FOR UPDATE`,
    [pm.id, owner.userId, owner.workspaceId],
  );
  const approvedRows = approvedResult.rows;
  const approvedId = existing.rows[0]?.current_approved_version_id;
  const current = approvedId ? approvedRows.find((version) => version.id === approvedId) : undefined;
  if (approvedId && !current) throw Object.assign(new Error("The current approved PM version could not be verified."), { statusCode: 409 });
  if (!approvedId && approvedRows.length) throw Object.assign(new Error("The approved PM history has no current version pointer."), { statusCode: 409 });

  if (current) {
    if (pm.status === "draft") {
      if (pm.baseRevisionNumber !== current.revision_number) {
        throw Object.assign(new Error("Start this PM revision from the current approved version before saving it."), { statusCode: 409 });
      }
      if (!draft && JSON.stringify(canonicalPm(pm)) !== JSON.stringify(canonicalPm(current.content))) {
        throw Object.assign(new Error("A new PM revision must start from the current approved version."), { statusCode: 409 });
      }
      if (draft && draft.base_revision_number !== current.revision_number) {
        throw Object.assign(new Error("The saved PM draft is based on an older approved version. Reload the analysis before continuing."), { statusCode: 409 });
      }
      const content = JSON.stringify(pmContentForStorage(pm, "draft"));
      if (draft) {
        await client.query(
          `UPDATE public.pm_versions SET content = $2::jsonb, change_summary = $3,
                  base_revision_number = $4, row_version = row_version + 1, updated_at = now()
            WHERE id = $1 AND pm_id = $5 AND status = 'draft'`,
          [draft.id, content, pm.changeSummary?.trim() ?? "", current.revision_number, pm.id],
        );
      } else {
        await client.query(
          `INSERT INTO public.pm_versions
            (pm_id, owner_id, workspace_id, content, change_summary, base_revision_number)
           VALUES ($1,$2,$3,$4::jsonb,$5,$6)`,
          [pm.id, owner.userId, owner.workspaceId, content, pm.changeSummary?.trim() ?? "", current.revision_number],
        );
      }
    } else if (pm.status === "approved") {
      if (!draft) {
        if (JSON.stringify(canonicalPm(pm)) !== JSON.stringify(canonicalPm(current.content)) ||
            (pm.changeSummary?.trim() ?? "") !== (current.change_summary ?? "")) {
          throw Object.assign(new Error("An approved PM is immutable. Start a new revision before changing it."), { statusCode: 409 });
        }
        return readPmHistory(client, owner, pm.id);
      }
      if (pm.baseRevisionNumber !== current.revision_number || draft.base_revision_number !== current.revision_number) {
        throw Object.assign(new Error("The PM revision is based on an older approved version. Reload the analysis before approval."), { statusCode: 409 });
      }
      const summary = pm.changeSummary?.trim() ?? "";
      if (!summary) throw Object.assign(new Error("Summarize the changes in this PM revision before approval."), { statusCode: 422 });
      const revisionNumber = Math.max(...approvedRows.map((version) => version.revision_number)) + 1;
      const approvedAt = new Date();
      await client.query(
        `UPDATE public.pm_versions
            SET status = 'confirmedApproved', revision_number = $2, content = $3::jsonb,
                change_summary = $4, base_revision_number = NULL, approved_by = $5, approved_at = $6,
                row_version = row_version + 1, updated_at = now()
          WHERE id = $1 AND pm_id = $7 AND status = 'draft'`,
        [draft.id, revisionNumber, JSON.stringify(pmContentForStorage(pm, "approved")), summary,
          owner.userId, approvedAt, pm.id],
      );
      await client.query(
        `UPDATE public.pms SET current_approved_version_id = $1, updated_at = now()
          WHERE id = $2 AND owner_id = $3 AND workspace_id = $4`,
        [draft.id, pm.id, owner.userId, owner.workspaceId],
      );
    } else {
      throw Object.assign(new Error("The PM status is invalid."), { statusCode: 422 });
    }
  } else if (pm.status === "approved") {
    if (pm.baseRevisionNumber !== undefined) throw Object.assign(new Error("A revision cannot be approved without an existing approved version."), { statusCode: 409 });
    let versionId: string;
    const approvedAt = new Date();
    if (draft) {
      if (draft.base_revision_number !== null) throw Object.assign(new Error("The initial PM draft has an invalid base revision."), { statusCode: 409 });
      versionId = draft.id;
      await client.query(
        `UPDATE public.pm_versions
            SET status = 'confirmedApproved', revision_number = 0, content = $2::jsonb,
                change_summary = NULL, base_revision_number = NULL,
                approved_by = $3, approved_at = $4, row_version = row_version + 1, updated_at = now()
          WHERE id = $1 AND pm_id = $5 AND status = 'draft'`,
        [versionId, JSON.stringify(pmContentForStorage(pm, "approved")), owner.userId, approvedAt, pm.id],
      );
    } else {
      versionId = randomUUID();
      await client.query(
        `INSERT INTO public.pm_versions
          (id, pm_id, owner_id, workspace_id, status, revision_number, content, approved_by, approved_at)
         VALUES ($1,$2,$3,$4,'confirmedApproved',0,$5::jsonb,$6,$7)`,
        [versionId, pm.id, owner.userId, owner.workspaceId, JSON.stringify(pmContentForStorage(pm, "approved")), owner.userId, approvedAt],
      );
    }
    await client.query(
      `UPDATE public.pms SET current_approved_version_id = $1, updated_at = now()
        WHERE id = $2 AND owner_id = $3 AND workspace_id = $4`,
      [versionId, pm.id, owner.userId, owner.workspaceId],
    );
  } else {
    if (pm.baseRevisionNumber !== undefined) throw Object.assign(new Error("A PM revision cannot be saved without an approved version."), { statusCode: 409 });
    if (draft) {
      await client.query(
        `UPDATE public.pm_versions SET content = $2::jsonb, change_summary = NULL, base_revision_number = NULL,
                row_version = row_version + 1, updated_at = now()
          WHERE id = $1 AND pm_id = $3 AND owner_id = $4 AND workspace_id = $5 AND status = 'draft'`,
        [draft.id, JSON.stringify(pmContentForStorage(pm, "draft")), pm.id, owner.userId, owner.workspaceId],
      );
    } else {
      await client.query(
        `INSERT INTO public.pm_versions (pm_id, owner_id, workspace_id, content)
         VALUES ($1,$2,$3,$4::jsonb)`,
        [pm.id, owner.userId, owner.workspaceId, JSON.stringify(pmContentForStorage(pm, "draft"))],
      );
    }
  }
  return readPmHistory(client, owner, pm.id);
}

async function persistPmLegacy(client: PoolClient, owner: Principal, analysis: PlannerAnalysis): Promise<PmVersionHistoryEntry[]> {
  const pm = analysis.pm as PmDraft;
  if (pm.baseRevisionNumber !== undefined) {
    throw Object.assign(new Error("PM revision history requires the pending database migration. The saved approved version was not changed."), { statusCode: 503 });
  }
  if (pm.changeSummary?.trim()) {
    throw Object.assign(new Error("PM change summaries require the pending database migration. The saved approved version was not changed."), { statusCode: 503 });
  }
  const existing = await client.query<{ current_approved_version_id: string | null }>(
    `SELECT current_approved_version_id FROM public.pms
      WHERE id = $1 AND owner_id = $2 AND workspace_id = $3 FOR UPDATE`,
    [pm.id, owner.userId, owner.workspaceId],
  );
  const inserted = await client.query(
    `INSERT INTO public.pms (id, asset_id, owner_id, workspace_id)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (id) DO UPDATE SET asset_id = EXCLUDED.asset_id, updated_at = now()
     WHERE public.pms.owner_id = EXCLUDED.owner_id AND public.pms.workspace_id = EXCLUDED.workspace_id
     RETURNING id`,
    [pm.id, pm.assetId, owner.userId, owner.workspaceId],
  );
  if (!inserted.rowCount) throw Object.assign(new Error("This PM belongs to another workspace."), { statusCode: 409 });
  const draft = await client.query<{ id: string }>(
    `SELECT id FROM public.pm_versions WHERE pm_id = $1 AND status = 'draft' FOR UPDATE`, [pm.id],
  );
  const approvedId = existing.rows[0]?.current_approved_version_id;
  if (approvedId) {
    const approved = await client.query<{ content: PmDraft }>(
      "SELECT content FROM public.pm_versions WHERE id = $1 AND pm_id = $2", [approvedId, pm.id],
    );
    if (pm.status !== "approved" || !approved.rows[0] ||
        JSON.stringify(canonicalPm(approved.rows[0].content)) !== JSON.stringify(canonicalPm(pm))) {
      throw Object.assign(new Error("An approved PM version is immutable. Apply the PM revision migration before starting a later revision."), { statusCode: 409 });
    }
    return readPmHistoryLegacy(client, owner, pm.id);
  }
  if (pm.status === "approved") {
    const approvedAt = new Date();
    let versionId: string;
    if (draft.rows[0]) {
      versionId = draft.rows[0].id;
      await client.query(
        `UPDATE public.pm_versions
            SET status = 'confirmedApproved', revision_number = 0, content = $2::jsonb,
                approved_by = $3, approved_at = $4, row_version = row_version + 1, updated_at = now()
          WHERE id = $1 AND pm_id = $5 AND status = 'draft'`,
        [versionId, JSON.stringify(pmContentForStorage(pm, "approved")), owner.userId, approvedAt, pm.id],
      );
    } else {
      versionId = randomUUID();
      await client.query(
        `INSERT INTO public.pm_versions
          (id, pm_id, owner_id, workspace_id, status, revision_number, content, approved_by, approved_at)
         VALUES ($1,$2,$3,$4,'confirmedApproved',0,$5::jsonb,$6,$7)`,
        [versionId, pm.id, owner.userId, owner.workspaceId, JSON.stringify(pmContentForStorage(pm, "approved")), owner.userId, approvedAt],
      );
    }
    await client.query(
      `UPDATE public.pms SET current_approved_version_id = $1, updated_at = now()
        WHERE id = $2 AND owner_id = $3 AND workspace_id = $4`,
      [versionId, pm.id, owner.userId, owner.workspaceId],
    );
  } else if (draft.rows[0]) {
    await client.query(
      `UPDATE public.pm_versions SET content = $2::jsonb, row_version = row_version + 1, updated_at = now()
        WHERE id = $1 AND pm_id = $3 AND owner_id = $4 AND workspace_id = $5 AND status = 'draft'`,
      [draft.rows[0].id, JSON.stringify(pmContentForStorage(pm, "draft")), pm.id, owner.userId, owner.workspaceId],
    );
  } else {
    await client.query(
      `INSERT INTO public.pm_versions (pm_id, owner_id, workspace_id, content)
       VALUES ($1,$2,$3,$4::jsonb)`,
      [pm.id, owner.userId, owner.workspaceId, JSON.stringify(pmContentForStorage(pm, "draft"))],
    );
  }
  return readPmHistoryLegacy(client, owner, pm.id);
}

async function readPmHistoryLegacy(client: PoolClient, owner: Principal, pmId: string): Promise<PmVersionHistoryEntry[]> {
  const result = await client.query<{
    id: string; revision_number: number; content: PmDraft; approved_at: Date;
  }>(
    `SELECT version.id, version.revision_number, version.content, version.approved_at
       FROM public.pms pm
       JOIN public.pm_versions version ON version.id = pm.current_approved_version_id
      WHERE pm.id = $1 AND pm.owner_id = $2 AND pm.workspace_id = $3
        AND version.status = 'confirmedApproved'`,
    [pmId, owner.userId, owner.workspaceId],
  );
  return result.rows.map((version) => {
    const approvedAt = version.approved_at.toISOString();
    const snapshot: PmDraft = {
      ...version.content,
      id: version.content.id ?? pmId,
      status: "approved",
      approvedAt,
      revisionNumber: version.revision_number,
      baseRevisionNumber: undefined,
      changeSummary: "",
      evidenceSourceIds: version.content.evidenceSourceIds ?? [],
    };
    return { id: version.id, revisionNumber: version.revision_number, approvedAt, changeSummary: null, pm: snapshot };
  });
}

function pmContentForStorage(pm: PmDraft, status: PmDraft["status"]): PmDraft {
  return {
    ...pm,
    status,
    approvedAt: undefined,
    revisionNumber: undefined,
    baseRevisionNumber: undefined,
    changeSummary: undefined,
  };
}

async function readPmHistory(client: PoolClient, owner: Principal, pmId: string): Promise<PmVersionHistoryEntry[]> {
  const result = await client.query<{
    id: string; revision_number: number; content: PmDraft; change_summary: string | null; approved_at: Date;
  }>(
    `SELECT id, revision_number, content, change_summary, approved_at
       FROM public.pm_versions
      WHERE pm_id = $1 AND owner_id = $2 AND workspace_id = $3 AND status = 'confirmedApproved'
      ORDER BY revision_number ASC`,
    [pmId, owner.userId, owner.workspaceId],
  );
  return result.rows.map((version) => {
    const approvedAt = version.approved_at.toISOString();
    return {
      id: version.id,
      revisionNumber: version.revision_number,
      approvedAt,
      changeSummary: version.change_summary,
      pm: {
        ...version.content,
        id: version.content.id ?? pmId,
        status: "approved",
        approvedAt,
        revisionNumber: version.revision_number,
        baseRevisionNumber: undefined,
        changeSummary: version.change_summary ?? "",
        evidenceSourceIds: version.content.evidenceSourceIds ?? [],
      },
    };
  });
}

function canonicalPm(pm: PmDraft) {
  const {
    status: _status,
    approvedAt: _approvedAt,
    revisionNumber: _revisionNumber,
    baseRevisionNumber: _baseRevisionNumber,
    changeSummary: _changeSummary,
    ...content
  } = pm;
  return { ...content, evidenceSourceIds: pm.evidenceSourceIds ?? [] };
}

function samePmHistory(expected: PmVersionHistoryEntry[], actual: PmVersionHistoryEntry[]): boolean {
  return expected.length === actual.length && expected.every((version, index) => {
    const readBack = actual[index];
    return Boolean(readBack && readBack.id === version.id && readBack.revisionNumber === version.revisionNumber &&
      readBack.approvedAt === version.approvedAt && readBack.changeSummary === version.changeSummary &&
      JSON.stringify(canonicalPm(readBack.pm)) === JSON.stringify(canonicalPm(version.pm)));
  });
}

type ManualDatabaseRecord = {
  source_id: string;
  document_id: string;
  analysis_id: string;
  file_name: string;
  content_type: string;
  byte_size: string | number;
  sha256: string;
  content: Buffer;
  page_count: number | null;
  extraction_method: ManualExtractionMethod;
  source_locator: Record<string, unknown> | null;
  title: string;
  applicability: EvidenceApplicability;
  applicability_details: string;
  limitations: string[];
  reviewed_at: Date | null;
};

type ManualMetadataRecord = Omit<ManualDatabaseRecord, "analysis_id" | "content">;

function readManualLocatorRange(
  locator: Record<string, unknown> | null,
  pageCount: number | null,
  contentType: string,
): ManualLocatorRange {
  const stored = locator?.locatorRange;
  if (stored && typeof stored === "object" &&
      "kind" in stored && (stored.kind === "page" || stored.kind === "paragraph" || stored.kind === "document") &&
      "first" in stored && stored.first === 1 && "last" in stored &&
      typeof stored.last === "number" && Number.isSafeInteger(stored.last) && stored.last > 0) {
    return stored as ManualLocatorRange;
  }
  return { kind: contentType === MANUAL_CONTENT_TYPES.docx ? "document" : "page", first: 1, last: pageCount ?? 1 };
}

function toManualEvidence(record: ManualMetadataRecord) {
  return {
    id: record.source_id,
    documentId: record.document_id,
    kind: "manual" as const,
    title: record.title,
    fileName: record.file_name,
    contentType: record.content_type,
    byteSize: Number(record.byte_size),
    sha256: record.sha256,
    pageCount: record.page_count,
    extractionMethod: record.extraction_method,
    locatorRange: readManualLocatorRange(record.source_locator, record.page_count, record.content_type),
    applicability: record.applicability,
    applicabilityDetails: record.applicability_details,
    limitations: Array.isArray(record.limitations) ? record.limitations : [],
    reviewedAt: record.reviewed_at?.toISOString(),
  };
}

async function loadManualRecord(owner: Principal, documentId: string): Promise<ManualDatabaseRecord | null> {
  const result = await pool.query<ManualDatabaseRecord>(
    `SELECT s.id AS source_id, d.id AS document_id, d.analysis_id, d.file_name, s.locator AS source_locator,
            d.content_type, d.byte_size, d.sha256, d.content, d.page_count,
            d.extraction_method, s.title, s.applicability, s.applicability_details,
            s.limitations, s.reviewed_at
       FROM public.original_documents d
       JOIN public.sources s ON s.id = d.source_id
      WHERE d.id = $1 AND d.owner_id = $2 AND d.workspace_id = $3 AND s.kind = 'manual'`,
    [documentId, owner.userId, owner.workspaceId],
  );
  return result.rows[0] ?? null;
}

async function loadManualMetadata(owner: Principal, documentId: string): Promise<ManualMetadataRecord | null> {
  const result = await pool.query<ManualMetadataRecord>(
    `SELECT s.id AS source_id, d.id AS document_id, d.file_name, d.content_type, s.locator AS source_locator,
            d.byte_size, d.sha256, d.page_count, d.extraction_method,
            s.title, s.applicability, s.applicability_details, s.limitations, s.reviewed_at
       FROM public.original_documents d
       JOIN public.sources s ON s.id = d.source_id
      WHERE d.id = $1 AND d.owner_id = $2 AND d.workspace_id = $3 AND s.kind = 'manual'`,
    [documentId, owner.userId, owner.workspaceId],
  );
  return result.rows[0] ?? null;
}

async function getVerifiedPdfPageCount(bytes: Buffer): Promise<number> {
  const loadingTask = getPdfDocument({
    data: new Uint8Array(bytes),
    useSystemFonts: false,
    disableFontFace: true,
  });
  const documentProxy = await loadingTask.promise;
  try {
    return documentProxy.numPages;
  } finally {
    await loadingTask.destroy();
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function manualLimitations(method: ManualExtractionMethod): string[] {
  const limitations = ["Extracted content was processed in this browser and is not independently verified."];
  if (method === "pdf-ocr" || method === "image-ocr") limitations.push("OCR may contain recognition errors. Compare extracted text with the original manual.");
  if (method === "docx-text") limitations.push("DOCX text extraction does not preserve complex layout or page breaks reliably.");
  if (method === "pdf-text") limitations.push("Selectable PDF text may omit words embedded only in figures or images.");
  return limitations;
}

async function saveManualDocument(owner: Principal, analysisId: string, descriptor: ManualUploadDescriptor, bytes: Buffer) {
  if (manualUploadConfig.maxTotalManualBytes === null) throw Object.assign(new Error(manualUploadConfig.message), { statusCode: 503 });
  const client = await pool.connect();
  const requestDigest = digest({ analysisId, ...descriptor });
  let documentId = "";
  let sourceId = "";
  let isReplay = false;
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock($1::bigint)", [741358201]);
    const priorOperation = await client.query<{ request_digest: string; resource_kind: string; resource_id: string | null }>(
      `SELECT request_digest, resource_kind, resource_id FROM public.operation_receipts
        WHERE owner_id = $1 AND workspace_id = $2 AND operation_id = $3 FOR UPDATE`,
      [owner.userId, owner.workspaceId, descriptor.operationId],
    );
    if (priorOperation.rows[0]) {
      const prior = priorOperation.rows[0];
      if (prior.request_digest !== requestDigest || prior.resource_kind !== "original_document" || !prior.resource_id) {
        throw Object.assign(new Error("This operation ID was already used for a different PlannerMC change."), { statusCode: 409 });
      }
      documentId = prior.resource_id;
      isReplay = true;
      const replay = await client.query<{ id: string }>(
        `SELECT id FROM public.original_documents WHERE id = $1 AND owner_id = $2 AND workspace_id = $3`,
        [documentId, owner.userId, owner.workspaceId],
      );
      if (!replay.rowCount) throw Object.assign(new Error("The earlier upload could not be verified."), { statusCode: 503 });
      await client.query("COMMIT");
    } else {
      const analysis = await client.query<{ id: string }>(
        `SELECT id FROM public.analyses WHERE id = $1 AND owner_id = $2 AND workspace_id = $3 FOR UPDATE`,
        [analysisId, owner.userId, owner.workspaceId],
      );
      if (!analysis.rowCount) throw Object.assign(new Error("This analysis is not available in the current workspace."), { statusCode: 404 });

      const usage = await client.query<{ stored_bytes: string }>(
        `SELECT COALESCE(sum(byte_size), 0)::text AS stored_bytes FROM public.original_documents`,
      );
      const existingBytes = Number(usage.rows[0]?.stored_bytes ?? 0);
      if (existingBytes + descriptor.byteSize > manualUploadConfig.maxTotalManualBytes) {
        throw Object.assign(new Error(`This upload would exceed the configured ${manualUploadConfig.maxTotalManualBytes}-byte manual storage limit for this database.`), { statusCode: 413 });
      }

      sourceId = randomUUID();
      documentId = randomUUID();
      const locator = {
        kind: "originalDocument",
        fileName: descriptor.fileName,
        pageCount: descriptor.pageCount,
        extractionMethod: descriptor.extractionMethod,
        sha256: descriptor.sha256,
        locatorRange: descriptor.locatorRange,
      };
      await client.query(
        `INSERT INTO public.sources
          (id, analysis_id, owner_id, workspace_id, kind, title, locator,
           applicability, applicability_details, limitations, reviewed_at)
         VALUES ($1,$2,$3,$4,'manual',$5,$6::jsonb,'unknown','',$7::jsonb,NULL)`,
        [sourceId, analysisId, owner.userId, owner.workspaceId, descriptor.fileName,
          JSON.stringify(locator), JSON.stringify(manualLimitations(descriptor.extractionMethod))],
      );
      await client.query(
        `INSERT INTO public.original_documents
          (id, source_id, analysis_id, owner_id, workspace_id, file_name,
           content_type, byte_size, sha256, content, page_count, extraction_method)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [documentId, sourceId, analysisId, owner.userId, owner.workspaceId,
          descriptor.fileName, descriptor.contentType, descriptor.byteSize, descriptor.sha256,
          bytes, descriptor.pageCount, descriptor.extractionMethod],
      );
      await client.query(
        `INSERT INTO public.operation_receipts
          (owner_id, workspace_id, operation_id, request_digest, result_digest,
           resource_kind, resource_id, outcome, result_summary)
         VALUES ($1,$2,$3,$4,$5,'original_document',$6,'completed',$7::jsonb)`,
        [owner.userId, owner.workspaceId, descriptor.operationId, requestDigest,
          digest({ sourceId, documentId, sha256: descriptor.sha256 }), documentId,
          JSON.stringify({ sourceId, documentId, sha256: descriptor.sha256 })],
      );
      await client.query("COMMIT");
    }
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }

  const readBack = await loadManualRecord(owner, documentId);
  if (!readBack || !readBack.content.equals(bytes) || readBack.sha256 !== descriptor.sha256 ||
      readBack.content.length !== descriptor.byteSize || readBack.file_name !== descriptor.fileName ||
      readBack.content_type !== descriptor.contentType || readBack.page_count !== descriptor.pageCount ||
      readBack.extraction_method !== descriptor.extractionMethod ||
      JSON.stringify(readManualLocatorRange(readBack.source_locator, readBack.page_count, readBack.content_type)) !== JSON.stringify(descriptor.locatorRange) ||
      createHash("sha256").update(readBack.content).digest("hex") !== descriptor.sha256) {
    throw Object.assign(new Error("The manual write completed, but its independent byte and digest read-back did not match. The result is unverified."), { statusCode: 503 });
  }
  if (!isReplay && readBack.source_id !== sourceId) {
    throw Object.assign(new Error("The uploaded file and its evidence record could not be verified together."), { statusCode: 503 });
  }
  return toManualEvidence(readBack);
}

app.get("/api/health", async () => ({ status: "ok" }));
app.get("/api/manual-intake/config", { preHandler: authenticate }, async () => ({
  ...manualUploadConfig,
  acceptedTypes: Object.values(MANUAL_CONTENT_TYPES),
}));

app.post<{ Params: { id: string }; Body: Buffer }>("/api/analyses/:id/documents", {
  preHandler: authenticate,
  bodyLimit: manualUploadConfig.maxFileBytes ?? 1_048_576,
}, async (request, reply) => {
  try {
    if (!uuidPattern.test(request.params.id)) return reply.code(400).send({ message: "The analysis ID is invalid." });
    if (!Buffer.isBuffer(request.body)) return reply.code(400).send({ message: "Send one manual file as binary content." });
    const owner = principal(request);
    const descriptor = parseManualUploadDescriptor(
      request.headers as Record<string, string | string[] | undefined>,
      request.body,
      manualUploadConfig,
    );
    if (descriptor.contentType === MANUAL_CONTENT_TYPES.pdf) {
      const serverPageCount = await getVerifiedPdfPageCount(request.body);
      verifyPdfPageCount(descriptor.pageCount, serverPageCount, manualUploadConfig);
    }
    return await saveManualDocument(owner, request.params.id, descriptor, request.body);
  } catch (error) {
    const statusCode = typeof error === "object" && error && "statusCode" in error ? Number(error.statusCode) : 500;
    request.log.error({ err: error }, "Planner manual upload failed");
    return reply.code(statusCode).send({ message: error instanceof Error ? error.message : "The manual could not be saved." });
  }
});

app.get<{ Params: { id: string } }>("/api/documents/:id", { preHandler: authenticate }, async (request, reply) => {
  if (!uuidPattern.test(request.params.id)) return reply.code(400).send({ message: "The document ID is invalid." });
  const record = await loadManualRecord(principal(request), request.params.id);
  if (!record) return reply.code(404).send({ message: "This manual is not available in the current workspace." });
  return reply
    .type(record.content_type)
    .header("content-disposition", `attachment; filename*=UTF-8''${encodeURIComponent(record.file_name)}`)
    .header("x-content-type-options", "nosniff")
    .header("cache-control", "no-store")
    .send(record.content);
});

app.patch<{ Params: { id: string } }>("/api/documents/:id/review", { preHandler: authenticate }, async (request, reply) => {
  try {
    if (!uuidPattern.test(request.params.id)) return reply.code(400).send({ message: "The document ID is invalid." });
    if (!isRecord(request.body)) return reply.code(400).send({ message: "The manual review is invalid." });
    const applicability = request.body.applicability;
    const applicabilityDetails = request.body.applicabilityDetails;
    const validApplicability: EvidenceApplicability[] = ["applicable", "different_variant", "unknown", "not_applicable"];
    if (!validApplicability.includes(applicability as EvidenceApplicability) ||
        typeof applicabilityDetails !== "string" || applicabilityDetails.length > 4000) {
      return reply.code(400).send({ message: "Choose a valid applicability and keep its explanation under 4,000 characters." });
    }
    const owner = principal(request);
    const updated = await pool.query(
      `UPDATE public.sources s
          SET applicability = $1, applicability_details = $2, reviewed_at = now(), updated_at = now()
        WHERE s.id = (
          SELECT d.source_id FROM public.original_documents d
           WHERE d.id = $3 AND d.owner_id = $4 AND d.workspace_id = $5
        ) AND s.owner_id = $4 AND s.workspace_id = $5 AND s.kind = 'manual'
        RETURNING s.id`,
      [applicability, applicabilityDetails, request.params.id, owner.userId, owner.workspaceId],
    );
    if (!updated.rowCount) return reply.code(404).send({ message: "This manual is not available in the current workspace." });
    const readBack = await loadManualMetadata(owner, request.params.id);
    if (!readBack || !readBack.reviewed_at || readBack.applicability !== applicability || readBack.applicability_details !== applicabilityDetails) {
      return reply.code(503).send({ message: "The manual review was saved, but its read-back could not be verified." });
    }
    return toManualEvidence(readBack);
  } catch (error) {
    const statusCode = typeof error === "object" && error && "statusCode" in error ? Number(error.statusCode) : 500;
    request.log.error({ err: error }, "Planner manual review failed");
    return reply.code(statusCode).send({ message: error instanceof Error ? error.message : "The manual review could not be saved." });
  }
});

app.get("/api/workspace", { preHandler: authenticate }, async (request) => loadWorkspace(principal(request)));
app.post("/api/analyses", { preHandler: authenticate }, async (request, reply) => {
  try {
    const body = parseSaveBody(request.body);
    const saved = await persistAnalysis(principal(request), body, true);
    return saved.workspace;
  } catch (error) {
    const statusCode = typeof error === "object" && error && "statusCode" in error ? Number(error.statusCode) : 500;
    request.log.error({ err: error }, "Planner analysis save failed");
    return reply.code(statusCode).send({ message: error instanceof Error ? error.message : "The analysis could not be saved." });
  }
});
app.put<{ Params: { id: string } }>("/api/analyses/:id", { preHandler: authenticate }, async (request, reply) => {
  try {
    const body = parseSaveBody(request.body);
    if (request.params.id !== body.analysis.id) return reply.code(400).send({ message: "The analysis ID does not match the request path." });
    const saved = await persistAnalysis(principal(request), body, false);
    return saved.workspace;
  } catch (error) {
    const statusCode = typeof error === "object" && error && "statusCode" in error ? Number(error.statusCode) : 500;
    request.log.error({ err: error }, "Planner analysis save failed");
    return reply.code(statusCode).send({ message: error instanceof Error ? error.message : "The analysis could not be saved." });
  }
});

const close = async () => {
  await app.close();
  await pool.end();
};
process.on("SIGINT", () => void close().finally(() => process.exit(0)));
process.on("SIGTERM", () => void close().finally(() => process.exit(0)));

const port = Number(process.env.API_PORT ?? 3001);
await app.listen({ host: process.env.API_HOST ?? "127.0.0.1", port });
