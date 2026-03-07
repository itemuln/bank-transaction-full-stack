// =============================================================================
// Dashboard Routes — Role-specific dashboard data
// =============================================================================

import { Router, Request, Response } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { bankingService } from "../services/banking.service";
import { UserRoleName } from "../../packages/shared/types";

const router = Router();

router.use(authenticate);

// GET /api/dashboard/customer — Customer dashboard data
router.get("/customer", async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await bankingService.getCustomerDashboard(req.user!.userId);
    res.json({ success: true, data });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message: string };
    res.status(err.statusCode ?? 500).json({ success: false, error: err.message });
  }
});

// GET /api/dashboard/admin — Admin overview stats
router.get(
  "/admin",
  authorize(UserRoleName.ADMIN),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const data = await bankingService.getAdminStats();
      res.json({ success: true, data });
    } catch (error: unknown) {
      const err = error as { statusCode?: number; message: string };
      res.status(err.statusCode ?? 500).json({ success: false, error: err.message });
    }
  }
);

// GET /api/dashboard/manager — Manager dashboard with pending approvals
router.get(
  "/manager",
  authorize(UserRoleName.MANAGER, UserRoleName.ADMIN),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const [stats, pendingApprovals] = await Promise.all([
        bankingService.getAdminStats(),
        bankingService.getPendingApprovals(1, 10),
      ]);
      res.json({
        success: true,
        data: { ...stats, pendingApprovals: pendingApprovals.transactions },
      });
    } catch (error: unknown) {
      const err = error as { statusCode?: number; message: string };
      res.status(err.statusCode ?? 500).json({ success: false, error: err.message });
    }
  }
);

export default router;
