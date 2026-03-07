// =============================================================================
// API: GET /api/admin/audit-logs
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { UserRoleName } from "@/packages/shared/types";
import { auditLogRepository } from "@/backend/repositories/audit-log.repository";
import { requireRoles, parsePagination, jsonPaginated, handleError } from "@/app/api/_lib/helpers";

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireRoles(req, UserRoleName.MANAGER, UserRoleName.ADMIN);
    if (authResult instanceof NextResponse) return authResult;

    const { page, limit } = parsePagination(req.nextUrl.searchParams);
    const { logs, total } = await auditLogRepository.findAll(page, limit, {
      action: req.nextUrl.searchParams.get("action") || undefined,
      resource: req.nextUrl.searchParams.get("resource") || undefined,
      userId: req.nextUrl.searchParams.get("userId") || undefined,
    });

    const data = logs.map((log: { id: string; userId: string | null; user: { firstName: string; lastName: string } | null; action: string; resource: string; resourceId: string | null; ipAddress: string | null; createdAt: Date }) => ({
      id: log.id,
      userId: log.userId,
      userName: log.user ? `${log.user.firstName} ${log.user.lastName}` : null,
      action: log.action,
      resource: log.resource,
      resourceId: log.resourceId,
      ipAddress: log.ipAddress,
      createdAt: log.createdAt.toISOString(),
    }));

    return jsonPaginated(data, { page, limit, total });
  } catch (error) {
    return handleError(error);
  }
}
