// =============================================================================
// API: POST /api/auth/password-reset
// =============================================================================

import { NextRequest } from "next/server";
import { authService } from "@/backend/services/auth.service";
import { passwordResetSchema } from "@/packages/shared/schemas";
import { jsonSuccess, jsonError, handleError, toReqLike } from "@/app/api/_lib/helpers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = passwordResetSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Validation failed: " + parsed.error.issues.map((i) => i.message).join(", "), 400);
    }

    await authService.resetPassword(parsed.data.token, parsed.data.password, toReqLike(req) as never);
    return jsonSuccess({ message: "Password reset successful" });
  } catch (error) {
    return handleError(error);
  }
}
