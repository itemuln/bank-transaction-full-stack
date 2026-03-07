// =============================================================================
// API: GET /api/admin/users, (list all users)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { UserRoleName } from "@/packages/shared/types";
import { userRepository } from "@/backend/repositories/user.repository";
import { mapUserToDTO } from "@/backend/services/auth.service";
import { requireRoles, parsePagination, jsonPaginated, handleError } from "@/app/api/_lib/helpers";

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireRoles(req, UserRoleName.ADMIN);
    if (authResult instanceof NextResponse) return authResult;

    const { page, limit } = parsePagination(req.nextUrl.searchParams);
    const { users, total } = await userRepository.findAll(page, limit);

    return jsonPaginated(users.map(mapUserToDTO), { page, limit, total });
  } catch (error) {
    return handleError(error);
  }
}
