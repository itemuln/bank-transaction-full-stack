"use client";

import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { StatCard } from "@/components/dashboard/StatCard";
import { AccountCard } from "@/components/dashboard/AccountCard";
import { TransactionTable } from "@/components/dashboard/TransactionTable";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchCustomerDashboard,
  fetchAdminStats,
  fetchAccounts,
  fetchTransactions,
} from "@/lib/api-hooks";
import {
  DollarSign,
  CreditCard,
  ArrowUpDown,
  TrendingUp,
  Users,
  ShieldCheck,
  Activity,
} from "lucide-react";
import type { AccountDTO, TransactionDTO, DashboardStats, AdminStats } from "@/packages/shared/types";
import { UserRoleName } from "@/packages/shared/types";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const roles = user?.roles ?? [];

  const isAdmin = roles.includes(UserRoleName.ADMIN);
  const isManager = roles.includes(UserRoleName.MANAGER);
  const isTeller = roles.includes(UserRoleName.TELLER);

  if (isAdmin) return <AdminDashboard />;
  if (isManager || isTeller) return <StaffDashboard />;
  return <CustomerDashboard />;
}

// =============================================================================
// Customer Dashboard
// =============================================================================

function CustomerDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [accounts, setAccounts] = useState<AccountDTO[]>([]);
  const [transactions, setTransactions] = useState<TransactionDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchCustomerDashboard(),
      fetchAccounts(),
      fetchTransactions(1, 10),
    ])
      .then(([dashData, accData, txData]) => {
        setStats(dashData);
        setAccounts(accData.accounts);
        setTransactions(txData.transactions);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome, {user?.firstName} 👋
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your finances
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Balance"
          value={`$${(stats?.totalBalance ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          subtitle="Across all accounts"
          trend={{ value: 2.5, label: "vs last month" }}
        />
        <StatCard
          title="Accounts"
          value={String(stats?.totalAccounts ?? 0)}
          icon={CreditCard}
          subtitle="Active accounts"
        />
        <StatCard
          title="Monthly Income"
          value={`$${(stats?.monthlyIncome ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          icon={ArrowUpDown}
          subtitle="This month"
        />
        <StatCard
          title="Monthly Expenses"
          value={`$${(stats?.monthlyExpenses ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          icon={TrendingUp}
          subtitle="This month"
        />
      </div>

      {/* Accounts */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Accounts</h2>
        {accounts.length === 0 ? (
          <p className="text-muted-foreground">No accounts yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {accounts.map((a) => (
              <AccountCard key={a.id} account={a} />
            ))}
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Recent Transactions</h2>
        <TransactionTable transactions={transactions} />
      </div>
    </div>
  );
}

// =============================================================================
// Staff Dashboard (Teller / Manager)
// =============================================================================

function StaffDashboard() {
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState<TransactionDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions(1, 20)
      .then(({ transactions: txs }) => setTransactions(txs))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Staff Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.firstName}. Manage customer operations.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Pending Approvals"
          value="—"
          icon={ShieldCheck}
          subtitle="Requires action"
        />
        <StatCard
          title="Today's Transactions"
          value={String(transactions.length)}
          icon={ArrowUpDown}
          subtitle="Processed"
        />
        <StatCard
          title="Active Accounts"
          value="—"
          icon={CreditCard}
          subtitle="In system"
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Recent Transactions</h2>
        <TransactionTable transactions={transactions} />
      </div>
    </div>
  );
}

// =============================================================================
// Admin Dashboard
// =============================================================================

function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground">
          System-wide overview and management
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={String(stats?.totalUsers ?? 0)}
          icon={Users}
          subtitle="Registered"
        />
        <StatCard
          title="Total Accounts"
          value={String(stats?.totalAccounts ?? 0)}
          icon={CreditCard}
          subtitle="In system"
        />
        <StatCard
          title="Total Transactions"
          value={String(stats?.totalTransactions ?? 0)}
          icon={Activity}
          subtitle="All time"
        />
        <StatCard
          title="Pending Approvals"
          value={String(stats?.pendingApprovals ?? 0)}
          icon={ShieldCheck}
          subtitle="Needs review"
        />
      </div>
    </div>
  );
}

// =============================================================================
// Loading skeleton
// =============================================================================

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-48" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}
