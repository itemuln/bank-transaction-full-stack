// =============================================================================
// JWT Token Service — Access & Refresh Token Management
// =============================================================================

import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import { AuthTokenPayload, UserRoleName } from "../../packages/shared/types";

export function generateAccessToken(payload: {
  userId: string;
  email: string;
  roles: UserRoleName[];
}): string {
  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRY as unknown as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

export function generateRefreshToken(payload: {
  userId: string;
  email: string;
  roles: UserRoleName[];
}): string {
  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRY as unknown as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthTokenPayload;
}

export function verifyRefreshToken(token: string): AuthTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as AuthTokenPayload;
}
