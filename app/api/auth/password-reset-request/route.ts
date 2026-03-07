// =============================================================================
// API: POST /api/auth/password-reset-request
// =============================================================================

import { NextRequest } from "next/server";
import { authService } from "@/backend/services/auth.service";
import { passwordResetRequestSchema } from "@/packages/shared/schemas";
import { jsonSuccess, jsonError, toReqLike } from "@/app/api/_lib/helpers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = passwordResetRequestSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Validation failed", 400);
    }

    await authService.requestPasswordReset(parsed.data.email, toReqLike(req) as never);
  } catch {
    // Swallow errors to prevent email enumeration
  }

  return jsonSuccess({ message: "If the email exists, a reset link has been sent" });
}
