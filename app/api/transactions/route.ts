// =============================================================================
// API: GET /api/transactions, (list all transactions)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { bankingService } from "@/backend/services/banking.service";
import { requireAuth, isStaff, parsePagination, jsonPaginated, handleError } from "@/app/api/_lib/helpers";

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const { page, limit } = parsePagination(req.nextUrl.searchParams);

    if (isStaff(authResult)) {
      const { transactions, total } = await bankingService.getAllTransactions(page, limit);
      return jsonPaginated(transactions, { page, limit, total });
    } else {
      const { transactions, total } = await bankingService.getTransactionsByUserId(
        authResult.userId,
        page,
        limit
      );
      return jsonPaginated(transactions, { page, limit, total });
    }
  } catch (error) {
    return handleError(error);
  }
}
