import { NextRequest } from "next/server";
import { createMagicLink } from "@/lib/auth";
import { sendMagicLinkEmail } from "@/lib/email";
import { loginSchema } from "@/lib/validations";
import { successResponse, handleApiError, getIpAddress } from "@/lib/api";
import { checkRateLimit } from "@/lib/redis";
import { auditLog } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = loginSchema.parse(body);

    // Rate limit: 5 login attempts per email per 15 minutes
    const rateLimitResult = await checkRateLimit(
      `login:${email}`,
      5,
      15 * 60
    );

    if (!rateLimitResult.allowed) {
      return successResponse(
        { message: "Check your email for a sign-in link" },
        200
      );
      // Don't reveal rate limiting - same response
    }

    // Create magic link
    const token = await createMagicLink(email);

    // Send email (don't let email failures block the response for security)
    try {
      await sendMagicLinkEmail(email, token);
    } catch (emailError) {
      console.error("Failed to send magic link email:", emailError);
      // Still return success to avoid revealing email sending status
    }

    await auditLog({
      action: "login_requested",
      entity: "User",
      details: { email },
      ipAddress: getIpAddress(request),
    });

    return successResponse({
      message: "Check your email for a sign-in link",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
