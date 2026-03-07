// =============================================================================
// API: POST /api/transactions/deposit
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { bankingService } from "@/backend/services/banking.service";
import { depositSchema } from "@/packages/shared/schemas";
import { UserRoleName } from "@/packages/shared/types";
import { requireRoles, jsonSuccess, jsonError, handleError, toReqLike } from "@/app/api/_lib/helpers";

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireRoles(req, UserRoleName.TELLER, UserRoleName.MANAGER, UserRoleName.ADMIN);
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const parsed = depositSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Validation failed: " + parsed.error.issues.map((i) => i.message).join(", "), 400);
    }

    const tx = await bankingService.deposit(parsed.data, authResult.userId, toReqLike(req) as never);
    return jsonSuccess(tx, 201);
  } catch (error) {
    return handleError(error);
  }
}
