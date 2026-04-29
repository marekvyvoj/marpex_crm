import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { hash } from "argon2";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { managerGuard } from "../lib/guards.js";
import { sendError } from "../lib/http.js";
import { paginationQuerySchema, resolvePagination, setPaginationHeaders } from "../lib/pagination.js";

const safeUserColumns = {
  id: users.id,
  email: users.email,
  name: users.name,
  role: users.role,
  active: users.active,
  createdAt: users.createdAt,
} as const;

const userCreateSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8),
  role: z.enum(["manager", "sales"]).default("sales"),
});

const userUpdateSchema = z
  .object({
    active: z.boolean(),
    role: z.enum(["manager", "sales"]),
    name: z.string().min(1).max(255),
  })
  .partial()
  .refine((d) => Object.keys(d).length > 0, { message: "No fields to update" });

type UserListQuery = z.input<typeof paginationQuerySchema>;

export const userRoutes: FastifyPluginAsync = async (app) => {
  // List users (manager only)
  app.get<{ Querystring: UserListQuery }>("/", { preHandler: [managerGuard] }, async (request, reply) => {
    const pagination = resolvePagination(request.query);

    if (!pagination) {
      return db.select(safeUserColumns).from(users).orderBy(users.name);
    }

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(users);

    const rows = await db
      .select(safeUserColumns)
      .from(users)
      .orderBy(users.name)
      .limit(pagination.limit)
      .offset(pagination.offset);

    setPaginationHeaders(reply, total, pagination);

    return rows;
  });

  // Create user (manager only)
  app.post("/", { preHandler: [managerGuard] }, async (request, reply) => {
    const body = userCreateSchema.parse(request.body);
    const passwordHash = await hash(body.password);
    const [row] = await db
      .insert(users)
      .values({ name: body.name, email: body.email, passwordHash, role: body.role })
      .returning(safeUserColumns);
    return reply.code(201).send(row);
  });

  // Update user (manager only) — toggle active, change role, rename
  app.patch<{ Params: { id: string } }>("/:id", { preHandler: [managerGuard] }, async (request, reply) => {
    z.string().uuid().parse(request.params.id);
    const body = userUpdateSchema.parse(request.body);

    if (request.params.id === request.userId && body.active === false) {
      return sendError(reply, 400, "SELF_DEACTIVATION_BLOCKED", "Nemôžete deaktivovať vlastné konto");
    }

    const [row] = await db
      .update(users)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(users.id, request.params.id))
      .returning(safeUserColumns);

    if (!row) return sendError(reply, 404, "NOT_FOUND", "Not found");
    return row;
  });
};
