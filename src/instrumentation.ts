/**
 * Next.js Instrumentation Hook
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 *
 * Runs once when the Next.js server starts (both dev and prod).
 * Used to initialize external services that the app depends on.
 *
 * Why here and not in a standalone script?
 *   - Runs automatically on every `next dev` / `next start`
 *   - Has access to all env vars that Next.js loads (.env, .env.local, etc.)
 *   - No manual steps required after Docker Compose / deploys
 *   - search:init script is no longer needed for normal operation
 */
export async function register() {
  // Only run on the server (Next.js calls register() for both edge + node runtimes)
  if (typeof window !== "undefined") return;

  // Initialize Meilisearch indexes with correct settings.
  // This is idempotent — safe to call on every startup.
  // If MEILISEARCH_HOST is not set, initializeSearchIndexes() is a no-op.
  try {
    const { initializeSearchIndexes } = await import("@/lib/search");
    await initializeSearchIndexes();
    if (process.env.MEILISEARCH_HOST) {
      console.log("✓ Meilisearch indexes initialized");
    }
  } catch (e) {
    // Search is non-critical — log and continue
    console.warn("⚠ Meilisearch initialization failed:", (e as Error).message);
  }
}
