// =============================================================================
// Authentication Middleware — JWT verification from httpOnly cookies
// =============================================================================

import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../infrastructure/token-service";
import { AuthTokenPayload, UserRoleName } from "../../packages/shared/types";

// Extend Express Request with authenticated user
declare module "express-serve-static-core" {
  interface Request {
    user?: AuthTokenPayload;
  }
}

/**
 * Verifies the JWT access token from httpOnly cookie or Authorization header.
 * Attaches decoded payload to `req.user`.
 */
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    // Try cookie first (preferred for web), then Authorization header (API clients)
    const token =
      req.cookies?.accessToken ||
      req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      res.status(401).json({
        success: false,
        error: "Authentication required",
      });
      return;
    }

    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({
      success: false,
      error: "Invalid or expired token",
    });
    return;
  }
}

/**
 * Role-based authorization middleware.
 * Must be used AFTER `authenticate`.
 */
export function authorize(...allowedRoles: UserRoleName[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: "Authentication required",
      });
      return;
    }

    const hasRole = req.user.roles.some((role) =>
      allowedRoles.includes(role)
    );

    if (!hasRole) {
      res.status(403).json({
        success: false,
        error: "Insufficient permissions",
      });
      return;
    }

    next();
  };
}
