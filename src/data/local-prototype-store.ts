import { createId, createPlannerEvidence, sampleCatalog, type AdditionalPmPlan, type CatalogLocation, type PlannerAnalysis, type PmDraft, type PmVersionHistoryEntry } from "../domain/planner";

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
    fieldEvidence: pm.fieldEvidence ?? {},
    createdAt: pm.createdAt,
  };
}

function normalizePm(pm: PmDraft): PmDraft {
  return { ...pm, id: pm.id ?? createId(), evidenceSourceIds: pm.evidenceSourceIds ?? [], fieldEvidence: pm.fieldEvidence ?? {}, changeSummary: pm.changeSummary ?? "" };
}

function normalizePmHistory(pm: PmDraft | undefined, value: PmVersionHistoryEntry[] | undefined, updatedAt: string): PmVersionHistoryEntry[] {
  const versions = Array.isArray(value) ? value.map((version) => ({
    ...version,
    pm: normalizePm(version.pm),
  })) : [];
  if (!versions.length && pm?.status === "approved") {
    const initial = { ...pm, revisionNumber: pm.revisionNumber ?? 0 };
    versions.push({
      id: pm.id,
      revisionNumber: initial.revisionNumber!,
      approvedAt: pm.approvedAt ?? updatedAt,
      changeSummary: null,
      pm: initial,
    });
  }
  return versions;
}

function savePmRecord(pm: PmDraft | undefined, savedHistory: PmVersionHistoryEntry[]): { pm: PmDraft | undefined; pmVersions: PmVersionHistoryEntry[] } {
  const pmVersions = [...savedHistory];
  let nextPm = pm ? { ...pm } : undefined;
  if (nextPm?.status === "approved") {
    const latest = pmVersions.at(-1);
    if (latest && nextPm.baseRevisionNumber === undefined &&
        JSON.stringify(pmContent(nextPm)) === JSON.stringify(pmContent(latest.pm)) &&
        (nextPm.changeSummary?.trim() ?? "") === (latest.pm.changeSummary?.trim() ?? "")) {
      nextPm = { ...latest.pm };
    } else {
      const expectedBase = latest?.revisionNumber;
      if (latest && nextPm.baseRevisionNumber !== expectedBase) {
        throw new Error("This PM revision is based on an older approved version. Reload the analysis before approving it.");
      }
      const revisionNumber = latest ? latest.revisionNumber + 1 : 0;
      const changeSummary = nextPm.changeSummary?.trim() ?? "";
      if (revisionNumber > 0 && !changeSummary) throw new Error("Summarize the changes in this PM revision before approval.");
      const approvedAt = nextPm.approvedAt ?? new Date().toISOString();
      nextPm = {
        ...nextPm,
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
        pm: { ...nextPm },
      });
    }
  } else if (nextPm?.status === "draft" && pmVersions.length > 0) {
    const latest = pmVersions.at(-1)!;
    if (nextPm.baseRevisionNumber !== latest.revisionNumber) {
      throw new Error("Start this PM revision from the current approved version before saving it.");
    }
  }
  return { pm: nextPm, pmVersions };
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
      const pm: PmDraft | undefined = analysis.pm ? normalizePm(analysis.pm) : undefined;
      const normalizedVersions = normalizePmHistory(pm, analysis.pmVersions, analysis.updatedAt);
      const additionalPms: AdditionalPmPlan[] = Array.isArray(analysis.additionalPms) ? analysis.additionalPms.map((record) => {
        const additionalPm = normalizePm(record.pm);
        return { pm: additionalPm, pmVersions: normalizePmHistory(additionalPm, record.pmVersions, analysis.updatedAt) };
      }) : [];
      return {
        ...analysis,
        rowVersion: analysis.rowVersion ?? 1,
        plannerEvidence: analysis.plannerEvidence ?? (analysis.plannerNotes?.trim() ? createPlannerEvidence(analysis.id) : null),
        manualDocuments: analysis.manualDocuments ?? [],
        pm,
        pmVersions: normalizedVersions,
        additionalPms,
      };
    });
    return { ...loaded, analyses, catalog: sampleCatalog, pmRevisionLifecycleEnabled: true };
  }

  async saveAnalysis(analysis: PlannerAnalysis): Promise<WorkspaceSnapshot> {
    const current = await this.load();
    const previous = current.analyses.find((item) => item.id === analysis.id);
    const primary = savePmRecord(analysis.pm, previous?.pmVersions ?? []);
    const requestedAdditional = analysis.additionalPms ?? [];
    const requestedIds = new Set(requestedAdditional.map((record) => record.pm.id));
    const mergedAdditional = [
      ...requestedAdditional,
      ...(previous?.additionalPms ?? []).filter((record) => !requestedIds.has(record.pm.id)),
    ];
    const previousAdditionalById = new Map((previous?.additionalPms ?? []).map((record) => [record.pm.id, record]));
    const additionalPms = mergedAdditional.map((record) => {
      const saved = savePmRecord(record.pm, previousAdditionalById.get(record.pm.id)?.pmVersions ?? record.pmVersions ?? []);
      return { pm: saved.pm!, pmVersions: saved.pmVersions };
    });
    const savedAnalysis = {
      ...analysis,
      pm: primary.pm,
      pmVersions: primary.pmVersions,
      additionalPms,
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
