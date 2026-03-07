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
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchAuditLogs } from "@/lib/api-hooks";
import { formatDateTime } from "@/lib/utils";
import type { AuditLogDTO } from "@/packages/shared/types";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const { logs: data, meta } = await fetchAuditLogs(page);
        if (!cancelled) {
          setLogs(data);
          if (meta) setTotalPages(meta.totalPages);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [page]);

  const filtered = search
    ? logs.filter(
        (l) =>
          l.action.toLowerCase().includes(search.toLowerCase()) ||
          l.resource.toLowerCase().includes(search.toLowerCase()) ||
          (l.userName ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : logs;

  const actionColor: Record<string, string> = {
    CREATE: "bg-green-100 text-green-800",
    UPDATE: "bg-blue-100 text-blue-800",
    DELETE: "bg-red-100 text-red-800",
    LOGIN: "bg-purple-100 text-purple-800",
    LOGOUT: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="h-7 w-7" />
          Audit Logs
        </h1>
        <p className="text-muted-foreground">
          Track all system activities and changes
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-10"
          placeholder="Filter by action, resource, or user..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <Skeleton className="h-96 rounded-xl" />
      ) : (
        <ScrollArea className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Resource ID</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No audit logs found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDateTime(new Date(log.createdAt)).dateTime}
                    </TableCell>
                    <TableCell className="font-medium">
                      {log.userName ?? "System"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          actionColor[log.action.split("_")[0]] ??
                          "bg-gray-100 text-gray-800"
                        }
                      >
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{log.resource}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {log.resourceId ? `...${log.resourceId.slice(-8)}` : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.ipAddress ?? "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
