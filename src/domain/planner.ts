export const MAX_PM_STEPS = 15;

export type OperatingState = "running" | "stopped" | "undetermined";

export type AssetProposal = {
  id: string;
  kind: "equipment" | "subasset";
  name: string;
  sourceTerm: string;
  confirmed: boolean;
};

export type EvidenceApplicability = "applicable" | "different_variant" | "unknown" | "not_applicable";
export const PLANNER_EVIDENCE_BASE_LIMITATION = "Planner-provided; not independently verified.";

export type PlannerEvidence = {
  id: string;
  kind: "plannerData";
  title: string;
  locator: string;
  applicability: EvidenceApplicability;
  applicabilityDetails: string;
  limitations: string[];
  reviewedAt?: string;
};

export type PmDraft = {
  id: string;
  title: string;
  assetId: string;
  frequency: string;
  durationMinutes: string;
  operatingState: OperatingState;
  safetyPrecautions: string;
  unresolvedSafetyAcknowledged: boolean;
  taskSteps: string[];
  finalVerification: string;
  evidenceSourceIds: string[];
  status: "draft" | "approved";
  createdAt: string;
  approvedAt?: string;
};

export type PlannerAnalysis = {
  id: string;
  rowVersion: number;
  locationId: string;
  areaId: string;
  equipmentName: string;
  originalEquipmentName: string;
  manufacturer: string;
  model: string;
  plannerNotes: string;
  plannerEvidence: PlannerEvidence | null;
  evidenceDecision: "not_decided" | "continue_with_limitations";
  assets: AssetProposal[];
  pm?: PmDraft;
  stage: number;
  createdAt: string;
  updatedAt: string;
};

export type CatalogLocation = {
  id: string;
  name: string;
  areas: Array<{ id: string; name: string }>;
};

export const sampleCatalog: CatalogLocation[] = [
  {
    id: "sample-plant-east",
    name: "Sample Plant East",
    areas: [
      { id: "sample-east-packaging", name: "Packaging" },
      { id: "sample-east-utilities", name: "Utilities" },
    ],
  },
  {
    id: "sample-plant-west",
    name: "Sample Plant West",
    areas: [
      { id: "sample-west-processing", name: "Processing" },
      { id: "sample-west-warehouse", name: "Warehouse" },
    ],
  },
];

export function createId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `analysis-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createPlannerEvidence(id = createId()): PlannerEvidence {
  return {
    id,
    kind: "plannerData",
    title: "Planner-provided information",
    locator: "Planner notes",
    applicability: "unknown",
    applicabilityDetails: "",
    limitations: [PLANNER_EVIDENCE_BASE_LIMITATION],
  };
}

export function createAnalysis(catalog: CatalogLocation[] = sampleCatalog): PlannerAnalysis {
  const now = new Date().toISOString();
  const firstLocation = catalog[0];
  if (!firstLocation || !firstLocation.areas[0]) throw new Error("No locations and areas are configured for this workspace.");
  return {
    id: createId(),
    rowVersion: 0,
    locationId: firstLocation.id,
    areaId: firstLocation.areas[0].id,
    equipmentName: "",
    originalEquipmentName: "",
    manufacturer: "",
    model: "",
    plannerNotes: "",
    plannerEvidence: createPlannerEvidence(),
    evidenceDecision: "not_decided",
    assets: [],
    stage: 0,
    createdAt: now,
    updatedAt: now,
  };
}

export function createEmptyPm(analysis: PlannerAnalysis): PmDraft {
  const equipment = analysis.assets.find((asset) => asset.kind === "equipment" && asset.confirmed);
  const firstConfirmed = analysis.assets.find((asset) => asset.confirmed);
  return {
    id: createId(),
    title: "",
    assetId: equipment?.id ?? firstConfirmed?.id ?? "",
    frequency: "",
    durationMinutes: "",
    operatingState: "undetermined",
    safetyPrecautions: "",
    unresolvedSafetyAcknowledged: false,
    taskSteps: [],
    finalVerification: "",
    evidenceSourceIds: analysis.plannerEvidence?.reviewedAt && analysis.plannerEvidence.applicability === "applicable"
      ? [analysis.plannerEvidence.id]
      : [],
    status: "draft",
    createdAt: new Date().toISOString(),
  };
}

export function totalPmSteps(pm: PmDraft): number {
  return 2 + pm.taskSteps.length;
}

export function openingPmStep(pm: PmDraft): string {
  const state = pm.operatingState === "running"
    ? "Running"
    : pm.operatingState === "stopped"
      ? "Stopped"
      : "Not determined";
  const precautions = pm.safetyPrecautions.trim() || "Not provided; planner review required";
  return `Operating state: ${state}. Safety precautions: ${precautions}`;
}

export function pmApprovalIssues(pm: PmDraft, confirmedAssets: AssetProposal[]): string[] {
  const issues: string[] = [];
  if (!pm.title.trim()) issues.push("Add a PM title.");
  if (!confirmedAssets.some((asset) => asset.id === pm.assetId)) issues.push("Choose a confirmed asset.");
  if (!pm.frequency.trim()) issues.push("Enter a frequency or mark it as not established.");
  const duration = Number(pm.durationMinutes);
  if (!pm.durationMinutes.trim() || !Number.isFinite(duration) || duration <= 0) issues.push("Enter a duration in minutes.");
  if (!pm.taskSteps.some((step) => step.trim())) issues.push("Add at least one task step.");
  if (!pm.finalVerification.trim()) issues.push("Add a final verification step.");
  if (totalPmSteps(pm) > MAX_PM_STEPS) issues.push(`Keep the PM to ${MAX_PM_STEPS} steps or fewer.`);
  const hasUnresolvedSafety = pm.operatingState === "undetermined" || !pm.safetyPrecautions.trim();
  if (hasUnresolvedSafety && !pm.unresolvedSafetyAcknowledged) {
    issues.push("Acknowledge the unresolved operating-state or safety information before approval.");
  }
  return issues;
}

export function renderPmText(analysis: PlannerAnalysis, pm: PmDraft, catalog: CatalogLocation[] = sampleCatalog): string {
  const location = catalog.find((item) => item.id === analysis.locationId);
  const area = location?.areas.find((item) => item.id === analysis.areaId);
  const asset = analysis.assets.find((item) => item.id === pm.assetId);
  const durationValue = pm.durationMinutes.trim();
  const duration = durationValue
    ? `${durationValue} ${Number(durationValue) === 1 ? "minute" : "minutes"}`
    : "Not established";
  const lines = [
    `PlannerMC · ${pm.status === "approved" ? "APPROVED" : "DRAFT"}`,
    pm.title.trim(),
    `Asset: ${asset?.name ?? "Not selected"}`,
    `Location: ${location?.name ?? "Not selected"} / ${area?.name ?? "Not selected"}`,
    `Frequency: ${pm.frequency.trim() || "Not established"}`,
    `Estimated duration: ${duration}`,
    "",
    "Procedure",
    `1. ${openingPmStep(pm)}`,
  ];
  pm.taskSteps.filter((step) => step.trim()).forEach((step, index) => lines.push(`${index + 2}. ${step.trim()}`));
  lines.push(`${pm.taskSteps.filter((step) => step.trim()).length + 2}. Verify and record: ${pm.finalVerification.trim() || "Not provided"}`);
  lines.push("", "Evidence references");
  const evidence = analysis.plannerEvidence && pm.evidenceSourceIds?.includes(analysis.plannerEvidence.id)
    ? analysis.plannerEvidence
    : null;
  if (!evidence) {
    lines.push("No source reference attached. Planner review required.");
  } else {
    const applicability = {
      applicable: "Applicable to this equipment",
      different_variant: "Different equipment variant",
      unknown: "Applicability not established",
      not_applicable: "Not applicable to this equipment",
    }[evidence.applicability];
    lines.push(`- ${evidence.title.trim() || "Planner-provided information"}`);
    lines.push(`  Reference: ${evidence.locator.trim() || "Planner notes"}`);
    lines.push(`  Applicability: ${applicability}`);
    if (evidence.applicabilityDetails.trim()) lines.push(`  Applicability details: ${evidence.applicabilityDetails.trim()}`);
    evidence.limitations.filter((limitation) => limitation.trim()).forEach((limitation) => lines.push(`  Limitation: ${limitation.trim()}`));
  }
  return lines.join("\n");
}
