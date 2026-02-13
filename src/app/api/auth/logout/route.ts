import { destroySession, getSession } from "@/lib/auth";
import { successResponse, handleApiError } from "@/lib/api";
import { auditLog } from "@/lib/audit";

export async function POST() {
  try {
    const session = await getSession();

    if (session) {
      await auditLog({
        userId: session.user.id,
        action: "logout",
        entity: "User",
        entityId: session.user.id,
      });
    }

    await destroySession();
    return successResponse({ message: "Logged out" });
  } catch (error) {
    return handleApiError(error);
  }
}
