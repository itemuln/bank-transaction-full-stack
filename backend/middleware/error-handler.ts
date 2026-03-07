// =============================================================================
// Global Error Handler — Catches unhandled errors and returns consistent responses
// =============================================================================

import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  console.error("[ERROR]", {
    name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // Prisma known errors
  if (err.name === "PrismaClientKnownRequestError") {
    res.status(400).json({
      success: false,
      error: "Database operation failed",
    });
    return;
  }

  // Default 500
  res.status(500).json({
    success: false,
    error:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
}
