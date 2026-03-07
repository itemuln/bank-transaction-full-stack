// =============================================================================
// Validation Middleware — Zod schema validation for Express routes
// =============================================================================

import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError, ZodIssue } from "zod";

function formatZodErrors(error: ZodError): { field: string; message: string }[] {
  return error.issues.map((issue: ZodIssue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
}

/**
 * Validates request body against a Zod schema.
 * Returns 400 with structured error messages on failure.
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          details: formatZodErrors(error),
        });
        return;
      }
      next(error);
    }
  };
}

/**
 * Validates query parameters against a Zod schema.
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req.query);
      (req as Request & { validatedQuery: unknown }).validatedQuery = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: "Invalid query parameters",
          details: formatZodErrors(error),
        });
        return;
      }
      next(error);
    }
  };
}

/**
 * Validates route parameters against a Zod schema.
 */
export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: "Invalid route parameters",
        });
        return;
      }
      next(error);
    }
  };
}
