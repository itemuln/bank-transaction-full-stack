// =============================================================================
// Transaction Routes — Deposits, Withdrawals, Transfers, Approvals
// =============================================================================

import { Router, Request, Response } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validation.middleware";
import { bankingService } from "../services/banking.service";
import {
  depositSchema,
  withdrawalSchema,
  transferSchema,
  transactionApprovalSchema,
} from "../../packages/shared/schemas";
import { UserRoleName } from "../../packages/shared/types";

const router = Router();

router.use(authenticate);

// POST /api/transactions/deposit — (Teller, Manager, Admin)
router.post(
  "/deposit",
  authorize(UserRoleName.TELLER, UserRoleName.MANAGER, UserRoleName.ADMIN),
  validateBody(depositSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const tx = await bankingService.deposit(req.body, req.user!.userId, req);
      res.status(201).json({ success: true, data: tx });
    } catch (error: unknown) {
      const err = error as { statusCode?: number; message: string };
      res.status(err.statusCode ?? 500).json({ success: false, error: err.message });
    }
  }
);

// POST /api/transactions/withdraw — (Teller, Manager, Admin)
router.post(
  "/withdraw",
  authorize(UserRoleName.TELLER, UserRoleName.MANAGER, UserRoleName.ADMIN),
  validateBody(withdrawalSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const tx = await bankingService.withdraw(req.body, req.user!.userId, req);
      res.status(201).json({ success: true, data: tx });
    } catch (error: unknown) {
      const err = error as { statusCode?: number; message: string };
      res.status(err.statusCode ?? 500).json({ success: false, error: err.message });
    }
  }
);

// POST /api/transactions/transfer — (Customer, Teller, Manager, Admin)
router.post(
  "/transfer",
  validateBody(transferSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const tx = await bankingService.transfer(req.body, req.user!.userId, req);
      res.status(201).json({ success: true, data: tx });
    } catch (error: unknown) {
      const err = error as { statusCode?: number; message: string };
      res.status(err.statusCode ?? 500).json({ success: false, error: err.message });
    }
  }
);

// POST /api/transactions/:id/approve — (Manager, Admin)
router.post(
  "/:id/approve",
  authorize(UserRoleName.MANAGER, UserRoleName.ADMIN),
  validateBody(transactionApprovalSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const tx = await bankingService.approveTransaction(
        req.params.id as string,
        req.user!.userId,
        req.body.approved,
        req.body.reason,
        req
      );
      res.json({ success: true, data: tx });
    } catch (error: unknown) {
      const err = error as { statusCode?: number; message: string };
      res.status(err.statusCode ?? 500).json({ success: false, error: err.message });
    }
  }
);

// GET /api/transactions — List transactions
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const roles = req.user!.roles;

    if (roles.includes(UserRoleName.ADMIN) || roles.includes(UserRoleName.MANAGER) || roles.includes(UserRoleName.TELLER)) {
      const { transactions, total } = await bankingService.getAllTransactions(page, limit);
      res.json({
        success: true,
        data: transactions,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    } else {
      const { transactions, total } = await bankingService.getTransactionsByUserId(
        req.user!.userId,
        page,
        limit
      );
      res.json({
        success: true,
        data: transactions,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    }
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message: string };
    res.status(err.statusCode ?? 500).json({ success: false, error: err.message });
  }
});

// GET /api/transactions/pending — Pending approvals (Manager, Admin)
router.get(
  "/pending",
  authorize(UserRoleName.MANAGER, UserRoleName.ADMIN),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const { transactions, total } = await bankingService.getPendingApprovals(page, limit);
      res.json({
        success: true,
        data: transactions,
        meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    } catch (error: unknown) {
      const err = error as { statusCode?: number; message: string };
      res.status(err.statusCode ?? 500).json({ success: false, error: err.message });
    }
  }
);

// GET /api/transactions/:id — Get single transaction
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const tx = await bankingService.getTransactionById(req.params.id as string);
    res.json({ success: true, data: tx });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message: string };
    res.status(err.statusCode ?? 500).json({ success: false, error: err.message });
  }
});

export default router;
