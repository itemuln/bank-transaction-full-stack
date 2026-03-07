// =============================================================================
// Auth Service — Registration, Login, Token Management
// =============================================================================

import bcryptjs from "bcryptjs";
import crypto from "crypto";
import { env } from "../config/env";
import { userRepository } from "../repositories/user.repository";
import { sessionRepository } from "../repositories/session.repository";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../infrastructure/token-service";
import { createAuditLog } from "../infrastructure/audit-logger";
import { AppError } from "../middleware/error-handler";
import { UserRoleName, UserDTO } from "../../packages/shared/types";
import { Request } from "express";

function mapUserToDTO(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  userRoles: { role: { name: string } }[];
}): UserDTO {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    isActive: user.isActive,
    emailVerified: user.emailVerified,
    roles: user.userRoles.map((ur) => ur.role.name as UserRoleName),
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

export class AuthService {
  /**
   * Register a new user with CUSTOMER role by default.
   */
  async register(input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    dateOfBirth?: string;
    address?: string;
  }, req?: Request) {
    // Check if user already exists
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new AppError(409, "An account with this email already exists");
    }

    // Hash password
    const passwordHash = await bcryptjs.hash(input.password, env.BCRYPT_ROUNDS);

    // Create user
    const user = await userRepository.create({
      email: input.email.toLowerCase(),
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
      address: input.address,
    });

    // Assign default CUSTOMER role
    await userRepository.assignRole(user.id, UserRoleName.CUSTOMER);

    // Re-fetch with roles
    const fullUser = await userRepository.findById(user.id);
    if (!fullUser) throw new AppError(500, "Failed to create user");

    await createAuditLog({
      userId: user.id,
      action: "USER_REGISTERED",
      resource: "users",
      resourceId: user.id,
      req,
    });

    return mapUserToDTO(fullUser);
  }

  /**
   * Authenticate user with email and password.
   * Returns access token, refresh token, and user data.
   */
  async login(
    email: string,
    password: string,
    req?: Request
  ): Promise<{
    user: UserDTO;
    accessToken: string;
    refreshToken: string;
  }> {
    const user = await userRepository.findByEmail(email.toLowerCase());
    if (!user) {
      throw new AppError(401, "Invalid email or password");
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new AppError(423, "Account is temporarily locked. Try again later.");
    }

    // Check if account is active
    if (!user.isActive) {
      throw new AppError(403, "Account has been deactivated");
    }

    // Verify password
    const valid = await bcryptjs.compare(password, user.passwordHash);
    if (!valid) {
      // Increment failed attempts
      await userRepository.incrementFailedAttempts(user.id);

      // Lock after 5 failed attempts for 30 minutes
      if (user.failedAttempts >= 4) {
        const lockUntil = new Date(Date.now() + 30 * 60 * 1000);
        await userRepository.lockAccount(user.id, lockUntil);
        throw new AppError(423, "Too many failed attempts. Account locked for 30 minutes.");
      }

      throw new AppError(401, "Invalid email or password");
    }

    // Reset failed attempts on successful login
    await userRepository.resetFailedAttempts(user.id);
    await userRepository.update(user.id, { lastLoginAt: new Date() });

    const roles = user.userRoles.map((ur: { role: { name: string } }) => ur.role.name as UserRoleName);
    const tokenPayload = { userId: user.id, email: user.email, roles };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token in sessions table
    const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await sessionRepository.create({
      userId: user.id,
      refreshToken,
      userAgent: req?.headers["user-agent"],
      ipAddress: req?.ip ?? req?.socket.remoteAddress,
      expiresAt: refreshExpiry,
    });

    await createAuditLog({
      userId: user.id,
      action: "USER_LOGIN",
      resource: "sessions",
      req,
    });

    return {
      user: mapUserToDTO(user),
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh access token using a valid refresh token.
   */
  async refreshTokens(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    // Verify the refresh token JWT
    const decoded = verifyRefreshToken(refreshToken);

    // Find session in database
    const session = await sessionRepository.findByRefreshToken(refreshToken);
    if (!session || session.expiresAt < new Date()) {
      throw new AppError(401, "Invalid or expired refresh token");
    }

    // Delete old session
    await sessionRepository.deleteByRefreshToken(refreshToken);

    // Generate new tokens (token rotation)
    const user = session.user;
    const roles = user.userRoles.map((ur: { role: { name: string } }) => ur.role.name as UserRoleName);
    const tokenPayload = { userId: decoded.userId, email: decoded.email, roles };

    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    // Create new session
    const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await sessionRepository.create({
      userId: decoded.userId,
      refreshToken: newRefreshToken,
      expiresAt: refreshExpiry,
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  /**
   * Logout — invalidate the refresh token session.
   */
  async logout(refreshToken: string, req?: Request) {
    const session = await sessionRepository.findByRefreshToken(refreshToken);
    if (session) {
      await sessionRepository.deleteByRefreshToken(refreshToken);
      await createAuditLog({
        userId: session.userId,
        action: "USER_LOGOUT",
        resource: "sessions",
        req,
      });
    }
  }

  /**
   * Generate a password reset token.
   */
  async requestPasswordReset(email: string, req?: Request) {
    const user = await userRepository.findByEmail(email.toLowerCase());
    // Always return success to prevent email enumeration
    if (!user) return;

    const token = crypto.randomBytes(32).toString("hex");
    const { prisma } = await import("../config/database");
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    await createAuditLog({
      userId: user.id,
      action: "PASSWORD_RESET_REQUESTED",
      resource: "users",
      resourceId: user.id,
      req,
    });

    // In production: send email with reset link containing the token
    // For now, log it in development
    if (env.NODE_ENV === "development") {
      console.log(`[DEV] Password reset token for ${email}: ${token}`);
    }
  }

  /**
   * Reset password with token.
   */
  async resetPassword(token: string, newPassword: string, req?: Request) {
    const { prisma } = await import("../config/database");
    const reset = await prisma.passwordReset.findUnique({ where: { token } });

    if (!reset || reset.expiresAt < new Date() || reset.usedAt) {
      throw new AppError(400, "Invalid or expired reset token");
    }

    const passwordHash = await bcryptjs.hash(newPassword, env.BCRYPT_ROUNDS);
    await userRepository.update(reset.userId, { passwordHash });

    // Mark token as used
    await prisma.passwordReset.update({
      where: { id: reset.id },
      data: { usedAt: new Date() },
    });

    // Invalidate all sessions
    await sessionRepository.deleteAllForUser(reset.userId);

    await createAuditLog({
      userId: reset.userId,
      action: "PASSWORD_RESET",
      resource: "users",
      resourceId: reset.userId,
      req,
    });
  }
}

export const authService = new AuthService();
export { mapUserToDTO };
