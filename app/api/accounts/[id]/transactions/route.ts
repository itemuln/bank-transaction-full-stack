// =============================================================================
// API: GET /api/accounts/[id]/transactions
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { bankingService } from "@/backend/services/banking.service";
import { requireAuth, parsePagination, jsonPaginated, handleError } from "@/app/api/_lib/helpers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const { page, limit } = parsePagination(req.nextUrl.searchParams);
    const { transactions, total } = await bankingService.getTransactionsByAccountId(id, page, limit);

    return jsonPaginated(transactions, { page, limit, total });
  } catch (error) {
    return handleError(error);
  }
}
