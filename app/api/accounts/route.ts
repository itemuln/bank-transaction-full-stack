// =============================================================================
// API: GET /api/accounts, POST /api/accounts
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { bankingService } from "@/backend/services/banking.service";
import { createAccountSchema } from "@/packages/shared/schemas";
import { UserRoleName } from "@/packages/shared/types";
import {
  requireAuth,
  requireRoles,
  isStaff,
  parsePagination,
  jsonSuccess,
  jsonPaginated,
  jsonError,
  handleError,
  toReqLike,
} from "@/app/api/_lib/helpers";

// GET /api/accounts
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const { page, limit } = parsePagination(req.nextUrl.searchParams);

    if (isStaff(authResult)) {
      const { accounts, total } = await bankingService.getAllAccounts(page, limit, {
        status: req.nextUrl.searchParams.get("status") || undefined,
        type: req.nextUrl.searchParams.get("type") || undefined,
      });
      return jsonPaginated(accounts, { page, limit, total });
    } else {
      const accounts = await bankingService.getAccountsByUserId(authResult.userId);
      return jsonSuccess(accounts);
    }
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/accounts
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireRoles(req, UserRoleName.TELLER, UserRoleName.MANAGER, UserRoleName.ADMIN);
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const parsed = createAccountSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Validation failed: " + parsed.error.issues.map((i) => i.message).join(", "), 400);
    }

    const account = await bankingService.createAccount(parsed.data, toReqLike(req) as never);
    return jsonSuccess(account, 201);
  } catch (error) {
    return handleError(error);
  }
}
