// =============================================================================
// Account Routes — CRUD for banking accounts
// =============================================================================

import { Router, Request, Response } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validation.middleware";
import { bankingService } from "../services/banking.service";
import { createAccountSchema, updateAccountStatusSchema } from "../../packages/shared/schemas";
import { UserRoleName } from "../../packages/shared/types";

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/accounts — Get accounts (customer sees own, staff sees all)
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const roles = req.user!.roles;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    if (roles.includes(UserRoleName.ADMIN) || roles.includes(UserRoleName.MANAGER) || roles.includes(UserRoleName.TELLER)) {
      const { accounts, total } = await bankingService.getAllAccounts(page, limit, {
        status: req.query.status as string,
        type: req.query.type as string,
      });
      res.json({
        success: true,
        data: accounts,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    } else {
      const accounts = await bankingService.getAccountsByUserId(req.user!.userId);
      res.json({ success: true, data: accounts });
    }
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message: string };
    res.status(err.statusCode ?? 500).json({ success: false, error: err.message });
  }
});

// GET /api/accounts/:id — Get single account
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const accountId = req.params.id as string;
    const account = await bankingService.getAccountById(accountId);

    // Customers can only view their own accounts
    const roles = req.user!.roles;
    const isStaff =
      roles.includes(UserRoleName.ADMIN) ||
      roles.includes(UserRoleName.MANAGER) ||
      roles.includes(UserRoleName.TELLER);

    if (!isStaff && account.userId !== req.user!.userId) {
      res.status(403).json({ success: false, error: "Access denied" });
      return;
    }

    res.json({ success: true, data: account });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message: string };
    res.status(err.statusCode ?? 500).json({ success: false, error: err.message });
  }
});

// POST /api/accounts — Create account (Teller, Manager, Admin only)
router.post(
  "/",
  authorize(UserRoleName.TELLER, UserRoleName.MANAGER, UserRoleName.ADMIN),
  validateBody(createAccountSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const account = await bankingService.createAccount(req.body, req);
      res.status(201).json({ success: true, data: account });
    } catch (error: unknown) {
      const err = error as { statusCode?: number; message: string };
      res.status(err.statusCode ?? 500).json({ success: false, error: err.message });
    }
  }
);

// PATCH /api/accounts/:id/status — Freeze/close/reactivate (Manager, Admin)
router.patch(
  "/:id/status",
  authorize(UserRoleName.MANAGER, UserRoleName.ADMIN),
  validateBody(updateAccountStatusSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const account = await bankingService.updateAccountStatus(
        req.params.id as string,
        req.body.status,
        req.body.reason,
        req.user!.userId,
        req
      );
      res.json({ success: true, data: account });
    } catch (error: unknown) {
      const err = error as { statusCode?: number; message: string };
      res.status(err.statusCode ?? 500).json({ success: false, error: err.message });
    }
  }
);

// GET /api/accounts/:id/transactions — Get transactions for account
router.get("/:id/transactions", async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const { transactions, total } = await bankingService.getTransactionsByAccountId(
      req.params.id as string,
      page,
      limit
    );
    res.json({
      success: true,
      data: transactions,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message: string };
    res.status(err.statusCode ?? 500).json({ success: false, error: err.message });
  }
});

export default router;
