"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { TransactionTable } from "@/components/dashboard/TransactionTable";
import {
  ArrowLeft,
  CreditCard,
  Landmark,
  DollarSign,
  CalendarDays,
} from "lucide-react";
import { fetchAccountById, fetchTransactionsByAccount } from "@/lib/api-hooks";
import { formatAmount, formatDateTime } from "@/lib/utils";
import type { AccountDTO, TransactionDTO } from "@/packages/shared/types";

export default function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [account, setAccount] = useState<AccountDTO | null>(null);
  const [transactions, setTransactions] = useState<TransactionDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchAccountById(id),
      fetchTransactionsByAccount(id),
    ])
      .then(([acc, txData]) => {
        setAccount(acc);
        setTransactions(txData.transactions);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-xl font-semibold">Account not found</h2>
        <Button variant="link" onClick={() => router.push("/accounts")}>
          Back to accounts
        </Button>
      </div>
    );
  }

  const statusColor: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800",
    FROZEN: "bg-yellow-100 text-yellow-800",
    CLOSED: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Account Details</h1>
          <p className="text-muted-foreground">
            ••••{account.accountNumber.slice(-4)}
          </p>
        </div>
      </div>

      {/* Account info card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {account.type === "CHECKING" ? (
                <CreditCard className="h-5 w-5" />
              ) : (
                <Landmark className="h-5 w-5" />
              )}
              {account.type} Account
            </div>
            <Badge className={statusColor[account.status] ?? ""}>
              {account.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Account Number</p>
              <p className="font-mono text-lg font-semibold">{account.accountNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Balance</p>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <p className="text-2xl font-bold">{formatAmount(account.balance)}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Opened</p>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">{formatDateTime(new Date(account.createdAt)).dateTime}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Transaction History */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Transaction History</h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No transactions yet for this account.</p>
        ) : (
          <TransactionTable transactions={transactions} />
        )}
      </div>
    </div>
  );
}
