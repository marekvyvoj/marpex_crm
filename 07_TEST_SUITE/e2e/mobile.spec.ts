import { expect, test } from "@playwright/test";
import { loginAsManager } from "./helpers/auth.ts";

test.use({ viewport: { width: 390, height: 844 } });

test("mobile viewport zachová navigáciu a prístup k pipeline", async ({ page }) => {
  await loginAsManager(page);

  await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
  await page.getByRole("link", { name: "Pipeline" }).click();

  await expect(page.getByRole("heading", { name: "Pipeline" })).toBeVisible();
  await expect(page.getByRole("button", { name: "+ Nová príležitosť" })).toBeVisible();
});