import { useState } from "react";
import { 
  useGetVendorsQuery, 
  useDeleteVendorMutation,
  type VendorFilters 
} from "../features/inventory/vendorApiSlice";
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
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Users, 
  Mail, 
  Phone,
  ArrowRight,
  RotateCw
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import { selectCurrentUser } from "../features/auth/authSlice";
import { cn } from "@/lib/utils";
import { Skeleton } from "../components/ui/skeleton";

const Vendors = () => {
  const navigate = useNavigate();
  const user = useAppSelector(selectCurrentUser);
  const isAdmin = user?.role === "ADMIN";

  const [filters, setFilters] = useState<VendorFilters>({
    page: 1,
    limit: 10,
    search: "",
    isActive: "",
  });

  const { data, isLoading, refetch, isFetching } = useGetVendorsQuery(filters);
  const [deleteVendor, { isLoading: isDeleting }] = useDeleteVendorMutation();

  const handleSearch = (val: string) => {
    setFilters(prev => ({ ...prev, search: val, page: 1 }));
  };

  const handleStatusChange = (val: string) => {
    setFilters(prev => ({ ...prev, isActive: val === "all" ? "" : val, page: 1 }));
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this vendor?")) return;
    try {
      await deleteVendor(id).unwrap();
      toast.success("Vendor deleted");
    } catch (err: any) {
      toast.error(err?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Vendors</h2>
            <p className="text-muted-foreground text-sm">Manage your suppliers and vendor contacts.</p>
          </div>
        </div>
        {isAdmin && (
          <Button onClick={() => navigate("/vendors/add")} className="cursor-pointer">
            <Plus className="mr-2 h-4 w-4" />
            Add Vendor
          </Button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search name, email, contact..." 
            className="pl-9"
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        
        <Select onValueChange={handleStatusChange}>
          <SelectTrigger>
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => refetch()} 
          disabled={isLoading || isFetching}
          className="h-10 w-10 cursor-pointer hover:bg-primary/5 hover:text-primary transition-all"
          title="Refresh Data"
        >
          <RotateCw className={cn("h-4 w-4", (isLoading || isFetching) && "animate-spin")} />
        </Button>
      </div>

      {isLoading ? (
        <div className="rounded-md border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor Info</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>Orders / Products</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[180px]" />
                      <Skeleton className="h-3 w-[120px]" />
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-4 w-[140px]" /></TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-10 rounded-md" />
                      <Skeleton className="h-6 w-10 rounded-md" />
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto rounded-md" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-md border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor Info</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.vendors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-[400px] text-center">
                    <div className="flex flex-col items-center justify-center space-y-4 animate-in fade-in zoom-in duration-500">
                      <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center ring-8 ring-primary/5">
                        <Users className="h-10 w-10 text-primary/40" />
                      </div>
                      <div className="space-y-2 max-w-[300px] mx-auto">
                        <p className="text-xl font-bold tracking-tight">No vendors found</p>
                        <p className="text-sm text-muted-foreground font-medium">We couldn't find any vendors matching your criteria.</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setFilters({
                            page: 1,
                            limit: 10,
                            search: "",
                            isActive: "",
                          })}
                          className="rounded-full px-6 font-semibold"
                        >
                          Clear filters
                        </Button>
                        {isAdmin && (
                          <Button 
                            size="sm" 
                            onClick={() => navigate("/vendors/add")}
                            className="rounded-full px-6 font-semibold"
                          >
                            Add Vendor
                          </Button>
                        )}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data?.vendors.map((vendor) => (
                  <TableRow key={vendor.id} className="group cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/vendors/${vendor.id}`)}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-base group-hover:text-primary transition-colors">{vendor.name}</span>
                        <div className="flex flex-col gap-1 mt-1">
                          {vendor.email && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {vendor.email}
                            </div>
                          )}
                          {vendor.phone && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {vendor.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">{vendor.contactPerson || "—"}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <div className="flex flex-col items-center justify-center h-10 w-12 rounded-lg bg-muted/50 border border-muted-foreground/10">
                          <span className="text-xs font-medium leading-none">{vendor._count?.purchaseOrders || 0}</span>
                          <span className="text-[8px] text-muted-foreground uppercase mt-0.5">Orders</span>
                        </div>
                        <div className="flex flex-col items-center justify-center h-10 w-12 rounded-lg bg-muted/50 border border-muted-foreground/10">
                          <span className="text-xs font-medium leading-none">{vendor._count?.vendorProducts || 0}</span>
                          <span className="text-[8px] text-muted-foreground uppercase mt-0.5">Items</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={vendor.isActive ? "outline" : "destructive"} className={vendor.isActive ? "text-green-600 border-green-600/20 bg-green-50/50" : ""}>
                        {vendor.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => navigate(`/vendors/${vendor.id}`)} 
                          className="h-8 w-8 cursor-pointer hover:bg-primary/10 hover:text-primary"
                          title="View Details"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                        {isAdmin && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => navigate(`/vendors/${vendor.id}/edit`)} 
                              className="h-8 w-8 cursor-pointer hover:bg-primary/10 hover:text-primary"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDelete(vendor.id)}
                              className="h-8 w-8 text-destructive cursor-pointer hover:bg-destructive/10"
                              disabled={isDeleting}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </motion.div>
      )}

      {/* Pagination Controls */}
      {!isLoading && data && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border rounded-lg p-4 bg-card shadow-sm mt-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-muted-foreground font-medium">
            <div>
              Showing <span className="font-medium text-foreground">{data.vendors.length}</span> of <span className="font-medium text-foreground">{data.pagination.total}</span> vendors
            </div>

            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <Select 
                value={String(filters.limit)} 
                onValueChange={(val) => setFilters(p => ({ ...p, limit: parseInt(val), page: 1 }))}
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
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  href="#"
                  className={cn(
                    data.pagination.page <= 1 && "pointer-events-none opacity-50"
                  )} 
                  onClick={(e) => {
                    e.preventDefault();
                    setFilters(p => ({ ...p, page: Math.max(1, (p.page || 1) - 1) }));
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
                  for (let i = start; i <= end; i++) { if (!pages.includes(i)) pages.push(i); }
                  if (currentPage < totalPages - 2) pages.push("ellipsis-2");
                  if (!pages.includes(totalPages)) pages.push(totalPages);
                }
                return pages.map((page, i) => {
                  if (typeof page === "string") {
                    return <PaginationItem key={`ellipsis-${i}`}><PaginationEllipsis /></PaginationItem>;
                  }
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        isActive={currentPage === page}
                        onClick={(e) => {
                          e.preventDefault();
                          setFilters(p => ({ ...p, page }));
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
                    data.pagination.page >= data.pagination.totalPages && "pointer-events-none opacity-50"
                  )} 
                  onClick={(e) => {
                    e.preventDefault();
                    setFilters(p => ({ ...p, page: Math.min(data.pagination.totalPages, (p.page || 1) + 1) }));
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

export default Vendors;
