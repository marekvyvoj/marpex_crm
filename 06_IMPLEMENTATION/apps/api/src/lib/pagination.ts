import type { FastifyReply } from "fastify";
import { z } from "zod";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export interface Pagination {
  page: number;
  limit: number;
  offset: number;
}

export function resolvePagination(query: unknown, defaultLimit = 25): Pagination | null {
  const parsed = paginationQuerySchema.parse(query);

  if (parsed.page === undefined && parsed.limit === undefined) {
    return null;
  }

  const page = parsed.page ?? 1;
  const limit = parsed.limit ?? defaultLimit;

  return {
    page,
    limit,
    offset: (page - 1) * limit,
  };
}

export function setPaginationHeaders(reply: FastifyReply, totalItems: number, pagination: Pagination | null) {
  if (!pagination) {
    return;
  }

  reply.header("X-Total-Count", String(totalItems));
  reply.header("X-Page", String(pagination.page));
  reply.header("X-Limit", String(pagination.limit));
  reply.header("X-Total-Pages", String(Math.max(1, Math.ceil(totalItems / pagination.limit))));
}