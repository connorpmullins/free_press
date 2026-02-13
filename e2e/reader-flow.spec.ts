import { test, expect } from "@playwright/test";
import { loginAsReader } from "./helpers/auth";

// ============================================================
// Flow 1: Public Smoke Test
// ============================================================

test.describe("Flow 1: Public Smoke Test", () => {
  test("homepage renders with nav and CTAs", async ({ page }) => {
    await page.goto("/");
    // Header nav items
    await expect(page.getByRole("link", { name: /feed/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /search/i }).first()).toBeVisible();
    // Hero / CTA content
    await expect(page.locator("body")).toContainText(/free press/i);
  });

  test("/terms renders content", async ({ page }) => {
    await page.goto("/terms");
    await expect(page.getByRole("heading", { name: /terms of service/i })).toBeVisible();
    await expect(page.locator("body")).toContainText(/account/i);
  });

  test("/privacy renders content", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByRole("heading", { name: /privacy policy/i })).toBeVisible();
    await expect(page.locator("body")).toContainText(/data/i);
  });

  test("/transparency renders content", async ({ page }) => {
    await page.goto("/transparency");
    await expect(page.getByRole("heading", { name: /transparency/i })).toBeVisible();
    await expect(page.locator("body")).toContainText(/moderation/i);
  });

  test("/integrity renders content", async ({ page }) => {
    await page.goto("/integrity");
    await expect(page.getByRole("heading", { name: /integrity/i })).toBeVisible();
    await expect(page.locator("body")).toContainText(/source/i);
  });
});

// ============================================================
// Flow 2: Reader + Paywall + Subscribe
// ============================================================

test.describe("Flow 2: Reader Auth + Feed + Subscribe", () => {
  test("reader can log in and access feed", async ({ page }) => {
    await loginAsReader(page);
    await page.goto("/feed");
    await expect(page.getByRole("heading", { name: /feed/i })).toBeVisible();
  });

  test("reader can open an article from feed", async ({ page }) => {
    await loginAsReader(page);
    await page.goto("/feed");

    const articleLink = page.locator("a[href^='/article/']").first();
    await expect(articleLink).toBeVisible();
    await articleLink.click();

    // Article detail page should have a heading
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("subscribe page renders pricing cards", async ({ page }) => {
    await page.goto("/subscribe");
    await expect(page.locator("body")).toContainText(/subscribe/i);
    // Should show monthly/annual plans
    await expect(page.locator("body")).toContainText(/month/i);
  });

  test("subscribe API creates checkout session (or returns mock)", async ({ page }) => {
    await loginAsReader(page);

    const res = await page.request.post("/api/subscribe", {
      data: { plan: "monthly" },
    });

    // Should succeed (mock mode in dev) or return a checkout URL
    const body = await res.json();
    expect(res.status()).toBeLessThan(500);
    // In dev mode with Stripe configured, we get a URL; in mock mode, we get success
    if (res.ok()) {
      expect(body.data.url || body.data.mock).toBeTruthy();
    }
  });
});

// ============================================================
// Flow 7: Media in Articles
// ============================================================

test.describe("Flow 7: Media in Articles", () => {
  test("article with video embed renders iframe", async ({ page }) => {
    await loginAsReader(page);
    // This article has a videoEmbed node in its content
    await page.goto("/article/consolidated-petrochemicals-sabine-river-contamination");

    // Wait for article content to load
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Check for YouTube iframe
    const iframe = page.locator("iframe[src*='youtube.com/embed']");
    await expect(iframe).toBeVisible({ timeout: 10_000 });

    // Verify the iframe is within a responsive wrapper
    const wrapper = page.locator("div.aspect-video");
    await expect(wrapper).toBeVisible();
  });

  test("article with inline image renders img tag", async ({ page }) => {
    await loginAsReader(page);
    // This article has an image node in its content
    await page.goto("/article/amazon-warehouse-wage-theft-investigation");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Check for rendered image
    const img = page.locator("article img, .prose img").first();
    await expect(img).toBeVisible({ timeout: 10_000 });
  });

  test("feed shows 8+ published articles after expanded seeding", async ({ page }) => {
    await page.goto("/feed");
    await expect(page.getByRole("heading", { name: /feed/i })).toBeVisible();

    // Wait for at least 8 articles to render (async feed load)
    const articles = page.locator("article");
    await expect(articles.nth(7)).toBeVisible({ timeout: 10_000 });

    const count = await articles.count();
    expect(count).toBeGreaterThanOrEqual(8);
  });
});
