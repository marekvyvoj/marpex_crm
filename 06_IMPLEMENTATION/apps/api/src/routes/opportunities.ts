import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { opportunities, opportunityStageHistory } from "../db/schema.js";
import {
  opportunityCreateSchema,
  quoteGateSchema,
  wonGateSchema,
  lostGateSchema,
  PIPELINE_STAGES,
  type StageId,
  isValidTransition,
} from "@marpex/domain";
import { writeAudit } from "../lib/audit.js";
import { sendError } from "../lib/http.js";
import { paginationQuerySchema, resolvePagination, setPaginationHeaders } from "../lib/pagination.js";

const stageIds = PIPELINE_STAGES.map((stage) => stage.id) as [StageId, ...StageId[]];

const opportunityListQuerySchema = paginationQuerySchema;

const stageUpdateSchema = z.object({
  stage: z.enum(stageIds),
  technicalSpec: z.string().optional(),
  competition: z.string().optional(),
  followUpDate: z.coerce.date().optional(),
  closeResult: z.string().optional(),
  closeTimestamp: z.coerce.date().optional(),
  lostReason: z.string().optional(),
});

type OpportunityListQuery = z.input<typeof opportunityListQuerySchema>;

export const opportunityRoutes: FastifyPluginAsync = async (app) => {
  // List opportunities
  app.get<{ Querystring: OpportunityListQuery }>("/", async (request, reply) => {
    const pagination = resolvePagination(opportunityListQuerySchema.parse(request.query));

    if (!pagination) {
      return db.select().from(opportunities).orderBy(desc(opportunities.updatedAt));
    }

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(opportunities);

    const rows = await db
      .select()
      .from(opportunities)
      .orderBy(desc(opportunities.updatedAt))
      .limit(pagination.limit)
      .offset(pagination.offset);

    setPaginationHeaders(reply, total, pagination);

    return rows;
  });

  // Create opportunity — blocking rule validation
  app.post("/", async (request, reply) => {
    const body = opportunityCreateSchema.parse(request.body);
    const ownerId = request.userId!;
    const [row] = await db
      .insert(opportunities)
      .values({
        title: body.title,
        customerId: body.customerId,
        ownerId,
        value: body.value.toString(),
        stage: body.stage,
        nextStepSummary: body.nextStepSummary,
        nextStepDeadline: body.nextStepDeadline.toISOString().slice(0, 10),
      })
      .returning();

    // Record initial stage
    await db.insert(opportunityStageHistory).values({
      opportunityId: row.id,
      fromStage: null,
      toStage: body.stage,
      changedBy: ownerId,
    });

    await writeAudit({ userId: ownerId, action: "opportunity.create", entityType: "opportunity", entityId: row.id, payload: { title: row.title, value: row.value, stage: row.stage } });

    return reply.code(201).send(row);
  });

  // Get single opportunity
  app.get<{ Params: { id: string } }>("/:id", async (request, reply) => {
    z.string().uuid().parse(request.params.id);
    const [row] = await db
      .select()
      .from(opportunities)
      .where(eq(opportunities.id, request.params.id))
      .limit(1);

    if (!row) return sendError(reply, 404, "NOT_FOUND", "Not found");
    return row;
  });

  // Move stage — with gate validation
  app.patch<{ Params: { id: string } }>("/:id/stage", async (request, reply) => {
    z.string().uuid().parse(request.params.id);
    const { stage: newStage, ...gateData } = stageUpdateSchema.parse(request.body);
    const userId = request.userId!;

    const [current] = await db
      .select()
      .from(opportunities)
      .where(eq(opportunities.id, request.params.id))
      .limit(1);

    if (!current) return sendError(reply, 404, "NOT_FOUND", "Not found");

    // Validate transition is legal (forward-only, final stages are terminal)
    if (!isValidTransition(current.stage, newStage)) {
      return sendError(
        reply,
        400,
        "INVALID_STAGE_TRANSITION",
        `Neplatný prechod z "${current.stage}" na "${newStage}"`,
      );
    }

    // Validate gate requirements
    let validatedGateData = gateData;
    if (newStage === "quote_delivered") {
      validatedGateData = quoteGateSchema.parse(gateData);
    } else if (newStage === "won") {
      validatedGateData = wonGateSchema.parse(gateData);
    } else if (newStage === "lost") {
      validatedGateData = lostGateSchema.parse(gateData);
    }

    // Update opportunity
    const updateData: Record<string, unknown> = {
      stage: newStage,
      lastActivityAt: new Date(),
      updatedAt: new Date(),
    };

    // Merge gate data into the opportunity record
    if (newStage === "quote_delivered") {
      const quoteData = validatedGateData as z.infer<typeof quoteGateSchema>;
      updateData.technicalSpec = quoteData.technicalSpec;
      updateData.competition = quoteData.competition;
      updateData.followUpDate = quoteData.followUpDate.toISOString().slice(0, 10);
    } else if (newStage === "won" || newStage === "lost") {
      if (newStage === "won") {
        const wonData = validatedGateData as z.infer<typeof wonGateSchema>;
        updateData.closeResult = wonData.closeResult;
        updateData.closeTimestamp = wonData.closeTimestamp;
      } else {
        const lostData = validatedGateData as z.infer<typeof lostGateSchema>;
        updateData.closeResult = lostData.closeResult;
        updateData.closeTimestamp = new Date();
        updateData.lostReason = lostData.lostReason;
      }
    }

    await db
      .update(opportunities)
      .set(updateData)
      .where(eq(opportunities.id, request.params.id));

    // Record stage change
    await db.insert(opportunityStageHistory).values({
      opportunityId: current.id,
      fromStage: current.stage,
      toStage: newStage,
      changedBy: userId,
    });

    await writeAudit({ userId, action: "opportunity.stage_change", entityType: "opportunity", entityId: current.id, payload: { from: current.stage, to: newStage } });

    return { success: true, newStage };
  });

  // Stage history
  app.get<{ Params: { id: string } }>("/:id/history", async (request) => {
    z.string().uuid().parse(request.params.id);
    return db
      .select()
      .from(opportunityStageHistory)
      .where(eq(opportunityStageHistory.opportunityId, request.params.id))
      .orderBy(opportunityStageHistory.changedAt);
  });
};
