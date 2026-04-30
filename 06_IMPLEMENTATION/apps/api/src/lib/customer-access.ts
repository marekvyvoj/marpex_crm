import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { customerResolvers, customers } from "../db/schema.js";

export async function loadAccessibleCustomerIds(userId: string) {
  const [ownedRows, resolverRows] = await Promise.all([
    db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.salespersonId, userId)),
    db
      .select({ id: customerResolvers.customerId })
      .from(customerResolvers)
      .where(eq(customerResolvers.userId, userId)),
  ]);

  return [...new Set([
    ...ownedRows.map((row) => row.id),
    ...resolverRows.map((row) => row.id),
  ])];
}