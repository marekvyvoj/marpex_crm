import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from "fastify";
import { sendError } from "./http.js";

export const managerGuard: preHandlerHookHandler = async (request, reply) => {
  if (request.userRole !== "manager") {
    return sendError(reply, 403, "FORBIDDEN", "Forbidden");
  }
};

export function requireAuthenticatedUser(request: FastifyRequest, reply: FastifyReply) {
  if (!request.userId || !request.userRole) {
    sendError(reply, 401, "UNAUTHORIZED", "Unauthorized");
    return null;
  }

  return {
    userId: request.userId,
    userRole: request.userRole,
  };
}