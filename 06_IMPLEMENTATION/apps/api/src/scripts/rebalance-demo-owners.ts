import { and, asc, eq, inArray, isNull, like } from "drizzle-orm";
import { db, pool } from "../db/index.js";
import { customers, opportunities, opportunityStageHistory, tasks, users, visits } from "../db/schema.js";

const seedSourceSystem = "marpex_demo_seed";
const writeMode = process.argv.includes("--write");
const demoOwnerEmails = [
  "manager@marpex.sk",
  "obchodnik1@marpex.sk",
  "obchodnik2@marpex.sk",
  "obchodnik3@marpex.sk",
  "obchodnik4@marpex.sk",
  "obchodnik5@marpex.sk",
  "obchodnik6@marpex.sk",
];

async function main() {
  const demoOwners = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(inArray(users.email, demoOwnerEmails))
    .orderBy(asc(users.email));

  if (demoOwners.length !== demoOwnerEmails.length) {
    const foundEmails = new Set(demoOwners.map((owner) => owner.email));
    const missingEmails = demoOwnerEmails.filter((email) => !foundEmails.has(email));
    throw new Error(`Missing demo owners: ${missingEmails.join(", ")}`);
  }

  const seededCustomers = await db
    .select({ id: customers.id, sourceRecordId: customers.sourceRecordId })
    .from(customers)
    .where(eq(customers.sourceSystem, seedSourceSystem))
    .orderBy(asc(customers.sourceRecordId), asc(customers.id));

  if (seededCustomers.length === 0) {
    console.log("No seeded demo customers found. Nothing to rebalance.");
    return;
  }

  const seededCustomerIds = seededCustomers.map((customer) => customer.id);

  const seededOpportunities = await db
    .select({ id: opportunities.id, customerId: opportunities.customerId, sourceRecordId: opportunities.sourceRecordId })
    .from(opportunities)
    .where(eq(opportunities.sourceSystem, seedSourceSystem))
    .orderBy(asc(opportunities.sourceRecordId), asc(opportunities.id));

  const seededOpportunityIds = seededOpportunities.map((opportunity) => opportunity.id);

  const seededVisits = await db
    .select({ id: visits.id, customerId: visits.customerId, date: visits.date })
    .from(visits)
    .where(and(inArray(visits.customerId, seededCustomerIds), like(visits.visitGoal, "Seed návšteva %")))
    .orderBy(asc(visits.customerId), asc(visits.date), asc(visits.id));

  const seededTasks = await db
    .select({ id: tasks.id, opportunityId: tasks.opportunityId, customerId: tasks.customerId })
    .from(tasks)
    .where(and(inArray(tasks.opportunityId, seededOpportunityIds), like(tasks.title, "Seed úloha %")))
    .orderBy(asc(tasks.customerId), asc(tasks.id));

  const ownerCounts = new Map<string, { email: string; opportunities: number; visits: number; tasks: number }>();
  for (const owner of demoOwners) {
    ownerCounts.set(owner.id, { email: owner.email, opportunities: 0, visits: 0, tasks: 0 });
  }

  const opportunityAssignments = seededOpportunities.map((opportunity, index) => ({
    opportunityId: opportunity.id,
    ownerId: demoOwners[index % demoOwners.length]!.id,
  }));

  const visitAssignments = seededVisits.map((visit, index) => ({
    visitId: visit.id,
    ownerId: demoOwners[index % demoOwners.length]!.id,
  }));

  const opportunityOwnerById = new Map<string, string>();

  for (const assignment of opportunityAssignments) {
    const ownerId = assignment.ownerId;
    const counters = ownerCounts.get(ownerId);
    if (counters) counters.opportunities += 1;
    opportunityOwnerById.set(assignment.opportunityId, ownerId);
  }

  const taskAssignments = seededTasks.map((task, index) => {
    const ownerId = task.opportunityId
      ? opportunityOwnerById.get(task.opportunityId) ?? demoOwners[index % demoOwners.length]!.id
      : demoOwners[index % demoOwners.length]!.id;

    const counters = ownerCounts.get(ownerId);
    if (counters) counters.tasks += 1;

    return {
      taskId: task.id,
      ownerId,
    };
  });

  for (const assignment of visitAssignments) {
    const counters = ownerCounts.get(assignment.ownerId);
    if (counters) counters.visits += 1;
  }

  console.table(Array.from(ownerCounts.values()));

  if (!writeMode) {
    console.log("Dry run only. Re-run with --write to persist the rebalance.");
    return;
  }

  await db.transaction(async (tx) => {
    for (const assignment of opportunityAssignments) {
      await tx
        .update(opportunities)
        .set({ ownerId: assignment.ownerId, updatedAt: new Date() })
        .where(eq(opportunities.id, assignment.opportunityId));

      await tx
        .update(opportunityStageHistory)
        .set({ changedBy: assignment.ownerId })
        .where(
          and(
            eq(opportunityStageHistory.opportunityId, assignment.opportunityId),
            isNull(opportunityStageHistory.fromStage),
          ),
        );
    }

    for (const assignment of visitAssignments) {
      await tx
        .update(visits)
        .set({ ownerId: assignment.ownerId, updatedAt: new Date() })
        .where(eq(visits.id, assignment.visitId));
    }

    for (const assignment of taskAssignments) {
      await tx
        .update(tasks)
        .set({ ownerId: assignment.ownerId, updatedAt: new Date() })
        .where(eq(tasks.id, assignment.taskId));
    }
  });

  console.log(`Rebalanced ${seededOpportunities.length} opportunities, ${seededVisits.length} visits, and ${seededTasks.length} tasks across ${demoOwners.length} demo owners.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  await pool.end();
});