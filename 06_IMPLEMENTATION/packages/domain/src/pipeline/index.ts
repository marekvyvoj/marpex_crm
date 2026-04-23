/**
 * Pipeline stages — fixed canon pre MVP.
 * Admin-configurable stages sú explicitne mimo scope V1.
 */

export const PIPELINE_STAGES = [
  { id: "identified_need", label: "Identifikovaná potreba", weight: 10, type: "open" },
  { id: "qualified", label: "Kvalifikovaná príležitosť", weight: 25, type: "open" },
  { id: "technical_solution", label: "Technické riešenie", weight: 40, type: "open" },
  { id: "quote_delivered", label: "Ponuka odovzdaná", weight: 55, type: "open" },
  { id: "negotiation", label: "Rokovanie", weight: 70, type: "open" },
  { id: "verbal_confirmed", label: "Verbálne potvrdené", weight: 90, type: "open" },
  { id: "won", label: "Vyhraté", weight: 100, type: "final" },
  { id: "lost", label: "Prehraté", weight: 0, type: "final" },
] as const;

export type StageId = (typeof PIPELINE_STAGES)[number]["id"];
export type StageType = "open" | "final";

export const OPEN_STAGES = PIPELINE_STAGES.filter((s) => s.type === "open");
export const FINAL_STAGES = PIPELINE_STAGES.filter((s) => s.type === "final");

export function getStage(id: StageId) {
  return PIPELINE_STAGES.find((s) => s.id === id)!;
}

export function getWeight(id: StageId): number {
  return getStage(id).weight;
}

/** Stages that require extra gate checks before transition */
export const GATED_STAGES: Partial<Record<StageId, string[]>> = {
  quote_delivered: ["technical_spec", "competition", "follow_up_date"],
  won: ["close_result", "close_timestamp"],
  lost: ["lost_reason", "close_result"],
};

/** Stagnation threshold in days */
export const STAGNATION_DAYS = 30;

/** Check if a stage transition is valid (forward-only, can always go to lost from open) */
export function isValidTransition(from: StageId, to: StageId): boolean {
  const fromIdx = PIPELINE_STAGES.findIndex((s) => s.id === from);
  const toIdx = PIPELINE_STAGES.findIndex((s) => s.id === to);
  const fromStage = PIPELINE_STAGES[fromIdx];

  // Cannot transition from final stages
  if (!fromStage || fromStage.type === "final") return false;

  // Can always go to "lost" from any open stage
  if (to === "lost") return true;

  // Must move forward (higher index)
  return toIdx > fromIdx;
}
