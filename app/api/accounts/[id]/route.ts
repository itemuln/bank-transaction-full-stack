// =============================================================================
// API: GET /api/accounts/[id]
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { bankingService } from "@/backend/services/banking.service";
import { requireAuth, isStaff, jsonSuccess, handleError } from "@/app/api/_lib/helpers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const account = await bankingService.getAccountById(id);

    if (!isStaff(authResult) && account.userId !== authResult.userId) {
      return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
    }

    return jsonSuccess(account);
  } catch (error) {
    return handleError(error);
  }
}
