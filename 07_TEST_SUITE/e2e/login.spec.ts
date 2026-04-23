import { expect, test } from "@playwright/test";
import { loginAsManager } from "./helpers/auth.ts";

test("manager login opens dashboard", async ({ page }) => {
  await loginAsManager(page);
  await expect(page.getByText("Weighted pipeline")).toBeVisible();
});

test("visit form shows validation on empty submit", async ({ page }) => {
  await loginAsManager(page);

  await page.getByRole("link", { name: "Návštevy" }).click();
  await page.getByRole("button", { name: "+ Nová návšteva" }).click();
  await page.getByRole("button", { name: "Uložiť návštevu" }).click();

  await expect(page.getByText("Cieľ návštevy je povinný")).toBeVisible();
  await expect(page.getByText("Výsledok je povinný")).toBeVisible();
});