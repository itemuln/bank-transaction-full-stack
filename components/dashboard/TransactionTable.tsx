"use client";

// =============================================================================
// Transaction Table — Displays transaction history with status badges
// =============================================================================

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatAmount, formatDateTime } from "@/lib/utils";
import type { TransactionDTO } from "@/packages/shared/types";
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from "lucide-react";

interface TransactionTableProps {
  transactions: TransactionDTO[];
  showActions?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

const statusStyles: Record<string, string> = {
  COMPLETED: "bg-green-100 text-green-700 border-green-200",
  PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
  REQUIRES_APPROVAL: "bg-orange-100 text-orange-700 border-orange-200",
  FAILED: "bg-red-100 text-red-700 border-red-200",
  CANCELLED: "bg-gray-100 text-gray-700 border-gray-200",
};

const typeIcons: Record<string, React.ElementType> = {
  DEPOSIT: ArrowDownLeft,
  WITHDRAWAL: ArrowUpRight,
  TRANSFER: ArrowLeftRight,
};

export function TransactionTable({ transactions, showActions, onApprove, onReject }: TransactionTableProps) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ArrowLeftRight className="h-10 w-10 text-muted-foreground/50" />
        <p className="mt-3 text-sm text-muted-foreground">No transactions found</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>From</TableHead>
            <TableHead>To</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            {showActions && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => {
            const Icon = typeIcons[tx.type] || ArrowLeftRight;
            const dateInfo = formatDateTime(new Date(tx.createdAt));

            return (
              <TableRow key={tx.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        tx.type === "DEPOSIT"
                          ? "bg-green-100"
                          : tx.type === "WITHDRAWAL"
                          ? "bg-red-100"
                          : "bg-blue-100"
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 ${
                          tx.type === "DEPOSIT"
                            ? "text-green-600"
                            : tx.type === "WITHDRAWAL"
                            ? "text-red-600"
                            : "text-blue-600"
                        }`}
                      />
                    </div>
                    <span className="text-sm font-medium capitalize">
                      {tx.type.toLowerCase()}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    className={`font-semibold ${
                      tx.type === "DEPOSIT" ? "text-green-600" : "text-foreground"
                    }`}
                  >
                    {tx.type === "DEPOSIT" ? "+" : tx.type === "WITHDRAWAL" ? "-" : ""}
                    {formatAmount(tx.amount)}
                  </span>
                </TableCell>
                <TableCell className="max-w-50 truncate text-sm text-muted-foreground">
                  {tx.description || "—"}
                </TableCell>
                <TableCell className="text-sm">
                  {tx.sourceAccountNumber ? `••••${tx.sourceAccountNumber.slice(-4)}` : "—"}
                </TableCell>
                <TableCell className="text-sm">
                  {tx.destinationAccountNumber
                    ? `••••${tx.destinationAccountNumber.slice(-4)}`
                    : "—"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={statusStyles[tx.status] || ""}
                  >
                    {tx.status.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {dateInfo.dateOnly}
                </TableCell>
                {showActions && tx.status === "REQUIRES_APPROVAL" && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onApprove?.(tx.id)}
                        className="rounded-md bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => onReject?.(tx.id)}
                        className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
