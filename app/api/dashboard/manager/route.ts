// =============================================================================
// API: GET /api/dashboard/manager
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { UserRoleName } from "@/packages/shared/types";
import { bankingService } from "@/backend/services/banking.service";
import { requireRoles, jsonSuccess, handleError } from "@/app/api/_lib/helpers";

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireRoles(req, UserRoleName.MANAGER, UserRoleName.ADMIN);
    if (authResult instanceof NextResponse) return authResult;

    const [stats, pendingApprovals] = await Promise.all([
      bankingService.getAdminStats(),
      bankingService.getPendingApprovals(1, 10),
    ]);

    return jsonSuccess({ ...stats, pendingApprovals: pendingApprovals.transactions });
  } catch (error) {
    return handleError(error);
  }
}
