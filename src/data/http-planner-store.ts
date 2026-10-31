import type { PlannerAnalysis } from "../domain/planner";
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

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const client = supabaseClient;
    if (!client) throw new Error("Supabase Auth is not configured for this build.");
    const { data: { session }, error } = await client.auth.getSession();
    if (error || !session?.access_token) throw new Error("Your session expired. Sign in again to continue.");

    const response = await fetch(path, {
      ...init,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${session.access_token}`,
        ...init.headers,
      },
    });
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const message = payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string"
        ? payload.message
        : "The PlannerMC server could not complete this request.";
      throw new PlannerApiError(message, response.status);
    }
    return payload as T;
  }
}

export const httpPlannerStore = new HttpPlannerStore();
