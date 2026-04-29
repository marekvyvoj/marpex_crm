import { z } from "zod";

export const listScopeValues = ["mine", "all"] as const;

export const listScopeSchema = z.enum(listScopeValues).optional();

export type ListScope = z.input<typeof listScopeSchema>;

export function shouldUseAllScope(userRole: string | null | undefined, scope: ListScope) {
  return userRole === "manager" || scope === "all";
}