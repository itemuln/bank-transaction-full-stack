// =============================================================================
// API: GET /api/dashboard/customer
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { bankingService } from "@/backend/services/banking.service";
import { requireAuth, jsonSuccess, handleError } from "@/app/api/_lib/helpers";

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const data = await bankingService.getCustomerDashboard(authResult.userId);
    return jsonSuccess(data);
  } catch (error) {
    return handleError(error);
  }
}
