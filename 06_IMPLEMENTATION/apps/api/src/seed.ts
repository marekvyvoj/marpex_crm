/**
 * Seed script — creates initial users and a large demo dataset.
 * Run: npx tsx src/seed.ts
 */
import argon2 from "argon2";
import { eq, inArray } from "drizzle-orm";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./db/schema.js";
import { requireEnv } from "./lib/env.js";
import { loadSourceCustomers, resolveSegmentForIndustry } from "./lib/source-customers.js";

const databaseUrl = requireEnv("DATABASE_URL");
const seedSourceSystem = "marpex_demo_seed";
const sourceDataCustomerSourceSystem = "source_data_seed";
const salesUserCount = 6;

// ABRA demo: seed ABRA data for first N customers
const abraQuotesPerCustomer = 8;
const abraOrdersPerCustomer = 6;
const contactsPerCustomer = 2;
const visitsPerCustomer = 2;
const opportunityCount = 120;
const taskCount = 80;

const contactRoles: Array<(typeof schema.contactRoleEnum.enumValues)[number]> = ["decision_maker", "influencer", "user"];
const visitOpportunityTypes: Array<(typeof schema.visitOpportunityTypeEnum.enumValues)[number]> = ["project", "service", "cross_sell"];
const opportunityStages: Array<(typeof schema.opportunityStageEnum.enumValues)[number]> = [
  "identified_need",
  "qualified",
  "technical_solution",
  "quote_delivered",
  "negotiation",
  "verbal_confirmed",
  "won",
  "lost",
];
const firstNames = ["Ján", "Marek", "Peter", "Lucia", "Zuzana", "Michaela", "Tomáš", "Martin", "Roman", "Eva"];
const lastNames = ["Novák", "Kováč", "Hruška", "Vaško", "Mráz", "Kollár", "Urban", "Šimko", "Kmeť", "Bartoš"];
const positions = ["Obchodný riaditeľ", "Výrobný manažér", "Technický riaditeľ", "Servisný koordinátor", "Nákupca", "Projektový manažér"];

const abraPersonnel = ["Miroslava Štefancová", "Lucia Dorušincová", "Patrik Bača", "Rastislav Bušík", "Dušan Gabriška", "Marcel Osúch"];
const abraQuoteStatuses = ["Odoslané", "dohodou", "v texte", "cca 4-6 týždňov", "Čakáme na odpoveď"];
const abraOrderStatuses = ["Potvrdené", "V spracovaní", "Dodané", "Čiastočne dodané"];
const abraDescriptions = [
  "Servisná zmluva na rok",
  "Dodávka hydraulických agregátov",
  "Rozšírenie výrobnej linky",
  "Náhradné diely – plánovaná údržba",
  "Inštalácia riadiaceho systému",
  "Kalibrácia a revízia",
  "Projekt automatizácie skladu",
  "Modernizácia pneumatického systému",
];

type DemoCustomerSeed = {
  key: string;
  name: string;
  segment: (typeof schema.customerSegmentEnum.enumValues)[number];
  industry: (typeof schema.customerIndustryEnum.enumValues)[number] | null;
  ico: string;
  address: string;
  city: string;
  postalCode: string;
  district: string;
  region: string;
  currentRevenue: string;
};

const demoCustomers: DemoCustomerSeed[] = [
  {
    key: "demo-customer-001",
    name: "Demo Hydraulika Bratislava",
    segment: "vyroba",
    industry: null,
    ico: "90000001",
    address: "Pristavna 12",
    city: "Bratislava",
    postalCode: "821 09",
    district: "Bratislava II",
    region: "Bratislavsky",
    currentRevenue: "85000.00",
  },
  {
    key: "demo-customer-002",
    name: "Demo Potraviny Nitra",
    segment: "vyroba",
    industry: "potravinarstvo",
    ico: "90000002",
    address: "Cabajska 4",
    city: "Nitra",
    postalCode: "949 01",
    district: "Nitra",
    region: "Nitriansky",
    currentRevenue: "92000.00",
  },
  {
    key: "demo-customer-003",
    name: "Demo OEM Zilina",
    segment: "oem",
    industry: "oem",
    ico: "90000003",
    address: "Priemyselna 8",
    city: "Zilina",
    postalCode: "010 01",
    district: "Zilina",
    region: "Zilinsky",
    currentRevenue: "134000.00",
  },
  {
    key: "demo-customer-004",
    name: "Demo Mobile Kosice",
    segment: "vyroba",
    industry: "mobile_equipment",
    ico: "90000004",
    address: "Rampova 16",
    city: "Kosice",
    postalCode: "040 01",
    district: "Kosice I",
    region: "Kosicky",
    currentRevenue: "78000.00",
  },
  {
    key: "demo-customer-005",
    name: "Demo Integrator Trencin",
    segment: "integrator",
    industry: null,
    ico: "90000005",
    address: "Elektricna 6",
    city: "Trencin",
    postalCode: "911 01",
    district: "Trencin",
    region: "Trenciansky",
    currentRevenue: "110000.00",
  },
  {
    key: "demo-customer-006",
    name: "Demo Servis Banska Bystrica",
    segment: "servis",
    industry: null,
    ico: "90000006",
    address: "Servisna 21",
    city: "Banska Bystrica",
    postalCode: "974 01",
    district: "Banska Bystrica",
    region: "Banskobystricky",
    currentRevenue: "67000.00",
  },
];

function pad(index: number) {
  return String(index).padStart(3, "0");
}

function isoDate(offsetDays: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function isoTimestamp(offsetDays: number) {
  const date = new Date();
  date.setHours(10, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  return date;
}

async function main() {
  const pool = new pg.Pool({ connectionString: databaseUrl });
  const db = drizzle(pool, { schema });
  const sourceCustomers = loadSourceCustomers();
  const sourceCustomerCount = sourceCustomers.length;
  const demoCustomerCount = demoCustomers.length;

  const managerPw = await argon2.hash("manager123");
  const salesPw = await argon2.hash("sales123");

  await db.transaction(async (tx) => {
    const updatedAt = new Date();
    const salesUsers = Array.from({ length: salesUserCount }, (_value, index) => ({
      email: `obchodnik${index + 1}@marpex.sk`,
      passwordHash: salesPw,
      name: `Obchodník ${index + 1}`,
      role: "sales" as const,
      active: true,
      updatedAt,
    }));

    await tx
      .insert(schema.users)
      .values({
        email: "manager@marpex.sk",
        passwordHash: managerPw,
        name: "Manažér",
        role: "manager",
        active: true,
        updatedAt,
      })
      .onConflictDoUpdate({
        target: schema.users.email,
        set: {
          passwordHash: managerPw,
          name: "Manažér",
          role: "manager",
          active: true,
          updatedAt,
        },
      });

    await tx
      .insert(schema.users)
      .values(salesUsers)
      .onConflictDoUpdate({
        target: schema.users.email,
        set: {
          passwordHash: salesPw,
          active: true,
          updatedAt,
        },
      });

    const ownerEmails = ["manager@marpex.sk", ...salesUsers.map((user) => user.email)];
    const owners = await tx
      .select({ id: schema.users.id, email: schema.users.email })
      .from(schema.users)
      .where(inArray(schema.users.email, ownerEmails));
    const ownerByEmail = new Map(owners.map((owner) => [owner.email, owner.id]));
    const demoOwnerEmails = ["manager@marpex.sk", ...salesUsers.map((user) => user.email)];
    const demoOwnerIds = demoOwnerEmails.map((email) => {
      const ownerId = ownerByEmail.get(email);

      if (!ownerId) {
        throw new Error(`Seed owner ${email} was not created.`);
      }

      return ownerId;
    });

    const seededCustomers = await tx
      .select({ id: schema.customers.id })
      .from(schema.customers)
      .where(inArray(schema.customers.sourceSystem, [seedSourceSystem, sourceDataCustomerSourceSystem]));

    if (seededCustomers.length > 0) {
      const customerIds = seededCustomers.map((customer) => customer.id);
      const seededOpportunities = await tx
        .select({ id: schema.opportunities.id })
        .from(schema.opportunities)
        .where(inArray(schema.opportunities.customerId, customerIds));
      const opportunityIds = seededOpportunities.map((opportunity) => opportunity.id);

      if (opportunityIds.length > 0) {
        await tx.delete(schema.tasks).where(inArray(schema.tasks.opportunityId, opportunityIds));
        await tx.delete(schema.opportunityStageHistory).where(inArray(schema.opportunityStageHistory.opportunityId, opportunityIds));
      }

      await tx.delete(schema.tasks).where(inArray(schema.tasks.customerId, customerIds));
      await tx.delete(schema.visits).where(inArray(schema.visits.customerId, customerIds));
      await tx.delete(schema.abraOrders).where(inArray(schema.abraOrders.customerId, customerIds));
      await tx.delete(schema.abraQuotes).where(inArray(schema.abraQuotes.customerId, customerIds));
      await tx.delete(schema.abraRevenues).where(inArray(schema.abraRevenues.customerId, customerIds));

      if (opportunityIds.length > 0) {
        await tx.delete(schema.opportunities).where(inArray(schema.opportunities.id, opportunityIds));
      }

      await tx.delete(schema.contacts).where(inArray(schema.contacts.customerId, customerIds));
      await tx.delete(schema.customers).where(inArray(schema.customers.id, customerIds));
    }

    const sourceDataCustomerRows = sourceCustomers.map((sourceCustomer, index) => {
      const customerIndex = index + 1;

      return {
        name: sourceCustomer.name,
        segment: resolveSegmentForIndustry(sourceCustomer.industry),
        industry: sourceCustomer.industry,
        ico: sourceCustomer.ico,
        dic: sourceCustomer.dic || null,
        icDph: sourceCustomer.icDph || null,
        address: sourceCustomer.address || null,
        city: sourceCustomer.city || null,
        postalCode: sourceCustomer.postalCode || null,
        district: sourceCustomer.district || null,
        region: sourceCustomer.region || null,
        currentRevenue: sourceCustomer.currentRevenue,
        annualRevenuePlan: null,
        annualRevenuePlanYear: null,
        sourceSystem: sourceDataCustomerSourceSystem,
        sourceRecordId: `source-customer-${pad(customerIndex)}`,
      };
    });

    await tx.insert(schema.customers).values(sourceDataCustomerRows);

    const insertedDemoCustomers = await tx
      .insert(schema.customers)
      .values(demoCustomers.map((demoCustomer) => ({
        name: demoCustomer.name,
        segment: demoCustomer.segment,
        industry: demoCustomer.industry,
        ico: demoCustomer.ico,
        address: demoCustomer.address,
        city: demoCustomer.city,
        postalCode: demoCustomer.postalCode,
        district: demoCustomer.district,
        region: demoCustomer.region,
        currentRevenue: demoCustomer.currentRevenue,
        annualRevenuePlan: null,
        annualRevenuePlanYear: null,
        sourceSystem: seedSourceSystem,
        sourceRecordId: demoCustomer.key,
      })))
      .returning({
        id: schema.customers.id,
        name: schema.customers.name,
        sourceRecordId: schema.customers.sourceRecordId,
      });
    const customerBySeedId = new Map(insertedDemoCustomers.map((customer) => [customer.sourceRecordId!, customer]));
    const customerById = new Map(insertedDemoCustomers.map((customer) => [customer.id, customer]));

    const contactRows = Array.from({ length: demoCustomerCount * contactsPerCustomer }, (_value, index) => {
      const customerIndex = Math.floor(index / contactsPerCustomer) + 1;
      const contactIndex = (index % contactsPerCustomer) + 1;
      const demoCustomer = demoCustomers[customerIndex - 1];

      if (!demoCustomer) {
        throw new Error(`Demo customer seed ${customerIndex} is missing.`);
      }

      const customer = customerBySeedId.get(demoCustomer.key);

      if (!customer) {
        throw new Error(`Demo customer seed ${demoCustomer.key} was not created.`);
      }

      return {
        customerId: customer.id,
        firstName: firstNames[index % firstNames.length],
        lastName: `${lastNames[(index + customerIndex) % lastNames.length]} ${pad(contactIndex)}`,
        role: contactRoles[(contactIndex - 1) % contactRoles.length],
        position: positions[(index + contactIndex) % positions.length],
        email: `kontakt-${customerIndex}-${contactIndex}@demo.marpex.test`,
        phone: `+421 90${(customerIndex % 9) + 1} ${String(100000 + index).slice(-6)}`,
        sourceSystem: seedSourceSystem,
        sourceRecordId: `contact-${pad(customerIndex)}-${contactIndex}`,
      };
    });

    const insertedContacts = await tx
      .insert(schema.contacts)
      .values(contactRows)
      .returning({ id: schema.contacts.id, customerId: schema.contacts.customerId });
    const contactsByCustomerId = new Map<string, Array<{ id: string }>>();

    for (const contact of insertedContacts) {
      const customerContacts = contactsByCustomerId.get(contact.customerId) ?? [];
      customerContacts.push({ id: contact.id });
      contactsByCustomerId.set(contact.customerId, customerContacts);
    }

    const visitRows = Array.from({ length: demoCustomerCount * visitsPerCustomer }, (_value, index) => {
      const customerIndex = Math.floor(index / visitsPerCustomer) + 1;
      const visitIndex = index % visitsPerCustomer;
      const demoCustomer = demoCustomers[customerIndex - 1];

      if (!demoCustomer) {
        throw new Error(`Demo customer seed ${customerIndex} is missing.`);
      }

      const customer = customerBySeedId.get(demoCustomer.key);

      if (!customer) {
        throw new Error(`Demo customer seed ${demoCustomer.key} was not created.`);
      }

      const customerContacts = contactsByCustomerId.get(customer.id) ?? [];
      const contact = customerContacts[visitIndex % customerContacts.length];

      if (!contact) {
        throw new Error(`Customer ${customer.name} is missing contacts for visit seed.`);
      }

      const ownerId = demoOwnerIds[(customerIndex + visitIndex) % demoOwnerIds.length];
      const baseOffset = -((index % 150) + 1);
      const opportunityCreated = (index + customerIndex) % 3 === 0;
      const nextStepOffset = opportunityCreated
        ? 4 + ((index + customerIndex) % 18)
        : (index + customerIndex) % 5 === 0
          ? -((index % 7) + 1)
          : 3 + ((index + customerIndex) % 10);

      return {
        date: isoDate(baseOffset),
        customerId: customer.id,
        contactId: contact.id,
        ownerId,
        visitGoal: `Seed návšteva ${pad(index + 1)} - zistiť ďalší krok u ${customer.name}`,
        result: opportunityCreated ? "Potvrdený záujem o rozšírenie riešenia" : "Zozbierané technické a obchodné vstupy",
        customerNeed: `Zákazník potrebuje lepšie plánovanie servisu a reakčný čas ${((customerIndex - 1) % 4) + 1}.`,
        opportunityCreated,
        opportunityType: opportunityCreated ? visitOpportunityTypes[index % visitOpportunityTypes.length] : null,
        potentialEur: String(2500 + ((customerIndex * 350) % 24000)),
        competition: ["Interné riešenie", "Lokálny integrátor", "Zahraničný dodávateľ"][index % 3],
        nextStep: opportunityCreated ? "Pripraviť kvalifikačný call a cenový rámec" : "Poslať recap a dohodnúť ďalšie stretnutie",
        nextStepDeadline: isoDate(baseOffset + nextStepOffset),
        lateFlag: baseOffset + nextStepOffset < 0,
      };
    });

    await tx.insert(schema.visits).values(visitRows);

    const opportunityRows = Array.from({ length: opportunityCount }, (_value, index) => {
      const customerIndex = (index % demoCustomerCount) + 1;
      const demoCustomer = demoCustomers[customerIndex - 1];

      if (!demoCustomer) {
        throw new Error(`Demo customer seed ${customerIndex} is missing.`);
      }

      const customer = customerBySeedId.get(demoCustomer.key);

      if (!customer) {
        throw new Error(`Demo customer seed ${demoCustomer.key} was not created.`);
      }

      const stage = opportunityStages[index % opportunityStages.length];
      const isClosed = stage === "won" || stage === "lost";
      const ownerId = demoOwnerIds[(index + 1) % demoOwnerIds.length];

      return {
        title: `Seed príležitosť ${pad(index + 1)} - ${customer.name}`,
        customerId: customer.id,
        ownerId,
        value: String(12000 + index * 1450),
        stage,
        nextStepSummary: isClosed ? "Uzatvorená príležitosť" : "Naplánovať follow-up a potvrdiť scope",
        nextStepDeadline: isClosed ? isoDate(-((index % 12) + 1)) : isoDate(3 + (index % 21)),
        technicalSpec: stage === "identified_need" || stage === "qualified" ? null : `Technická špecifikácia pre balík ${((index % 5) + 1)}`,
        competition: ["Bez konkurencie", "Lokálny partner", "Globálny vendor"][index % 3],
        followUpDate: isClosed ? null : isoDate(5 + (index % 14)),
        closeResult: stage === "won" ? "Objednávka potvrdená" : stage === "lost" ? "Projekt pozastavený" : null,
        closeTimestamp: isClosed ? isoTimestamp(-((index % 20) + 1)) : null,
        lostReason: stage === "lost" ? "Rozpočet a posun investície" : null,
        stagnant: !isClosed && index % 9 === 0,
        lastActivityAt: isoTimestamp(!isClosed && index % 9 === 0 ? -45 : -((index % 14) + 2)),
        sourceSystem: seedSourceSystem,
        sourceRecordId: `opportunity-${pad(index + 1)}`,
      };
    });

    const insertedOpportunities = await tx
      .insert(schema.opportunities)
      .values(opportunityRows)
      .returning({
        id: schema.opportunities.id,
        customerId: schema.opportunities.customerId,
        ownerId: schema.opportunities.ownerId,
        stage: schema.opportunities.stage,
      });

    await tx.insert(schema.opportunityStageHistory).values(
      insertedOpportunities.map((opportunity) => ({
        opportunityId: opportunity.id,
        fromStage: null,
        toStage: opportunity.stage,
        changedBy: opportunity.ownerId,
      })),
    );

    const taskRows = insertedOpportunities.slice(0, taskCount).map((opportunity, index) => ({
      opportunityId: opportunity.id,
      customerId: opportunity.customerId,
      ownerId: opportunity.ownerId,
      title: `Seed úloha ${pad(index + 1)} pre ${customerById.get(opportunity.customerId)?.name ?? "zákazníka"}`,
      description: index % 4 === 0 ? "Skontrolovať otvorené body po návšteve a potvrdiť termín." : "Pripraviť update pre ďalší obchodný krok.",
      dueDate: isoDate(index % 5 === 0 ? -((index % 3) + 1) : 3 + (index % 16)),
      completedAt: index % 6 === 0 ? isoTimestamp(-((index % 10) + 1)) : null,
    }));

    if (taskRows.length > 0) {
      await tx.insert(schema.tasks).values(taskRows);
    }

    // ── ABRA demo data ────────────────────────────────────────────────────────
    // Wipe existing ABRA demo data for seeded customers
  const abraCustomerIds = insertedDemoCustomers.map((customer) => customer.id);

    await tx.delete(schema.abraOrders).where(inArray(schema.abraOrders.customerId, abraCustomerIds));
    await tx.delete(schema.abraQuotes).where(inArray(schema.abraQuotes.customerId, abraCustomerIds));
    await tx.delete(schema.abraRevenues).where(inArray(schema.abraRevenues.customerId, abraCustomerIds));

    const currentYear = new Date().getFullYear();

    // Annual revenues: 3 years per customer
    const revenueRows = abraCustomerIds.flatMap((customerId, ci) => {
      return [0, 1, 2].map((yearOffset) => {
        const year = currentYear - yearOffset;
        const baseRevenue = 25000 + ((ci * 3700 + yearOffset * 1100) % 180000);
        // Slight growth year-on-year
        const amount = baseRevenue * (1 + yearOffset * 0.08);
        const invoiceCount = 4 + ((ci + yearOffset) % 14);
        return {
          customerId,
          year,
          totalAmount: amount.toFixed(2),
          invoiceCount,
          sourceSystem: "abra_demo_seed",
        };
      });
    });
    await tx.insert(schema.abraRevenues).values(revenueRows);

    // Quotes (Ponuky vydané – AG-xxx/yyyy)
    const quoteRows = abraCustomerIds.flatMap((customerId, ci) => {
      return Array.from({ length: abraQuotesPerCustomer }, (_, qi) => {
        const docYear = currentYear - (qi % 2 === 0 ? 0 : 1);
        const docNum = 900 + ci * abraQuotesPerCustomer + qi;
        const daysAgo = 5 + qi * 18 + ci % 30;
        const total = 76 + (ci * 251 + qi * 847) % 14800;
        return {
          customerId,
          documentNumber: `AG-${docNum}/${docYear}`,
          documentDate: isoDate(-daysAgo),
          totalAmountExVat: total.toFixed(2),
          status: abraQuoteStatuses[(ci + qi) % abraQuoteStatuses.length],
          description: abraDescriptions[(ci * 3 + qi) % abraDescriptions.length],
          responsiblePerson: abraPersonnel[(ci + qi) % abraPersonnel.length],
          sentAt: qi % 4 === 3 ? null : isoDate(-daysAgo + 2),
          sourceSystem: "abra_demo_seed",
        };
      });
    });
    await tx.insert(schema.abraQuotes).values(quoteRows);

    // Orders (Objednávky prijaté – PO-xxx/yyyy)
    const orderRows = abraCustomerIds.flatMap((customerId, ci) => {
      return Array.from({ length: abraOrdersPerCustomer }, (_, oi) => {
        const docYear = currentYear - (oi % 3 === 0 ? 0 : oi % 3 === 1 ? 0 : 1);
        const docNum = 500 + ci * abraOrdersPerCustomer + oi;
        const daysAgo = 10 + oi * 22 + ci % 40;
        const total = 220 + (ci * 613 + oi * 1321) % 32000;
        return {
          customerId,
          documentNumber: `PO-${docNum}/${docYear}`,
          documentDate: isoDate(-daysAgo),
          totalAmountExVat: total.toFixed(2),
          status: abraOrderStatuses[(ci + oi) % abraOrderStatuses.length],
          description: abraDescriptions[(ci * 2 + oi + 3) % abraDescriptions.length],
          responsiblePerson: abraPersonnel[(ci * 2 + oi) % abraPersonnel.length],
          sourceSystem: "abra_demo_seed",
        };
      });
    });
    await tx.insert(schema.abraOrders).values(orderRows);
  });

  console.log(`✅ Seed complete (${salesUserCount + 1} users, ${sourceCustomerCount} imported customers, ${demoCustomerCount} demo customers, ${demoCustomerCount * contactsPerCustomer} contacts, ${demoCustomerCount * visitsPerCustomer} visits, ${opportunityCount} opportunities, ${taskCount} tasks, ${demoCustomerCount} demo customers with ABRA data)`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
