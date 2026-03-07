// =============================================================================
// API: POST /api/admin/users/assign-role
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { UserRoleName } from "@/packages/shared/types";
import { userRepository } from "@/backend/repositories/user.repository";
import { assignRoleSchema } from "@/packages/shared/schemas";
import { createAuditLog } from "@/backend/infrastructure/audit-logger";
import { requireRoles, jsonSuccess, jsonError, handleError, toReqLike } from "@/app/api/_lib/helpers";

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireRoles(req, UserRoleName.ADMIN);
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const parsed = assignRoleSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Validation failed: " + parsed.error.issues.map((i) => i.message).join(", "), 400);
    }

    await userRepository.assignRole(parsed.data.userId, parsed.data.role);
    await createAuditLog({
      userId: authResult.userId,
      action: "ROLE_ASSIGNED",
      resource: "users",
      resourceId: parsed.data.userId,
      newValue: { role: parsed.data.role },
      req: toReqLike(req) as never,
    });

    return jsonSuccess({ message: `Role ${parsed.data.role} assigned successfully` });
  } catch (error) {
    return handleError(error);
  }
}
