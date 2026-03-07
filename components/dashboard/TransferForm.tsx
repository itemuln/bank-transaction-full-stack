"use client";

// =============================================================================
// Transfer Form — Fund transfer between accounts
// =============================================================================

import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { formatAmount } from "@/lib/utils";
import { fetchAccounts, performTransfer } from "@/lib/api-hooks";
import type { AccountDTO } from "@/packages/shared/types";

export function TransferForm() {
  const [accounts, setAccounts] = useState<AccountDTO[]>([]);
  const [sourceAccountId, setSourceAccountId] = useState("");
  const [destinationAccountId, setDestinationAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAccounts()
      .then(({ accounts }) => setAccounts(accounts.filter((a) => a.status === "ACTIVE")))
      .catch(console.error);
  }, []);

  const selectedSource = accounts.find((a) => a.id === sourceAccountId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (sourceAccountId === destinationAccountId) {
      setError("Cannot transfer to the same account");
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setIsLoading(true);
    try {
      await performTransfer({
        sourceAccountId,
        destinationAccountId,
        amount: numAmount,
        description: description || undefined,
        idempotencyKey: uuidv4(),
      });
      setSuccess(true);
      setAmount("");
      setDescription("");
      // Refresh accounts
      const { accounts: refreshed } = await fetchAccounts();
      setAccounts(refreshed.filter((a) => a.status === "ACTIVE"));
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      setError(axiosError.response?.data?.error || "Transfer failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Transfer Funds
        </CardTitle>
        <CardDescription>
          Move money between your accounts or to another account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>Transfer completed successfully!</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label>From Account</Label>
            <Select value={sourceAccountId} onValueChange={setSourceAccountId}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select source account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.type} ••••{account.accountNumber.slice(-4)} —{" "}
                    {formatAmount(account.balance)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSource && (
              <p className="text-xs text-muted-foreground">
                Available: {formatAmount(selectedSource.balance)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>To Account</Label>
            <Select value={destinationAccountId} onValueChange={setDestinationAccountId}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select destination account" />
              </SelectTrigger>
              <SelectContent>
                {accounts
                  .filter((a) => a.id !== sourceAccountId)
                  .map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.type} ••••{account.accountNumber.slice(-4)} —{" "}
                      {formatAmount(account.balance)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Amount ($)</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="h-11 text-lg font-semibold"
            />
          </div>

          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Textarea
              placeholder="What's this transfer for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <Button
            type="submit"
            className="h-11 w-full"
            disabled={isLoading || !sourceAccountId || !destinationAccountId || !amount}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Transfer Funds
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
