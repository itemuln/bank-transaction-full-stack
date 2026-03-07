// =============================================================================
// Account Repository — Database access for banking accounts
// =============================================================================

import { prisma } from "../config/database";

export class AccountRepository {
  async findById(id: string) {
    return prisma.account.findUnique({
      where: { id },
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    });
  }

  async findByAccountNumber(accountNumber: string) {
    return prisma.account.findUnique({
      where: { accountNumber },
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    });
  }

  async findByUserId(userId: string) {
    return prisma.account.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    });
  }

  async create(data: {
    accountNumber: string;
    userId: string;
    type: "CHECKING" | "SAVINGS";
    balance?: number;
    dailyLimit?: number;
  }) {
    return prisma.account.create({
      data: {
        accountNumber: data.accountNumber,
        userId: data.userId,
        type: data.type,
        balance: data.balance ?? 0,
        dailyLimit: data.dailyLimit ?? 10000,
      },
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    });
  }

  async updateBalance(id: string, newBalance: number) {
    return prisma.account.update({
      where: { id },
      data: { balance: newBalance },
    });
  }

  async updateStatus(id: string, status: "ACTIVE" | "FROZEN" | "CLOSED") {
    return prisma.account.update({
      where: { id },
      data: { status },
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    });
  }

  async findAll(page: number, limit: number, filters?: { status?: string; type?: string }) {
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.type) where.type = filters.type;

    const [accounts, total] = await Promise.all([
      prisma.account.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
      }),
      prisma.account.count({ where }),
    ]);
    return { accounts, total };
  }

  async getStats() {
    const [totalAccounts, totalBalance] = await Promise.all([
      prisma.account.count(),
      prisma.account.aggregate({ _sum: { balance: true } }),
    ]);
    return {
      totalAccounts,
      totalBalance: Number(totalBalance._sum.balance ?? 0),
    };
  }

  /**
   * Get total spent today for daily limit enforcement.
   */
  async getDailySpent(accountId: string): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const result = await prisma.transaction.aggregate({
      where: {
        sourceAccountId: accountId,
        type: { in: ["WITHDRAWAL", "TRANSFER"] },
        status: { in: ["COMPLETED", "PENDING"] },
        createdAt: { gte: startOfDay },
      },
      _sum: { amount: true },
    });

    return Number(result._sum.amount ?? 0);
  }
}

export const accountRepository = new AccountRepository();
