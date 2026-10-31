import type { PmFieldEvidence } from "../src/domain/planner.js";

export function canonicalFieldEvidence(fieldEvidence: PmFieldEvidence | undefined): PmFieldEvidence {
  return Object.fromEntries(Object.entries(fieldEvidence ?? {})
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([fieldKey, citations]) => [fieldKey, citations.map((citation) => ({
      sourceId: citation.sourceId,
      locator: citation.locator,
    }))]));
}
