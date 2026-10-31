import type { PlannerAnalysis } from "../domain/planner";

const storageKey = "plannermc-local-prototype-v1";

export type WorkspaceSnapshot = {
  analyses: PlannerAnalysis[];
  currentAnalysisId: string | null;
};

export interface PlannerDataStore {
  load(): WorkspaceSnapshot;
  saveAnalysis(analysis: PlannerAnalysis): WorkspaceSnapshot;
  selectAnalysis(id: string | null): WorkspaceSnapshot;
}

function emptySnapshot(): WorkspaceSnapshot {
  return { analyses: [], currentAnalysisId: null };
}

export class LocalPrototypeStore implements PlannerDataStore {
  load(): WorkspaceSnapshot {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return emptySnapshot();
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !Array.isArray((parsed as WorkspaceSnapshot).analyses)) {
      throw new Error("Saved local data could not be read. The prototype data may be invalid.");
    }
    return parsed as WorkspaceSnapshot;
  }

  saveAnalysis(analysis: PlannerAnalysis): WorkspaceSnapshot {
    const current = this.load();
    const next: WorkspaceSnapshot = {
      analyses: [analysis, ...current.analyses.filter((item) => item.id !== analysis.id)],
      currentAnalysisId: analysis.id,
    };
    this.writeAndVerify(next, analysis.id, analysis.updatedAt);
    return next;
  }

  selectAnalysis(id: string | null): WorkspaceSnapshot {
    const current = this.load();
    const next = { ...current, currentAnalysisId: id };
    this.writeAndVerify(next, id ?? undefined);
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
