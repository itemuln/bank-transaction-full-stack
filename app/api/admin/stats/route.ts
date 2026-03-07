// =============================================================================
// API: GET /api/admin/stats
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { UserRoleName } from "@/packages/shared/types";
import { bankingService } from "@/backend/services/banking.service";
import { requireRoles, jsonSuccess, handleError } from "@/app/api/_lib/helpers";

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireRoles(req, UserRoleName.ADMIN);
    if (authResult instanceof NextResponse) return authResult;

    const stats = await bankingService.getAdminStats();
    return jsonSuccess(stats);
  } catch (error) {
    return handleError(error);
  }
}
