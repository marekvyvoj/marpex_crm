import Fastify from "fastify";
import fastifyCookie from "@fastify/cookie";
import fastifySession from "@fastify/session";
import fastifyCors from "@fastify/cors";
import { ZodError } from "zod";
import { requireEnv } from "./lib/env.js";
import { getStatusCode, sendError } from "./lib/http.js";

import { authRoutes } from "./routes/auth.js";
import { customerRoutes } from "./routes/customers.js";
import { visitRoutes } from "./routes/visits.js";
import { opportunityRoutes } from "./routes/opportunities.js";
import { dashboardRoutes } from "./routes/dashboard.js";
import { healthRoutes } from "./routes/health.js";
import { taskRoutes } from "./routes/tasks.js";
import { userRoutes } from "./routes/users.js";
import { importRoutes } from "./routes/import.js";
import { reportRoutes } from "./routes/report.js";

export async function buildApp() {
  const isProduction = process.env.NODE_ENV === "production";
  const app = Fastify({ logger: true, trustProxy: isProduction });

  // ── Content-type parsers ─────────────────────────────
  app.addContentTypeParser("text/csv", { parseAs: "string" }, (_req, body, done) => done(null, body));
  app.addContentTypeParser("text/plain", { parseAs: "string" }, (_req, body, done) => done(null, body));

  // ── Plugins ──────────────────────────────────────────
  await app.register(fastifyCors, {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  });

  await app.register(fastifyCookie);
  await app.register(fastifySession, {
    secret: requireEnv("SESSION_SECRET"),
    cookie: {
      secure: isProduction,
      httpOnly: true,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 8 * 60 * 60 * 1000, // 8h
    },
  });

  // ── Auth guard decorator ─────────────────────────────
  app.decorateRequest("userId", null);
  app.decorateRequest("userRole", null);

  app.addHook("onRequest", async (request, reply) => {
    const publicPaths = ["/api/auth/login", "/api/health"];
    if (publicPaths.some((p) => request.url.startsWith(p))) return;

    const session = request.session;
    if (!session?.userId) {
      return sendError(reply, 401, "UNAUTHORIZED", "Unauthorized");
    }

    request.userId = session.userId;
    request.userRole = session.userRole ?? null;
  });

  // ── Error handler ────────────────────────────────────
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return sendError(reply, 400, "VALIDATION_ERROR", "Validation error", error.flatten().fieldErrors);
    }
    const statusCode = getStatusCode(error);
    if (statusCode >= 500) app.log.error(error);
    return sendError(
      reply,
      statusCode,
      statusCode >= 500 ? "INTERNAL_SERVER_ERROR" : "REQUEST_ERROR",
      error instanceof Error ? error.message : "Unexpected error",
    );
  });

  // ── Routes ───────────────────────────────────────────
  await app.register(healthRoutes, { prefix: "/api/health" });
  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(customerRoutes, { prefix: "/api/customers" });
  await app.register(visitRoutes, { prefix: "/api/visits" });
  await app.register(opportunityRoutes, { prefix: "/api/opportunities" });
  await app.register(dashboardRoutes, { prefix: "/api/dashboard" });
  await app.register(taskRoutes, { prefix: "/api/tasks" });
  await app.register(userRoutes, { prefix: "/api/users" });
  await app.register(importRoutes, { prefix: "/api/import" });
  await app.register(reportRoutes, { prefix: "/api/report" });

  return app;
}
