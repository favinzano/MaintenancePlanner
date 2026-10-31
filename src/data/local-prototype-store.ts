import { createId, createPlannerEvidence, sampleCatalog, type CatalogLocation, type PlannerAnalysis } from "../domain/planner";

const storageKey = "plannermc-local-prototype-v1";

export type WorkspaceSnapshot = {
  analyses: PlannerAnalysis[];
  currentAnalysisId: string | null;
  catalog: CatalogLocation[];
};

export interface PlannerDataStore {
  load(): Promise<WorkspaceSnapshot>;
  saveAnalysis(analysis: PlannerAnalysis): Promise<WorkspaceSnapshot>;
}

function emptySnapshot(): Omit<WorkspaceSnapshot, "catalog"> {
  return { analyses: [], currentAnalysisId: null };
}

export class LocalPrototypeStore implements PlannerDataStore {
  async load(): Promise<WorkspaceSnapshot> {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return { ...emptySnapshot(), catalog: sampleCatalog };
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !Array.isArray((parsed as WorkspaceSnapshot).analyses)) {
      throw new Error("Saved local data could not be read. The prototype data may be invalid.");
    }
    const loaded = parsed as WorkspaceSnapshot;
    const analyses = loaded.analyses.map((analysis) => ({
      ...analysis,
      rowVersion: analysis.rowVersion ?? 1,
      plannerEvidence: analysis.plannerEvidence ?? (analysis.plannerNotes?.trim() ? createPlannerEvidence(analysis.id) : null),
      pm: analysis.pm ? {
        ...analysis.pm,
        id: analysis.pm.id ?? createId(),
        evidenceSourceIds: analysis.pm.evidenceSourceIds ?? [],
      } : undefined,
    }));
    return { ...loaded, analyses, catalog: sampleCatalog };
  }

  async saveAnalysis(analysis: PlannerAnalysis): Promise<WorkspaceSnapshot> {
    const current = await this.load();
    const previous = current.analyses.find((item) => item.id === analysis.id);
    const savedAnalysis = { ...analysis, rowVersion: Number(previous?.rowVersion ?? 0) + 1 };
    const next: WorkspaceSnapshot = {
      ...current,
      analyses: [savedAnalysis, ...current.analyses.filter((item) => item.id !== savedAnalysis.id)],
      currentAnalysisId: savedAnalysis.id,
    };
    this.writeAndVerify(next, savedAnalysis.id, savedAnalysis.updatedAt);
    return next;
  }

  private writeAndVerify(next: WorkspaceSnapshot, expectedId?: string, expectedUpdatedAt?: string): void {
    const serialized = JSON.stringify(next);
    window.localStorage.setItem(storageKey, serialized);
    const readBack = window.localStorage.getItem(storageKey);
    if (!readBack) throw new Error("The local save could not be verified.");
    const verified = JSON.parse(readBack) as WorkspaceSnapshot;
    const matches = JSON.stringify(verified) === serialized;
    const record = expectedId ? verified.analyses.find((item) => item.id === expectedId) : undefined;
    if (!matches || (expectedId && verified.currentAnalysisId !== expectedId) || (expectedUpdatedAt && record?.updatedAt !== expectedUpdatedAt)) {
      throw new Error("The local save could not be verified. The change was not reported as complete.");
    }
  }
}

export const plannerStore: PlannerDataStore = new LocalPrototypeStore();
