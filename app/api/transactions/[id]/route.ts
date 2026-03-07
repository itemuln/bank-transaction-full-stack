// =============================================================================
// API: GET /api/transactions/[id], POST /api/transactions/[id]/approve
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { bankingService } from "@/backend/services/banking.service";
import { requireAuth, jsonSuccess, handleError } from "@/app/api/_lib/helpers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const tx = await bankingService.getTransactionById(id);
    return jsonSuccess(tx);
  } catch (error) {
    return handleError(error);
  }
}
