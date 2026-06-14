import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  useGetUsersQuery,
  useToggleUserStatusMutation,
  type User,
} from "../features/auth/usersApiSlice";
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
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import { Button } from "../components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Edit, UserCog, RotateCw } from "lucide-react";
import { CreateUserModal } from "../components/users/CreateUserModal";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Skeleton } from "../components/ui/skeleton";
import { cn } from "@/lib/utils";

const Users = () => {
  const navigate = useNavigate();
  const { data: users, isLoading, isError, refetch, isFetching } = useGetUsersQuery();
  const [toggleStatus] = useToggleUserStatusMutation();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const handleToggleStatus = async (id: string) => {
    try {
      await toggleStatus(id).unwrap();
      toast.success("User status updated");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update status");
    }
  };

  const openEdit = (user: User) => {
    navigate(`/users/${user.id}/edit`);
  };

  const paginatedUsers = users?.slice((page - 1) * limit, page * limit) || [];
  const totalPages = Math.ceil((users?.length || 0) / limit) || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <UserCog className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
            <p className="text-muted-foreground text-sm">
              Manage system users, roles, and account statuses.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => refetch()} 
            disabled={isLoading || isFetching}
            className="h-10 w-10 cursor-pointer"
            title="Refresh Users"
          >
            <RotateCw className={cn("h-4 w-4", (isLoading || isFetching) && "animate-spin")} />
          </Button>
          <CreateUserModal />
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-md border bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded-full" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : isError ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/5 p-8 flex flex-col items-center justify-center min-h-[400px] gap-4 text-center">
          <p className="text-destructive font-medium">Failed to load users.</p>
          <Button onClick={() => window.location.reload()} variant="outline" className="cursor-pointer">Retry Connection</Button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-md border bg-card shadow-sm overflow-hidden"
        >
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold">Email</TableHead>
                <TableHead className="font-semibold">Role</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Created At</TableHead>
                <TableHead className="text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-[400px] text-center">
                    <div className="flex flex-col items-center justify-center space-y-4 animate-in fade-in zoom-in duration-500">
                      <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center ring-8 ring-primary/5">
                        <UserCog className="h-10 w-10 text-primary/40" />
                      </div>
                      <div className="space-y-2 max-w-[280px] mx-auto">
                        <p className="text-xl font-bold tracking-tight">No users found</p>
                        <p className="text-sm text-muted-foreground font-medium">We couldn't find any user accounts. Start by creating a new one.</p>
                      </div>
                      <CreateUserModal />
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((user) => (
                  <TableRow key={user.id} className="group transition-colors hover:bg-muted/30">
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "ADMIN" ? "default" : "secondary"} className="font-medium">
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={user.isActive}
                          onCheckedChange={() => handleToggleStatus(user.id)}
                          className="cursor-pointer scale-90"
                        />
                        <span className="text-[11px] font-medium text-muted-foreground uppercase">
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(user.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => openEdit(user)}
                              className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left">
                            <p>Edit User & Security</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </motion.div>
      )}

      {/* Pagination */}
      {!isLoading && users && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border rounded-lg p-4 bg-card shadow-sm mt-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-muted-foreground font-medium">
            <div>
              Showing <span className="text-foreground font-semibold">{paginatedUsers.length}</span> of <span className="text-foreground font-semibold">{users.length}</span> users
            </div>

            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <Select 
                value={String(limit)} 
                onValueChange={(val) => {
                  setLimit(parseInt(val));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={limit} />
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
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  href="#"
                  className={cn(page <= 1 && "pointer-events-none opacity-50")} 
                  onClick={(e) => {
                    e.preventDefault();
                    setPage(p => Math.max(1, p - 1));
                  }}
                />
              </PaginationItem>

              {/* Page Numbers */}
              {(() => {
                const pages = [];
                if (totalPages <= 5) {
                  for (let i = 1; i <= totalPages; i++) pages.push(i);
                } else {
                  pages.push(1);
                  if (page > 3) pages.push("ellipsis-1");
                  const start = Math.max(2, page - 1);
                  const end = Math.min(totalPages - 1, page + 1);
                  for (let i = start; i <= end; i++) { if (!pages.includes(i)) pages.push(i); }
                  if (page < totalPages - 2) pages.push("ellipsis-2");
                  if (!pages.includes(totalPages)) pages.push(totalPages);
                }
                return pages.map((p, i) => {
                  if (typeof p === "string") {
                    return <PaginationItem key={`ellipsis-${i}`}><PaginationEllipsis /></PaginationItem>;
                  }
                  return (
                    <PaginationItem key={p}>
                      <PaginationLink
                        href="#"
                        isActive={page === p}
                        onClick={(e) => {
                          e.preventDefault();
                          setPage(p);
                        }}
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  );
                });
              })()}

              <PaginationItem>
                <PaginationNext 
                  href="#"
                  className={cn(page >= totalPages && "pointer-events-none opacity-50")} 
                  onClick={(e) => {
                    e.preventDefault();
                    setPage(p => Math.min(totalPages, p + 1));
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

export default Users;
