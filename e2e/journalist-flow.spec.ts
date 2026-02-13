import { test, expect } from "@playwright/test";

test("apply page loads and shows contributor flow", async ({ page }) => {
  await page.goto("/apply");
  await expect(page.getByRole("heading", { name: /become a contributor/i })).toBeVisible();
});
