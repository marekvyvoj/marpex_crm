import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { eq } from "drizzle-orm";
import argon2 from "argon2";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { sendError } from "../lib/http.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ── Rate limiting ─────────────────────────────────────
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function isLoginRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    loginAttempts.delete(ip);
    return false;
  }

  return entry.count >= MAX_LOGIN_ATTEMPTS;
}

function registerFailedLogin(ip: string) {
  const now = Date.now();
  const entry = loginAttempts.get(ip);

  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return;
  }

  entry.count++;
}

function clearLoginAttempts(ip: string) {
  loginAttempts.delete(ip);
}

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post("/login", async (request, reply) => {
    if (isLoginRateLimited(request.ip)) {
      return sendError(reply, 429, "RATE_LIMITED", "Príliš veľa pokusov. Skúste znova o 15 minút.");
    }

    const body = loginSchema.parse(request.body);

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, body.email))
      .limit(1);

    if (!user || !user.active) {
      registerFailedLogin(request.ip);
      return sendError(reply, 401, "INVALID_CREDENTIALS", "Neplatné prihlasovacie údaje");
    }

    const valid = await argon2.verify(user.passwordHash, body.password);
    if (!valid) {
      registerFailedLogin(request.ip);
      return sendError(reply, 401, "INVALID_CREDENTIALS", "Neplatné prihlasovacie údaje");
    }

    clearLoginAttempts(request.ip);

    // Set session
    const session = request.session;
    session.userId = user.id;
    session.userRole = user.role;

    return { id: user.id, name: user.name, email: user.email, role: user.role };
  });

  app.post("/logout", async (request, reply) => {
    request.session.destroy();
    return reply.code(204).send();
  });

  app.get("/me", async (request, reply) => {
    const session = request.session;
    if (!session?.userId) {
      return sendError(reply, 401, "UNAUTHORIZED", "Unauthorized");
    }

    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (!user) {
      request.session.destroy();
      return sendError(reply, 401, "UNAUTHORIZED", "Unauthorized");
    }

    return user;
  });
};
