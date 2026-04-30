import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { eq, and, isNull, isNotNull, sql, type SQL } from "drizzle-orm";
import { db } from "../db/index.js";
import { customerResolvers, customers, opportunities, tasks, users } from "../db/schema.js";
import { sendError } from "../lib/http.js";
import { paginationQuerySchema, resolvePagination, setPaginationHeaders } from "../lib/pagination.js";

const taskCreateSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  opportunityId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  ownerId: z.string().uuid().optional(),
});

const taskCompleteSchema = z.object({
  completed: z.boolean().optional(),
});

const taskListQuerySchema = paginationQuerySchema.extend({
  opportunityId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  done: z.enum(["true", "false"]).optional(),
});

type TaskListQuery = z.input<typeof taskListQuerySchema>;

const taskSelectFields = {
  id: tasks.id,
  title: tasks.title,
  description: tasks.description,
  dueDate: tasks.dueDate,
  completedAt: tasks.completedAt,
  ownerId: tasks.ownerId,
  ownerName: users.name,
  opportunityId: tasks.opportunityId,
  customerId: tasks.customerId,
  createdAt: tasks.createdAt,
  updatedAt: tasks.updatedAt,
} as const;

function isMissingCustomerResolversRelation(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const candidate = error as { code?: string; message?: string };
  return candidate.code === "42P01" && candidate.message?.includes("customer_resolvers") === true;
}

export const taskRoutes: FastifyPluginAsync = async (app) => {
  // List tasks — optional filters: opportunityId, customerId, done (true/false)
  app.get<{ Querystring: TaskListQuery }>("/", async (request, reply) => {
    const q = taskListQuerySchema.parse(request.query);
    const conditions: SQL[] = [];

    if (q.opportunityId) {
      z.string().uuid().parse(q.opportunityId);
      conditions.push(eq(tasks.opportunityId, q.opportunityId));
    }
    if (q.customerId) {
      z.string().uuid().parse(q.customerId);
      conditions.push(eq(tasks.customerId, q.customerId));
    }
    if (q.done === "false") conditions.push(isNull(tasks.completedAt));
    if (q.done === "true") conditions.push(isNotNull(tasks.completedAt));

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const pagination = resolvePagination(request.query);

    if (!pagination) {
      return db
        .select(taskSelectFields)
        .from(tasks)
        .leftJoin(users, eq(tasks.ownerId, users.id))
        .where(where)
        .orderBy(tasks.dueDate);
    }

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(tasks)
      .where(where);

    const rows = await db
      .select(taskSelectFields)
      .from(tasks)
      .leftJoin(users, eq(tasks.ownerId, users.id))
      .where(where)
      .orderBy(tasks.dueDate)
      .limit(pagination.limit)
      .offset(pagination.offset);

    setPaginationHeaders(reply, total, pagination);

    return rows;
  });

  // Create task
  app.post("/", async (request, reply) => {
    const body = taskCreateSchema.parse(request.body);
    const ownerId = body.ownerId ?? request.userId!;

    const [owner] = await db
      .select({ id: users.id, role: users.role, active: users.active })
      .from(users)
      .where(eq(users.id, ownerId))
      .limit(1);

    if (!owner || !owner.active) {
      return sendError(reply, 400, "INVALID_TASK_OWNER", "Vybraný riešiteľ úlohy neexistuje alebo nie je aktívny.");
    }

    let resolvedCustomerId = body.customerId ?? null;
    let customerOwnerId: string | null = null;

    if (body.opportunityId) {
      const [opportunity] = await db
        .select({ id: opportunities.id, customerId: opportunities.customerId })
        .from(opportunities)
        .where(eq(opportunities.id, body.opportunityId))
        .limit(1);

      if (!opportunity) {
        return sendError(reply, 404, "OPPORTUNITY_NOT_FOUND", "Príležitosť neexistuje.");
      }

      if (resolvedCustomerId && resolvedCustomerId !== opportunity.customerId) {
        return sendError(reply, 400, "TASK_CUSTOMER_MISMATCH", "Príležitosť nepatrí k vybranému zákazníkovi.");
      }

      resolvedCustomerId = opportunity.customerId;
    }

    if (resolvedCustomerId) {
      const [customer] = await db
        .select({ id: customers.id, ownerId: customers.salespersonId })
        .from(customers)
        .where(eq(customers.id, resolvedCustomerId))
        .limit(1);

      if (!customer) {
        return sendError(reply, 404, "CUSTOMER_NOT_FOUND", "Zákazník neexistuje.");
      }

      customerOwnerId = customer.ownerId;
    }

    const [createdTask] = await db.transaction(async (tx) => {
      const [taskRow] = await tx
        .insert(tasks)
        .values({
          title: body.title,
          description: body.description ?? null,
          dueDate: body.dueDate,
          opportunityId: body.opportunityId ?? null,
          customerId: resolvedCustomerId,
          ownerId,
        })
        .returning({ id: tasks.id });

      if (resolvedCustomerId && owner.role === "sales" && owner.id !== customerOwnerId) {
        try {
          await tx
            .insert(customerResolvers)
            .values({ customerId: resolvedCustomerId, userId: owner.id })
            .onConflictDoNothing();
        } catch (error) {
          if (!isMissingCustomerResolversRelation(error)) {
            throw error;
          }
        }
      }

      return [taskRow];
    });

    const [row] = await db
      .select(taskSelectFields)
      .from(tasks)
      .leftJoin(users, eq(tasks.ownerId, users.id))
      .where(eq(tasks.id, createdTask.id))
      .limit(1);

    return reply.code(201).send(row);
  });

  // Mark task complete
  app.patch<{ Params: { id: string } }>("/:id/complete", async (request, reply) => {
    z.string().uuid().parse(request.params.id);
    const body = taskCompleteSchema.parse(request.body ?? {});
    const completed = body.completed ?? true;
    const [row] = await db
      .update(tasks)
      .set({ completedAt: completed ? new Date() : null, updatedAt: new Date() })
      .where(eq(tasks.id, request.params.id))
      .returning();
    if (!row) return sendError(reply, 404, "NOT_FOUND", "Not found");
    return row;
  });

  // Delete task
  app.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {
    z.string().uuid().parse(request.params.id);
    const [row] = await db.delete(tasks).where(eq(tasks.id, request.params.id)).returning();
    if (!row) return sendError(reply, 404, "NOT_FOUND", "Not found");
    return reply.code(204).send();
  });
};
