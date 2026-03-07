// =============================================================================
// Zod Validation Schemas — Shared between Frontend and Backend
// =============================================================================

import { z } from "zod";

// ── Auth Schemas ─────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string(),
    firstName: z.string().min(1, "First name is required").max(100),
    lastName: z.string().min(1, "Last name is required").max(100),
    phone: z.string().optional(),
    dateOfBirth: z.string().optional(),
    address: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const passwordResetRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const passwordResetSchema = z
  .object({
    token: z.string().min(1, "Token is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain uppercase letter")
      .regex(/[0-9]/, "Must contain a number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// ── Account Schemas ──────────────────────────────────────────────────────────

export const createAccountSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  type: z.enum(["CHECKING", "SAVINGS"]),
  initialDeposit: z
    .number()
    .min(0, "Initial deposit cannot be negative")
    .default(0),
  dailyLimit: z
    .number()
    .min(100, "Daily limit must be at least $100")
    .max(1000000, "Daily limit cannot exceed $1,000,000")
    .optional(),
});

export const updateAccountStatusSchema = z.object({
  status: z.enum(["ACTIVE", "FROZEN", "CLOSED"]),
  reason: z.string().min(1, "Reason is required").max(500),
});

// ── Transaction Schemas ──────────────────────────────────────────────────────

export const depositSchema = z.object({
  accountId: z.string().uuid("Invalid account ID"),
  amount: z
    .number()
    .positive("Amount must be positive")
    .max(1000000, "Single deposit cannot exceed $1,000,000"),
  description: z.string().max(500).optional(),
  idempotencyKey: z.string().min(1, "Idempotency key is required"),
});

export const withdrawalSchema = z.object({
  accountId: z.string().uuid("Invalid account ID"),
  amount: z
    .number()
    .positive("Amount must be positive")
    .max(50000, "Single withdrawal cannot exceed $50,000"),
  description: z.string().max(500).optional(),
  idempotencyKey: z.string().min(1, "Idempotency key is required"),
});

export const transferSchema = z.object({
  sourceAccountId: z.string().uuid("Invalid source account ID"),
  destinationAccountId: z.string().uuid("Invalid destination account ID"),
  amount: z
    .number()
    .positive("Amount must be positive")
    .max(100000, "Single transfer cannot exceed $100,000"),
  description: z.string().max(500).optional(),
  idempotencyKey: z.string().min(1, "Idempotency key is required"),
});

export const transactionApprovalSchema = z.object({
  approved: z.boolean(),
  reason: z.string().max(500).optional(),
});

// ── Admin Schemas ────────────────────────────────────────────────────────────

export const assignRoleSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  role: z.enum(["CUSTOMER", "TELLER", "MANAGER", "ADMIN"]),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional(),
  isActive: z.boolean().optional(),
});

// ── Pagination Schema ────────────────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// ── Type Exports ─────────────────────────────────────────────────────────────

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountStatusInput = z.infer<typeof updateAccountStatusSchema>;
export type DepositInput = z.infer<typeof depositSchema>;
export type WithdrawalInput = z.infer<typeof withdrawalSchema>;
export type TransferInput = z.infer<typeof transferSchema>;
export type TransactionApprovalInput = z.infer<typeof transactionApprovalSchema>;
export type AssignRoleInput = z.infer<typeof assignRoleSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
