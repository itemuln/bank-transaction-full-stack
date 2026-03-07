// =============================================================================
// API: PATCH /api/accounts/[id]/status
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { bankingService } from "@/backend/services/banking.service";
import { updateAccountStatusSchema } from "@/packages/shared/schemas";
import { UserRoleName } from "@/packages/shared/types";
import { requireRoles, jsonSuccess, jsonError, handleError, toReqLike } from "@/app/api/_lib/helpers";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRoles(req, UserRoleName.MANAGER, UserRoleName.ADMIN);
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const parsed = updateAccountStatusSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Validation failed: " + parsed.error.issues.map((i) => i.message).join(", "), 400);
    }

    const { id } = await params;
    const account = await bankingService.updateAccountStatus(
      id,
      parsed.data.status,
      parsed.data.reason,
      authResult.userId,
      toReqLike(req) as never
    );

    return jsonSuccess(account);
  } catch (error) {
    return handleError(error);
  }
}
