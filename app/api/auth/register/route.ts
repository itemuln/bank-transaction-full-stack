// =============================================================================
// API: POST /api/auth/register
// =============================================================================

import { NextRequest } from "next/server";
import { authService } from "@/backend/services/auth.service";
import { registerSchema } from "@/packages/shared/schemas";
import { jsonSuccess, jsonError, handleError, toReqLike } from "@/app/api/_lib/helpers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Validation failed: " + parsed.error.issues.map((i) => i.message).join(", "), 400);
    }

    const user = await authService.register(parsed.data, toReqLike(req) as never);
    return jsonSuccess(user, 201);
  } catch (error) {
    return handleError(error);
  }
}
