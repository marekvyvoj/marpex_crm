import { z } from "zod";

export const visitOpportunityTypes = ["project", "service", "cross_sell"] as const;

/**
 * 11 mandatory visit fields — hard enforcement on frontend + backend.
 */
export const visitSchema = z.object({
  date: z.coerce.date(),
  customerId: z.string().uuid(),
  contactId: z.string().uuid(),
  visitGoal: z.string().min(1, "Cieľ návštevy je povinný"),
  result: z.string().min(1, "Výsledok je povinný"),
  customerNeed: z.string().min(1, "Potreba zákazníka je povinná"),
  notes: z.string().trim().max(5000, "Poznámka je príliš dlhá").optional(),
  opportunityCreated: z.boolean(),
  opportunityType: z.enum(visitOpportunityTypes).optional(),
  potentialEur: z.number().min(0, "Potenciál nesmie byť záporný"),
  competition: z.string().min(1, "Konkurencia je povinná"),
  nextStep: z.string().min(1, "Next step je povinný"),
  nextStepDeadline: z.coerce.date(),
}).superRefine((value, ctx) => {
  if (value.opportunityCreated && !value.opportunityType) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Pri vzniknutej príležitosti vyberte typ (projekt / servis / cross-sell)",
      path: ["opportunityType"],
    });
  }
});

export type VisitInput = z.infer<typeof visitSchema>;

export const VISIT_MANDATORY_FIELDS = [
  "date",
  "customerId",
  "contactId",
  "visitGoal",
  "result",
  "customerNeed",
  "opportunityCreated",
  "potentialEur",
  "competition",
  "nextStep",
  "nextStepDeadline",
] as const;
