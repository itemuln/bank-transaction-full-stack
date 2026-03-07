"use client";

// =============================================================================
// Deposit / Withdrawal Form — Teller operations
// =============================================================================

import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowDownToLine, ArrowUpFromLine, CheckCircle2, AlertCircle } from "lucide-react";
import { performDeposit, performWithdrawal } from "@/lib/api-hooks";

interface TellerTransactionFormProps {
  type: "DEPOSIT" | "WITHDRAWAL";
}

export function TellerTransactionForm({ type }: TellerTransactionFormProps) {
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const isDeposit = type === "DEPOSIT";
  const Icon = isDeposit ? ArrowDownToLine : ArrowUpFromLine;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setIsLoading(true);
    try {
      // We need accountId, but teller has account number. The API uses accountId,
      // so in a production system you'd search by account number first.
      // For now, we treat the input as the accountId.
      const payload = {
        accountId: accountNumber,
        amount: numAmount,
        description: description || undefined,
        idempotencyKey: uuidv4(),
      };

      if (isDeposit) {
        await performDeposit(payload);
      } else {
        await performWithdrawal(payload);
      }

      setSuccess(true);
      setAmount("");
      setDescription("");
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      setError(axiosError.response?.data?.error || `${type.toLowerCase()} failed`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {isDeposit ? "Deposit" : "Withdrawal"}
        </CardTitle>
        <CardDescription>
          {isDeposit
            ? "Add funds to a customer account"
            : "Remove funds from a customer account"}
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
              <AlertDescription>
                {isDeposit ? "Deposit" : "Withdrawal"} completed successfully!
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label>Account ID / Number</Label>
            <Input
              placeholder="Enter account ID or number"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              required
              className="h-11 font-mono"
            />
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
              placeholder={`Reason for ${type.toLowerCase()}`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <Button
            type="submit"
            className="h-11 w-full"
            disabled={isLoading || !accountNumber || !amount}
            variant={isDeposit ? "default" : "destructive"}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Icon className="mr-2 h-4 w-4" />
                {isDeposit ? "Deposit Funds" : "Withdraw Funds"}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
