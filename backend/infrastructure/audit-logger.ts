// =============================================================================
// Audit Logger — Records all significant actions for compliance
// =============================================================================

import { prisma } from "../config/database";
import { Request } from "express";

interface AuditLogInput {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  req?: Request;
}

export async function createAuditLog(input: AuditLogInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        resource: input.resource,
        resourceId: input.resourceId ?? null,
        oldValue: input.oldValue ? JSON.parse(JSON.stringify(input.oldValue)) : undefined,
        newValue: input.newValue ? JSON.parse(JSON.stringify(input.newValue)) : undefined,
        ipAddress: input.req?.ip ?? input.req?.socket.remoteAddress ?? null,
        userAgent: input.req?.headers["user-agent"] ?? null,
      },
    });
  } catch (error) {
    // Audit logging should never crash the request
    console.error("[AUDIT_LOG_ERROR]", error);
  }
}
