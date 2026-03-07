"use client";

// =============================================================================
// Sidebar Navigation — Role-aware navigation for the banking dashboard
// =============================================================================

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import { cn } from "@/lib/utils";
import { UserRoleName } from "@/packages/shared/types";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Users,
  ShieldCheck,
  ScrollText,
  Settings,
  LogOut,
  Building2,
  ClipboardCheck,
  Landmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: UserRoleName[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    roles: [UserRoleName.CUSTOMER, UserRoleName.TELLER, UserRoleName.MANAGER, UserRoleName.ADMIN],
  },
  {
    label: "Accounts",
    href: "/accounts",
    icon: Wallet,
    roles: [UserRoleName.CUSTOMER, UserRoleName.TELLER, UserRoleName.MANAGER, UserRoleName.ADMIN],
  },
  {
    label: "Transactions",
    href: "/transactions",
    icon: ArrowLeftRight,
    roles: [UserRoleName.CUSTOMER, UserRoleName.TELLER, UserRoleName.MANAGER, UserRoleName.ADMIN],
  },
  {
    label: "Transfer Funds",
    href: "/transfer",
    icon: Landmark,
    roles: [UserRoleName.CUSTOMER],
  },
  {
    label: "Teller Operations",
    href: "/teller",
    icon: Building2,
    roles: [UserRoleName.TELLER],
  },
  {
    label: "Approvals",
    href: "/approvals",
    icon: ClipboardCheck,
    roles: [UserRoleName.MANAGER, UserRoleName.ADMIN],
  },
  {
    label: "User Management",
    href: "/admin/users",
    icon: Users,
    roles: [UserRoleName.ADMIN],
  },
  {
    label: "Roles & Permissions",
    href: "/admin/roles",
    icon: ShieldCheck,
    roles: [UserRoleName.ADMIN],
  },
  {
    label: "Audit Logs",
    href: "/admin/audit-logs",
    icon: ScrollText,
    roles: [UserRoleName.ADMIN, UserRoleName.MANAGER],
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    roles: [UserRoleName.ADMIN],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  if (!user) return null;

  const userRoles = user.roles as UserRoleName[];
  const visibleItems = NAV_ITEMS.filter((item) =>
    item.roles.some((role) => userRoles.includes(role))
  );

  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border/40 bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-br from-blue-600 to-indigo-600">
          <Building2 className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-bold tracking-tight">Horizon</span>
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* User Profile */}
      <div className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 truncate">
            <p className="truncate text-sm font-medium">
              {user.firstName} {user.lastName}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {user.roles[0]}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            onClick={() => logout()}
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
