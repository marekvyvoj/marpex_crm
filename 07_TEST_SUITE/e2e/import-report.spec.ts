import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import {
  cleanupTestData,
  createTestContact,
  createTestCustomer,
  createTestOpportunity,
  createTestVisit,
  getUserByEmail,
} from "../helpers/fixtures.ts";
import { loginAsManager } from "./helpers/auth.ts";

test.afterEach(async () => {
  await cleanupTestData();
});

test("manažér vykoná CSV import end-to-end", async ({ page }) => {
  const suffix = randomUUID().slice(0, 6);
  const importName = `Phase5 Import Alpha ${suffix}`;
  const csv = [
    "name,segment,category,currentRevenue,potential,contactFirstName,contactLastName,contactRole,contactEmail,contactPhone",
    `${importName},oem,A,120000,350000,Ján,Novák,decision_maker,alpha-${suffix}@example.test,0900123456`,
    `Phase5 Import Beta ${suffix},vyroba,B,80000,200000,Petra,Kováčová,influencer,beta-${suffix}@example.test,`,
  ].join("\n");

  await loginAsManager(page);
  await page.getByRole("link", { name: "Import" }).click();
  await expect(page.getByRole("heading", { name: "Import zákazníkov z CSV" })).toBeVisible();

  await page.getByPlaceholder("Vložte CSV obsah sem…").fill(csv);
  await expect(page.getByRole("cell", { name: importName })).toBeVisible();

  await page.getByRole("button", { name: "Spustiť import" }).click();
  await expect(page.getByText("Výsledok importu")).toBeVisible();
  await expect(page.getByText(/Importovaných:/)).toContainText("2");

  await page.getByRole("link", { name: "Zákazníci" }).click();
  await page.getByPlaceholder("Hľadať podľa názvu…").fill(importName);
  await expect(page.getByRole("link", { name: importName })).toBeVisible();
});

test("manažér vidí report obchodníkov s rizikovým obchodníkom", async ({ page }) => {
  const suffix = randomUUID().slice(0, 6);
  const sales = await getUserByEmail("obchodnik1@marpex.sk");
  const customer = await createTestCustomer({ name: `Phase5 Report ${suffix}` });
  const contact = await createTestContact(customer.id, {
    firstName: "Risk",
    lastName: `Kontakt ${suffix}`,
    role: "decision_maker",
    email: `risk-${suffix}@example.test`,
  });

  await createTestVisit({
    customerId: customer.id,
    contactId: contact.id,
    ownerId: sales.id,
    date: "2026-04-10",
    nextStepDeadline: "2026-04-11",
    visitGoal: "Risk report visit",
    result: "Vznikla nová príležitosť",
    customerNeed: "Cross-sell servis",
    opportunityCreated: true,
    opportunityType: "cross_sell",
    potentialEur: "15000",
    nextStep: "Uzavrieť scope",
    lateFlag: true,
  });

  await createTestOpportunity({
    customerId: customer.id,
    ownerId: sales.id,
    title: `Phase5 Risk Opp ${suffix}`,
    stage: "technical_solution",
    value: "50000",
    nextStepSummary: "Close scope",
    nextStepDeadline: "2026-04-05",
    lastActivityAt: new Date("2026-03-01T00:00:00.000Z"),
    stagnant: true,
  });

  await loginAsManager(page);
  await page.getByRole("link", { name: "Report" }).click();
  await expect(page.getByRole("heading", { name: "Report obchodníkov" })).toBeVisible();

  const salesRow = page.locator("tr").filter({ hasText: "obchodnik1@marpex.sk" });
  await expect(salesRow).toContainText(/POZOR|RIZIKO/);
  await expect(salesRow).toContainText("obchodnik1@marpex.sk");
});