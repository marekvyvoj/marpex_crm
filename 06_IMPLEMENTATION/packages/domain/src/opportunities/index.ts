import { z } from "zod";
import { PIPELINE_STAGES, type StageId } from "../pipeline/index.js";

const stageIds = PIPELINE_STAGES.map((s) => s.id) as [StageId, ...StageId[]];

export const opportunityCreateSchema = z.object({
  title: z.string().min(1),
  customerId: z.string().uuid(),
  value: z.number().positive("Hodnota musí byť kladná"),
  stage: z.enum(stageIds),
  nextStepSummary: z.string().min(1, "Next step je povinný"),
  nextStepDeadline: z.coerce.date(),
});

export type OpportunityCreateInput = z.infer<typeof opportunityCreateSchema>;

/** Extra fields required when moving to quote_delivered */
export const quoteGateSchema = z.object({
  technicalSpec: z.string().min(1),
  competition: z.string().min(1),
  followUpDate: z.coerce.date(),
});

/** Extra fields required when closing as won */
export const wonGateSchema = z.object({
  closeResult: z.string().min(1),
  closeTimestamp: z.coerce.date(),
});

/** Extra fields required when closing as lost */
export const lostGateSchema = z.object({
  lostReason: z.string().min(1),
  closeResult: z.string().min(1),
});
