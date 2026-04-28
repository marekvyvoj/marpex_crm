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

test("manažér prejde customer detail end-to-end", async ({ page }) => {
  const suffix = randomUUID().slice(0, 6);
  const manager = await getUserByEmail("manager@marpex.sk");
  const customer = await createTestCustomer({
    name: `Phase5 Customer Flow ${suffix}`,
    segment: "integrator",
    currentRevenue: "120000",
  });
  const contact = await createTestContact(customer.id, {
    firstName: "Eva",
    lastName: `Kontakt ${suffix}`,
    role: "decision_maker",
    email: `eva-${suffix}@example.test`,
  });

  await createTestVisit({
    customerId: customer.id,
    contactId: contact.id,
    ownerId: manager.id,
    date: "2026-04-15",
    nextStepDeadline: "2026-04-20",
    visitGoal: "Phase5 Visit Goal",
    result: "Phase5 Visit Result",
    customerNeed: "Potrebujú nový servisný kontrakt",
    opportunityCreated: false,
    potentialEur: "2500",
    nextStep: "Poslať ponuku",
    lateFlag: false,
  });

  const opportunity = await createTestOpportunity({
    customerId: customer.id,
    ownerId: manager.id,
    title: `Phase5 Opportunity ${suffix}`,
    stage: "qualified",
    value: "42000",
    nextStepSummary: "Follow-up call",
    nextStepDeadline: "2026-05-02",
  });

  await loginAsManager(page);
  await page.getByRole("link", { name: "Zákazníci" }).click();
  await page.getByPlaceholder("Hľadať podľa názvu…").fill(customer.name);
  await expect(page.getByRole("link", { name: customer.name })).toBeVisible();
  await page.getByRole("link", { name: customer.name }).click();

  await expect(page.getByRole("heading", { name: customer.name })).toBeVisible();

  const updatedName = `Phase5 Customer Updated ${suffix}`;
  await page.getByRole("button", { name: "Upraviť" }).click();
  await page.getByPlaceholder("Názov firmy").fill(updatedName);
  await page.getByRole("button", { name: "Uložiť" }).click();
  await expect(page.getByRole("heading", { name: updatedName })).toBeVisible();

  await page.getByRole("button", { name: "+ Nový kontakt" }).click();
  await page.getByPlaceholder("Meno").fill("Nový");
  await page.getByPlaceholder("Priezvisko").fill(`Kontakt ${suffix}`);
  await page.getByPlaceholder("Pozícia").fill("Nákup");
  await page.getByPlaceholder("Email").fill(`novy-${suffix}@example.test`);
  await page.getByPlaceholder("Telefón").fill("0900999888");
  await page.getByRole("button", { name: "Uložiť kontakt" }).click();
  await expect(page.getByText(`Nový Kontakt ${suffix}`)).toBeVisible();

  await page.getByRole("button", { name: "Návštevy" }).click();
  await expect(page.getByText("Phase5 Visit Goal")).toBeVisible();
  await expect(page.getByText("Phase5 Visit Result")).toBeVisible();

  await page.getByRole("button", { name: "Príležitosti" }).click();
  await expect(page.getByRole("link", { name: opportunity.title })).toBeVisible();
});