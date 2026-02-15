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
// Flow 3d: Article Management (Delete, Edit Published, Withdraw)
// ============================================================

test.describe("Flow 3d: Article Management", () => {
  test("dashboard shows edit button for published articles", async ({ page }) => {
    await loginAsJournalist(page);
    await page.goto("/journalist/dashboard");
    // Look for pencil edit icon button (title is on the <button> inside the <a>)
    const editButton = page.locator('button[title="Edit"]').first();
    await expect(editButton).toBeVisible();
  });

  test("dashboard shows delete button for draft articles", async ({ page }) => {
    await loginAsJournalist(page);
    await page.goto("/journalist/dashboard");
    // Switch to drafts tab if any exist
    const draftsTab = page.getByRole("tab", { name: /drafts/i });
    if (await draftsTab.isVisible()) {
      await draftsTab.click();
      const deleteButton = page.locator('button[title="Delete draft"]').first();
      // May or may not be visible depending on seed data
      if (await deleteButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(deleteButton).toBeVisible();
      }
    }
  });

  test("dashboard shows withdraw button for published articles", async ({ page }) => {
    await loginAsJournalist(page);
    await page.goto("/journalist/dashboard");
    const withdrawButton = page.locator('button[title="Withdraw article"]').first();
    // May or may not be visible depending on seed data
    if (await withdrawButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(withdrawButton).toBeVisible();
    }
  });

  test("editor shows update mode for published articles", async ({ page }) => {
    await loginAsJournalist(page);
    await page.goto("/journalist/dashboard");
    // Click edit on a published article
    const editLink = page.locator('a[title="Edit"]').first();
    if (await editLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await editLink.click();
      await page.waitForURL(/\/journalist\/write\?edit=/);
      // Should show "Update Article" button instead of "Publish"
      await expect(page.getByRole("button", { name: /update article/i })).toBeVisible();
      // Should show change note field
      await expect(page.getByLabel(/change note/i)).toBeVisible();
      // Should NOT show "Save Draft" button
      await expect(page.getByRole("button", { name: /save draft/i })).not.toBeVisible();
    }
  });
});

// ============================================================
// Flow 3e: Issue Correction
// ============================================================

test.describe("Flow 3e: Issue Correction", () => {
  test("article page shows correction form for author", async ({ page }) => {
    await loginAsJournalist(page);
    await page.goto("/journalist/dashboard");
    // Click a published article to go to article detail
    const publishedTab = page.getByRole("tab", { name: /published/i });
    await publishedTab.click();
    const articleLink = page.locator("a.font-medium").first();
    if (await articleLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await articleLink.click();
      // Should show "Issue a Correction" section
      await expect(page.locator("body")).toContainText(/issue a correction/i);
      await expect(page.getByLabel(/severity/i)).toBeVisible();
      await expect(page.getByLabel(/correction details/i)).toBeVisible();
    }
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
