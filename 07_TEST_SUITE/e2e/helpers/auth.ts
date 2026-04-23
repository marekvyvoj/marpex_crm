import { expect, type Page } from "@playwright/test";

export async function loginAsManager(page: Page) {
  await page.goto("/login");
  await page.getByPlaceholder("Email").fill("manager@marpex.sk");
  await page.getByPlaceholder("Heslo").fill("manager123");
  await page.getByRole("button", { name: "Prihlásiť sa" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
}