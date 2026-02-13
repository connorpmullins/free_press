import { successResponse } from "@/lib/api";

// GET /api/system/integrations - Non-secret integration readiness checks
export async function GET() {
  const readiness = {
    stripe: {
      configured: Boolean(process.env.STRIPE_SECRET_KEY),
    },
    resend: {
      configured: Boolean(process.env.RESEND_API_KEY),
      senderConfigured: Boolean(process.env.EMAIL_FROM),
    },
    redis: {
      configured: Boolean(process.env.REDIS_URL),
    },
    meilisearch: {
      configured: Boolean(process.env.MEILISEARCH_HOST),
      apiKeyConfigured: Boolean(process.env.MEILISEARCH_API_KEY),
    },
  };

  return successResponse(readiness);
}
