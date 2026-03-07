// =============================================================================
// API: POST /api/transactions/transfer
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { bankingService } from "@/backend/services/banking.service";
import { transferSchema } from "@/packages/shared/schemas";
import { requireAuth, jsonSuccess, jsonError, handleError, toReqLike } from "@/app/api/_lib/helpers";

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const parsed = transferSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Validation failed: " + parsed.error.issues.map((i) => i.message).join(", "), 400);
    }

    const tx = await bankingService.transfer(parsed.data, authResult.userId, toReqLike(req) as never);
    return jsonSuccess(tx, 201);
  } catch (error) {
    return handleError(error);
  }
}
