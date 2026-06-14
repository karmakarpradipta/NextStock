import { useState } from "react";
import { useGetAuditLogsQuery, type AuditFilters } from "../features/audit/auditApiSlice";
import { useGetUsersQuery } from "../features/auth/usersApiSlice";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../components/ui/pagination";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Activity,
  Calendar,
  User,
  RotateCw,
  Eye,
  Terminal,
  Database,
  Globe,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Skeleton } from "../components/ui/skeleton";
import { Input } from "../components/ui/input";

const AuditLogPage = () => {
  const [filters, setFilters] = useState<AuditFilters>({
    page: 1,
    limit: 10,
    action: undefined,
    entity: undefined,
    userId: undefined,
    from: undefined,
    to: undefined,
  });

  const { data, isLoading, refetch, isFetching } = useGetAuditLogsQuery(filters);
  const { data: users } = useGetUsersQuery();

  const handleFilterChange = (key: keyof AuditFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === "all" ? undefined : value,
      page: key === "page" ? value : 1,
    }));
  };

  const getActionBadge = (action: string) => {
    const actionUpper = action.toUpperCase();
    if (actionUpper.includes("LOGIN") || actionUpper.includes("LOGOUT")) {
      return <Badge className="bg-blue-500 hover:bg-blue-600 border-none">{action}</Badge>;
    }
    if (actionUpper.includes("CREATED") || actionUpper.includes("APPROVED") || actionUpper.includes("SUCCESS")) {
      return <Badge className="bg-emerald-500 hover:bg-emerald-600 border-none">{action}</Badge>;
    }
    if (actionUpper.includes("UPDATED") || actionUpper.includes("MODIFIED")) {
      return <Badge className="bg-amber-500 hover:bg-amber-600 border-none">{action}</Badge>;
    }
    if (actionUpper.includes("DELETED") || actionUpper.includes("CANCELLED") || actionUpper.includes("REJECTED") || actionUpper.includes("FAILED")) {
      return <Badge className="bg-rose-500 hover:bg-rose-600 border-none">{action}</Badge>;
    }
    if (actionUpper.includes("CONFIRMED")) {
      return <Badge className="bg-purple-500 hover:bg-purple-600 border-none">{action}</Badge>;
    }
    return <Badge variant="secondary">{action}</Badge>;
  };

  const entities = [
    "Product",
    "Category",
    "Vendor",
    "PurchaseOrder",
    "Sale",
    "User",
    "StockMovement",
  ];

  const actions = [
    "LOGIN",
    "LOGOUT",
    "CREATED",
    "UPDATED",
    "DELETED",
    "CONFIRMED",
    "CANCELLED",
    "APPROVED",
    "REJECTED",
  ];

  const formatIP = (ip: string) => {
    if (!ip) return "Unknown";
    if (ip === "::1" || ip === "127.0.0.1") return "Localhost";
    if (ip.startsWith("::ffff:")) return ip.replace("::ffff:", "");
    return ip;
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Audit Logs</h2>
            <p className="text-muted-foreground text-sm font-medium">Monitor system activity and user actions.</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isLoading || isFetching}
          className="rounded-md font-semibold cursor-pointer"
        >
          <RotateCw className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-card border rounded-lg p-6 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground ml-1">Action</label>
            <Select onValueChange={(val) => handleFilterChange("action", val)}>
              <SelectTrigger className="rounded-md border-muted-foreground/20">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {actions.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground ml-1">Entity</label>
            <Select onValueChange={(val) => handleFilterChange("entity", val)}>
              <SelectTrigger className="rounded-md border-muted-foreground/20">
                <SelectValue placeholder="All Entities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                {entities.map((e) => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground ml-1">User</label>
            <Select onValueChange={(val) => handleFilterChange("userId", val)}>
              <SelectTrigger className="rounded-md border-muted-foreground/20">
                <SelectValue placeholder="All Users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {users?.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground ml-1">From Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="date"
                className="pl-10 rounded-md border-muted-foreground/20 font-medium"
                onChange={(e) => handleFilterChange("from", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground ml-1">To Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="date"
                className="pl-10 rounded-md border-muted-foreground/20 font-medium"
                onChange={(e) => handleFilterChange("to", e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-lg border bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[180px]">Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead className="text-right">Metadata</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(10)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-10 w-full rounded-lg" /></TableCell>
                  <TableCell><Skeleton className="h-10 w-full rounded-lg" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-10 w-full rounded-lg" /></TableCell>
                  <TableCell><Skeleton className="h-10 w-full rounded-lg" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto rounded-lg" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border bg-card overflow-hidden shadow-sm"
        >
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-b">
                <TableHead className="py-5 px-6 font-semibold uppercase tracking-widest text-[10px]">Timestamp</TableHead>
                <TableHead className="font-semibold uppercase tracking-widest text-[10px]">User</TableHead>
                <TableHead className="font-semibold uppercase tracking-widest text-[10px]">Action</TableHead>
                <TableHead className="font-semibold uppercase tracking-widest text-[10px]">Entity</TableHead>
                <TableHead className="font-semibold uppercase tracking-widest text-[10px]">IP Address</TableHead>
                <TableHead className="text-right font-semibold uppercase tracking-widest text-[10px] px-6">Metadata</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-[400px] text-center">
                    <div className="flex flex-col items-center justify-center space-y-4 animate-in fade-in zoom-in duration-500">
                      <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center ring-8 ring-muted/20">
                        <Activity className="h-10 w-10 text-muted-foreground/40" />
                      </div>
                      <div className="space-y-2 max-w-[280px] mx-auto">
                        <p className="text-xl font-bold tracking-tight">No activity found</p>
                        <p className="text-sm text-muted-foreground font-medium">We couldn't find any audit logs matching your current filters.</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setFilters({
                          page: 1,
                          limit: 10,
                          action: undefined,
                          entity: undefined,
                          userId: undefined,
                          from: undefined,
                          to: undefined,
                        })}
                        className="mt-2 rounded-full px-6 font-semibold"
                      >
                        Clear all filters
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data?.logs.map((log) => (
                  <TableRow key={log.id} className="group hover:bg-muted/30 transition-colors border-b last:border-0">
                    <TableCell className="px-6">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-sm tracking-tight">
                          {new Date(log.createdAt).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.user ? (
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                            <User className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold tracking-tight">{log.user.name}</span>
                            <Badge variant="outline" className="w-fit h-4 text-[9px] font-medium px-1.5 uppercase tracking-tighter bg-muted/50">
                              {log.user.role}
                            </Badge>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground font-medium">System</span>
                      )}
                    </TableCell>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                          <Database className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">{log.entity}</span>
                          <span className="text-[10px] font-mono text-muted-foreground tracking-tighter truncate max-w-[100px]" title={log.entityId}>
                            {log.entityId.substring(0, 8)}...
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Globe className="h-3.5 w-3.5" />
                        <span className="text-xs font-mono font-medium">{formatIP(log.ipAddress)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] rounded-lg">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-2xl font-bold tracking-tight">
                              <Terminal className="h-6 w-6 text-primary" />
                              Action Metadata
                            </DialogTitle>
                          </DialogHeader>
                          <div className="bg-zinc-950 rounded-lg p-6 mt-4 overflow-auto max-h-[400px]">
                            <pre className="text-emerald-400 text-xs font-mono">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </div>
                          <div className="flex justify-end mt-4">
                            <Button variant="outline" className="rounded-md font-semibold cursor-pointer" onClick={(e) => {
                              const target = e.target as HTMLElement;
                              const dialog = target.closest('[role="dialog"]');
                              if (dialog) {
                                const closeBtn = dialog.querySelector('button[aria-label="Close"]') as HTMLButtonElement;
                                if (closeBtn) closeBtn.click();
                              }
                            }}>
                              Close
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </motion.div>
      )}

      {/* Pagination */}
      {!isLoading && data && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border rounded-lg p-6 bg-card shadow-sm mt-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-muted-foreground font-medium">
            <div>
              Showing <span className="text-foreground font-semibold">{data.logs.length}</span> of <span className="text-foreground font-semibold">{data.pagination.total}</span> logs
            </div>
            
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <Select 
                value={String(filters.limit)} 
                onValueChange={(val) => handleFilterChange("limit", parseInt(val))}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={filters.limit} />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 20, 50, 100].map((pageSize) => (
                    <SelectItem key={pageSize} value={String(pageSize)}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Pagination className="w-auto mx-0">
            <PaginationContent className="gap-2">
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  className={cn(
                    "rounded-md font-semibold border-muted-foreground/20",
                    data.pagination.page <= 1 && "pointer-events-none opacity-50"
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    handleFilterChange("page", Math.max(1, (filters.page || 1) - 1));
                  }}
                />
              </PaginationItem>
              
              {/* Page Numbers */}
              {(() => {
                const totalPages = data.pagination.totalPages;
                const currentPage = data.pagination.page;
                const pages = [];
                
                if (totalPages <= 5) {
                  for (let i = 1; i <= totalPages; i++) pages.push(i);
                } else {
                  pages.push(1);
                  if (currentPage > 3) pages.push("ellipsis-1");
                  
                  const start = Math.max(2, currentPage - 1);
                  const end = Math.min(totalPages - 1, currentPage + 1);
                  
                  for (let i = start; i <= end; i++) {
                    if (!pages.includes(i)) pages.push(i);
                  }
                  
                  if (currentPage < totalPages - 2) pages.push("ellipsis-2");
                  if (!pages.includes(totalPages)) pages.push(totalPages);
                }

                return pages.map((page, i) => {
                  if (typeof page === "string") {
                    return (
                      <PaginationItem key={`ellipsis-${i}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }

                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        isActive={currentPage === page}
                        onClick={(e) => {
                          e.preventDefault();
                          handleFilterChange("page", page);
                        }}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                });
              })()}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  className={cn(
                    "rounded-md font-semibold border-muted-foreground/20",
                    data.pagination.page >= data.pagination.totalPages && "pointer-events-none opacity-50"
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    handleFilterChange("page", Math.min(data.pagination.totalPages, (filters.page || 1) + 1));
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default AuditLogPage;
