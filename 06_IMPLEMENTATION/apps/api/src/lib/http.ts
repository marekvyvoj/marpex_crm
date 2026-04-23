import type { FastifyReply } from "fastify";

export interface ApiErrorResponse {
  error: string;
  code: string;
  details?: unknown;
}

export function sendError(
  reply: FastifyReply,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown,
) {
  const payload: ApiErrorResponse = details === undefined
    ? { error: message, code }
    : { error: message, code, details };

  return reply.code(statusCode).send(payload);
}

export function getStatusCode(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof (error as { statusCode?: unknown }).statusCode === "number"
  ) {
    return (error as { statusCode: number }).statusCode;
  }

  return 500;
}