// =============================================================================
// Banking API Hooks — Data fetching hooks using the API client
// =============================================================================

import { apiClient } from "@/lib/api-client";
import type {
  AccountDTO,
  TransactionDTO,
  ApiResponse,
  PaginationMeta,
  AdminStats,
} from "@/packages/shared/types";

// ── Dashboard ────────────────────────────────────────────────────────────────

export async function fetchCustomerDashboard() {
  const { data } = await apiClient.get<
    ApiResponse<{
      totalBalance: number;
      totalAccounts: number;
      accounts: AccountDTO[];
      recentTransactions: TransactionDTO[];
      monthlyIncome: number;
      monthlyExpenses: number;
    }>
  >("/dashboard/customer");
  return data.data!;
}

export async function fetchAdminStats() {
  const { data } = await apiClient.get<ApiResponse<AdminStats>>("/dashboard/admin");
  return data.data!;
}

export async function fetchManagerDashboard() {
  const { data } = await apiClient.get<
    ApiResponse<AdminStats & { pendingApprovals: TransactionDTO[] }>
  >("/dashboard/manager");
  return data.data!;
}

// ── Accounts ─────────────────────────────────────────────────────────────────

export async function fetchAccounts(page = 1, limit = 20) {
  const { data } = await apiClient.get<ApiResponse<AccountDTO[]> & { meta?: PaginationMeta }>(
    "/accounts",
    { params: { page, limit } }
  );
  return { accounts: data.data!, meta: data.meta };
}

export async function fetchAccountById(id: string) {
  const { data } = await apiClient.get<ApiResponse<AccountDTO>>(`/accounts/${id}`);
  return data.data!;
}

export async function createAccount(input: {
  userId: string;
  type: "CHECKING" | "SAVINGS";
  initialDeposit?: number;
}) {
  const { data } = await apiClient.post<ApiResponse<AccountDTO>>("/accounts", input);
  return data.data!;
}

export async function updateAccountStatus(
  accountId: string,
  input: { status: string; reason: string }
) {
  const { data } = await apiClient.patch<ApiResponse<AccountDTO>>(
    `/accounts/${accountId}/status`,
    input
  );
  return data.data!;
}

// ── Transactions ─────────────────────────────────────────────────────────────

export async function fetchTransactions(page = 1, limit = 20) {
  const { data } = await apiClient.get<
    ApiResponse<TransactionDTO[]> & { meta?: PaginationMeta }
  >("/transactions", { params: { page, limit } });
  return { transactions: data.data!, meta: data.meta };
}

export async function fetchTransactionsByAccount(accountId: string, page = 1, limit = 20) {
  const { data } = await apiClient.get<
    ApiResponse<TransactionDTO[]> & { meta?: PaginationMeta }
  >(`/accounts/${accountId}/transactions`, { params: { page, limit } });
  return { transactions: data.data!, meta: data.meta };
}

export async function fetchPendingApprovals(page = 1, limit = 20) {
  const { data } = await apiClient.get<
    ApiResponse<TransactionDTO[]> & { meta?: PaginationMeta }
  >("/transactions/pending", { params: { page, limit } });
  return { transactions: data.data!, meta: data.meta };
}

export async function performDeposit(input: {
  accountId: string;
  amount: number;
  description?: string;
  idempotencyKey: string;
}) {
  const { data } = await apiClient.post<ApiResponse<TransactionDTO>>(
    "/transactions/deposit",
    input
  );
  return data.data!;
}

export async function performWithdrawal(input: {
  accountId: string;
  amount: number;
  description?: string;
  idempotencyKey: string;
}) {
  const { data } = await apiClient.post<ApiResponse<TransactionDTO>>(
    "/transactions/withdraw",
    input
  );
  return data.data!;
}

export async function performTransfer(input: {
  sourceAccountId: string;
  destinationAccountId: string;
  amount: number;
  description?: string;
  idempotencyKey: string;
}) {
  const { data } = await apiClient.post<ApiResponse<TransactionDTO>>(
    "/transactions/transfer",
    input
  );
  return data.data!;
}

export async function approveTransaction(
  transactionId: string,
  input: { approved: boolean; reason?: string }
) {
  const { data } = await apiClient.post<ApiResponse<TransactionDTO>>(
    `/transactions/${transactionId}/approve`,
    input
  );
  return data.data!;
}

// ── Admin ────────────────────────────────────────────────────────────────────

export async function fetchUsers(page = 1, limit = 20) {
  const { data } = await apiClient.get<
    ApiResponse<import("@/packages/shared/types").UserDTO[]> & { meta?: PaginationMeta }
  >("/admin/users", { params: { page, limit } });
  return { users: data.data!, meta: data.meta };
}

export async function assignRole(userId: string, role: string) {
  const { data } = await apiClient.post<ApiResponse>("/admin/users/assign-role", {
    userId,
    role,
  });
  return data;
}

export async function fetchAuditLogs(page = 1, limit = 50) {
  const { data } = await apiClient.get<
    ApiResponse<import("@/packages/shared/types").AuditLogDTO[]> & { meta?: PaginationMeta }
  >("/admin/audit-logs", { params: { page, limit } });
  return { logs: data.data!, meta: data.meta };
}
