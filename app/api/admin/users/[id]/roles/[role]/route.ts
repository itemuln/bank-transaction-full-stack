// =============================================================================
// API: DELETE /api/admin/users/[id]/roles/[role]
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { UserRoleName } from "@/packages/shared/types";
import { userRepository } from "@/backend/repositories/user.repository";
import { createAuditLog } from "@/backend/infrastructure/audit-logger";
import { requireRoles, jsonSuccess, handleError, toReqLike } from "@/app/api/_lib/helpers";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; role: string }> }
) {
  try {
    const authResult = await requireRoles(req, UserRoleName.ADMIN);
    if (authResult instanceof NextResponse) return authResult;

    const { id, role } = await params;
    await userRepository.removeRole(id, role);
    await createAuditLog({
      userId: authResult.userId,
      action: "ROLE_REMOVED",
      resource: "users",
      resourceId: id,
      newValue: { role },
      req: toReqLike(req) as never,
    });

    return jsonSuccess({ message: "Role removed successfully" });
  } catch (error) {
    return handleError(error);
  }
}
