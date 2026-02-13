import { test, expect } from "@playwright/test";

test("admin route redirects unauthenticated users to login", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/auth\/login/);
});
