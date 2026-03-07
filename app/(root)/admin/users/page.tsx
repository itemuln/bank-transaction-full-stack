"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Users,
  ShieldPlus,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { fetchUsers, assignRole } from "@/lib/api-hooks";
import { formatDateTime } from "@/lib/utils";
import type { UserDTO } from "@/packages/shared/types";
import { UserRoleName } from "@/packages/shared/types";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserDTO | null>(null);
  const [newRole, setNewRole] = useState<string>("");
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const loadUsers = () => {
    fetchUsers()
      .then(({ users: data }) => setUsers(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleAssign = async () => {
    if (!selectedUser || !newRole) return;
    setAssigning(true);
    setError("");
    setSuccess(false);
    try {
      await assignRole(selectedUser.id, newRole);
      setSuccess(true);
      loadUsers();
      setTimeout(() => {
        setSelectedUser(null);
        setSuccess(false);
      }, 1500);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      setError(axiosError.response?.data?.error || "Failed to assign role");
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Users className="h-7 w-7" />
          User Management
        </h1>
        <p className="text-muted-foreground">
          View all users and manage their roles
        </p>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.firstName} {user.lastName}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {user.email}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {user.roles.map((role) => (
                      <Badge key={role} variant="secondary" className="text-xs">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={user.isActive ? "default" : "destructive"}>
                    {user.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDateTime(new Date(user.createdAt)).dateOnly}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedUser(user);
                      setNewRole("");
                      setError("");
                      setSuccess(false);
                    }}
                  >
                    <ShieldPlus className="mr-1 h-4 w-4" />
                    Assign Role
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Assign Role Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={(o) => !o && setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Role</DialogTitle>
            <DialogDescription>
              {selectedUser
                ? `Assign a role to ${selectedUser.firstName} ${selectedUser.lastName}`
                : "Select a user"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50 text-green-800">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>Role assigned successfully!</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label>Current Roles</Label>
              <div className="flex flex-wrap gap-1">
                {selectedUser?.roles.map((r) => (
                  <Badge key={r} variant="secondary">{r}</Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>New Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role to assign" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(UserRoleName).map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full"
              onClick={handleAssign}
              disabled={assigning || !newRole}
            >
              {assigning ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ShieldPlus className="mr-2 h-4 w-4" />
              )}
              Assign Role
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
