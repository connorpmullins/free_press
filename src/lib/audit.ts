import { db } from "./db";
import type { Prisma } from "@prisma/client";

export async function auditLog(params: {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        details: (params.details as Prisma.InputJsonValue) ?? undefined,
        ipAddress: params.ipAddress,
      },
    });
  } catch (error) {
    // Audit logging should never break the main flow
    console.error("Failed to write audit log:", error);
  }
}
