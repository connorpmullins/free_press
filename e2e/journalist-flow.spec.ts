import { test, expect } from "@playwright/test";
import { loginAsJournalist } from "./helpers/auth";

// ============================================================
// Flow 3: Journalist Dashboard + Write Page
// ============================================================

test.describe("Flow 3: Journalist Dashboard + Write", () => {
  test("journalist can access dashboard", async ({ page }) => {
    await loginAsJournalist(page);
    await page.goto("/journalist/dashboard");
    // Should not redirect to login
    await expect(page).not.toHaveURL(/\/auth\/login/);
    // Dashboard heading or article list
    await expect(page.locator("body")).toContainText(/dashboard|articles/i);
  });

  test("journalist write page renders editor with media buttons", async ({ page }) => {
    await loginAsJournalist(page);
    await page.goto("/journalist/write");

    // Title input
    await expect(page.getByLabel(/title/i)).toBeVisible();
    // Summary input
    await expect(page.getByLabel(/summary/i)).toBeVisible();
    // Content editor area (Tiptap)
    await expect(page.locator("[contenteditable], .tiptap, .ProseMirror")).toBeVisible();
    // Source section
    await expect(page.locator("body")).toContainText(/source/i);
    // Action buttons
    await expect(page.getByRole("button", { name: /save draft/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /publish/i })).toBeVisible();
    // Media toolbar buttons
    await expect(page.getByTitle("Upload image")).toBeVisible();
    await expect(page.getByTitle("Embed video (YouTube/Vimeo)")).toBeVisible();
  });

  test("journalist can fill in article fields", async ({ page }) => {
    await loginAsJournalist(page);
    await page.goto("/journalist/write");

    await page.getByLabel(/title/i).fill("Test Article Title");
    await page.getByLabel(/summary/i).fill("A brief summary for testing");

    // Fill a source title
    const sourceTitleInput = page.locator('input[placeholder="Source title"]').first();
    if (await sourceTitleInput.isVisible()) {
      await sourceTitleInput.fill("Test Source");
    }

    // Verify values stuck
    await expect(page.getByLabel(/title/i)).toHaveValue("Test Article Title");
  });

  test("journalist revenue page loads", async ({ page }) => {
    await loginAsJournalist(page);
    await page.goto("/journalist/revenue");
    await expect(page).not.toHaveURL(/\/auth\/login/);
    await expect(page.getByRole("heading", { name: /revenue/i })).toBeVisible();
  });
});

// ============================================================
// Flow 4: Journalist Settings + Stripe Connect
// ============================================================

test.describe("Flow 4: Settings + Connect/Verification", () => {
  test("settings page loads for journalist", async ({ page }) => {
    await loginAsJournalist(page);
    await page.goto("/settings");
    await expect(page).not.toHaveURL(/\/auth\/login/);
    await expect(page.getByRole("heading", { name: /settings/i })).toBeVisible();
  });

  test("settings shows identity verification section", async ({ page }) => {
    await loginAsJournalist(page);
    await page.goto("/settings");
    await expect(page.locator("body")).toContainText(/identity verification/i);
  });

  test("settings shows payout / Connect section", async ({ page }) => {
    await loginAsJournalist(page);
    await page.goto("/settings");
    await expect(page.locator("body")).toContainText(/payout|connect/i);
  });

  test("POST /api/profile/connect returns success or 403 (unverified)", async ({ page }) => {
    await loginAsJournalist(page);
    const res = await page.request.post("/api/profile/connect");
    // 403 expected because seeded journalist may not be VERIFIED
    // (depends on seed state), or 200 if verified
    expect([200, 403, 503].includes(res.status())).toBeTruthy();
  });
});
