import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { eq, desc, ilike, and, inArray, or, sql, type SQL } from "drizzle-orm";
import { db } from "../db/index.js";
import { customers, customerResolvers, contacts, visits, opportunities, abraRevenues, abraQuotes, abraOrders, users } from "../db/schema.js";
import { customerSchema, contactSchema, customerSegments, customerIndustries } from "@marpex/domain";
import { writeAudit } from "../lib/audit.js";
import { loadAccessibleCustomerIds } from "../lib/customer-access.js";
import { sendError } from "../lib/http.js";
import { paginationQuerySchema, resolvePagination, setPaginationHeaders } from "../lib/pagination.js";
import { listScopeSchema, shouldUseAllScope } from "../lib/view-scope.js";

const customerListQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().min(1).optional(),
  segment: z.enum(customerSegments).optional(),
  industry: z.enum(customerIndustries).optional(),
  scope: listScopeSchema,
});

const bodyObjectSchema = z.record(z.string(), z.unknown());

type CustomerListQuery = z.input<typeof customerListQuerySchema>;

const customerSelectFields = {
  id: customers.id,
  name: customers.name,
  segment: customers.segment,
  industry: customers.industry,
  ico: customers.ico,
  dic: customers.dic,
  icDph: customers.icDph,
  address: customers.address,
  city: customers.city,
  postalCode: customers.postalCode,
  district: customers.district,
  region: customers.region,
  currentRevenue: customers.currentRevenue,
  annualRevenuePlan: customers.annualRevenuePlan,
  annualRevenuePlanYear: customers.annualRevenuePlanYear,
  shareOfWallet: customers.shareOfWallet,
  ownerId: customers.salespersonId,
  ownerName: users.name,
  sourceSystem: customers.sourceSystem,
  sourceRecordId: customers.sourceRecordId,
  createdAt: customers.createdAt,
  updatedAt: customers.updatedAt,
} as const;

async function withCustomerDecorations<T extends { id: string; currentRevenue?: string | null }>(rows: T[]) {
  if (rows.length === 0) {
    return [] as Array<T & {
      currentYearRevenue: string | null;
      previousYearRevenue: string | null;
      resolverIds: string[];
      resolverNames: string[];
    }>;
  }

  const currentYear = new Date().getFullYear();
  const customerIds = rows.map((row) => row.id);
  const [revenueRows, resolverRows] = await Promise.all([
    db
      .select({
        customerId: abraRevenues.customerId,
        year: abraRevenues.year,
        totalAmount: abraRevenues.totalAmount,
      })
      .from(abraRevenues)
      .where(
        and(
          inArray(abraRevenues.customerId, customerIds),
          inArray(abraRevenues.year, [currentYear, currentYear - 1]),
        ),
      ),
    db
      .select({
        customerId: customerResolvers.customerId,
        userId: customerResolvers.userId,
        userName: users.name,
      })
      .from(customerResolvers)
      .innerJoin(users, eq(customerResolvers.userId, users.id))
      .where(inArray(customerResolvers.customerId, customerIds))
      .orderBy(users.name),
  ]);

  const revenuesByCustomer = new Map<string, { currentYearRevenue: string | null; previousYearRevenue: string | null }>();
  const resolversByCustomer = new Map<string, { resolverIds: string[]; resolverNames: string[] }>();

  for (const revenue of revenueRows) {
    const summary = revenuesByCustomer.get(revenue.customerId) ?? {
      currentYearRevenue: null,
      previousYearRevenue: null,
    };

    if (revenue.year === currentYear) {
      summary.currentYearRevenue = revenue.totalAmount;
    }
    if (revenue.year === currentYear - 1) {
      summary.previousYearRevenue = revenue.totalAmount;
    }

    revenuesByCustomer.set(revenue.customerId, summary);
  }

  for (const resolver of resolverRows) {
    const summary = resolversByCustomer.get(resolver.customerId) ?? {
      resolverIds: [],
      resolverNames: [],
    };

    summary.resolverIds.push(resolver.userId);
    summary.resolverNames.push(resolver.userName);
    resolversByCustomer.set(resolver.customerId, summary);
  }

  return rows.map((row) => ({
    ...row,
    ...(revenuesByCustomer.get(row.id) ?? {
      currentYearRevenue: row.currentRevenue ?? null,
      previousYearRevenue: null,
    }),
    ...(resolversByCustomer.get(row.id) ?? {
      resolverIds: [],
      resolverNames: [],
    }),
  }));
}

function normalizeResolverIds(resolverIds: string[] | undefined) {
  return [...new Set((resolverIds ?? []).filter((resolverId) => resolverId.length > 0))];
}

async function loadActiveSalesIds(candidateIds: string[]) {
  if (candidateIds.length === 0) {
    return new Set<string>();
  }

  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(and(inArray(users.id, candidateIds), eq(users.role, "sales"), eq(users.active, true)));

  return new Set(rows.map((row) => row.id));
}

async function loadResolverIdsForCustomer(customerId: string) {
  const rows = await db
    .select({ userId: customerResolvers.userId })
    .from(customerResolvers)
    .where(eq(customerResolvers.customerId, customerId));

  return rows.map((row) => row.userId);
}

async function loadCustomerById(customerId: string) {
  const [row] = await db
    .select(customerSelectFields)
    .from(customers)
    .leftJoin(users, eq(customers.salespersonId, users.id))
    .where(eq(customers.id, customerId))
    .limit(1);

  if (!row) {
    return null;
  }

  const [customer] = await withCustomerDecorations([row]);
  return customer;
}

export const customerRoutes: FastifyPluginAsync = async (app) => {
  // List customers — optional ?q= (name search), ?segment=, ?industry=
  app.get<{ Querystring: CustomerListQuery }>("/", async (request, reply) => {
    const { q, segment, industry, scope } = customerListQuerySchema.parse(request.query);
    const conditions: SQL[] = [];
    const showAll = shouldUseAllScope(request.userRole, scope);

    if (q) conditions.push(ilike(customers.name, `%${q}%`));
    if (segment) conditions.push(eq(customers.segment, segment));
    if (industry) conditions.push(eq(customers.industry, industry));
    if (!showAll) {
      const accessibleCustomerIds = await loadAccessibleCustomerIds(request.userId!);

      if (accessibleCustomerIds.length === 0) {
        conditions.push(eq(customers.salespersonId, request.userId!));
      } else {
        conditions.push(or(eq(customers.salespersonId, request.userId!), inArray(customers.id, accessibleCustomerIds))!);
      }
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const pagination = resolvePagination(request.query);

    if (!pagination) {
      const rows = await db
        .select(customerSelectFields)
        .from(customers)
        .leftJoin(users, eq(customers.salespersonId, users.id))
        .where(where)
        .orderBy(customers.name);
      return withCustomerDecorations(rows);
    }

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(customers)
      .where(where);

    const rows = await db
      .select(customerSelectFields)
      .from(customers)
      .leftJoin(users, eq(customers.salespersonId, users.id))
      .where(where)
      .orderBy(customers.name)
      .limit(pagination.limit)
      .offset(pagination.offset);

    setPaginationHeaders(reply, total, pagination);

    return withCustomerDecorations(rows);
  });

  // Get single customer
  app.get<{ Params: { id: string } }>("/:id", async (request, reply) => {
    z.string().uuid().parse(request.params.id);
    const customer = await loadCustomerById(request.params.id);

    if (!customer) return sendError(reply, 404, "NOT_FOUND", "Not found");
    return customer;
  });

  // Create customer
  app.post("/", async (request, reply) => {
    const body = customerSchema.parse(request.body);
    const userId = request.userId!;
    const userRole = request.userRole!;
    let ownerId: string | null = userRole === "sales" ? userId : null;

    if (body.ownerId !== undefined) {
      if (body.ownerId === null) {
        if (userRole !== "manager") {
          return sendError(reply, 403, "FORBIDDEN", "Obchodník môže priradiť zákazníka len sebe.");
        }

        ownerId = null;
      } else {
        if (userRole !== "manager" && body.ownerId !== userId) {
          return sendError(reply, 403, "FORBIDDEN", "Obchodník môže priradiť zákazníka len sebe.");
        }

        ownerId = body.ownerId;
      }
    }

    if (userRole !== "manager" && body.resolverIds !== undefined) {
      return sendError(reply, 403, "FORBIDDEN", "Obchodník nemôže meniť riešiteľov.");
    }

    const resolverIds = normalizeResolverIds(userRole === "manager" ? body.resolverIds : undefined).filter((resolverId) => resolverId !== ownerId);
    const candidateIds = [...new Set([ownerId, ...resolverIds].filter((candidateId): candidateId is string => Boolean(candidateId)))];
    const activeSalesIds = await loadActiveSalesIds(candidateIds);

    if (ownerId && !activeSalesIds.has(ownerId)) {
      return sendError(reply, 400, "INVALID_OWNER", "Vybraný vlastník neexistuje alebo nie je aktívny.");
    }

    if (resolverIds.some((resolverId) => !activeSalesIds.has(resolverId))) {
      return sendError(reply, 400, "INVALID_RESOLVER", "Aspoň jeden vybraný riešiteľ neexistuje alebo nie je aktívny.");
    }

    const [row] = await db.transaction(async (tx) => {
      const [createdCustomer] = await tx
        .insert(customers)
        .values({
          name: body.name,
          segment: body.segment,
          industry: body.industry ?? null,
          ico: body.ico ?? null,
          dic: body.dic ?? null,
          icDph: body.icDph ?? null,
          address: body.address ?? null,
          city: body.city ?? null,
          postalCode: body.postalCode ?? null,
          district: body.district ?? null,
          region: body.region ?? null,
          currentRevenue: body.currentRevenue?.toString() ?? null,
          annualRevenuePlan: body.annualRevenuePlan != null ? body.annualRevenuePlan.toString() : null,
          annualRevenuePlanYear: body.annualRevenuePlanYear ?? null,
          shareOfWallet: body.shareOfWallet ?? null,
          salespersonId: ownerId,
        })
        .returning({ id: customers.id, name: customers.name, segment: customers.segment });

      if (resolverIds.length > 0) {
        await tx.insert(customerResolvers).values(
          resolverIds.map((resolverId) => ({ customerId: createdCustomer.id, userId: resolverId })),
        );
      }

      return [createdCustomer];
    });

    await writeAudit({ userId, action: "customer.create", entityType: "customer", entityId: row.id, payload: { name: row.name, segment: row.segment, ownerId, resolverIds } });
    const customer = await loadCustomerById(row.id);
    return reply.code(201).send(customer);
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
    const userId = request.userId!;
    const userRole = request.userRole!;
    const [existingCustomer] = await db
      .select({ id: customers.id, ownerId: customers.salespersonId })
      .from(customers)
      .where(eq(customers.id, request.params.id))
      .limit(1);

    if (!existingCustomer) return sendError(reply, 404, "NOT_FOUND", "Not found");

    const currentResolverIds = await loadResolverIdsForCustomer(request.params.id);
    let nextOwnerId = existingCustomer.ownerId;
    let nextResolverIds = currentResolverIds;
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (body.name !== undefined) updateData.name = body.name;
    if (body.segment !== undefined) updateData.segment = body.segment;
    if (body.industry !== undefined) updateData.industry = body.industry;
    if (body.ico !== undefined) updateData.ico = body.ico;
    if (body.dic !== undefined) updateData.dic = body.dic;
    if (body.icDph !== undefined) updateData.icDph = body.icDph;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.postalCode !== undefined) updateData.postalCode = body.postalCode;
    if (body.district !== undefined) updateData.district = body.district;
    if (body.region !== undefined) updateData.region = body.region;
    if (body.currentRevenue !== undefined) updateData.currentRevenue = body.currentRevenue.toString();
    if (body.annualRevenuePlan !== undefined) updateData.annualRevenuePlan = body.annualRevenuePlan != null ? body.annualRevenuePlan.toString() : null;
    if (body.annualRevenuePlanYear !== undefined) updateData.annualRevenuePlanYear = body.annualRevenuePlanYear;
    if (body.shareOfWallet !== undefined) updateData.shareOfWallet = body.shareOfWallet;
    if (body.ownerId !== undefined) {
      if (body.ownerId === null) {
        if (userRole !== "manager") {
          return sendError(reply, 403, "FORBIDDEN", "Obchodník môže zmeniť priradenie len na seba.");
        }

        nextOwnerId = null;
      } else {
        if (userRole !== "manager" && body.ownerId !== userId) {
          return sendError(reply, 403, "FORBIDDEN", "Obchodník môže zmeniť priradenie len na seba.");
        }

        nextOwnerId = body.ownerId;
      }
    }

    if (body.resolverIds !== undefined) {
      if (userRole !== "manager") {
        return sendError(reply, 403, "FORBIDDEN", "Obchodník nemôže meniť riešiteľov.");
      }

      nextResolverIds = normalizeResolverIds(body.resolverIds);
    }

    nextResolverIds = nextResolverIds.filter((resolverId) => resolverId !== nextOwnerId);
    const candidateIds = [...new Set([nextOwnerId, ...nextResolverIds].filter((candidateId): candidateId is string => Boolean(candidateId)))];
    const activeSalesIds = await loadActiveSalesIds(candidateIds);

    if (nextOwnerId && !activeSalesIds.has(nextOwnerId)) {
      return sendError(reply, 400, "INVALID_OWNER", "Vybraný vlastník neexistuje alebo nie je aktívny.");
    }

    if (nextResolverIds.some((resolverId) => !activeSalesIds.has(resolverId))) {
      return sendError(reply, 400, "INVALID_RESOLVER", "Aspoň jeden vybraný riešiteľ neexistuje alebo nie je aktívny.");
    }

    if (body.ownerId !== undefined) {
      updateData.salespersonId = nextOwnerId;
    }

    await db.transaction(async (tx) => {
      await tx
        .update(customers)
        .set(updateData)
        .where(eq(customers.id, request.params.id));

      if (body.ownerId !== undefined || body.resolverIds !== undefined) {
        await tx.delete(customerResolvers).where(eq(customerResolvers.customerId, request.params.id));

        if (nextResolverIds.length > 0) {
          await tx.insert(customerResolvers).values(
            nextResolverIds.map((resolverId) => ({ customerId: request.params.id, userId: resolverId })),
          );
        }
      }
    });

    const customer = await loadCustomerById(request.params.id);
    return customer;
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
