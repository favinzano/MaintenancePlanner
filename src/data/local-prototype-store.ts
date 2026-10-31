import { createId, createPlannerEvidence, sampleCatalog, type CatalogLocation, type PlannerAnalysis, type PmDraft } from "../domain/planner";

const storageKey = "plannermc-local-prototype-v1";

export type WorkspaceSnapshot = {
  analyses: PlannerAnalysis[];
  currentAnalysisId: string | null;
  catalog: CatalogLocation[];
  pmRevisionLifecycleEnabled?: boolean;
};

export interface PlannerDataStore {
  load(): Promise<WorkspaceSnapshot>;
  saveAnalysis(analysis: PlannerAnalysis): Promise<WorkspaceSnapshot>;
}

function emptySnapshot(): Omit<WorkspaceSnapshot, "catalog"> {
  return { analyses: [], currentAnalysisId: null };
}

function pmContent(pm: PmDraft) {
  return {
    id: pm.id,
    title: pm.title,
    assetId: pm.assetId,
    frequency: pm.frequency,
    durationMinutes: pm.durationMinutes,
    operatingState: pm.operatingState,
    safetyPrecautions: pm.safetyPrecautions,
    unresolvedSafetyAcknowledged: pm.unresolvedSafetyAcknowledged,
    taskSteps: pm.taskSteps,
    finalVerification: pm.finalVerification,
    evidenceSourceIds: pm.evidenceSourceIds ?? [],
    createdAt: pm.createdAt,
  };
}

export class LocalPrototypeStore implements PlannerDataStore {
  async load(): Promise<WorkspaceSnapshot> {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return { ...emptySnapshot(), catalog: sampleCatalog, pmRevisionLifecycleEnabled: true };
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !Array.isArray((parsed as WorkspaceSnapshot).analyses)) {
      throw new Error("Saved local data could not be read. The prototype data may be invalid.");
    }
    const loaded = parsed as WorkspaceSnapshot;
    const analyses = loaded.analyses.map((analysis) => {
      const pm: PmDraft | undefined = analysis.pm ? {
        ...analysis.pm,
        id: analysis.pm.id ?? createId(),
        evidenceSourceIds: analysis.pm.evidenceSourceIds ?? [],
        changeSummary: analysis.pm.changeSummary ?? "",
      } : undefined;
      const pmVersions = Array.isArray(analysis.pmVersions) ? analysis.pmVersions : [];
      const normalizedVersions = pmVersions.map((version) => ({
        ...version,
        pm: { ...version.pm, evidenceSourceIds: version.pm.evidenceSourceIds ?? [] },
      }));
      if (normalizedVersions.length === 0 && pm?.status === "approved") {
        const initial = { ...pm, revisionNumber: pm.revisionNumber ?? 0 };
        normalizedVersions.push({
          id: pm.id,
          revisionNumber: initial.revisionNumber!,
          approvedAt: pm.approvedAt ?? analysis.updatedAt,
          changeSummary: null,
          pm: initial,
        });
      }
      return {
        ...analysis,
        rowVersion: analysis.rowVersion ?? 1,
        plannerEvidence: analysis.plannerEvidence ?? (analysis.plannerNotes?.trim() ? createPlannerEvidence(analysis.id) : null),
        manualDocuments: analysis.manualDocuments ?? [],
        pm,
        pmVersions: normalizedVersions,
      };
    });
    return { ...loaded, analyses, catalog: sampleCatalog, pmRevisionLifecycleEnabled: true };
  }

  async saveAnalysis(analysis: PlannerAnalysis): Promise<WorkspaceSnapshot> {
    const current = await this.load();
    const previous = current.analyses.find((item) => item.id === analysis.id);
    const pmVersions = [...(previous?.pmVersions ?? [])];
    let pm = analysis.pm ? { ...analysis.pm } : undefined;
    if (pm?.status === "approved") {
      const latest = pmVersions.at(-1);
      if (latest && pm.baseRevisionNumber === undefined &&
          JSON.stringify(pmContent(pm)) === JSON.stringify(pmContent(latest.pm)) &&
          (pm.changeSummary?.trim() ?? "") === (latest.pm.changeSummary?.trim() ?? "")) {
        pm = { ...latest.pm };
      } else {
        const expectedBase = latest?.revisionNumber;
        if (latest && pm.baseRevisionNumber !== expectedBase) {
          throw new Error("This PM revision is based on an older approved version. Reload the analysis before approving it.");
        }
        const revisionNumber = latest ? latest.revisionNumber + 1 : 0;
        const changeSummary = pm.changeSummary?.trim() ?? "";
        if (revisionNumber > 0 && !changeSummary) throw new Error("Summarize the changes in this PM revision before approval.");
        const approvedAt = pm.approvedAt ?? new Date().toISOString();
        pm = {
          ...pm,
          status: "approved",
          approvedAt,
          revisionNumber,
          baseRevisionNumber: undefined,
          changeSummary: revisionNumber > 0 ? changeSummary : undefined,
        };
        pmVersions.push({
          id: createId(),
          revisionNumber,
          approvedAt,
          changeSummary: revisionNumber > 0 ? changeSummary : null,
          pm: { ...pm },
        });
      }
    } else if (pm?.status === "draft" && pmVersions.length > 0) {
      const latest = pmVersions.at(-1)!;
      if (pm.baseRevisionNumber !== latest.revisionNumber) {
        throw new Error("Start this PM revision from the current approved version before saving it.");
      }
    }
    const savedAnalysis = {
      ...analysis,
      pm,
      pmVersions,
      rowVersion: Number(previous?.rowVersion ?? 0) + 1,
    };
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
