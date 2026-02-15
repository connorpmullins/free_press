import type { NextConfig } from "next";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    // Throwing here fails `next build` loudly (Preview + Production on Vercel).
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Fail loudly at build time for required production integrations.
// Enforced for:
// - Vercel builds (Preview + Production)
// - local `next build` (NODE_ENV defaults to "production")
const isBuildLike = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
if (isBuildLike) {
  requireEnv("BLOB_READ_WRITE_TOKEN");
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
