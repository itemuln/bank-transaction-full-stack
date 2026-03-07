// =============================================================================
// API: POST /api/auth/refresh
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authService } from "@/backend/services/auth.service";
import { jsonError, handleError, setAuthCookies } from "@/app/api/_lib/helpers";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    let refreshToken = cookieStore.get("refreshToken")?.value;

    if (!refreshToken) {
      try {
        const body = await req.json();
        refreshToken = body?.refreshToken;
      } catch {
        // no body
      }
    }

    if (!refreshToken) {
      return jsonError("Refresh token required", 401);
    }

    const tokens = await authService.refreshTokens(refreshToken);

    const response = NextResponse.json({
      success: true,
      data: { accessToken: tokens.accessToken },
    });

    return setAuthCookies(response, tokens.accessToken, tokens.refreshToken);
  } catch (error) {
    return handleError(error);
  }
}
