"use client";

// =============================================================================
// Account Card — Displays a single bank account with status and balance
// =============================================================================

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatAmount } from "@/lib/utils";
import type { AccountDTO } from "@/packages/shared/types";
import { CreditCard, PiggyBank } from "lucide-react";

interface AccountCardProps {
  account: AccountDTO;
}

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ACTIVE: "default",
  FROZEN: "destructive",
  CLOSED: "secondary",
};

export function AccountCard({ account }: AccountCardProps) {
  const Icon = account.type === "CHECKING" ? CreditCard : PiggyBank;

  return (
    <Link href={`/accounts/${account.id}`}>
      <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm font-medium">
                {account.type === "CHECKING" ? "Checking" : "Savings"} Account
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                ••••{account.accountNumber.slice(-4)}
              </p>
            </div>
          </div>
          <Badge variant={statusVariant[account.status] ?? "outline"}>
            {account.status}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-bold tracking-tight">
              {formatAmount(account.balance)}
            </p>
            <p className="text-xs text-muted-foreground">
              Daily limit: {formatAmount(account.dailyLimit)}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
