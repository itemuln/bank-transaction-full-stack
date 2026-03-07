"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TransactionTable } from "@/components/dashboard/TransactionTable";
import { ChevronLeft, ChevronRight, ArrowLeftRight } from "lucide-react";
import { fetchTransactions } from "@/lib/api-hooks";
import type { TransactionDTO } from "@/packages/shared/types";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const { transactions: txs, meta } = await fetchTransactions(p, 20);
      setTransactions(txs);
      if (meta) setTotalPages(meta.totalPages);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page);
  }, [page, load]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <ArrowLeftRight className="h-7 w-7" />
          Transactions
        </h1>
        <p className="text-muted-foreground">
          View all your transaction history
        </p>
      </div>

      {loading ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : (
        <TransactionTable transactions={transactions} />
      )}

      {/* Pagination */}
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
