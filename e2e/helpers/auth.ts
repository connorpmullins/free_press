import { Page, expect } from "@playwright/test";

/**
 * Log in as a test user by generating a magic link token
 * and navigating to the verification URL.
 */
export async function loginAs(page: Page, email: string): Promise<void> {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
  // Get a magic link token via the dev-only test endpoint
  const res = await page.request.post("/api/auth/login/test", {
    data: { email },
    // Middleware requires Origin/Referer for API mutations in production-mode deployments.
    headers: { Origin: baseURL },
  });

  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  const token = body.data.token;
  expect(token).toBeTruthy();

  // Navigate to verify endpoint to create session
  await page.goto(`/auth/verify?token=${token}`);

  // Wait for redirect to complete (verify sets cookie and redirects)
  await page.waitForURL((url) => !url.pathname.includes("/auth/verify"), {
    timeout: 10_000,
  });
}

/**
 * Log in as the seeded admin user.
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  await loginAs(page, "admin@warrant.ink");
}

/**
 * Log in as the seeded journalist user.
 */
export async function loginAsJournalist(page: Page): Promise<void> {
  await loginAs(page, "elena.vasquez@example.com");
}

/**
 * Log in as the seeded reader user.
 */
export async function loginAsReader(page: Page): Promise<void> {
  await loginAs(page, "reader@example.com");
}
