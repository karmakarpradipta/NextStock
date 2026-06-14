import { useState } from "react";
import {
  useGetRequisitionsQuery,
  useCreateRequisitionMutation,
  useReviewRequisitionMutation,
  useCancelRequisitionMutation,
  type RequisitionFilters,
} from "../features/inventory/requisitionApiSlice";
import { useGetProductsQuery } from "../features/inventory/productApiSlice";
import { useAppSelector } from "../store/hooks";
import { selectCurrentUser } from "../features/auth/authSlice";
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
  Search,
  Plus,
  RotateCw,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Ban,
  MessageSquare,
  Package,
  Loader2,
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
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Skeleton } from "../components/ui/skeleton";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";

const Requisitions = () => {
  const user = useAppSelector(selectCurrentUser);
  const isAdmin = user?.role === "ADMIN";

  const [filters, setFilters] = useState<RequisitionFilters>({
    page: 1,
    limit: 10,
    status: undefined,
    search: "",
  });

  const { data, isLoading, refetch, isFetching } = useGetRequisitionsQuery(filters);
  const { data: productsData } = useGetProductsQuery({ limit: 1000 });

  const [createRequisition, { isLoading: isCreating }] = useCreateRequisitionMutation();
  const [reviewRequisition, { isLoading: isReviewing }] = useReviewRequisitionMutation();
  const [cancelRequisition, { isLoading: isCancelling }] = useCancelRequisitionMutation();

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedRequisitionId, setSelectedRequisitionId] = useState<string | null>(null);
  const [rejectionNote, setRejectionNote] = useState("");

  const handleFilterChange = (key: keyof RequisitionFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === "all" ? undefined : value,
      page: key === "page" ? value : 1,
    }));
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const productId = formData.get("productId") as string;
    const quantity = parseInt(formData.get("quantity") as string);
    const reason = formData.get("reason") as string;

    if (!productId) return toast.error("Please select a product");
    if (!quantity || quantity <= 0) return toast.error("Please enter a valid quantity");

    try {
      await createRequisition({ productId, quantity, reason }).unwrap();
      toast.success("Requisition requested successfully");
      setIsNewModalOpen(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create requisition");
    }
  };

  const handleReview = async (id: string, action: "APPROVE" | "REJECT") => {
    if (action === "REJECT" && !rejectionNote.trim()) {
      return toast.error("Rejection note is required");
    }

    try {
      await reviewRequisition({ id, action, rejectionNote: action === "REJECT" ? rejectionNote : undefined }).unwrap();
      toast.success(`Requisition ${action.toLowerCase()}d`);
      setIsRejectModalOpen(false);
      setRejectionNote("");
    } catch (err: any) {
      toast.error(err?.data?.message || "Action failed");
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm("Are you sure you want to cancel this requisition?")) return;
    try {
      await cancelRequisition(id).unwrap();
      toast.success("Requisition cancelled");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to cancel requisition");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 font-medium">PENDING</Badge>;
      case "APPROVED":
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 font-medium">APPROVED</Badge>;
      case "REJECTED":
        return <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-200 font-medium">REJECTED</Badge>;
      case "ORDERED":
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 font-medium">ORDERED</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Requisitions</h2>
            <p className="text-muted-foreground text-sm font-medium">Request items for inventory restock.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading || isFetching}
            className="rounded-lg font-semibold cursor-pointer"
          >
            <RotateCw className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")} />
            Refresh
          </Button>
          {!isAdmin && (
            <Dialog open={isNewModalOpen} onOpenChange={setIsNewModalOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-lg font-semibold cursor-pointer">
                  <Plus className="mr-2 h-4 w-4" />
                  New Request
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] rounded-lg">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold tracking-tight">New Purchase Request</DialogTitle>
                  <DialogDescription className="font-medium">
                    Submit a requisition for items needed in stock.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-6 py-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Select Product</Label>
                    <Select name="productId" required>
                      <SelectTrigger className="rounded-md h-11">
                        <SelectValue placeholder="Search product..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-md">
                        {productsData?.products.filter(p => p.isActive).map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku}) — Stock: {p.currentStock}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Quantity Needed</Label>
                    <Input name="quantity" type="number" min="1" required className="h-11 rounded-md" placeholder="e.g. 50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Reason (Optional)</Label>
                    <Textarea name="reason" className="rounded-md min-h-[100px]" placeholder="Explain why these items are needed..." />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isCreating} className="w-full h-11 rounded-md font-bold">
                      {isCreating ? <Loader2 className="animate-spin h-5 w-5" /> : "Submit Request"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border rounded-lg p-6 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2 col-span-1 sm:col-span-2">
            <Label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={isAdmin ? "Product or Requester..." : "Search product..."}
                className="pl-10 rounded-md h-10 border-muted-foreground/20"
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Status</Label>
            <Select onValueChange={(val) => handleFilterChange("status", val)}>
              <SelectTrigger className="rounded-md h-10 border-muted-foreground/20">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="rounded-md">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="ORDERED">Ordered</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-lg border bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requester</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-10 w-48 rounded-md" /></TableCell>
                  <TableCell><Skeleton className="h-10 w-12 rounded-md" /></TableCell>
                  <TableCell><Skeleton className="h-7 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-10 w-32 rounded-md" /></TableCell>
                  <TableCell><Skeleton className="h-10 w-24 rounded-md" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto rounded-md" /></TableCell>
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
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-4 px-6 font-semibold uppercase tracking-widest text-[10px]">Product</TableHead>
                <TableHead className="font-semibold uppercase tracking-widest text-[10px]">Quantity</TableHead>
                <TableHead className="font-semibold uppercase tracking-widest text-[10px]">Status</TableHead>
                <TableHead className="font-semibold uppercase tracking-widest text-[10px]">Requester</TableHead>
                <TableHead className="font-semibold uppercase tracking-widest text-[10px]">Requested Date</TableHead>
                <TableHead className="text-right font-semibold uppercase tracking-widest text-[10px] px-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.requisitions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-[400px] text-center">
                    <div className="flex flex-col items-center justify-center space-y-4 animate-in fade-in zoom-in duration-500">
                      <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center ring-8 ring-muted/20">
                        <ClipboardList className="h-10 w-10 text-muted-foreground/40" />
                      </div>
                      <div className="space-y-2 max-w-[280px] mx-auto">
                        <p className="text-xl font-bold tracking-tight">No requisitions found</p>
                        <p className="text-sm text-muted-foreground font-medium">There are no pending or history requests matching your filters.</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setFilters({
                          page: 1,
                          limit: 10,
                          status: undefined,
                          search: "",
                        })}
                        className="rounded-full px-6 font-semibold"
                      >
                        Clear filters
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data?.requisitions.map((req) => (
                  <TableRow key={req.id} className="group hover:bg-muted/10 transition-colors border-b last:border-0">
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm tracking-tight">{req.product.name}</span>
                          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">{req.product.sku}</span>
                        </div>
                      </div>
                      {req.reason && (
                        <div className="mt-1 flex items-start gap-1 text-[10px] text-muted-foreground italic max-w-[200px] truncate" title={req.reason}>
                          <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
                          {req.reason}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-sm">{req.quantity}</span>
                      <span className="text-[10px] text-muted-foreground ml-1 uppercase">{req.product.unit}</span>
                    </TableCell>
                    <TableCell>{getStatusBadge(req.status)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">{req.requester.name}</span>
                        <span className="text-[10px] text-muted-foreground">{req.requester.email}</span>
                        {req.reviewer && (
                          <div className="mt-1 text-[9px] font-medium text-primary uppercase">
                            Reviewed by {req.reviewer.name}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-xs">{new Date(req.createdAt).toLocaleDateString()}</span>
                        <span className="text-[9px] text-muted-foreground font-medium uppercase">{new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <div className="flex justify-end gap-2">
                        {isAdmin && req.status === "PENDING" && (
                          <>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 px-2 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 font-semibold text-[10px] uppercase tracking-widest cursor-pointer">
                                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                  Approve
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="rounded-lg">
                                <DialogHeader>
                                  <DialogTitle>Approve Requisition</DialogTitle>
                                  <DialogDescription>
                                    Are you sure you want to approve this request for {req.quantity} {req.product.unit} of {req.product.name}?
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <Button onClick={() => handleReview(req.id, "APPROVE")} disabled={isReviewing} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md">
                                    Confirm Approval
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>

                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => {
                                setSelectedRequisitionId(req.id);
                                setIsRejectModalOpen(true);
                              }}
                              className="h-8 px-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-semibold text-[10px] uppercase tracking-widest cursor-pointer"
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}

                        {!isAdmin && req.status === "PENDING" && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleCancel(req.id)}
                            disabled={isCancelling}
                            className="h-8 px-2 text-muted-foreground hover:bg-muted/10 hover:text-foreground font-semibold text-[10px] uppercase tracking-widest cursor-pointer"
                          >
                            <Ban className="h-3.5 w-3.5 mr-1" />
                            Cancel
                          </Button>
                        )}

                        {req.status === "REJECTED" && req.rejectionNote && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:bg-muted/10 font-semibold text-[10px] uppercase tracking-widest">
                                <MessageSquare className="h-3.5 w-3.5 mr-1" />
                                Reason
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="rounded-lg">
                              <DialogHeader>
                                <DialogTitle>Rejection Note</DialogTitle>
                              </DialogHeader>
                              <div className="p-4 bg-rose-50 border border-rose-100 rounded-md text-rose-800 text-sm">
                                {req.rejectionNote}
                              </div>
                            </DialogContent>
                          </Dialog>
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

      {/* Pagination */}
      {!isLoading && data && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border rounded-lg p-6 bg-card shadow-sm mt-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-muted-foreground font-medium">
            <div>
              Showing <span className="text-foreground font-semibold">{data.requisitions.length}</span> of <span className="text-foreground font-semibold">{data.pagination.total}</span> requests
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
                    "rounded-md font-semibold",
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
                    "rounded-md font-semibold",
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

      {/* Reject Reason Modal */}
      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent className="rounded-lg">
          <DialogHeader>
            <DialogTitle>Reject Requisition</DialogTitle>
            <DialogDescription>Please provide a reason for rejecting this request.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label className="text-sm font-semibold">Rejection Note</Label>
            <Textarea 
              value={rejectionNote} 
              onChange={(e) => setRejectionNote(e.target.value)} 
              placeholder="e.g. Current budget doesn't allow, or we have enough stock coming."
              className="rounded-md"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectModalOpen(false)} className="rounded-md font-semibold">Cancel</Button>
            <Button 
              onClick={() => selectedRequisitionId && handleReview(selectedRequisitionId, "REJECT")} 
              disabled={isReviewing}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-md"
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Requisitions;
