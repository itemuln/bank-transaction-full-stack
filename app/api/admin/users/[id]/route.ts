// =============================================================================
// API: GET /api/admin/users/[id], PATCH /api/admin/users/[id]
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { UserRoleName } from "@/packages/shared/types";
import { userRepository } from "@/backend/repositories/user.repository";
import { mapUserToDTO } from "@/backend/services/auth.service";
import { updateUserSchema } from "@/packages/shared/schemas";
import { createAuditLog } from "@/backend/infrastructure/audit-logger";
import { requireRoles, jsonSuccess, jsonError, handleError, toReqLike } from "@/app/api/_lib/helpers";

// GET /api/admin/users/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRoles(req, UserRoleName.ADMIN);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const user = await userRepository.findById(id);
    if (!user) {
      return jsonError("User not found", 404);
    }

    return jsonSuccess(mapUserToDTO(user));
  } catch (error) {
    return handleError(error);
  }
}

// PATCH /api/admin/users/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRoles(req, UserRoleName.ADMIN);
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Validation failed: " + parsed.error.issues.map((i) => i.message).join(", "), 400);
    }

    const { id } = await params;
    const user = await userRepository.update(id, parsed.data);
    await createAuditLog({
      userId: authResult.userId,
      action: "USER_UPDATED",
      resource: "users",
      resourceId: id,
      newValue: parsed.data,
      req: toReqLike(req) as never,
    });

    return jsonSuccess(mapUserToDTO(user));
  } catch (error) {
    return handleError(error);
  }
}
