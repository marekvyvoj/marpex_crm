import "fastify";
import type { UserRole } from "./auth.js";

declare module "fastify" {
  interface FastifyRequest {
    userId: string | null;
    userRole: UserRole | null;
  }

  interface Session {
    userId?: string;
    userRole?: UserRole;
  }
}