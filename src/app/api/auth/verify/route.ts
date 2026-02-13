import { NextRequest } from "next/server";
import { verifyMagicLink, createSession, setSessionCookie } from "@/lib/auth";
import { handleApiError, getIpAddress, getUserAgent } from "@/lib/api";
import { auditLog } from "@/lib/audit";
import { redirect } from "next/navigation";

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return redirect("/auth/login?error=missing_token");
    }

    const user = await verifyMagicLink(token);

    if (!user) {
      return redirect("/auth/login?error=invalid_token");
    }

    // Create session
    const sessionToken = await createSession(
      user.id,
      getIpAddress(request),
      getUserAgent(request)
    );

    // Set session cookie
    await setSessionCookie(sessionToken);

    await auditLog({
      userId: user.id,
      action: "login_success",
      entity: "User",
      entityId: user.id,
      ipAddress: getIpAddress(request),
    });

    // Redirect based on role
    if (user.role === "ADMIN") {
      return redirect("/admin");
    } else if (user.role === "JOURNALIST") {
      return redirect("/journalist/dashboard");
    } else {
      return redirect("/feed");
    }
  } catch (error) {
    console.error("Verification error:", error);
    return redirect("/auth/login?error=verification_failed");
  }
}
