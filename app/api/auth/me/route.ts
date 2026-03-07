// =============================================================================
// API: GET /api/auth/me
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, jsonSuccess, handleError } from "@/app/api/_lib/helpers";
import { mapUserToDTO } from "@/backend/services/auth.service";
import { userRepository } from "@/backend/repositories/user.repository";

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const user = await userRepository.findById(authResult.userId);
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    return jsonSuccess(mapUserToDTO(user));
  } catch (error) {
    return handleError(error);
  }
}
