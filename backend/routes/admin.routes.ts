// =============================================================================
// Admin Routes — User management, role assignment, audit logs, stats
// =============================================================================

import { Router, Request, Response } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validation.middleware";
import { userRepository } from "../repositories/user.repository";
import { auditLogRepository } from "../repositories/audit-log.repository";
import { bankingService } from "../services/banking.service";
import { createAuditLog } from "../infrastructure/audit-logger";
import { mapUserToDTO } from "../services/auth.service";
import { assignRoleSchema, updateUserSchema } from "../../packages/shared/schemas";
import { UserRoleName } from "../../packages/shared/types";

const router = Router();

router.use(authenticate);
router.use(authorize(UserRoleName.ADMIN));

// GET /api/admin/users — List all users
router.get("/users", async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const { users, total } = await userRepository.findAll(page, limit);
    res.json({
      success: true,
      data: users.map(mapUserToDTO),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message: string };
    res.status(err.statusCode ?? 500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/users/:id — Get user details
router.get("/users/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await userRepository.findById(req.params.id as string);
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

// PATCH /api/admin/users/:id — Update user
router.patch(
  "/users/:id",
  validateBody(updateUserSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await userRepository.update(req.params.id as string, req.body);
      await createAuditLog({
        userId: req.user!.userId,
        action: "USER_UPDATED",
        resource: "users",
        resourceId: req.params.id as string,
        newValue: req.body,
        req,
      });
      res.json({ success: true, data: mapUserToDTO(user) });
    } catch (error: unknown) {
      const err = error as { statusCode?: number; message: string };
      res.status(err.statusCode ?? 500).json({ success: false, error: err.message });
    }
  }
);

// POST /api/admin/users/assign-role — Assign role to user
router.post(
  "/users/assign-role",
  validateBody(assignRoleSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      await userRepository.assignRole(req.body.userId, req.body.role);
      await createAuditLog({
        userId: req.user!.userId,
        action: "ROLE_ASSIGNED",
        resource: "users",
        resourceId: req.body.userId,
        newValue: { role: req.body.role },
        req,
      });
      res.json({ success: true, message: `Role ${req.body.role} assigned successfully` });
    } catch (error: unknown) {
      const err = error as { statusCode?: number; message: string };
      res.status(err.statusCode ?? 500).json({ success: false, error: err.message });
    }
  }
);

// DELETE /api/admin/users/:id/roles/:role — Remove role from user
router.delete(
  "/users/:id/roles/:role",
  async (req: Request, res: Response): Promise<void> => {
    try {
      await userRepository.removeRole(req.params.id as string, req.params.role as string);
      await createAuditLog({
        userId: req.user!.userId,
        action: "ROLE_REMOVED",
        resource: "users",
        resourceId: req.params.id as string,
        newValue: { role: req.params.role },
        req,
      });
      res.json({ success: true, message: "Role removed successfully" });
    } catch (error: unknown) {
      const err = error as { statusCode?: number; message: string };
      res.status(err.statusCode ?? 500).json({ success: false, error: err.message });
    }
  }
);

// GET /api/admin/audit-logs — View audit logs
router.get("/audit-logs", async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const { logs, total } = await auditLogRepository.findAll(page, limit, {
      action: req.query.action as string,
      resource: req.query.resource as string,
      userId: req.query.userId as string,
    });
    res.json({
      success: true,
      data: logs.map((log: { id: string; userId: string | null; user: { firstName: string; lastName: string } | null; action: string; resource: string; resourceId: string | null; ipAddress: string | null; createdAt: Date }) => ({
        id: log.id,
        userId: log.userId,
        userName: log.user ? `${log.user.firstName} ${log.user.lastName}` : null,
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId,
        ipAddress: log.ipAddress,
        createdAt: log.createdAt.toISOString(),
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message: string };
    res.status(err.statusCode ?? 500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/stats — System-wide statistics
router.get("/stats", async (_req: Request, res: Response): Promise<void> => {
  try {
    const stats = await bankingService.getAdminStats();
    res.json({ success: true, data: stats });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message: string };
    res.status(err.statusCode ?? 500).json({ success: false, error: err.message });
  }
});

export default router;
