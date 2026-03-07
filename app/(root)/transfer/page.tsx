"use client";

import React from "react";
import { TransferForm } from "@/components/dashboard/TransferForm";

export default function TransferPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Transfer Funds</h1>
        <p className="text-muted-foreground">
          Move money between your accounts
        </p>
      </div>

      <div className="mx-auto max-w-lg">
        <TransferForm />
      </div>
    </div>
  );
}
