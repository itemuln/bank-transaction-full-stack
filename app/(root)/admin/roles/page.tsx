"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShieldCheck, Users, Landmark, ArrowLeftRight, ScrollText, Eye, Pencil, Trash2 } from "lucide-react";

// Static roles & permissions overview — in a full production system,
// this page would query the admin API for dynamic role management.
const ROLE_DEFINITIONS = [
  {
    name: "CUSTOMER",
    description: "Standard bank customer with personal account access",
    color: "bg-blue-100 text-blue-800",
    permissions: [
      "accounts:read",
      "transactions:deposit",
      "transactions:withdraw",
      "transactions:transfer",
      "transactions:read",
    ],
  },
  {
    name: "TELLER",
    description: "Bank teller who processes customer transactions",
    color: "bg-green-100 text-green-800",
    permissions: [
      "accounts:read",
      "accounts:create",
      "transactions:deposit",
      "transactions:withdraw",
      "transactions:transfer",
      "transactions:read",
      "users:read",
    ],
  },
  {
    name: "MANAGER",
    description: "Branch manager who oversees operations and approves transactions",
    color: "bg-purple-100 text-purple-800",
    permissions: [
      "accounts:read",
      "accounts:create",
      "accounts:update",
      "accounts:freeze",
      "transactions:deposit",
      "transactions:withdraw",
      "transactions:transfer",
      "transactions:read",
      "transactions:approve",
      "users:read",
      "audit:read",
    ],
  },
  {
    name: "ADMIN",
    description: "System administrator with full access to all features",
    color: "bg-red-100 text-red-800",
    permissions: [
      "accounts:read",
      "accounts:create",
      "accounts:update",
      "accounts:freeze",
      "accounts:close",
      "transactions:deposit",
      "transactions:withdraw",
      "transactions:transfer",
      "transactions:read",
      "transactions:approve",
      "users:read",
      "users:create",
      "users:update",
      "users:delete",
      "roles:manage",
      "audit:read",
      "settings:manage",
    ],
  },
];

const PERMISSION_ICONS: Record<string, React.ElementType> = {
  accounts: Landmark,
  transactions: ArrowLeftRight,
  users: Users,
  audit: ScrollText,
  roles: ShieldCheck,
  settings: ShieldCheck,
};

const ACTION_ICONS: Record<string, React.ElementType> = {
  read: Eye,
  create: Pencil,
  update: Pencil,
  delete: Trash2,
};

export default function AdminRolesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <ShieldCheck className="h-7 w-7" />
          Roles & Permissions
        </h1>
        <p className="text-muted-foreground">
          Overview of system roles and their associated permissions
        </p>
      </div>

      <div className="grid gap-6">
        {ROLE_DEFINITIONS.map((role) => (
          <Card key={role.name}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{role.name}</CardTitle>
                <Badge className={role.color}>{role.name}</Badge>
              </div>
              <CardDescription>{role.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Separator className="mb-4" />
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {role.permissions.map((perm) => {
                  const [resource, action] = perm.split(":");
                  const ResourceIcon = PERMISSION_ICONS[resource] ?? ShieldCheck;
                  const ActionIcon = ACTION_ICONS[action] ?? Eye;
                  return (
                    <div
                      key={perm}
                      className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                    >
                      <ResourceIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{resource}</span>
                      <span className="text-muted-foreground">:</span>
                      <ActionIcon className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">{action}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
