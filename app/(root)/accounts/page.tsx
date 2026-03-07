"use client";

import React, { useEffect, useState } from "react";
import { AccountCard } from "@/components/dashboard/AccountCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Loader2, CreditCard, AlertCircle } from "lucide-react";
import { fetchAccounts, createAccount } from "@/lib/api-hooks";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { AccountDTO } from "@/packages/shared/types";

export default function AccountsPage() {
  const { user } = useAuthStore();
  const [accounts, setAccounts] = useState<AccountDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newType, setNewType] = useState<"CHECKING" | "SAVINGS">("CHECKING");
  const [initialDeposit, setInitialDeposit] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const loadAccounts = () => {
    fetchAccounts()
      .then(({ accounts: accs }) => setAccounts(accs))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleCreate = async () => {
    if (!user) return;
    setError("");
    setCreating(true);
    try {
      await createAccount({
        userId: user.id,
        type: newType,
        initialDeposit: initialDeposit ? parseFloat(initialDeposit) : undefined,
      });
      setDialogOpen(false);
      setInitialDeposit("");
      loadAccounts();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      setError(axiosError.response?.data?.error || "Failed to create account");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-9 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Accounts</h1>
          <p className="text-muted-foreground">
            Manage your bank accounts
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Open New Account</DialogTitle>
              <DialogDescription>
                Choose account type and optional initial deposit.
              </DialogDescription>
            </DialogHeader>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Account Type</Label>
                <Select
                  value={newType}
                  onValueChange={(v) => setNewType(v as "CHECKING" | "SAVINGS")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CHECKING">Checking</SelectItem>
                    <SelectItem value="SAVINGS">Savings</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Initial Deposit ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={initialDeposit}
                  onChange={(e) => setInitialDeposit(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleCreate}
                disabled={creating}
              >
                {creating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="mr-2 h-4 w-4" />
                )}
                Open Account
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
          <CreditCard className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold">No accounts yet</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Open your first bank account to get started.
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Open Account
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      )}
    </div>
  );
}
