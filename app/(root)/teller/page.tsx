"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TellerTransactionForm } from "@/components/dashboard/TellerTransactionForm";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";

export default function TellerPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Teller Operations</h1>
        <p className="text-muted-foreground">
          Process customer deposits and withdrawals
        </p>
      </div>

      <div className="mx-auto max-w-lg">
        <Tabs defaultValue="deposit">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deposit" className="flex items-center gap-2">
              <ArrowDownToLine className="h-4 w-4" />
              Deposit
            </TabsTrigger>
            <TabsTrigger value="withdrawal" className="flex items-center gap-2">
              <ArrowUpFromLine className="h-4 w-4" />
              Withdrawal
            </TabsTrigger>
          </TabsList>
          <TabsContent value="deposit" className="mt-4">
            <TellerTransactionForm type="DEPOSIT" />
          </TabsContent>
          <TabsContent value="withdrawal" className="mt-4">
            <TellerTransactionForm type="WITHDRAWAL" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
