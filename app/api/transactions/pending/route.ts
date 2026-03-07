// =============================================================================
// API: GET /api/transactions/pending
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { bankingService } from "@/backend/services/banking.service";
import { UserRoleName } from "@/packages/shared/types";
import { requireRoles, parsePagination, jsonPaginated, handleError } from "@/app/api/_lib/helpers";

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireRoles(req, UserRoleName.MANAGER, UserRoleName.ADMIN);
    if (authResult instanceof NextResponse) return authResult;

    const { page, limit } = parsePagination(req.nextUrl.searchParams);
    const { transactions, total } = await bankingService.getPendingApprovals(page, limit);

    return jsonPaginated(transactions, { page, limit, total });
  } catch (error) {
    return handleError(error);
  }
}
