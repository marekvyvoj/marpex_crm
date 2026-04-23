import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { cleanupTestData, createTestCustomer, createTestOpportunity, getUserByEmail } from "../helpers/fixtures.ts";
import { loginAsManager } from "./helpers/auth.ts";
import { dragAndDropHtml5 } from "./helpers/dnd.ts";

test.afterEach(async () => {
  await cleanupTestData();
});

test("drag do gated stage otvorí detail s gate formulárom", async ({ page }) => {
  const manager = await getUserByEmail("manager@marpex.sk");
  const customer = await createTestCustomer({ name: `Phase5 Gate ${randomUUID().slice(0, 6)}` });
  const title = `Gate Opportunity ${randomUUID().slice(0, 6)}`;

  const opportunity = await createTestOpportunity({
    customerId: customer.id,
    ownerId: manager.id,
    title,
    stage: "technical_solution",
    value: "55000",
    nextStepDeadline: "2026-04-30",
  });

  await loginAsManager(page);
  await page.getByRole("link", { name: "Pipeline" }).click();

  const source = page.locator('[data-testid="pipeline-stage-technical_solution"]').getByText(title);
  const target = page.locator('[data-testid="pipeline-stage-quote_delivered"]');
  await dragAndDropHtml5(page, source, target);

  await expect(page).toHaveURL(new RegExp(`/pipeline/${opportunity.id}`));
  await expect(page.getByPlaceholder("Technická špecifikácia")).toBeVisible();
  await expect(page.getByPlaceholder("Konkurencia")).toBeVisible();
  await expect(page.getByLabel("Follow-up dátum")).toBeVisible();
});

test("detail príležitosti pokrýva task CRUD flow", async ({ page }) => {
  const manager = await getUserByEmail("manager@marpex.sk");
  const customer = await createTestCustomer({ name: `Phase5 Task ${randomUUID().slice(0, 6)}` });
  const title = `Task Opportunity ${randomUUID().slice(0, 6)}`;
  const taskTitle = `Follow-up ${randomUUID().slice(0, 5)}`;

  const opportunity = await createTestOpportunity({
    customerId: customer.id,
    ownerId: manager.id,
    title,
    stage: "qualified",
    value: "32000",
    nextStepDeadline: "2026-05-05",
  });

  await loginAsManager(page);
  await page.goto(`/pipeline/${opportunity.id}`);

  await expect(page.getByRole("heading", { name: title })).toBeVisible();

  await page.getByRole("button", { name: "+ Nová úloha" }).click();
  await page.getByPlaceholder("Popis úlohy").fill(taskTitle);
  await page.getByLabel("Termín úlohy").fill("2026-05-10");
  await page.getByRole("button", { name: "Uložiť" }).click();

  const taskRow = page.locator("li", { hasText: taskTitle });
  await expect(taskRow).toBeVisible();

  await taskRow.getByRole("checkbox").click();
  await expect(taskRow.getByRole("checkbox")).toBeChecked();

  await taskRow.getByRole("button", { name: `Zmazať úlohu ${taskTitle}` }).click();
  await page.reload();
  await expect(page.locator("li", { hasText: taskTitle })).toHaveCount(0);
});