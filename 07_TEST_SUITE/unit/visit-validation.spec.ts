import { describe, expect, it } from "vitest";
import { visitSchema } from "../../06_IMPLEMENTATION/packages/domain/src/visits/index.ts";

const baseVisit = {
  date: "2026-04-19",
  customerId: "33a19359-04de-45fc-9c2f-1d69439972f3",
  contactId: "4888900e-5599-4d1c-a0ff-95d1a3f4e698",
  visitGoal: "Overenie potenciálu",
  result: "Dohodnutý follow-up",
  customerNeed: "Retrofit linky",
  opportunityCreated: false,
  potentialEur: 12000,
  competition: "Siemens",
  nextStep: "Poslať návrh",
  nextStepDeadline: "2026-04-22",
};

describe("visit schema", () => {
  it("accepts a valid visit without opportunity type when no opportunity was created", () => {
    const parsed = visitSchema.parse(baseVisit);
    expect(parsed.opportunityCreated).toBe(false);
    expect(parsed.opportunityType).toBeUndefined();
  });

  it("requires opportunity type when opportunity was created", () => {
    const result = visitSchema.safeParse({
      ...baseVisit,
      opportunityCreated: true,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.opportunityType).toContain(
        "Pri vzniknutej príležitosti vyberte typ (projekt / servis / cross-sell)",
      );
    }
  });

  it("accepts cross-sell opportunity type", () => {
    const parsed = visitSchema.parse({
      ...baseVisit,
      opportunityCreated: true,
      opportunityType: "cross_sell",
    });

    expect(parsed.opportunityType).toBe("cross_sell");
  });

  it("coerces string dates and rejects negative potential", () => {
    const invalid = visitSchema.safeParse({
      ...baseVisit,
      potentialEur: -5,
    });

    expect(invalid.success).toBe(false);
    if (!invalid.success) {
      expect(invalid.error.flatten().fieldErrors.potentialEur).toContain("Potenciál nesmie byť záporný");
    }

    const parsed = visitSchema.parse(baseVisit);
    expect(parsed.date).toBeInstanceOf(Date);
    expect(parsed.nextStepDeadline).toBeInstanceOf(Date);
  });
});