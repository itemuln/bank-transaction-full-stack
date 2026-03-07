// =============================================================================
// Transaction Repository — Database access for transactions
// =============================================================================

import { prisma } from "../config/database";

export class TransactionRepository {
  async findById(id: string) {
    return prisma.transaction.findUnique({
      where: { id },
      include: {
        sourceAccount: { select: { accountNumber: true, userId: true } },
        destinationAccount: { select: { accountNumber: true, userId: true } },
        initiator: { select: { firstName: true, lastName: true } },
        approvals: {
          include: {
            approver: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });
  }

  async findByIdempotencyKey(key: string) {
    return prisma.transaction.findUnique({
      where: { idempotencyKey: key },
    });
  }

  async create(data: {
    idempotencyKey: string;
    type: "DEPOSIT" | "WITHDRAWAL" | "TRANSFER";
    status: "PENDING" | "COMPLETED" | "REQUIRES_APPROVAL";
    amount: number;
    description?: string;
    sourceAccountId?: string;
    destinationAccountId?: string;
    initiatedBy: string;
    balanceBefore?: number;
    balanceAfter?: number;
    fraudFlagged?: boolean;
  }) {
    return prisma.transaction.create({
      data,
      include: {
        sourceAccount: { select: { accountNumber: true } },
        destinationAccount: { select: { accountNumber: true } },
        initiator: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async updateStatus(id: string, status: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED") {
    return prisma.transaction.update({
      where: { id },
      data: { status },
    });
  }

  async findByAccountId(
    accountId: string,
    page: number,
    limit: number,
    filters?: { type?: string; status?: string }
  ) {
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {
      OR: [{ sourceAccountId: accountId }, { destinationAccountId: accountId }],
    };
    if (filters?.type) where.type = filters.type;
    if (filters?.status) where.status = filters.status;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          sourceAccount: { select: { accountNumber: true } },
          destinationAccount: { select: { accountNumber: true } },
          initiator: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.transaction.count({ where }),
    ]);
    return { transactions, total };
  }

  async findByUserId(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const where = { initiatedBy: userId };
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          sourceAccount: { select: { accountNumber: true } },
          destinationAccount: { select: { accountNumber: true } },
          initiator: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.transaction.count({ where }),
    ]);
    return { transactions, total };
  }

  async findPendingApprovals(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const where = { status: "REQUIRES_APPROVAL" as const };
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          sourceAccount: { select: { accountNumber: true } },
          destinationAccount: { select: { accountNumber: true } },
          initiator: { select: { firstName: true, lastName: true } },
          approvals: {
            include: {
              approver: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),
      prisma.transaction.count({ where }),
    ]);
    return { transactions, total };
  }

  async createApproval(data: {
    transactionId: string;
    approverId: string;
    approved: boolean;
    reason?: string;
  }) {
    return prisma.transactionApproval.create({
      data,
      include: {
        approver: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async findAll(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          sourceAccount: { select: { accountNumber: true } },
          destinationAccount: { select: { accountNumber: true } },
          initiator: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.transaction.count(),
    ]);
    return { transactions, total };
  }

  async getStats() {
    const [totalTransactions, pendingApprovals] = await Promise.all([
      prisma.transaction.count(),
      prisma.transaction.count({ where: { status: "REQUIRES_APPROVAL" } }),
    ]);
    return { totalTransactions, pendingApprovals };
  }
}

export const transactionRepository = new TransactionRepository();
