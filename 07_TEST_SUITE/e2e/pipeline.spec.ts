import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { createTestCustomer, createTestOpportunity, cleanupTestData, getUserByEmail } from "../helpers/fixtures.ts";
import { loginAsManager } from "./helpers/auth.ts";
import { dragAndDropHtml5 } from "./helpers/dnd.ts";

test.afterEach(async () => {
  await cleanupTestData();
});

test("drag and drop presunie opportunity do ďalšej fázy", async ({ page }) => {
  const manager = await getUserByEmail("manager@marpex.sk");
  const customer = await createTestCustomer({ name: `Phase5 DnD ${randomUUID().slice(0, 6)}` });
  const title = `DnD Opportunity ${randomUUID().slice(0, 6)}`;

  await createTestOpportunity({
    customerId: customer.id,
    ownerId: manager.id,
    title,
    stage: "identified_need",
    value: "45000",
    nextStepDeadline: "2026-04-30",
  });

  await loginAsManager(page);
  await page.getByRole("link", { name: "Pipeline" }).click();
  await expect(page.getByRole("heading", { name: "Pipeline" })).toBeVisible();

  const source = page.locator('[data-testid="pipeline-stage-identified_need"]').getByText(title);
  const target = page.locator('[data-testid="pipeline-stage-qualified"]');
  await dragAndDropHtml5(page, source, target);

  await expect(page.locator('[data-testid="pipeline-stage-qualified"]')).toContainText(title);

  const response = await page.context().request.get("/api/opportunities");
  const opportunities = await response.json();
  const moved = opportunities.find((opportunity: { title: string; stage: string }) => opportunity.title === title);
  expect(moved.stage).toBe("qualified");
});

test("drag v strede pipeline presunie kartu do ďalšej open fázy", async ({ page }) => {
  const manager = await getUserByEmail("manager@marpex.sk");
  const customer = await createTestCustomer({ name: `Phase5 Mid ${randomUUID().slice(0, 6)}` });
  const title = `Mid Pipeline ${randomUUID().slice(0, 6)}`;

  await createTestOpportunity({
    customerId: customer.id,
    ownerId: manager.id,
    title,
    stage: "qualified",
    value: "62000",
    nextStepDeadline: "2026-05-02",
  });

  await loginAsManager(page);
  await page.getByRole("link", { name: "Pipeline" }).click();
  await expect(page.getByRole("heading", { name: "Pipeline" })).toBeVisible();

  const source = page.locator('[data-testid="pipeline-stage-qualified"]').getByText(title);
  const target = page.locator('[data-testid="pipeline-stage-technical_solution"]');
  await dragAndDropHtml5(page, source, target);

  await expect(page.locator('[data-testid="pipeline-stage-technical_solution"]')).toContainText(title);

  const response = await page.context().request.get("/api/opportunities");
  const opportunities = await response.json();
  const moved = opportunities.find((opportunity: { title: string; stage: string }) => opportunity.title === title);
  expect(moved.stage).toBe("technical_solution");
});

test("dashboard označí stagnujúcu príležitosť v top deals", async ({ page }) => {
  const manager = await getUserByEmail("manager@marpex.sk");
  const customer = await createTestCustomer({ name: `Phase5 Stagnation ${randomUUID().slice(0, 6)}` });
  const title = `Stagnant Deal ${randomUUID().slice(0, 6)}`;

  await createTestOpportunity({
    customerId: customer.id,
    ownerId: manager.id,
    title,
    stage: "technical_solution",
    value: "999999",
    nextStepDeadline: "2026-03-10",
    lastActivityAt: new Date("2026-02-01T09:00:00.000Z"),
  });

  await loginAsManager(page);

  const row = page.locator("tr", { hasText: title });
  await expect(row).toBeVisible();
  await expect(row).toHaveClass(/bg-red-50/);
});