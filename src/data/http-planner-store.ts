import type { ManualEvidence, ManualExtraction, ManualIntakeConfig, PlannerAnalysis } from "../domain/planner";
import type { PlannerDataStore, WorkspaceSnapshot } from "./local-prototype-store";
import { supabaseClient } from "./supabase-client";

type SnapshotResponse = Omit<WorkspaceSnapshot, "catalog"> & {
  catalog: WorkspaceSnapshot["catalog"];
};

export class PlannerApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "PlannerApiError";
    this.status = status;
  }
}

export class HttpPlannerStore implements PlannerDataStore {
  async load(): Promise<WorkspaceSnapshot> {
    return this.request<SnapshotResponse>("/api/workspace");
  }

  async saveAnalysis(analysis: PlannerAnalysis): Promise<WorkspaceSnapshot> {
    const isNew = analysis.rowVersion === 0;
    const path = isNew ? "/api/analyses" : `/api/analyses/${encodeURIComponent(analysis.id)}`;
    const method = isNew ? "POST" : "PUT";
    return this.request<SnapshotResponse>(path, {
      method,
      body: JSON.stringify({
        operationId: crypto.randomUUID(),
        expectedRowVersion: analysis.rowVersion,
        analysis,
      }),
    });
  }

  async getManualIntakeConfig(): Promise<ManualIntakeConfig> {
    return this.request<ManualIntakeConfig>("/api/manual-intake/config");
  }

  async uploadManual(analysisId: string, file: File, extraction: ManualExtraction, operationId: string): Promise<ManualEvidence> {
    const encodedFileName = [...new TextEncoder().encode(file.name)]
      .map((value) => String.fromCharCode(value)).join("");
    const base64FileName = btoa(encodedFileName).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
    const locatorKind = extraction.contentType === "application/pdf" || extraction.contentType.startsWith("image/")
      ? "page"
      : extraction.segments[0]?.locator === "Document text" ? "document" : "paragraph";
    return this.request<ManualEvidence>(`/api/analyses/${encodeURIComponent(analysisId)}/documents`, {
      method: "POST",
      body: file,
      headers: {
        "content-type": "application/octet-stream",
        "x-manual-file-name": base64FileName,
        "x-manual-content-type": extraction.contentType,
        "x-manual-sha256": extraction.sha256,
        "x-manual-extraction-method": extraction.extractionMethod,
        "x-manual-page-count": extraction.pageCount === null ? "" : String(extraction.pageCount),
        "x-manual-locator-kind": locatorKind,
        "x-manual-locator-count": String(extraction.segments.length),
        "x-operation-id": operationId,
      },
    });
  }

  async reviewManual(documentId: string, applicability: ManualEvidence["applicability"], applicabilityDetails: string): Promise<ManualEvidence> {
    return this.request<ManualEvidence>(`/api/documents/${encodeURIComponent(documentId)}/review`, {
      method: "PATCH",
      body: JSON.stringify({ applicability, applicabilityDetails }),
    });
  }

  async downloadManual(source: ManualEvidence): Promise<File> {
    const response = await this.authenticatedFetch(`/api/documents/${encodeURIComponent(source.documentId)}`);
    if (!response.ok) {
      const payload: unknown = await response.json().catch(() => null);
      const message = payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string"
        ? payload.message
        : "The PlannerMC server could not retrieve this manual.";
      throw new PlannerApiError(message, response.status);
    }
    const blob = await response.blob();
    const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
    const sha256 = [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("");
    if (sha256 !== source.sha256 || blob.size !== source.byteSize) {
      throw new Error("The retrieved manual failed its saved size and SHA-256 integrity check.");
    }
    return new File([blob], source.fileName, { type: source.contentType });
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await this.authenticatedFetch(path, init);
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const message = payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string"
        ? payload.message
        : "The PlannerMC server could not complete this request.";
      throw new PlannerApiError(message, response.status);
    }
    return payload as T;
  }

  private async authenticatedFetch(path: string, init: RequestInit = {}): Promise<Response> {
    const client = supabaseClient;
    if (!client) throw new Error("Supabase Auth is not configured for this build.");
    const { data: { session }, error } = await client.auth.getSession();
    if (error || !session?.access_token) throw new Error("Your session expired. Sign in again to continue.");

    return fetch(path, {
      ...init,
      headers: {
        ...(init.body instanceof FormData || init.body instanceof Blob ? {} : { "content-type": "application/json" }),
        authorization: `Bearer ${session.access_token}`,
        ...init.headers,
      },
    });
  }
}

export const httpPlannerStore = new HttpPlannerStore();
