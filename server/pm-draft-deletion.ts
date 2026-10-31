export type PmDraftDeletionRequest = {
  operationId: string;
  expectedRowVersion: number;
};

export type ApprovedPmVersionRef = { id: string; revisionNumber: number };

export type PmDraftDeletionState = {
  draftVersionId: string | null;
  currentApprovedVersionId: string | null;
  approvedVersions: ApprovedPmVersionRef[];
};

export type PmDraftDeletionPlan = {
  deletePmRecord: boolean;
  latestApprovedVersionId: string | null;
  approvedVersionIds: string[];
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function invalid(message: string, statusCode: number): Error & { statusCode: number } {
  return Object.assign(new Error(message), { statusCode });
}

export function parsePmDraftDeletionRequest(value: unknown): PmDraftDeletionRequest {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw invalid("Provide an operation ID and the version of the analysis you reviewed.", 400);
  }
  const body = value as Record<string, unknown>;
  if (typeof body.operationId !== "string" || !uuidPattern.test(body.operationId) ||
      !Number.isSafeInteger(body.expectedRowVersion) || Number(body.expectedRowVersion) < 1) {
    throw invalid("The draft deletion request is invalid. Reload the analysis and try again.", 400);
  }
  return { operationId: body.operationId, expectedRowVersion: Number(body.expectedRowVersion) };
}

export function planPmDraftDeletion(state: PmDraftDeletionState): PmDraftDeletionPlan {
  if (!state.draftVersionId) {
    throw invalid("Only a saved PM draft can be deleted.", 409);
  }
  const approved = [...state.approvedVersions].sort((a, b) => a.revisionNumber - b.revisionNumber);
  const latest = approved.at(-1) ?? null;
  if (state.currentApprovedVersionId === null && approved.length > 0) {
    throw invalid("The approved PM history has no current version pointer. Reload the analysis before deleting this draft.", 409);
  }
  if (state.currentApprovedVersionId !== null && latest?.id !== state.currentApprovedVersionId) {
    throw invalid("The current approved PM version could not be verified. Reload the analysis before deleting this draft.", 409);
  }
  return {
    deletePmRecord: approved.length === 0,
    latestApprovedVersionId: latest?.id ?? null,
    approvedVersionIds: approved.map((version) => version.id),
  };
}
