import { test, expect } from "@playwright/test";

test("reader can access feed and open article detail", async ({ page }) => {
  await page.goto("/feed");
  await expect(page.getByRole("heading", { name: /feed/i })).toBeVisible();

  const articleLink = page.locator("a[href^='/article/']").first();
  await expect(articleLink).toBeVisible();
  await articleLink.click();

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
