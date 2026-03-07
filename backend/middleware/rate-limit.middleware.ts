// =============================================================================
// Rate Limiting Middleware — Prevents brute force & abuse
// =============================================================================

import { Request, Response, NextFunction } from "express";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * In-memory rate limiter. In production, use Redis for distributed rate limiting.
 * This implementation is per-process and suitable for single-instance deployments.
 */
class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 300000);
  }

  check(key: string, maxRequests: number, windowMs: number): {
    allowed: boolean;
    remaining: number;
    resetAt: number;
  } {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetAt) {
      this.store.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
    }

    entry.count++;
    const allowed = entry.count <= maxRequests;
    return {
      allowed,
      remaining: Math.max(0, maxRequests - entry.count),
      resetAt: entry.resetAt,
    };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetAt) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

const limiter = new RateLimiter();

/**
 * General API rate limiter.
 */
export function rateLimit(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = `general:${req.ip}`;
    const result = limiter.check(key, maxRequests, windowMs);

    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader("X-RateLimit-Remaining", result.remaining);
    res.setHeader("X-RateLimit-Reset", Math.ceil(result.resetAt / 1000));

    if (!result.allowed) {
      res.status(429).json({
        success: false,
        error: "Too many requests. Please try again later.",
      });
      return;
    }

    next();
  };
}

/**
 * Stricter rate limiter for login endpoints.
 */
export function loginRateLimit(maxAttempts: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const email = req.body?.email || "unknown";
    const key = `login:${req.ip}:${email}`;
    const result = limiter.check(key, maxAttempts, windowMs);

    if (!result.allowed) {
      res.status(429).json({
        success: false,
        error: "Too many login attempts. Please try again later.",
        retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
      });
      return;
    }

    next();
  };
}
