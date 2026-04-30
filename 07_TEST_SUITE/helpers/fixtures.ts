import { randomUUID } from "node:crypto";
import { eq, ilike, inArray, or } from "drizzle-orm";

export const TEST_SOURCE_SYSTEM = "phase5_test";

async function getDbContext() {
  process.env.DATABASE_URL ??= "postgresql://marpex:marpex@localhost:5432/marpex_crm";

  const [{ db }, schema] = await Promise.all([
    import("../../06_IMPLEMENTATION/apps/api/src/db/index.ts"),
    import("../../06_IMPLEMENTATION/apps/api/src/db/schema.ts"),
  ]);

  return { db, ...schema };
}

export async function getUserByEmail(email: string) {
  const { db, users } = await getDbContext();
  const [user] = await db
    .select({ id: users.id, email: users.email, role: users.role, name: users.name })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    throw new Error(`User ${email} was not found.`);
  }

  return user;
}

export async function createTestCustomer(overrides: Partial<{
  name: string;
  segment: "oem" | "vyroba" | "integrator" | "servis" | "other";
  currentRevenue: string;
  ownerId: string | null;
  resolverIds: string[];
}> = {}) {
  const { db, customers, customerResolvers } = await getDbContext();
  const suffix = randomUUID().slice(0, 8);
  const [customer] = await db.transaction(async (tx) => {
    const [createdCustomer] = await tx
      .insert(customers)
      .values({
        name: overrides.name ?? `Phase5 Customer ${suffix}`,
        segment: overrides.segment ?? "vyroba",
        currentRevenue: overrides.currentRevenue ?? null,
        salespersonId: overrides.ownerId ?? null,
        sourceSystem: TEST_SOURCE_SYSTEM,
        sourceRecordId: suffix,
      })
      .returning();

    if ((overrides.resolverIds ?? []).length > 0) {
      await tx.insert(customerResolvers).values(
        (overrides.resolverIds ?? []).map((resolverId) => ({ customerId: createdCustomer.id, userId: resolverId })),
      );
    }

    return [createdCustomer];
  });

  return customer;
}

export async function createTestContact(customerId: string, overrides: Partial<{
  firstName: string;
  lastName: string;
  role: "decision_maker" | "influencer" | "user";
  email: string;
}> = {}) {
  const { db, contacts } = await getDbContext();
  const suffix = randomUUID().slice(0, 8);
  const [contact] = await db
    .insert(contacts)
    .values({
      customerId,
      firstName: overrides.firstName ?? "Phase5",
      lastName: overrides.lastName ?? `Kontakt ${suffix}`,
      role: overrides.role ?? "decision_maker",
      email: overrides.email ?? `phase5-${suffix}@example.test`,
      sourceSystem: TEST_SOURCE_SYSTEM,
      sourceRecordId: suffix,
    })
    .returning();

  return contact;
}

export async function createTestVisit(overrides: {
  customerId: string;
  contactId: string;
  ownerId: string;
  date: string;
  nextStepDeadline: string;
  visitGoal?: string;
  result?: string;
  customerNeed?: string;
  opportunityCreated?: boolean;
  opportunityType?: "project" | "service" | "cross_sell" | null;
  potentialEur?: string;
  competition?: string;
  nextStep?: string;
  lateFlag?: boolean;
}) {
  const { db, visits } = await getDbContext();
  const [visit] = await db
    .insert(visits)
    .values({
      date: overrides.date,
      customerId: overrides.customerId,
      contactId: overrides.contactId,
      ownerId: overrides.ownerId,
      visitGoal: overrides.visitGoal ?? "Phase5 visit",
      result: overrides.result ?? "Phase5 result",
      customerNeed: overrides.customerNeed ?? "Phase5 need",
      opportunityCreated: overrides.opportunityCreated ?? false,
      opportunityType: overrides.opportunityCreated ? overrides.opportunityType ?? null : null,
      potentialEur: overrides.potentialEur ?? "1000",
      competition: overrides.competition ?? "Phase5 competitor",
      nextStep: overrides.nextStep ?? "Phase5 follow-up",
      nextStepDeadline: overrides.nextStepDeadline,
      lateFlag: overrides.lateFlag ?? false,
    })
    .returning();

  return visit;
}

export async function createTestOpportunity(overrides: {
  customerId: string;
  ownerId: string;
  title?: string;
  value?: string;
  stage?: "identified_need" | "qualified" | "technical_solution" | "quote_delivered" | "negotiation" | "verbal_confirmed" | "won" | "lost";
  nextStepSummary?: string;
  nextStepDeadline?: string;
  lastActivityAt?: Date;
  stagnant?: boolean;
  closeResult?: string | null;
  closeTimestamp?: Date | null;
  lostReason?: string | null;
}) {
  const { db, opportunities, opportunityStageHistory } = await getDbContext();
  const suffix = randomUUID().slice(0, 8);
  const [opportunity] = await db
    .insert(opportunities)
    .values({
      title: overrides.title ?? `Phase5 Opportunity ${suffix}`,
      customerId: overrides.customerId,
      ownerId: overrides.ownerId,
      value: overrides.value ?? "10000",
      stage: overrides.stage ?? "identified_need",
      nextStepSummary: overrides.nextStepSummary ?? "Phase5 next step",
      nextStepDeadline: overrides.nextStepDeadline ?? new Date().toISOString().slice(0, 10),
      lastActivityAt: overrides.lastActivityAt ?? new Date(),
      stagnant: overrides.stagnant ?? false,
      closeResult: overrides.closeResult ?? null,
      closeTimestamp: overrides.closeTimestamp ?? null,
      lostReason: overrides.lostReason ?? null,
      sourceSystem: TEST_SOURCE_SYSTEM,
      sourceRecordId: suffix,
    })
    .returning();

  await db.insert(opportunityStageHistory).values({
    opportunityId: opportunity.id,
    fromStage: null,
    toStage: opportunity.stage,
    changedBy: overrides.ownerId,
  });

  return opportunity;
}

export async function cleanupTestData() {
  const {
    abraRevenues,
    auditLog,
    contacts,
    customerResolvers,
    customers,
    db,
    opportunities,
    opportunityStageHistory,
    tasks,
    users,
    visits,
  } = await getDbContext();
  const testCustomers = await db
    .select({ id: customers.id })
    .from(customers)
    .where(or(eq(customers.sourceSystem, TEST_SOURCE_SYSTEM), ilike(customers.name, "Phase5%")));
  const testUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(or(ilike(users.email, "phase5-%"), ilike(users.name, "Phase5%")));

  if (testCustomers.length === 0 && testUsers.length === 0) {
    return;
  }

  const customerIds = testCustomers.map((customer) => customer.id);
  const userIds = testUsers.map((user) => user.id);
  const testOpportunities = customerIds.length > 0
    ? await db
        .select({ id: opportunities.id })
        .from(opportunities)
        .where(inArray(opportunities.customerId, customerIds))
    : [];
  const opportunityIds = testOpportunities.map((opportunity) => opportunity.id);
  const testContacts = customerIds.length > 0
    ? await db
        .select({ id: contacts.id })
        .from(contacts)
        .where(inArray(contacts.customerId, customerIds))
    : [];
  const contactIds = testContacts.map((contact) => contact.id);
  const testVisits = customerIds.length > 0
    ? await db
        .select({ id: visits.id })
        .from(visits)
        .where(inArray(visits.customerId, customerIds))
    : [];
  const visitIds = testVisits.map((visit) => visit.id);
  const entityIds = [...customerIds, ...contactIds, ...visitIds, ...opportunityIds];

  if (opportunityIds.length > 0) {
    await db.delete(tasks).where(inArray(tasks.opportunityId, opportunityIds));
    await db.delete(opportunityStageHistory).where(inArray(opportunityStageHistory.opportunityId, opportunityIds));
  }

  await db.delete(tasks).where(inArray(tasks.customerId, customerIds));
  if (visitIds.length > 0) {
    await db.delete(visits).where(inArray(visits.id, visitIds));
  }

  if (customerIds.length > 0) {
    await db.delete(customerResolvers).where(inArray(customerResolvers.customerId, customerIds));
    await db.delete(abraRevenues).where(inArray(abraRevenues.customerId, customerIds));
  }

  if (opportunityIds.length > 0) {
    await db.delete(opportunities).where(inArray(opportunities.id, opportunityIds));
  }

  if (contactIds.length > 0) {
    await db.delete(contacts).where(inArray(contacts.id, contactIds));
  }

  if (entityIds.length > 0) {
    await db.delete(auditLog).where(inArray(auditLog.entityId, entityIds));
  }

  if (userIds.length > 0) {
    await db.delete(auditLog).where(inArray(auditLog.userId, userIds));
  }

  if (customerIds.length > 0) {
    await db.delete(customers).where(inArray(customers.id, customerIds));
  }

  if (userIds.length > 0) {
    await db.delete(users).where(inArray(users.id, userIds));
  }
}