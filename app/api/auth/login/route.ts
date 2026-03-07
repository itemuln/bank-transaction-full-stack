// =============================================================================
// API: POST /api/auth/login
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/backend/services/auth.service";
import { loginSchema } from "@/packages/shared/schemas";
import { jsonError, handleError, setAuthCookies, toReqLike } from "@/app/api/_lib/helpers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Validation failed: " + parsed.error.issues.map((i) => i.message).join(", "), 400);
    }

    const { user, accessToken, refreshToken } = await authService.login(
      parsed.data.email,
      parsed.data.password,
      toReqLike(req) as never
    );

    const response = NextResponse.json({
      success: true,
      data: { user, accessToken },
      message: "Login successful",
    });

    return setAuthCookies(response, accessToken, refreshToken);
  } catch (error) {
    return handleError(error);
  }
}
