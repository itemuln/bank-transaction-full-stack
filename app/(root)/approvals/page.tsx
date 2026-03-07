"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  CheckCircle,
  XCircle,
  ShieldCheck,
  Loader2,
  DollarSign,
  ArrowRight,
} from "lucide-react";
import { fetchPendingApprovals, approveTransaction } from "@/lib/api-hooks";
import { formatAmount, formatDateTime } from "@/lib/utils";
import type { TransactionDTO } from "@/packages/shared/types";

export default function ApprovalsPage() {
  const [pending, setPending] = useState<TransactionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionTx, setActionTx] = useState<TransactionDTO | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [reason, setReason] = useState("");
  const [processing, setProcessing] = useState(false);

  const loadPending = () => {
    fetchPendingApprovals()
      .then(({ transactions }) => setPending(transactions))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleAction = async () => {
    if (!actionTx) return;
    setProcessing(true);
    try {
      await approveTransaction(actionTx.id, {
        approved: actionType === "approve",
        reason: reason || undefined,
      });
      setActionTx(null);
      setReason("");
      loadPending();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const openAction = (tx: TransactionDTO, type: "approve" | "reject") => {
    setActionTx(tx);
    setActionType(type);
    setReason("");
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-9 w-64" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pending Approvals</h1>
        <p className="text-muted-foreground">
          Review and approve large or flagged transactions
        </p>
      </div>

      {pending.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
          <ShieldCheck className="mb-4 h-12 w-12 text-green-500" />
          <h3 className="text-lg font-semibold">All caught up!</h3>
          <p className="text-sm text-muted-foreground">
            There are no transactions waiting for approval.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((tx) => (
            <Card key={tx.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <DollarSign className="h-4 w-4" />
                    {tx.type} — {formatAmount(tx.amount)}
                  </CardTitle>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                    Pending
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">
                      {formatDateTime(new Date(tx.createdAt)).dateTime}
                    </p>
                    {tx.description && (
                      <p className="text-muted-foreground">{tx.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>From: ••••{tx.sourceAccountId?.slice(-4) ?? "N/A"}</span>
                      {tx.destinationAccountId && (
                        <>
                          <ArrowRight className="h-3 w-3" />
                          <span>To: ••••{tx.destinationAccountId.slice(-4)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600 hover:bg-green-50"
                      onClick={() => openAction(tx, "approve")}
                    >
                      <CheckCircle className="mr-1 h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => openAction(tx, "reject")}
                    >
                      <XCircle className="mr-1 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Action Dialog */}
      <Dialog open={!!actionTx} onOpenChange={(open) => !open && setActionTx(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve" : "Reject"} Transaction
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? "Confirm you want to approve this transaction."
                : "Provide a reason for rejecting this transaction."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {actionTx && (
              <div className="rounded-lg bg-muted p-3 text-sm">
                <p className="font-medium">
                  {actionTx.type} — {formatAmount(actionTx.amount)}
                </p>
                <p className="text-muted-foreground">{actionTx.description}</p>
              </div>
            )}
            <Textarea
              placeholder={
                actionType === "reject"
                  ? "Reason for rejection (required)"
                  : "Optional note"
              }
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setActionTx(null)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                variant={actionType === "approve" ? "default" : "destructive"}
                onClick={handleAction}
                disabled={processing || (actionType === "reject" && !reason.trim())}
              >
                {processing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : actionType === "approve" ? (
                  <CheckCircle className="mr-2 h-4 w-4" />
                ) : (
                  <XCircle className="mr-2 h-4 w-4" />
                )}
                {actionType === "approve" ? "Approve" : "Reject"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
