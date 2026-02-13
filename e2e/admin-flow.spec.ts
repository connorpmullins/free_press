import { test, expect } from "@playwright/test";
import { loginAsAdmin, loginAsReader } from "./helpers/auth";

// ============================================================
// Flow 5: Admin Dashboard + Flag Moderation
// ============================================================

test.describe("Flow 5: Admin Dashboard + Flags", () => {
  test("admin can access /admin dashboard", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin");
    await expect(page).not.toHaveURL(/\/auth\/login/);
    await expect(page.locator("body")).toContainText(/admin|dashboard/i);
  });

  test("admin flags page loads", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/flags");
    await expect(page).not.toHaveURL(/\/auth\/login/);
    await expect(page.getByRole("heading", { name: /flags/i })).toBeVisible();
  });

  test("admin flags API returns list", async ({ page }) => {
    await loginAsAdmin(page);
    const res = await page.request.get("/api/admin/flags?status=ALL");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.data.flags).toBeDefined();
    expect(body.data.pagination).toBeDefined();
  });

  test("admin disputes page loads", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/disputes");
    await expect(page).not.toHaveURL(/\/auth\/login/);
  });
});

// ============================================================
// Flow 6: Access Control Sanity
// ============================================================

test.describe("Flow 6: Access Control", () => {
  test("unauthenticated user is redirected from /journalist/dashboard", async ({ page }) => {
    await page.goto("/journalist/dashboard");
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("unauthenticated user is redirected from /journalist/write", async ({ page }) => {
    await page.goto("/journalist/write");
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("unauthenticated user is redirected from /admin", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("unauthenticated user is redirected from /admin/flags", async ({ page }) => {
    await page.goto("/admin/flags");
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("unauthenticated user is redirected from /settings", async ({ page }) => {
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("unauthenticated user is redirected from /bookmarks", async ({ page }) => {
    await page.goto("/bookmarks");
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("protected API returns 401 for unauthenticated requests", async ({ page }) => {
    const res = await page.request.get("/api/bookmarks");
    expect(res.status()).toBe(401);
  });

  test("reader cannot access admin API", async ({ page }) => {
    await loginAsReader(page);
    const res = await page.request.get("/api/admin/flags");
    // Should get 401 or 403 (role check in route handler)
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });
});
