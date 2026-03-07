// =============================================================================
// Auth Routes — Registration, Login, Token Refresh, Logout
// =============================================================================

import { Router, Request, Response } from "express";
import { authService } from "../services/auth.service";
import { authenticate } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validation.middleware";
import { loginRateLimit } from "../middleware/rate-limit.middleware";
import {
  loginSchema,
  registerSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
} from "../../packages/shared/schemas";
import { env } from "../config/env";

const router = Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
};

// POST /api/auth/register
router.post(
  "/register",
  validateBody(registerSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await authService.register(req.body, req);
      res.status(201).json({ success: true, data: user, message: "Registration successful" });
    } catch (error: unknown) {
      const err = error as { statusCode?: number; message: string };
      res.status(err.statusCode ?? 500).json({ success: false, error: err.message });
    }
  }
);

// POST /api/auth/login
router.post(
  "/login",
  loginRateLimit(env.LOGIN_RATE_LIMIT_MAX, 900000),
  validateBody(loginSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { user, accessToken, refreshToken } = await authService.login(
        req.body.email,
        req.body.password,
        req
      );

      // Set httpOnly cookies
      res.cookie("accessToken", accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      res.cookie("refreshToken", refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        success: true,
        data: { user, accessToken },
        message: "Login successful",
      });
    } catch (error: unknown) {
      const err = error as { statusCode?: number; message: string };
      res.status(err.statusCode ?? 500).json({ success: false, error: err.message });
    }
  }
);

// POST /api/auth/refresh
router.post("/refresh", async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!refreshToken) {
      res.status(401).json({ success: false, error: "Refresh token required" });
      return;
    }

    const tokens = await authService.refreshTokens(refreshToken);

    res.cookie("accessToken", tokens.accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", tokens.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, data: { accessToken: tokens.accessToken } });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message: string };
    res.status(err.statusCode ?? 401).json({ success: false, error: err.message });
  }
});

// POST /api/auth/logout
router.post("/logout", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      await authService.logout(refreshToken, req);
    }

    res.clearCookie("accessToken", COOKIE_OPTIONS);
    res.clearCookie("refreshToken", COOKIE_OPTIONS);
    res.json({ success: true, message: "Logged out successfully" });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message: string };
    res.status(err.statusCode ?? 500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/password-reset-request
router.post(
  "/password-reset-request",
  validateBody(passwordResetRequestSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      await authService.requestPasswordReset(req.body.email, req);
      // Always return success to prevent email enumeration
      res.json({ success: true, message: "If the email exists, a reset link has been sent" });
    } catch {
      res.json({ success: true, message: "If the email exists, a reset link has been sent" });
    }
  }
);

// POST /api/auth/password-reset
router.post(
  "/password-reset",
  validateBody(passwordResetSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      await authService.resetPassword(req.body.token, req.body.password, req);
      res.json({ success: true, message: "Password reset successful" });
    } catch (error: unknown) {
      const err = error as { statusCode?: number; message: string };
      res.status(err.statusCode ?? 500).json({ success: false, error: err.message });
    }
  }
);

// GET /api/auth/me — Get current user
router.get("/me", authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { mapUserToDTO } = await import("../services/auth.service");
    const { userRepository } = await import("../repositories/user.repository");
    const user = await userRepository.findById(req.user!.userId);
    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }
    res.json({ success: true, data: mapUserToDTO(user) });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message: string };
    res.status(err.statusCode ?? 500).json({ success: false, error: err.message });
  }
});

export default router;
