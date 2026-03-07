// =============================================================================
// Banking Service — Core business logic for accounts and transactions
// =============================================================================

import { prisma } from "../config/database";
import { env } from "../config/env";
import { accountRepository } from "../repositories/account.repository";
import { transactionRepository } from "../repositories/transaction.repository";
import { createAuditLog } from "../infrastructure/audit-logger";
import { AppError } from "../middleware/error-handler";
import {
  AccountDTO,
  TransactionDTO,
  TransactionStatus,
  TransactionType,
} from "../../packages/shared/types";
import { Request } from "express";

// ── Utility: Generate unique account numbers ────────────────────────────────

function generateAccountNumber(): string {
  const prefix = "1";
  const random = Math.floor(Math.random() * 1000000000)
    .toString()
    .padStart(9, "0");
  return `${prefix}${random}`;
}

// ── Mappers ──────────────────────────────────────────────────────────────────

function mapAccountToDTO(account: {
  id: string;
  accountNumber: string;
  userId: string;
  type: string;
  status: string;
  balance: unknown;
  currency: string;
  dailyLimit: unknown;
  createdAt: Date;
  user?: { firstName: string; lastName: string } | null;
}): AccountDTO {
  return {
    id: account.id,
    accountNumber: account.accountNumber,
    userId: account.userId,
    ownerName: account.user
      ? `${account.user.firstName} ${account.user.lastName}`
      : "Unknown",
    type: account.type as AccountDTO["type"],
    status: account.status as AccountDTO["status"],
    balance: Number(account.balance),
    currency: account.currency,
    dailyLimit: Number(account.dailyLimit),
    createdAt: account.createdAt.toISOString(),
  };
}

function mapTransactionToDTO(tx: {
  id: string;
  idempotencyKey: string;
  type: string;
  status: string;
  amount: unknown;
  currency: string;
  description: string | null;
  sourceAccountId: string | null;
  destinationAccountId: string | null;
  initiatedBy: string;
  balanceBefore: unknown;
  balanceAfter: unknown;
  fraudFlagged: boolean;
  createdAt: Date;
  sourceAccount?: { accountNumber: string } | null;
  destinationAccount?: { accountNumber: string } | null;
  initiator?: { firstName: string; lastName: string } | null;
}): TransactionDTO {
  return {
    id: tx.id,
    idempotencyKey: tx.idempotencyKey,
    type: tx.type as TransactionType,
    status: tx.status as TransactionStatus,
    amount: Number(tx.amount),
    currency: tx.currency,
    description: tx.description,
    sourceAccountId: tx.sourceAccountId,
    sourceAccountNumber: tx.sourceAccount?.accountNumber ?? null,
    destinationAccountId: tx.destinationAccountId,
    destinationAccountNumber: tx.destinationAccount?.accountNumber ?? null,
    initiatedBy: tx.initiatedBy,
    initiatorName: tx.initiator
      ? `${tx.initiator.firstName} ${tx.initiator.lastName}`
      : "System",
    balanceBefore: tx.balanceBefore !== null ? Number(tx.balanceBefore) : null,
    balanceAfter: tx.balanceAfter !== null ? Number(tx.balanceAfter) : null,
    fraudFlagged: tx.fraudFlagged,
    createdAt: tx.createdAt.toISOString(),
  };
}

export class BankingService {
  // ── Account Operations ──────────────────────────────────────────────────

  async createAccount(
    input: { userId: string; type: "CHECKING" | "SAVINGS"; initialDeposit?: number; dailyLimit?: number },
    req?: Request
  ): Promise<AccountDTO> {
    const accountNumber = generateAccountNumber();

    const account = await accountRepository.create({
      accountNumber,
      userId: input.userId,
      type: input.type,
      balance: input.initialDeposit ?? 0,
      dailyLimit: input.dailyLimit,
    });

    await createAuditLog({
      userId: input.userId,
      action: "ACCOUNT_CREATED",
      resource: "accounts",
      resourceId: account.id,
      newValue: { type: input.type, initialDeposit: input.initialDeposit ?? 0 },
      req,
    });

    return mapAccountToDTO(account);
  }

  async getAccountById(id: string): Promise<AccountDTO> {
    const account = await accountRepository.findById(id);
    if (!account) throw new AppError(404, "Account not found");
    return mapAccountToDTO(account);
  }

  async getAccountsByUserId(userId: string): Promise<AccountDTO[]> {
    const accounts = await accountRepository.findByUserId(userId);
    return accounts.map(mapAccountToDTO);
  }

  async getAllAccounts(page: number, limit: number, filters?: { status?: string; type?: string }) {
    const { accounts, total } = await accountRepository.findAll(page, limit, filters);
    return {
      accounts: accounts.map(mapAccountToDTO),
      total,
    };
  }

  async updateAccountStatus(
    accountId: string,
    status: "ACTIVE" | "FROZEN" | "CLOSED",
    reason: string,
    userId: string,
    req?: Request
  ): Promise<AccountDTO> {
    const account = await accountRepository.findById(accountId);
    if (!account) throw new AppError(404, "Account not found");

    const oldStatus = account.status;
    const updated = await accountRepository.updateStatus(accountId, status);

    await createAuditLog({
      userId,
      action: "ACCOUNT_STATUS_CHANGED",
      resource: "accounts",
      resourceId: accountId,
      oldValue: { status: oldStatus },
      newValue: { status, reason },
      req,
    });

    return mapAccountToDTO(updated);
  }

  // ── Transaction Operations ──────────────────────────────────────────────

  /**
   * Deposit funds into an account.
   * Only tellers and admins can perform deposits.
   */
  async deposit(
    input: { accountId: string; amount: number; description?: string; idempotencyKey: string },
    initiatedBy: string,
    req?: Request
  ): Promise<TransactionDTO> {
    // Idempotency check
    const existing = await transactionRepository.findByIdempotencyKey(input.idempotencyKey);
    if (existing) return mapTransactionToDTO(existing as Parameters<typeof mapTransactionToDTO>[0]);

    const account = await accountRepository.findById(input.accountId);
    if (!account) throw new AppError(404, "Account not found");
    if (account.status !== "ACTIVE") throw new AppError(400, "Account is not active");

    const balanceBefore = Number(account.balance);
    const balanceAfter = balanceBefore + input.amount;

    // Fraud check: flag unusually large deposits
    const fraudFlagged = input.amount > env.LARGE_TRANSACTION_THRESHOLD * 5;

    // Execute atomically
    const [tx] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          idempotencyKey: input.idempotencyKey,
          type: "DEPOSIT",
          status: "COMPLETED",
          amount: input.amount,
          description: input.description ?? "Cash deposit",
          destinationAccountId: input.accountId,
          initiatedBy,
          balanceBefore,
          balanceAfter,
          fraudFlagged,
        },
        include: {
          sourceAccount: { select: { accountNumber: true } },
          destinationAccount: { select: { accountNumber: true } },
          initiator: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.account.update({
        where: { id: input.accountId },
        data: { balance: balanceAfter },
      }),
    ]);

    await createAuditLog({
      userId: initiatedBy,
      action: "DEPOSIT",
      resource: "transactions",
      resourceId: tx.id,
      newValue: { amount: input.amount, accountId: input.accountId },
      req,
    });

    return mapTransactionToDTO(tx);
  }

  /**
   * Withdraw funds from an account.
   * Enforces balance check and daily limits.
   */
  async withdraw(
    input: { accountId: string; amount: number; description?: string; idempotencyKey: string },
    initiatedBy: string,
    req?: Request
  ): Promise<TransactionDTO> {
    // Idempotency check
    const existing = await transactionRepository.findByIdempotencyKey(input.idempotencyKey);
    if (existing) return mapTransactionToDTO(existing as Parameters<typeof mapTransactionToDTO>[0]);

    const account = await accountRepository.findById(input.accountId);
    if (!account) throw new AppError(404, "Account not found");
    if (account.status !== "ACTIVE") throw new AppError(400, "Account is not active");

    const balanceBefore = Number(account.balance);
    if (balanceBefore < input.amount) {
      throw new AppError(400, "Insufficient funds");
    }

    // Daily limit check
    const dailySpent = await accountRepository.getDailySpent(input.accountId);
    if (dailySpent + input.amount > Number(account.dailyLimit)) {
      throw new AppError(400, "Daily withdrawal limit exceeded");
    }

    const balanceAfter = balanceBefore - input.amount;

    // Large transaction approval
    const needsApproval = input.amount > env.LARGE_TRANSACTION_THRESHOLD;

    if (needsApproval) {
      // Create pending transaction without updating balance
      const tx = await transactionRepository.create({
        idempotencyKey: input.idempotencyKey,
        type: "WITHDRAWAL",
        status: "REQUIRES_APPROVAL",
        amount: input.amount,
        description: input.description ?? "Cash withdrawal",
        sourceAccountId: input.accountId,
        initiatedBy,
        balanceBefore,
        balanceAfter,
      });

      await createAuditLog({
        userId: initiatedBy,
        action: "WITHDRAWAL_PENDING_APPROVAL",
        resource: "transactions",
        resourceId: tx.id,
        req,
      });

      return mapTransactionToDTO(tx);
    }

    // Execute atomically
    const [tx] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          idempotencyKey: input.idempotencyKey,
          type: "WITHDRAWAL",
          status: "COMPLETED",
          amount: input.amount,
          description: input.description ?? "Cash withdrawal",
          sourceAccountId: input.accountId,
          initiatedBy,
          balanceBefore,
          balanceAfter,
        },
        include: {
          sourceAccount: { select: { accountNumber: true } },
          destinationAccount: { select: { accountNumber: true } },
          initiator: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.account.update({
        where: { id: input.accountId },
        data: { balance: balanceAfter },
      }),
    ]);

    await createAuditLog({
      userId: initiatedBy,
      action: "WITHDRAWAL",
      resource: "transactions",
      resourceId: tx.id,
      newValue: { amount: input.amount, accountId: input.accountId },
      req,
    });

    return mapTransactionToDTO(tx);
  }

  /**
   * Transfer funds between accounts.
   * Enforces balance, daily limits, and approval workflow.
   */
  async transfer(
    input: {
      sourceAccountId: string;
      destinationAccountId: string;
      amount: number;
      description?: string;
      idempotencyKey: string;
    },
    initiatedBy: string,
    req?: Request
  ): Promise<TransactionDTO> {
    if (input.sourceAccountId === input.destinationAccountId) {
      throw new AppError(400, "Cannot transfer to the same account");
    }

    // Idempotency check
    const existing = await transactionRepository.findByIdempotencyKey(input.idempotencyKey);
    if (existing) return mapTransactionToDTO(existing as Parameters<typeof mapTransactionToDTO>[0]);

    const sourceAccount = await accountRepository.findById(input.sourceAccountId);
    if (!sourceAccount) throw new AppError(404, "Source account not found");
    if (sourceAccount.status !== "ACTIVE") throw new AppError(400, "Source account is not active");

    const destAccount = await accountRepository.findById(input.destinationAccountId);
    if (!destAccount) throw new AppError(404, "Destination account not found");
    if (destAccount.status !== "ACTIVE") throw new AppError(400, "Destination account is not active");

    const sourceBalance = Number(sourceAccount.balance);
    if (sourceBalance < input.amount) {
      throw new AppError(400, "Insufficient funds");
    }

    // Daily limit check
    const dailySpent = await accountRepository.getDailySpent(input.sourceAccountId);
    if (dailySpent + input.amount > Number(sourceAccount.dailyLimit)) {
      throw new AppError(400, "Daily transfer limit exceeded");
    }

    // Large transaction approval
    const needsApproval = input.amount > env.LARGE_TRANSACTION_THRESHOLD;

    if (needsApproval) {
      const tx = await transactionRepository.create({
        idempotencyKey: input.idempotencyKey,
        type: "TRANSFER",
        status: "REQUIRES_APPROVAL",
        amount: input.amount,
        description: input.description ?? "Fund transfer",
        sourceAccountId: input.sourceAccountId,
        destinationAccountId: input.destinationAccountId,
        initiatedBy,
        balanceBefore: sourceBalance,
        balanceAfter: sourceBalance - input.amount,
      });

      await createAuditLog({
        userId: initiatedBy,
        action: "TRANSFER_PENDING_APPROVAL",
        resource: "transactions",
        resourceId: tx.id,
        req,
      });

      return mapTransactionToDTO(tx);
    }

    const newSourceBalance = sourceBalance - input.amount;
    const destBalance = Number(destAccount.balance);
    const newDestBalance = destBalance + input.amount;

    // Execute atomically
    const [tx] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          idempotencyKey: input.idempotencyKey,
          type: "TRANSFER",
          status: "COMPLETED",
          amount: input.amount,
          description: input.description ?? "Fund transfer",
          sourceAccountId: input.sourceAccountId,
          destinationAccountId: input.destinationAccountId,
          initiatedBy,
          balanceBefore: sourceBalance,
          balanceAfter: newSourceBalance,
        },
        include: {
          sourceAccount: { select: { accountNumber: true } },
          destinationAccount: { select: { accountNumber: true } },
          initiator: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.account.update({
        where: { id: input.sourceAccountId },
        data: { balance: newSourceBalance },
      }),
      prisma.account.update({
        where: { id: input.destinationAccountId },
        data: { balance: newDestBalance },
      }),
    ]);

    await createAuditLog({
      userId: initiatedBy,
      action: "TRANSFER",
      resource: "transactions",
      resourceId: tx.id,
      newValue: {
        amount: input.amount,
        from: input.sourceAccountId,
        to: input.destinationAccountId,
      },
      req,
    });

    return mapTransactionToDTO(tx);
  }

  /**
   * Approve or reject a pending transaction (Manager+ only).
   */
  async approveTransaction(
    transactionId: string,
    approverId: string,
    approved: boolean,
    reason?: string,
    req?: Request
  ): Promise<TransactionDTO> {
    const tx = await transactionRepository.findById(transactionId);
    if (!tx) throw new AppError(404, "Transaction not found");
    if (tx.status !== "REQUIRES_APPROVAL") {
      throw new AppError(400, "Transaction is not pending approval");
    }

    // Create approval record
    await transactionRepository.createApproval({
      transactionId,
      approverId,
      approved,
      reason,
    });

    if (approved) {
      // Execute the transaction
      if (tx.type === "WITHDRAWAL" && tx.sourceAccountId) {
        const account = await accountRepository.findById(tx.sourceAccountId);
        if (!account) throw new AppError(404, "Source account not found");

        const currentBalance = Number(account.balance);
        if (currentBalance < Number(tx.amount)) {
          await transactionRepository.updateStatus(transactionId, "FAILED");
          throw new AppError(400, "Insufficient funds — balance changed since request");
        }

        await prisma.$transaction([
          prisma.transaction.update({
            where: { id: transactionId },
            data: { status: "COMPLETED" },
          }),
          prisma.account.update({
            where: { id: tx.sourceAccountId },
            data: { balance: currentBalance - Number(tx.amount) },
          }),
        ]);
      } else if (tx.type === "TRANSFER" && tx.sourceAccountId && tx.destinationAccountId) {
        const source = await accountRepository.findById(tx.sourceAccountId);
        const dest = await accountRepository.findById(tx.destinationAccountId);
        if (!source || !dest) throw new AppError(404, "Account not found");

        const sourceBalance = Number(source.balance);
        if (sourceBalance < Number(tx.amount)) {
          await transactionRepository.updateStatus(transactionId, "FAILED");
          throw new AppError(400, "Insufficient funds — balance changed since request");
        }

        await prisma.$transaction([
          prisma.transaction.update({
            where: { id: transactionId },
            data: { status: "COMPLETED" },
          }),
          prisma.account.update({
            where: { id: tx.sourceAccountId },
            data: { balance: sourceBalance - Number(tx.amount) },
          }),
          prisma.account.update({
            where: { id: tx.destinationAccountId },
            data: { balance: Number(dest.balance) + Number(tx.amount) },
          }),
        ]);
      }
    } else {
      await transactionRepository.updateStatus(transactionId, "CANCELLED");
    }

    await createAuditLog({
      userId: approverId,
      action: approved ? "TRANSACTION_APPROVED" : "TRANSACTION_REJECTED",
      resource: "transactions",
      resourceId: transactionId,
      newValue: { approved, reason },
      req,
    });

    const updated = await transactionRepository.findById(transactionId);
    return mapTransactionToDTO(updated as Parameters<typeof mapTransactionToDTO>[0]);
  }

  // ── Query Operations ────────────────────────────────────────────────────

  async getTransactionById(id: string): Promise<TransactionDTO> {
    const tx = await transactionRepository.findById(id);
    if (!tx) throw new AppError(404, "Transaction not found");
    return mapTransactionToDTO(tx);
  }

  async getTransactionsByAccountId(accountId: string, page: number, limit: number) {
    const { transactions, total } = await transactionRepository.findByAccountId(accountId, page, limit);
    return { transactions: transactions.map(mapTransactionToDTO), total };
  }

  async getTransactionsByUserId(userId: string, page: number, limit: number) {
    const { transactions, total } = await transactionRepository.findByUserId(userId, page, limit);
    return { transactions: transactions.map(mapTransactionToDTO), total };
  }

  async getPendingApprovals(page: number, limit: number) {
    const { transactions, total } = await transactionRepository.findPendingApprovals(page, limit);
    return { transactions: transactions.map(mapTransactionToDTO), total };
  }

  async getAllTransactions(page: number, limit: number) {
    const { transactions, total } = await transactionRepository.findAll(page, limit);
    return { transactions: transactions.map(mapTransactionToDTO), total };
  }

  // ── Dashboard Stats ─────────────────────────────────────────────────────

  async getCustomerDashboard(userId: string) {
    const accounts = await accountRepository.findByUserId(userId);
    const totalBalance = accounts.reduce((sum: number, a: { balance: unknown }) => sum + Number(a.balance), 0);

    const { transactions } = await transactionRepository.findByUserId(userId, 1, 10);

    // Monthly income/expenses (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let monthlyIncome = 0;
    let monthlyExpenses = 0;
    for (const tx of transactions) {
      const amount = Number(tx.amount);
      if (tx.createdAt >= thirtyDaysAgo) {
        if (tx.type === "DEPOSIT" || (tx.type === "TRANSFER" && tx.destinationAccount)) {
          monthlyIncome += amount;
        }
        if (tx.type === "WITHDRAWAL" || (tx.type === "TRANSFER" && tx.sourceAccount)) {
          monthlyExpenses += amount;
        }
      }
    }

    return {
      totalBalance,
      totalAccounts: accounts.length,
      accounts: accounts.map(mapAccountToDTO),
      recentTransactions: transactions.map(mapTransactionToDTO),
      monthlyIncome,
      monthlyExpenses,
    };
  }

  async getAdminStats() {
    const [accountStats, txStats, userStats] = await Promise.all([
      accountRepository.getStats(),
      transactionRepository.getStats(),
      prisma.user.count().then(async (totalUsers: number) => ({
        totalUsers,
        activeUsers: await prisma.user.count({ where: { isActive: true } }),
      })),
    ]);

    return {
      ...accountStats,
      ...txStats,
      ...userStats,
    };
  }
}

export const bankingService = new BankingService();
export { mapAccountToDTO, mapTransactionToDTO };
