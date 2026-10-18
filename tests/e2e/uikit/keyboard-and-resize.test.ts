import assert from "node:assert/strict";

import { expect, test } from "@playwright/test";

test("calendar arrow keys move focus to the next date", async ({ page }) => {
  await page.goto("/components/date");
  const calendar = page.locator('[data-slot="calendar"]').first();
  const firstDay = calendar.locator("button[data-day]").first();
  const nextDate = await calendar.locator("button[data-day]").nth(1).getAttribute("data-day");
  assert(nextDate !== null, "The next calendar day must have a date.");

  await firstDay.focus();
  await page.keyboard.press("ArrowRight");

  await expect(calendar.locator("button:focus")).toHaveAttribute("data-day", nextDate);
});

test("canceling a resize restores the body styles and stops dragging", async ({ page }) => {
  await page.goto("/components/disclosure");
  const handle = page.getByRole("separator", { name: "Resize documents" });
  await handle.scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    document.body.style.cursor = "crosshair";
    document.body.style.userSelect = "text";
  });
  const bounds = await handle.boundingBox();
  assert(bounds !== null, "The resize handle must be visible.");

  await page.mouse.move(bounds.x, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await page.mouse.move(bounds.x + 40, bounds.y + bounds.height / 2);
  await expect(page.locator("body")).toHaveCSS("cursor", "col-resize");

  await page.evaluate(() => window.dispatchEvent(new PointerEvent("pointercancel")));
  await expect(page.locator("body")).toHaveCSS("cursor", "crosshair");
  await expect(page.locator("body")).toHaveCSS("user-select", "text");
  const stoppedSize = await handle.getAttribute("aria-valuenow");
  assert(stoppedSize !== null, "The handle must expose the current panel size.");
  await page.mouse.move(bounds.x + 80, bounds.y + bounds.height / 2);
  await expect(handle).toHaveAttribute("aria-valuenow", stoppedSize);
  await page.mouse.up();
});
