// =============================================================================
// API Route Helpers — Shared utilities for Next.js API Route Handlers
// =============================================================================

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/backend/infrastructure/token-service";
import { AuthTokenPayload, UserRoleName } from "@/packages/shared/types";

// Standard JSON response helpers
export function jsonSuccess(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function jsonError(error: string, status = 500) {
  return NextResponse.json({ success: false, error }, { status });
}

export function jsonPaginated(data: unknown, meta: { page: number; limit: number; total: number }) {
  return NextResponse.json({
    success: true,
    data,
    meta: { ...meta, totalPages: Math.ceil(meta.total / meta.limit) },
  });
}

// Cookie config
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
};

// Set auth cookies on a response
export function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string
) {
  response.cookies.set("accessToken", accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: 15 * 60, // 15 minutes (in seconds for Next.js)
  });
  response.cookies.set("refreshToken", refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
  return response;
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set("accessToken", "", { ...COOKIE_OPTIONS, maxAge: 0 });
  response.cookies.set("refreshToken", "", { ...COOKIE_OPTIONS, maxAge: 0 });
  return response;
}

// Extract authenticated user from cookies or Authorization header
export async function getAuthUser(req: NextRequest): Promise<AuthTokenPayload | null> {
  try {
    const cookieStore = await cookies();
    const token =
      cookieStore.get("accessToken")?.value ||
      req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) return null;
    return verifyAccessToken(token);
  } catch {
    return null;
  }
}

// Require authentication — returns user or error response
export async function requireAuth(req: NextRequest): Promise<AuthTokenPayload | NextResponse> {
  const user = await getAuthUser(req);
  if (!user) {
    return jsonError("Authentication required", 401);
  }
  return user;
}

// Require specific roles
export async function requireRoles(
  req: NextRequest,
  ...roles: UserRoleName[]
): Promise<AuthTokenPayload | NextResponse> {
  const result = await requireAuth(req);
  if (result instanceof NextResponse) return result;

  const hasRole = result.roles.some((r) => roles.includes(r));
  if (!hasRole) {
    return jsonError("Insufficient permissions", 403);
  }
  return result;
}

// Check if user is staff (Teller, Manager, Admin)
export function isStaff(user: AuthTokenPayload): boolean {
  return (
    user.roles.includes(UserRoleName.ADMIN) ||
    user.roles.includes(UserRoleName.MANAGER) ||
    user.roles.includes(UserRoleName.TELLER)
  );
}

// Parse pagination from search params
export function parsePagination(searchParams: URLSearchParams) {
  return {
    page: Math.max(1, Number(searchParams.get("page")) || 1),
    limit: Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20)),
  };
}

// Build a minimal "req-like" object for audit logger compatibility
export function toReqLike(req: NextRequest) {
  return {
    ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown",
    headers: {
      "user-agent": req.headers.get("user-agent") || "unknown",
      "x-forwarded-for": req.headers.get("x-forwarded-for") || undefined,
    },
    get(name: string) {
      return req.headers.get(name) || undefined;
    },
  };
}

// Safe error handling wrapper
export function handleError(error: unknown) {
  const err = error as { statusCode?: number; message?: string };
  const status = err.statusCode ?? 500;
  const message = err.message ?? "Internal server error";
  return jsonError(message, status);
}
