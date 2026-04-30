import { eq, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import { customerResolvers, customers, users } from "../db/schema.js";

function isMissingCustomerResolversRelation(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const candidate = error as { code?: string; message?: string };
  return candidate.code === "42P01" && candidate.message?.includes("customer_resolvers") === true;
}

export async function loadCustomerResolverRows(customerIds: string[]) {
  if (customerIds.length === 0) {
    return [] as Array<{ customerId: string; userId: string; userName: string }>;
  }

  try {
    return await db
      .select({
        customerId: customerResolvers.customerId,
        userId: customerResolvers.userId,
        userName: users.name,
      })
      .from(customerResolvers)
      .innerJoin(users, eq(customerResolvers.userId, users.id))
      .where(inArray(customerResolvers.customerId, customerIds))
      .orderBy(users.name);
  } catch (error) {
    if (isMissingCustomerResolversRelation(error)) {
      return [];
    }

    throw error;
  }
}

export async function loadResolverIdsForCustomer(customerId: string) {
  try {
    const rows = await db
      .select({ userId: customerResolvers.userId })
      .from(customerResolvers)
      .where(eq(customerResolvers.customerId, customerId));

    return rows.map((row) => row.userId);
  } catch (error) {
    if (isMissingCustomerResolversRelation(error)) {
      return [];
    }

    throw error;
  }
}

export async function loadAccessibleCustomerIds(userId: string) {
  const ownedRows = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.salespersonId, userId));

  let resolverRows: Array<{ id: string }> = [];

  try {
    resolverRows = await db
      .select({ id: customerResolvers.customerId })
      .from(customerResolvers)
      .where(eq(customerResolvers.userId, userId));
  } catch (error) {
    if (!isMissingCustomerResolversRelation(error)) {
      throw error;
    }
  }

  return [...new Set([
    ...ownedRows.map((row) => row.id),
    ...resolverRows.map((row) => row.id),
  ])];
}