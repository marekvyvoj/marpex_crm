import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { eq, and, isNull, isNotNull, sql, type SQL } from "drizzle-orm";
import { db } from "../db/index.js";
import { tasks } from "../db/schema.js";
import { sendError } from "../lib/http.js";
import { paginationQuerySchema, resolvePagination, setPaginationHeaders } from "../lib/pagination.js";

const taskCreateSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  opportunityId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
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
      return db.select().from(tasks).where(where).orderBy(tasks.dueDate);
    }

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(tasks)
      .where(where);

    const rows = await db
      .select()
      .from(tasks)
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
    const ownerId = request.userId!;

    const [row] = await db
      .insert(tasks)
      .values({
        title: body.title,
        description: body.description ?? null,
        dueDate: body.dueDate,
        opportunityId: body.opportunityId ?? null,
        customerId: body.customerId ?? null,
        ownerId,
      })
      .returning();
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
