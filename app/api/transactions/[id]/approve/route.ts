// =============================================================================
// API: POST /api/transactions/[id]/approve
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { bankingService } from "@/backend/services/banking.service";
import { transactionApprovalSchema } from "@/packages/shared/schemas";
import { UserRoleName } from "@/packages/shared/types";
import { requireRoles, jsonSuccess, jsonError, handleError, toReqLike } from "@/app/api/_lib/helpers";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRoles(req, UserRoleName.MANAGER, UserRoleName.ADMIN);
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const parsed = transactionApprovalSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Validation failed: " + parsed.error.issues.map((i) => i.message).join(", "), 400);
    }

    const { id } = await params;
    const tx = await bankingService.approveTransaction(
      id,
      authResult.userId,
      parsed.data.approved,
      parsed.data.reason,
      toReqLike(req) as never
    );

    return jsonSuccess(tx);
  } catch (error) {
    return handleError(error);
  }
}
