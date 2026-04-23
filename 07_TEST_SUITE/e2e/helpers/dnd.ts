import type { Locator, Page } from "@playwright/test";

export async function dragAndDropHtml5(page: Page, source: Locator, target: Locator) {
  await source.scrollIntoViewIfNeeded();
  await target.scrollIntoViewIfNeeded();

  const dataTransfer = await page.evaluateHandle(() => new DataTransfer());

  await source.dispatchEvent("dragstart", { dataTransfer });
  await target.dispatchEvent("dragenter", { dataTransfer });
  await target.dispatchEvent("dragover", { dataTransfer });
  await target.dispatchEvent("drop", { dataTransfer });
  await source.dispatchEvent("dragend", { dataTransfer });
}