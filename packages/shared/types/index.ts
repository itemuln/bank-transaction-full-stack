// =============================================================================
// Shared TypeScript Types — Used by both Frontend and Backend
// =============================================================================

// ── RBAC ─────────────────────────────────────────────────────────────────────

export enum UserRoleName {
  CUSTOMER = "CUSTOMER",
  TELLER = "TELLER",
  MANAGER = "MANAGER",
  ADMIN = "ADMIN",
}

export interface UserDTO {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isActive: boolean;
  emailVerified: boolean;
  roles: UserRoleName[];
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AuthTokenPayload {
  userId: string;
  email: string;
  roles: UserRoleName[];
  iat?: number;
  exp?: number;
}

// ── Accounts ─────────────────────────────────────────────────────────────────

export enum AccountType {
  CHECKING = "CHECKING",
  SAVINGS = "SAVINGS",
}

export enum AccountStatus {
  ACTIVE = "ACTIVE",
  FROZEN = "FROZEN",
  CLOSED = "CLOSED",
}

export interface AccountDTO {
  id: string;
  accountNumber: string;
  userId: string;
  ownerName: string;
  type: AccountType;
  status: AccountStatus;
  balance: number;
  currency: string;
  dailyLimit: number;
  createdAt: string;
}

// ── Transactions ─────────────────────────────────────────────────────────────

export enum TransactionType {
  DEPOSIT = "DEPOSIT",
  WITHDRAWAL = "WITHDRAWAL",
  TRANSFER = "TRANSFER",
}

export enum TransactionStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
  REQUIRES_APPROVAL = "REQUIRES_APPROVAL",
}

export interface TransactionDTO {
  id: string;
  idempotencyKey: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  currency: string;
  description: string | null;
  sourceAccountId: string | null;
  sourceAccountNumber: string | null;
  destinationAccountId: string | null;
  destinationAccountNumber: string | null;
  initiatedBy: string;
  initiatorName: string;
  balanceBefore: number | null;
  balanceAfter: number | null;
  fraudFlagged: boolean;
  createdAt: string;
}

export interface TransactionApprovalDTO {
  id: string;
  transactionId: string;
  approverId: string;
  approverName: string;
  approved: boolean;
  reason: string | null;
  createdAt: string;
}

// ── Audit ────────────────────────────────────────────────────────────────────

export interface AuditLogDTO {
  id: string;
  userId: string | null;
  userName: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  ipAddress: string | null;
  createdAt: string;
}

// ── API Response Envelope ────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ── Dashboard Stats ──────────────────────────────────────────────────────────

export interface DashboardStats {
  totalBalance: number;
  totalAccounts: number;
  recentTransactions: TransactionDTO[];
  monthlyIncome: number;
  monthlyExpenses: number;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalAccounts: number;
  totalTransactions: number;
  pendingApprovals: number;
  totalBalance: number;
}
