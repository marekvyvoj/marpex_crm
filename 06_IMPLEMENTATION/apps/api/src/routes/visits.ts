import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { eq, and, gte, lte, desc, sql, type SQL } from "drizzle-orm";
import { db } from "../db/index.js";
import { visits, contacts } from "../db/schema.js";
import { visitSchema } from "@marpex/domain";
import { sendError } from "../lib/http.js";
import { paginationQuerySchema, resolvePagination, setPaginationHeaders } from "../lib/pagination.js";

const visitListQuerySchema = paginationQuerySchema.extend({
  customerId: z.string().uuid().optional(),
  ownerId: z.string().uuid().optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  late: z.enum(["true", "false"]).optional(),
});

type VisitListQuery = z.input<typeof visitListQuerySchema>;

export const visitRoutes: FastifyPluginAsync = async (app) => {
  // List visits — filters: customerId, ownerId, from (YYYY-MM-DD), to, late=true
  app.get<{ Querystring: VisitListQuery }>("/", async (request, reply) => {
    const q = visitListQuerySchema.parse(request.query);
    const conditions: SQL[] = [];
    if (q.customerId) { z.string().uuid().parse(q.customerId); conditions.push(eq(visits.customerId, q.customerId)); }
    if (q.ownerId) { z.string().uuid().parse(q.ownerId); conditions.push(eq(visits.ownerId, q.ownerId)); }
    if (q.from) conditions.push(gte(visits.date, q.from));
    if (q.to) conditions.push(lte(visits.date, q.to));
    if (q.late === "true") conditions.push(eq(visits.lateFlag, true));
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const pagination = resolvePagination(request.query);

    if (!pagination) {
      return db.select().from(visits).where(where).orderBy(desc(visits.date));
    }

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(visits)
      .where(where);

    const rows = await db
      .select()
      .from(visits)
      .where(where)
      .orderBy(desc(visits.date))
      .limit(pagination.limit)
      .offset(pagination.offset);

    setPaginationHeaders(reply, total, pagination);

    return rows;
  });

  // Create visit — enforces all 11 mandatory fields
  app.post("/", async (request, reply) => {
    const body = visitSchema.parse(request.body);
    const ownerId = request.userId!;

    // Verify contact belongs to selected customer
    const [contact] = await db
      .select({ id: contacts.id })
      .from(contacts)
      .where(and(eq(contacts.id, body.contactId), eq(contacts.customerId, body.customerId)))
      .limit(1);
    if (!contact) {
      return sendError(reply, 400, "CONTACT_CUSTOMER_MISMATCH", "Kontakt nepatrí k vybranému zákazníkovi");
    }

    // Detect late filing (>24h after visit date)
    const visitDate = new Date(body.date);
    const now = new Date();
    const diffMs = now.getTime() - visitDate.getTime();
    const lateFlag = diffMs > 24 * 60 * 60 * 1000;

    const [row] = await db
      .insert(visits)
      .values({
        date: body.date.toISOString().slice(0, 10),
        customerId: body.customerId,
        contactId: body.contactId,
        ownerId,
        visitGoal: body.visitGoal,
        result: body.result,
        customerNeed: body.customerNeed,
        notes: body.notes?.trim() || null,
        opportunityCreated: body.opportunityCreated,
        opportunityType: body.opportunityCreated ? body.opportunityType ?? null : null,
        potentialEur: body.potentialEur.toString(),
        competition: body.competition,
        nextStep: body.nextStep,
        nextStepDeadline: body.nextStepDeadline.toISOString().slice(0, 10),
        lateFlag,
      })
      .returning();

    return reply.code(201).send(row);
  });

  // Get single visit
  app.get<{ Params: { id: string } }>("/:id", async (request, reply) => {
    z.string().uuid().parse(request.params.id);
    const [row] = await db
      .select()
      .from(visits)
      .where(eq(visits.id, request.params.id))
      .limit(1);

    if (!row) return sendError(reply, 404, "NOT_FOUND", "Not found");
    return row;
  });
};
