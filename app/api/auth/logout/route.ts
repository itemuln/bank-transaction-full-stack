// =============================================================================
// API: POST /api/auth/logout
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authService } from "@/backend/services/auth.service";
import { requireAuth, clearAuthCookies, handleError, toReqLike } from "@/app/api/_lib/helpers";

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;
    if (refreshToken) {
      await authService.logout(refreshToken, toReqLike(req) as never);
    }

    const response = NextResponse.json({ success: true, message: "Logged out successfully" });
    return clearAuthCookies(response);
  } catch (error) {
    return handleError(error);
  }
}
