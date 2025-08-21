import { test, expect } from "@playwright/test";

test("home abre sem erro", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/collab/i);
});
