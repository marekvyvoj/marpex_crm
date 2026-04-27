import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { createApp, loginAs } from "./helpers/app.ts";
import {
  cleanupTestData,
  createTestContact,
  createTestCustomer,
  createTestOpportunity,
  createTestVisit,
  getUserByEmail,
} from "../helpers/fixtures.ts";

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

describe("API integration", () => {
  let app: Awaited<ReturnType<typeof createApp>>;

  beforeAll(async () => {
    app = await createApp();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    delete process.env.ANNUAL_REVENUE_TARGET_EUR;
    await cleanupTestData();
  });

  it("exposes public health endpoint", async () => {
    const response = await app.inject({ method: "GET", url: "/api/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: "ok" });
  });

  it("protects private routes without session", async () => {
    const response = await app.inject({ method: "GET", url: "/api/customers" });

    expect(response.statusCode).toBe(401);
  });

  it("does not rate limit repeated successful logins", async () => {
    for (let attempt = 0; attempt < 6; attempt++) {
      const { response } = await loginAs(app, "manager@marpex.sk", "manager123", "127.0.0.77");
      expect(response.statusCode).toBe(200);
    }
  });

  it("rate limits repeated failed logins and keeps valid logins separate", async () => {
    for (let attempt = 0; attempt < 5; attempt++) {
      const { response } = await loginAs(app, "manager@marpex.sk", "zle-heslo", "127.0.0.66");
      expect(response.statusCode).toBe(401);
    }

    const limited = await loginAs(app, "manager@marpex.sk", "zle-heslo", "127.0.0.66");
    expect(limited.response.statusCode).toBe(429);

    const successFromAnotherIp = await loginAs(app, "manager@marpex.sk", "manager123", "127.0.0.67");
    expect(successFromAnotherIp.response.statusCode).toBe(200);
  });

  it("returns current user and invalidates session after logout", async () => {
    const { cookie, response: loginResponse } = await loginAs(app, "manager@marpex.sk", "manager123", "127.0.0.68");
    expect(loginResponse.statusCode).toBe(200);

    const meResponse = await app.inject({
      method: "GET",
      url: "/api/auth/me",
      headers: { cookie },
    });
    expect(meResponse.statusCode).toBe(200);
    expect(meResponse.json()).toMatchObject({ email: "manager@marpex.sk", role: "manager" });

    const logoutResponse = await app.inject({
      method: "POST",
      url: "/api/auth/logout",
      headers: { cookie },
    });
    expect(logoutResponse.statusCode).toBe(204);

    const meAfterLogout = await app.inject({
      method: "GET",
      url: "/api/auth/me",
      headers: { cookie },
    });
    expect(meAfterLogout.statusCode).toBe(401);
  });

  it("returns extended dashboard metrics for manager", async () => {
    const { cookie, response: loginResponse } = await loginAs(app, "manager@marpex.sk", "manager123", "127.0.0.78");
    expect(loginResponse.statusCode).toBe(200);

    const response = await app.inject({
      method: "GET",
      url: "/api/dashboard",
      headers: { cookie },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();

    expect(body.customerCount).toEqual(expect.any(Number));
    expect(body.totalPipeline).toEqual(expect.any(Number));
    expect(body.weightedPipeline).toEqual(expect.any(Number));
    expect(Object.prototype.hasOwnProperty.call(body, "coverageRatio")).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(body, "crossSellRate")).toBe(true);
  });

  it("returns dashboard scoped to the logged-in salesperson", async () => {
    const sales = await getUserByEmail("obchodnik1@marpex.sk");
    const manager = await getUserByEmail("manager@marpex.sk");
    const customer = await createTestCustomer({ name: "Phase5 Sales Dashboard" });
    await createTestOpportunity({
      customerId: customer.id,
      ownerId: sales.id,
      title: "Sales Owned Opp",
      stage: "qualified",
      value: "55000",
      nextStepDeadline: "2026-04-30",
    });
    await createTestOpportunity({
      customerId: customer.id,
      ownerId: manager.id,
      title: "Manager Only Opp",
      stage: "qualified",
      value: "88000",
      nextStepDeadline: "2026-04-30",
    });

    const { cookie, response: loginResponse } = await loginAs(app, "obchodnik1@marpex.sk", "sales123", "127.0.0.84");
    expect(loginResponse.statusCode).toBe(200);

    const response = await app.inject({
      method: "GET",
      url: "/api/dashboard",
      headers: { cookie },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.openCount).toBe(1);
    expect(body.top10).toHaveLength(1);
    expect(body.top10[0].title).toBe("Sales Owned Opp");
  });

  it("returns planner items from visits and opportunities scoped to the logged-in salesperson", async () => {
    const sales = await getUserByEmail("obchodnik1@marpex.sk");
    const manager = await getUserByEmail("manager@marpex.sk");
    const customer = await createTestCustomer({ name: "Phase5 Planner Scope" });
    const contact = await createTestContact(customer.id);
    const today = new Date();
    const overdueDate = dateKey(addDays(today, -1));
    const upcomingDate = dateKey(addDays(today, 3));

    await createTestVisit({
      customerId: customer.id,
      contactId: contact.id,
      ownerId: sales.id,
      date: overdueDate,
      nextStepDeadline: overdueDate,
      nextStep: "Zavolať po návšteve",
      potentialEur: "2500",
    });

    await createTestOpportunity({
      customerId: customer.id,
      ownerId: sales.id,
      title: "Sales Planner Opp",
      stage: "qualified",
      value: "42000",
      nextStepSummary: "Poslať ďalší návrh",
      nextStepDeadline: upcomingDate,
    });

    await createTestOpportunity({
      customerId: customer.id,
      ownerId: manager.id,
      title: "Manager Hidden Opp",
      stage: "qualified",
      value: "99000",
      nextStepSummary: "Nemá byť viditeľné",
      nextStepDeadline: overdueDate,
    });

    const { cookie, response: loginResponse } = await loginAs(app, "obchodnik1@marpex.sk", "sales123", "127.0.0.90");
    expect(loginResponse.statusCode).toBe(200);

    const response = await app.inject({
      method: "GET",
      url: "/api/dashboard/planner",
      headers: { cookie },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();

    expect(body.summary).toMatchObject({
      overdueCount: 1,
      dueTodayCount: 0,
      dueThisWeekCount: 1,
      laterCount: 0,
      totalCount: 2,
    });
    expect(body.items).toHaveLength(2);
    expect(body.items.map((item: { title: string }) => item.title)).toEqual([
      expect.stringContaining("Návšteva"),
      "Sales Planner Opp",
    ]);
    expect(body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceType: "visit",
          customerName: "Phase5 Planner Scope",
          nextStep: "Zavolať po návšteve",
          status: "overdue",
        }),
        expect.objectContaining({
          sourceType: "opportunity",
          title: "Sales Planner Opp",
          nextStep: "Poslať ďalší návrh",
          status: "this_week",
        }),
      ]),
    );
    expect(body.items.some((item: { title: string }) => item.title === "Manager Hidden Opp")).toBe(false);
    expect(body.previewItems).toHaveLength(2);
  });

  it("blocks salesperson access to manager report", async () => {
    const { cookie, response: loginResponse } = await loginAs(app, "obchodnik1@marpex.sk", "sales123", "127.0.0.79");
    expect(loginResponse.statusCode).toBe(200);

    const response = await app.inject({
      method: "GET",
      url: "/api/report/salesperson",
      headers: { cookie },
    });

    expect(response.statusCode).toBe(403);
  });

  it("returns salesperson report to manager", async () => {
    const { cookie, response: loginResponse } = await loginAs(app, "manager@marpex.sk", "manager123", "127.0.0.81");
    expect(loginResponse.statusCode).toBe(200);

    const response = await app.inject({
      method: "GET",
      url: "/api/report/salesperson",
      headers: { cookie },
    });

    expect(response.statusCode).toBe(200);
    const rows = response.json();
    expect(rows.length).toBeGreaterThanOrEqual(3);
    expect(rows.some((row: { email: string; visitCount: number; weightedPipeline: number }) => row.email === "manager@marpex.sk")).toBe(true);
  });

  it("rejects visit creation without opportunity type when opportunity was created", async () => {
    const { cookie } = await loginAs(app, "manager@marpex.sk", "manager123", "127.0.0.80");
    const customersResponse = await app.inject({
      method: "GET",
      url: "/api/customers",
      headers: { cookie },
    });
    const [customer] = customersResponse.json();

    const contactsResponse = await app.inject({
      method: "GET",
      url: `/api/customers/${customer.id}/contacts`,
      headers: { cookie },
    });
    const [contact] = contactsResponse.json();

    const response = await app.inject({
      method: "POST",
      url: "/api/visits",
      headers: { cookie },
      payload: {
        date: "2026-04-19",
        customerId: customer.id,
        contactId: contact.id,
        visitGoal: "Test validácie",
        result: "Bez záznamu typu",
        customerNeed: "Potrebuje servis",
        opportunityCreated: true,
        potentialEur: 1500,
        competition: "Iný dodávateľ",
        nextStep: "Ozvať sa budúci týždeň",
        nextStepDeadline: "2026-04-25",
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: "Validation error",
      details: {
        opportunityType: [
          "Pri vzniknutej príležitosti vyberte typ (projekt / servis / cross-sell)",
        ],
      },
    });
  });

  it("creates and filters visits including late flag and date range", async () => {
    const manager = await getUserByEmail("manager@marpex.sk");
    const customer = await createTestCustomer();
    const contact = await createTestContact(customer.id);
    const { cookie } = await loginAs(app, "manager@marpex.sk", "manager123", "127.0.0.82");

    const createResponse = await app.inject({
      method: "POST",
      url: "/api/visits",
      headers: { cookie },
      payload: {
        date: "2026-04-01",
        customerId: customer.id,
        contactId: contact.id,
        visitGoal: "Filter test",
        result: "Visit created",
        customerNeed: "Need coverage",
        opportunityCreated: true,
        opportunityType: "service",
        potentialEur: 3200,
        competition: "Competitor",
        nextStep: "Send offer",
        nextStepDeadline: "2026-04-10",
      },
    });

    expect(createResponse.statusCode).toBe(201);
    const created = createResponse.json();
    expect(created.lateFlag).toBe(true);

    const listResponse = await app.inject({
      method: "GET",
      url: `/api/visits?customerId=${customer.id}&ownerId=${manager.id}&late=true&from=2026-04-01&to=2026-04-30`,
      headers: { cookie },
    });
    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json().some((visit: { id: string }) => visit.id === created.id)).toBe(true);

    const singleResponse = await app.inject({
      method: "GET",
      url: `/api/visits/${created.id}`,
      headers: { cookie },
    });
    expect(singleResponse.statusCode).toBe(200);
    expect(singleResponse.json()).toMatchObject({
      id: created.id,
      customerId: customer.id,
      contactId: contact.id,
      opportunityType: "service",
      ownerId: manager.id,
      lateFlag: true,
    });
  });

  it("creates, filters, updates and expands customer detail resources", async () => {
    const manager = await getUserByEmail("manager@marpex.sk");
    const { cookie } = await loginAs(app, "manager@marpex.sk", "manager123", "127.0.0.86");
    const currentYear = new Date().getFullYear();

    const createResponse = await app.inject({
      method: "POST",
      url: "/api/customers",
      headers: { cookie },
      payload: {
        name: "Phase5 Customer CRUD",
        segment: "integrator",
        industry: "oem",
        ico: "44556677",
        dic: "2023001122",
        icDph: "SK2023001122",
        address: "Priemyselna 12",
        city: "Nitra",
        postalCode: "949 01",
        district: "Nitra",
        region: "Nitriansky",
        currentRevenue: 120000,
        profit: 18000,
        potential: 280000,
        shareOfWallet: 35,
        strategicCategory: "B",
      },
    });
    expect(createResponse.statusCode).toBe(201);
    const customer = createResponse.json();

    const [{ db }, { abraRevenues }] = await Promise.all([
      import("../../06_IMPLEMENTATION/apps/api/src/db/index.ts"),
      import("../../06_IMPLEMENTATION/apps/api/src/db/schema.ts"),
    ]);

    await db.insert(abraRevenues).values([
      {
        customerId: customer.id,
        year: currentYear,
        totalAmount: "125000.50",
        invoiceCount: 4,
      },
      {
        customerId: customer.id,
        year: currentYear - 1,
        totalAmount: "83000.25",
        invoiceCount: 3,
      },
    ]);

    const contactResponse = await app.inject({
      method: "POST",
      url: `/api/customers/${customer.id}/contacts`,
      headers: { cookie },
      payload: {
        firstName: "Phase5",
        lastName: "Contact",
        role: "decision_maker",
        email: "phase5-customer@example.test",
      },
    });
    expect(contactResponse.statusCode).toBe(201);
    const contact = contactResponse.json();

    const visit = await createTestVisit({
      customerId: customer.id,
      contactId: contact.id,
      ownerId: manager.id,
      date: "2026-04-15",
      nextStepDeadline: "2026-04-20",
      opportunityCreated: false,
      lateFlag: false,
    });
    const opportunity = await createTestOpportunity({
      customerId: customer.id,
      ownerId: manager.id,
      title: "Phase5 Customer Opportunity",
      stage: "qualified",
      value: "54321",
      nextStepDeadline: "2026-04-28",
    });

    const listResponse = await app.inject({
      method: "GET",
      url: "/api/customers?q=Phase5%20Customer&segment=integrator&industry=oem&category=B",
      headers: { cookie },
    });
    expect(listResponse.statusCode).toBe(200);
    const listedCustomer = listResponse
      .json()
      .find((row: { id: string }) => row.id === customer.id);
    expect(listedCustomer).toMatchObject({
      id: customer.id,
      industry: "oem",
      ico: "44556677",
      city: "Nitra",
      region: "Nitriansky",
      profit: "18000.00",
      currentYearRevenue: "125000.50",
      previousYearRevenue: "83000.25",
    });

    const singleResponse = await app.inject({
      method: "GET",
      url: `/api/customers/${customer.id}`,
      headers: { cookie },
    });
    expect(singleResponse.statusCode).toBe(200);
    expect(singleResponse.json()).toMatchObject({
      name: "Phase5 Customer CRUD",
      segment: "integrator",
      industry: "oem",
      ico: "44556677",
      dic: "2023001122",
      icDph: "SK2023001122",
      address: "Priemyselna 12",
      city: "Nitra",
      postalCode: "949 01",
      district: "Nitra",
      region: "Nitriansky",
      profit: "18000.00",
      currentYearRevenue: "125000.50",
      previousYearRevenue: "83000.25",
    });

    const contactsResponse = await app.inject({
      method: "GET",
      url: `/api/customers/${customer.id}/contacts`,
      headers: { cookie },
    });
    expect(contactsResponse.statusCode).toBe(200);
    expect(contactsResponse.json()).toHaveLength(1);

    const patchResponse = await app.inject({
      method: "PATCH",
      url: `/api/customers/${customer.id}`,
      headers: { cookie },
      payload: {
        name: "Phase5 Customer Updated",
        city: "Zilina",
        profit: 19500,
        potential: 300000,
        strategicCategory: "A",
      },
    });
    expect(patchResponse.statusCode).toBe(200);
    expect(patchResponse.json()).toMatchObject({
      name: "Phase5 Customer Updated",
      city: "Zilina",
      profit: "19500.00",
      strategicCategory: "A",
    });

    const visitsResponse = await app.inject({
      method: "GET",
      url: `/api/customers/${customer.id}/visits`,
      headers: { cookie },
    });
    expect(visitsResponse.statusCode).toBe(200);
    expect(visitsResponse.json().map((row: { id: string }) => row.id)).toContain(visit.id);

    const oppsResponse = await app.inject({
      method: "GET",
      url: `/api/customers/${customer.id}/opportunities`,
      headers: { cookie },
    });
    expect(oppsResponse.statusCode).toBe(200);
    expect(oppsResponse.json().map((row: { id: string }) => row.id)).toContain(opportunity.id);

    const missingCustomer = await app.inject({
      method: "GET",
      url: "/api/customers/00000000-0000-4000-8000-000000000002",
      headers: { cookie },
    });
    expect(missingCustomer.statusCode).toBe(404);

    const missingCustomerVisits = await app.inject({
      method: "GET",
      url: "/api/customers/00000000-0000-4000-8000-000000000002/visits",
      headers: { cookie },
    });
    expect(missingCustomerVisits.statusCode).toBe(404);

    const missingCustomerOpps = await app.inject({
      method: "GET",
      url: "/api/customers/00000000-0000-4000-8000-000000000002/opportunities",
      headers: { cookie },
    });
    expect(missingCustomerOpps.statusCode).toBe(404);
  });

  it("creates opportunities, validates gated transitions and returns history", async () => {
    const { cookie } = await loginAs(app, "manager@marpex.sk", "manager123", "127.0.0.87");
    const customer = await createTestCustomer({ name: "Phase5 Opportunity Customer" });

    const createResponse = await app.inject({
      method: "POST",
      url: "/api/opportunities",
      headers: { cookie },
      payload: {
        title: "Phase5 Opportunity CRUD",
        customerId: customer.id,
        value: 25000,
        stage: "qualified",
        nextStepSummary: "Follow-up call",
        nextStepDeadline: "2026-05-01",
      },
    });
    expect(createResponse.statusCode).toBe(201);
    const opportunity = createResponse.json();

    const listResponse = await app.inject({
      method: "GET",
      url: "/api/opportunities",
      headers: { cookie },
    });
    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json().some((row: { id: string }) => row.id === opportunity.id)).toBe(true);

    const singleResponse = await app.inject({
      method: "GET",
      url: `/api/opportunities/${opportunity.id}`,
      headers: { cookie },
    });
    expect(singleResponse.statusCode).toBe(200);
    expect(singleResponse.json()).toMatchObject({ title: "Phase5 Opportunity CRUD", stage: "qualified" });

    const invalidTransition = await app.inject({
      method: "PATCH",
      url: `/api/opportunities/${opportunity.id}/stage`,
      headers: { cookie },
      payload: { stage: "identified_need" },
    });
    expect(invalidTransition.statusCode).toBe(400);

    const missingGate = await app.inject({
      method: "PATCH",
      url: `/api/opportunities/${opportunity.id}/stage`,
      headers: { cookie },
      payload: { stage: "quote_delivered" },
    });
    expect(missingGate.statusCode).toBe(400);

    const quoteTransition = await app.inject({
      method: "PATCH",
      url: `/api/opportunities/${opportunity.id}/stage`,
      headers: { cookie },
      payload: {
        stage: "quote_delivered",
        technicalSpec: "Full scope",
        competition: "Competitor",
        followUpDate: "2026-05-03",
      },
    });
    expect(quoteTransition.statusCode).toBe(200);

    const lostTransition = await app.inject({
      method: "PATCH",
      url: `/api/opportunities/${opportunity.id}/stage`,
      headers: { cookie },
      payload: {
        stage: "lost",
        lostReason: "Budget",
        closeResult: "Lost after quotation",
      },
    });
    expect(lostTransition.statusCode).toBe(200);

    const wonSeed = await app.inject({
      method: "POST",
      url: "/api/opportunities",
      headers: { cookie },
      payload: {
        title: "Phase5 Won Opportunity",
        customerId: customer.id,
        value: 50000,
        stage: "verbal_confirmed",
        nextStepSummary: "Close the deal",
        nextStepDeadline: "2026-05-02",
      },
    });
    expect(wonSeed.statusCode).toBe(201);
    const wonOpportunity = wonSeed.json();

    const wonTransition = await app.inject({
      method: "PATCH",
      url: `/api/opportunities/${wonOpportunity.id}/stage`,
      headers: { cookie },
      payload: {
        stage: "won",
        closeResult: "Signed",
        closeTimestamp: "2026-05-04T08:30:00.000Z",
      },
    });
    expect(wonTransition.statusCode).toBe(200);

    const historyResponse = await app.inject({
      method: "GET",
      url: `/api/opportunities/${opportunity.id}/history`,
      headers: { cookie },
    });
    expect(historyResponse.statusCode).toBe(200);
    expect(historyResponse.json().map((row: { toStage: string }) => row.toStage)).toEqual([
      "qualified",
      "quote_delivered",
      "lost",
    ]);

    const missingOpportunity = await app.inject({
      method: "GET",
      url: "/api/opportunities/00000000-0000-4000-8000-000000000003",
      headers: { cookie },
    });
    expect(missingOpportunity.statusCode).toBe(404);

    const missingOpportunityPatch = await app.inject({
      method: "PATCH",
      url: "/api/opportunities/00000000-0000-4000-8000-000000000003/stage",
      headers: { cookie },
      payload: {
        stage: "lost",
        lostReason: "N/A",
        closeResult: "N/A",
      },
    });
    expect(missingOpportunityPatch.statusCode).toBe(404);
  });

  it("validates import content type and payload", async () => {
    const { cookie } = await loginAs(app, "manager@marpex.sk", "manager123", "127.0.0.88");

    const wrongType = await app.inject({
      method: "POST",
      url: "/api/import/customers",
      headers: { cookie, "content-type": "application/json" },
      payload: JSON.stringify({}),
    });
    expect(wrongType.statusCode).toBe(415);

    const emptyBody = await app.inject({
      method: "POST",
      url: "/api/import/customers",
      headers: { cookie, "content-type": "text/csv" },
      payload: "",
    });
    expect(emptyBody.statusCode).toBe(400);

    const headerOnly = await app.inject({
      method: "POST",
      url: "/api/import/customers",
      headers: { cookie, "content-type": "text/csv" },
      payload: "name,segment,category",
    });
    expect(headerOnly.statusCode).toBe(400);
  });

  it("imports customers from CSV and reports row errors", async () => {
    const { cookie } = await loginAs(app, "manager@marpex.sk", "manager123", "127.0.0.89");
    const suffix = randomUUID().slice(0, 8);
    const validName = `Phase5 Import Alpha ${suffix}`;

    const csv = [
      "name,segment,category,currentRevenue,potential,contactFirstName,contactLastName,contactRole,contactEmail,contactPhone",
      `${validName},oem,A,120000,350000,Ján,Novák,decision_maker,alpha-${suffix}@example.test,0900123456`,
      `Phase5 Import Broken ${suffix},invalid,A,10,20,,,,,`,
      `Phase5 Import Beta ${suffix},vyroba,B,80000,200000,Petra,Kováčová,influencer,beta-${suffix}@example.test,`,
    ].join("\n");

    const response = await app.inject({
      method: "POST",
      url: "/api/import/customers",
      headers: { cookie, "content-type": "text/csv" },
      payload: csv,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      total: 3,
      imported: 2,
      errors: 1,
    });
    expect(response.json().errorReport[0]).toContain("Riadok 3");

    const listResponse = await app.inject({
      method: "GET",
      url: `/api/customers?q=${encodeURIComponent(validName)}`,
      headers: { cookie },
    });
    expect(listResponse.statusCode).toBe(200);

    const importedCustomer = listResponse.json().find((row: { name: string }) => row.name === validName);
    expect(importedCustomer).toBeTruthy();

    const contactsResponse = await app.inject({
      method: "GET",
      url: `/api/customers/${importedCustomer.id}/contacts`,
      headers: { cookie },
    });
    expect(contactsResponse.statusCode).toBe(200);
    expect(contactsResponse.json()[0]).toMatchObject({
      firstName: "Ján",
      lastName: "Novák",
      role: "decision_maker",
    });
  });

  it("manages users as manager and enforces access rules", async () => {
    const { cookie: managerCookie } = await loginAs(app, "manager@marpex.sk", "manager123", "127.0.0.90");
    const manager = await getUserByEmail("manager@marpex.sk");
    const salesLogin = await loginAs(app, "obchodnik1@marpex.sk", "sales123", "127.0.0.91");
    const suffix = randomUUID().slice(0, 8);
    const email = `phase5-user-${suffix}@example.test`;

    const salesList = await app.inject({
      method: "GET",
      url: "/api/users",
      headers: { cookie: salesLogin.cookie },
    });
    expect(salesList.statusCode).toBe(403);

    const createResponse = await app.inject({
      method: "POST",
      url: "/api/users",
      headers: { cookie: managerCookie },
      payload: {
        name: `Phase5 User ${suffix}`,
        email,
        password: "phase5pass",
        role: "sales",
      },
    });
    expect(createResponse.statusCode).toBe(201);
    const created = createResponse.json();

    const listResponse = await app.inject({
      method: "GET",
      url: "/api/users",
      headers: { cookie: managerCookie },
    });
    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json().some((row: { email: string }) => row.email === email)).toBe(true);

    const promoteResponse = await app.inject({
      method: "PATCH",
      url: `/api/users/${created.id}`,
      headers: { cookie: managerCookie },
      payload: { role: "manager", name: `Phase5 User Updated ${suffix}` },
    });
    expect(promoteResponse.statusCode).toBe(200);
    expect(promoteResponse.json()).toMatchObject({ role: "manager", name: `Phase5 User Updated ${suffix}` });

    const deactivateResponse = await app.inject({
      method: "PATCH",
      url: `/api/users/${created.id}`,
      headers: { cookie: managerCookie },
      payload: { active: false },
    });
    expect(deactivateResponse.statusCode).toBe(200);
    expect(deactivateResponse.json()).toMatchObject({ active: false });

    const selfDeactivate = await app.inject({
      method: "PATCH",
      url: `/api/users/${manager.id}`,
      headers: { cookie: managerCookie },
      payload: { active: false },
    });
    expect(selfDeactivate.statusCode).toBe(400);

    const missingUser = await app.inject({
      method: "PATCH",
      url: "/api/users/00000000-0000-4000-8000-000000000004",
      headers: { cookie: managerCookie },
      payload: { active: false },
    });
    expect(missingUser.statusCode).toBe(404);
  });

  it("creates, filters, completes and deletes tasks", async () => {
    const { cookie } = await loginAs(app, "manager@marpex.sk", "manager123", "127.0.0.92");
    const manager = await getUserByEmail("manager@marpex.sk");
    const customer = await createTestCustomer({ name: `Phase5 Task Customer ${randomUUID().slice(0, 6)}` });
    const opportunity = await createTestOpportunity({
      customerId: customer.id,
      ownerId: manager.id,
      title: `Phase5 Task Opp ${randomUUID().slice(0, 6)}`,
      stage: "qualified",
      value: "23000",
      nextStepDeadline: "2026-05-12",
    });

    const oppTaskResponse = await app.inject({
      method: "POST",
      url: "/api/tasks",
      headers: { cookie },
      payload: {
        title: "Phase5 Opportunity Task",
        description: "Task linked to opportunity",
        dueDate: "2026-05-10",
        opportunityId: opportunity.id,
      },
    });
    expect(oppTaskResponse.statusCode).toBe(201);
    const oppTask = oppTaskResponse.json();

    const customerTaskResponse = await app.inject({
      method: "POST",
      url: "/api/tasks",
      headers: { cookie },
      payload: {
        title: "Phase5 Customer Task",
        dueDate: "2026-05-11",
        customerId: customer.id,
      },
    });
    expect(customerTaskResponse.statusCode).toBe(201);
    const customerTask = customerTaskResponse.json();

    const oppList = await app.inject({
      method: "GET",
      url: `/api/tasks?opportunityId=${opportunity.id}&done=false`,
      headers: { cookie },
    });
    expect(oppList.statusCode).toBe(200);
    expect(oppList.json().map((row: { id: string }) => row.id)).toContain(oppTask.id);

    const customerList = await app.inject({
      method: "GET",
      url: `/api/tasks?customerId=${customer.id}&done=false`,
      headers: { cookie },
    });
    expect(customerList.statusCode).toBe(200);
    expect(customerList.json().map((row: { id: string }) => row.id)).toContain(customerTask.id);

    const completeResponse = await app.inject({
      method: "PATCH",
      url: `/api/tasks/${oppTask.id}/complete`,
      headers: { cookie },
      payload: {},
    });
    expect(completeResponse.statusCode).toBe(200);
    expect(completeResponse.json().completedAt).toBeTruthy();

    const doneList = await app.inject({
      method: "GET",
      url: `/api/tasks?opportunityId=${opportunity.id}&done=true`,
      headers: { cookie },
    });
    expect(doneList.statusCode).toBe(200);
    expect(doneList.json().map((row: { id: string }) => row.id)).toContain(oppTask.id);

    const reopenResponse = await app.inject({
      method: "PATCH",
      url: `/api/tasks/${oppTask.id}/complete`,
      headers: { cookie },
      payload: { completed: false },
    });
    expect(reopenResponse.statusCode).toBe(200);
    expect(reopenResponse.json().completedAt).toBeNull();

    const reopenedList = await app.inject({
      method: "GET",
      url: `/api/tasks?opportunityId=${opportunity.id}&done=false`,
      headers: { cookie },
    });
    expect(reopenedList.statusCode).toBe(200);
    expect(reopenedList.json().map((row: { id: string }) => row.id)).toContain(oppTask.id);

    const deleteResponse = await app.inject({
      method: "DELETE",
      url: `/api/tasks/${customerTask.id}`,
      headers: { cookie },
    });
    expect(deleteResponse.statusCode).toBe(204);

    const missingDelete = await app.inject({
      method: "DELETE",
      url: "/api/tasks/00000000-0000-4000-8000-000000000005",
      headers: { cookie },
    });
    expect(missingDelete.statusCode).toBe(404);
  });

  it("rejects mismatched contact/customer pair and returns 404 for missing visit", async () => {
    const { cookie } = await loginAs(app, "manager@marpex.sk", "manager123", "127.0.0.85");
    const customerA = await createTestCustomer({ name: "Phase5 Customer A" });
    const customerB = await createTestCustomer({ name: "Phase5 Customer B" });
    const contactA = await createTestContact(customerA.id);

    const mismatchResponse = await app.inject({
      method: "POST",
      url: "/api/visits",
      headers: { cookie },
      payload: {
        date: "2026-04-19",
        customerId: customerB.id,
        contactId: contactA.id,
        visitGoal: "Mismatch test",
        result: "Should fail",
        customerNeed: "Need mismatch check",
        opportunityCreated: false,
        potentialEur: 100,
        competition: "None",
        nextStep: "N/A",
        nextStepDeadline: "2026-04-25",
      },
    });

    expect(mismatchResponse.statusCode).toBe(400);
    expect(mismatchResponse.json()).toMatchObject({ error: "Kontakt nepatrí k vybranému zákazníkovi" });

    const missingResponse = await app.inject({
      method: "GET",
      url: "/api/visits/00000000-0000-4000-8000-000000000001",
      headers: { cookie },
    });

    expect(missingResponse.statusCode).toBe(404);
  });

  it("computes coverage, cross-sell and stagnant dashboard metrics from fixtures", async () => {
    process.env.ANNUAL_REVENUE_TARGET_EUR = "100000";

    const manager = await getUserByEmail("manager@marpex.sk");
    const customer = await createTestCustomer({
      name: "Phase5 Dashboard Customer",
      currentRevenue: "50000",
      potential: "750000",
    });
    const contact = await createTestContact(customer.id);
    await createTestVisit({
      customerId: customer.id,
      contactId: contact.id,
      ownerId: manager.id,
      date: "2026-04-10",
      nextStepDeadline: "2026-04-12",
      opportunityCreated: true,
      opportunityType: "cross_sell",
      potentialEur: "25000",
      lateFlag: true,
    });
    await createTestVisit({
      customerId: customer.id,
      contactId: contact.id,
      ownerId: manager.id,
      date: "2026-04-15",
      nextStepDeadline: "2026-04-20",
      opportunityCreated: true,
      opportunityType: "project",
      potentialEur: "80000",
    });
    await createTestOpportunity({
      customerId: customer.id,
      ownerId: manager.id,
      title: "Phase5 Weighted Open",
      value: "400000",
      stage: "qualified",
      nextStepDeadline: "2026-04-25",
    });
    await createTestOpportunity({
      customerId: customer.id,
      ownerId: manager.id,
      title: "Phase5 Stagnant Top Deal",
      value: "900000",
      stage: "technical_solution",
      nextStepDeadline: "2026-04-05",
      lastActivityAt: new Date("2026-02-01T12:00:00.000Z"),
    });
    await createTestOpportunity({
      customerId: customer.id,
      ownerId: manager.id,
      title: "Phase5 Lost Deal",
      value: "120000",
      stage: "lost",
      closeResult: "Lost by test",
      closeTimestamp: new Date("2026-04-12T10:00:00.000Z"),
      lostReason: "Phase5 lost reason",
    });

    const { cookie } = await loginAs(app, "manager@marpex.sk", "manager123", "127.0.0.83");
    const response = await app.inject({
      method: "GET",
      url: "/api/dashboard",
      headers: { cookie },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.coverageRatio).toBeGreaterThan(10);
    expect(body.crossSellRate).toBeGreaterThan(0);
    expect(body.lostReasons["Phase5 lost reason"]).toBe(1);
    expect(body.semaphore).not.toBe("OK");
    expect(body.top10[0]).toMatchObject({
      title: "Phase5 Stagnant Top Deal",
      customerName: "Phase5 Dashboard Customer",
      stagnant: true,
    });
  });
});