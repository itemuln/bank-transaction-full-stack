"use client";

// =============================================================================
// Auth Guard — Protects routes based on authentication and roles
// =============================================================================

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import { UserRoleName } from "@/packages/shared/types";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRoleName[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, fetchUser } = useAuthStore();
  const [authChecked, setAuthChecked] = React.useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      if (!isAuthenticated) {
        try {
          await fetchUser();
        } catch {
          if (!cancelled) router.replace("/sign-in");
          return;
        }
      }
      if (!cancelled) setAuthChecked(true);
    }

    checkAuth();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Still checking auth
  if (isLoading || !authChecked) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated after check completed
  if (!isAuthenticated || !user) {
    router.replace("/sign-in");
    return null;
  }

  // Role check
  if (allowedRoles && allowedRoles.length > 0) {
    const hasRole = user.roles.some((role) =>
      allowedRoles.includes(role as UserRoleName)
    );
    if (!hasRole) {
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Access Denied</h2>
            <p className="mt-2 text-muted-foreground">
              You don&apos;t have permission to access this page.
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
