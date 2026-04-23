import { describe, expect, it } from "vitest";
import {
  FINAL_STAGES,
  OPEN_STAGES,
  getStage,
  getWeight,
  isValidTransition,
} from "../../06_IMPLEMENTATION/packages/domain/src/pipeline/index.ts";

describe("pipeline transitions", () => {
  it("allows forward stage transitions", () => {
    expect(isValidTransition("identified_need", "qualified")).toBe(true);
    expect(isValidTransition("qualified", "technical_solution")).toBe(true);
    expect(isValidTransition("verbal_confirmed", "won")).toBe(true);
  });

  it("allows moving to lost from any open stage", () => {
    expect(isValidTransition("identified_need", "lost")).toBe(true);
    expect(isValidTransition("negotiation", "lost")).toBe(true);
  });

  it("rejects backward and terminal transitions", () => {
    expect(isValidTransition("qualified", "identified_need")).toBe(false);
    expect(isValidTransition("won", "lost")).toBe(false);
    expect(isValidTransition("lost", "won")).toBe(false);
  });

  it("returns canon stage metadata and weights", () => {
    expect(getStage("negotiation")).toMatchObject({ label: "Rokovanie", weight: 70, type: "open" });
    expect(getWeight("won")).toBe(100);
    expect(OPEN_STAGES).toHaveLength(6);
    expect(FINAL_STAGES.map((stage) => stage.id)).toEqual(["won", "lost"]);
  });
});