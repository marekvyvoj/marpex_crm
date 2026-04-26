import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { eq, desc, ilike, and, sql, type SQL } from "drizzle-orm";
import { db } from "../db/index.js";
import { customers, contacts, visits, opportunities, abraRevenues, abraQuotes, abraOrders } from "../db/schema.js";
import { customerSchema, contactSchema, customerSegments, strategicCategories } from "@marpex/domain";
import { writeAudit } from "../lib/audit.js";
import { sendError } from "../lib/http.js";
import { paginationQuerySchema, resolvePagination, setPaginationHeaders } from "../lib/pagination.js";

const customerListQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().min(1).optional(),
  segment: z.enum(customerSegments).optional(),
  category: z.enum(strategicCategories).optional(),
});

const bodyObjectSchema = z.record(z.string(), z.unknown());

type CustomerListQuery = z.input<typeof customerListQuerySchema>;

export const customerRoutes: FastifyPluginAsync = async (app) => {
  // List customers — optional ?q= (name search), ?segment=, ?category=
  app.get<{ Querystring: CustomerListQuery }>("/", async (request, reply) => {
    const { q, segment, category } = customerListQuerySchema.parse(request.query);
    const conditions: SQL[] = [];
    if (q) conditions.push(ilike(customers.name, `%${q}%`));
    if (segment) conditions.push(eq(customers.segment, segment));
    if (category) conditions.push(eq(customers.strategicCategory, category));
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const pagination = resolvePagination(request.query);

    if (!pagination) {
      return db.select().from(customers).where(where).orderBy(customers.name);
    }

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(customers)
      .where(where);

    const rows = await db
      .select()
      .from(customers)
      .where(where)
      .orderBy(customers.name)
      .limit(pagination.limit)
      .offset(pagination.offset);

    setPaginationHeaders(reply, total, pagination);

    return rows;
  });

  // Get single customer
  app.get<{ Params: { id: string } }>("/:id", async (request, reply) => {
    z.string().uuid().parse(request.params.id);
    const [row] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, request.params.id))
      .limit(1);

    if (!row) return sendError(reply, 404, "NOT_FOUND", "Not found");
    return row;
  });

  // Create customer
  app.post("/", async (request, reply) => {
    const body = customerSchema.parse(request.body);
    const userId = request.userId!;
    const [row] = await db
      .insert(customers)
      .values({
        name: body.name,
        segment: body.segment,
        currentRevenue: body.currentRevenue?.toString() ?? null,
        annualRevenuePlan: body.annualRevenuePlan != null ? body.annualRevenuePlan.toString() : null,
        annualRevenuePlanYear: body.annualRevenuePlanYear ?? null,
        potential: body.potential?.toString() ?? null,
        shareOfWallet: body.shareOfWallet ?? null,
        strategicCategory: body.strategicCategory ?? null,
      })
      .returning();
    await writeAudit({ userId, action: "customer.create", entityType: "customer", entityId: row.id, payload: { name: row.name, segment: row.segment } });
    return reply.code(201).send(row);
  });

  // Get contacts for a customer
  app.get<{ Params: { id: string } }>("/:id/contacts", async (request) => {
    z.string().uuid().parse(request.params.id);
    const rows = await db
      .select()
      .from(contacts)
      .where(eq(contacts.customerId, request.params.id));
    return rows;
  });

  // Create contact for a customer
  app.post<{ Params: { id: string } }>("/:id/contacts", async (request, reply) => {
    z.string().uuid().parse(request.params.id);
    const body = contactSchema.parse({
      ...bodyObjectSchema.parse(request.body),
      customerId: request.params.id,
    });
    const [row] = await db.insert(contacts).values(body).returning();
    return reply.code(201).send(row);
  });

  // Update customer
  app.patch<{ Params: { id: string } }>("/:id", async (request, reply) => {
    z.string().uuid().parse(request.params.id);
    const body = customerSchema.partial().parse(request.body);
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (body.name !== undefined) updateData.name = body.name;
    if (body.segment !== undefined) updateData.segment = body.segment;
    if (body.currentRevenue !== undefined) updateData.currentRevenue = body.currentRevenue.toString();
    if (body.annualRevenuePlan !== undefined) updateData.annualRevenuePlan = body.annualRevenuePlan != null ? body.annualRevenuePlan.toString() : null;
    if (body.annualRevenuePlanYear !== undefined) updateData.annualRevenuePlanYear = body.annualRevenuePlanYear;
    if (body.potential !== undefined) updateData.potential = body.potential.toString();
    if (body.shareOfWallet !== undefined) updateData.shareOfWallet = body.shareOfWallet;
    if (body.strategicCategory !== undefined) updateData.strategicCategory = body.strategicCategory;

    const [row] = await db
      .update(customers)
      .set(updateData)
      .where(eq(customers.id, request.params.id))
      .returning();
    if (!row) return sendError(reply, 404, "NOT_FOUND", "Not found");
    return row;
  });

  // Visits for a customer
  app.get<{ Params: { id: string } }>("/:id/visits", async (request, reply) => {
    z.string().uuid().parse(request.params.id);
    const [customer] = await db.select().from(customers).where(eq(customers.id, request.params.id)).limit(1);
    if (!customer) return sendError(reply, 404, "NOT_FOUND", "Not found");
    return db.select().from(visits).where(eq(visits.customerId, request.params.id)).orderBy(desc(visits.date));
  });

  // Opportunities for a customer
  app.get<{ Params: { id: string } }>("/:id/opportunities", async (request, reply) => {
    z.string().uuid().parse(request.params.id);
    const [customer] = await db.select().from(customers).where(eq(customers.id, request.params.id)).limit(1);
    if (!customer) return sendError(reply, 404, "NOT_FOUND", "Not found");
    return db.select().from(opportunities).where(eq(opportunities.customerId, request.params.id)).orderBy(desc(opportunities.updatedAt));
  });

  // ABRA: annual revenues for a customer (last 3 years)
  app.get<{ Params: { id: string } }>("/:id/abra-revenues", async (request, reply) => {
    z.string().uuid().parse(request.params.id);
    const [customer] = await db.select().from(customers).where(eq(customers.id, request.params.id)).limit(1);
    if (!customer) return sendError(reply, 404, "NOT_FOUND", "Not found");
    const currentYear = new Date().getFullYear();
    return db
      .select()
      .from(abraRevenues)
      .where(
        and(
          eq(abraRevenues.customerId, request.params.id),
          sql`${abraRevenues.year} >= ${currentYear - 2}`,
        ),
      )
      .orderBy(desc(abraRevenues.year));
  });

  // ABRA: last 10 quotes for a customer
  app.get<{ Params: { id: string } }>("/:id/abra-quotes", async (request, reply) => {
    z.string().uuid().parse(request.params.id);
    const [customer] = await db.select().from(customers).where(eq(customers.id, request.params.id)).limit(1);
    if (!customer) return sendError(reply, 404, "NOT_FOUND", "Not found");
    return db
      .select()
      .from(abraQuotes)
      .where(eq(abraQuotes.customerId, request.params.id))
      .orderBy(desc(abraQuotes.documentDate))
      .limit(10);
  });

  // ABRA: last 10 orders for a customer
  app.get<{ Params: { id: string } }>("/:id/abra-orders", async (request, reply) => {
    z.string().uuid().parse(request.params.id);
    const [customer] = await db.select().from(customers).where(eq(customers.id, request.params.id)).limit(1);
    if (!customer) return sendError(reply, 404, "NOT_FOUND", "Not found");
    return db
      .select()
      .from(abraOrders)
      .where(eq(abraOrders.customerId, request.params.id))
      .orderBy(desc(abraOrders.documentDate))
      .limit(10);
  });
};
