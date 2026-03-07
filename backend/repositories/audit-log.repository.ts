// =============================================================================
// Audit Log Repository — Database access for audit trail
// =============================================================================

import { prisma } from "../config/database";

export class AuditLogRepository {
  async findAll(page: number, limit: number, filters?: { action?: string; resource?: string; userId?: string }) {
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (filters?.action) where.action = filters.action;
    if (filters?.resource) where.resource = filters.resource;
    if (filters?.userId) where.userId = filters.userId;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);
    return { logs, total };
  }
}

export const auditLogRepository = new AuditLogRepository();
