import { useState } from "react";
import { 
  useGetProductsQuery,
  type Product 
} from "../features/inventory/productApiSlice";
import { useAddStockMovementMutation } from "../features/inventory/stockApiSlice";
import { useCreateRequisitionMutation } from "../features/inventory/requisitionApiSlice";
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
  Package, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  History,
  RotateCw,
  Plus,
  Minus,
  CheckCircle2,
  Loader2,
  ClipboardList
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Skeleton } from "../components/ui/skeleton";
import { useAppSelector } from "../store/hooks";
import { selectCurrentUser } from "../features/auth/authSlice";

const Inventory = () => {
  const navigate = useNavigate();
  const user = useAppSelector(selectCurrentUser);
  const isAdmin = user?.role === "ADMIN";
  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "low">("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data, isLoading, refetch, isFetching } = useGetProductsQuery({
    page,
    limit,
    search: searchTerm,
    lowStock: stockFilter === "low" ? "true" : undefined
  });

  const [addMovement, { isLoading: isAdjusting }] = useAddStockMovementMutation();
  const [createRequisition, { isLoading: isCreatingReq }] = useCreateRequisitionMutation();

  // Adjustment Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<"IN" | "OUT" | "ADJUSTMENT">("ADJUSTMENT");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");

  // Requisition Modal State
  const [isReqModalOpen, setIsReqModalOpen] = useState(false);
  const [reqQuantity, setReqQuantity] = useState("");
  const [reqReason, setReqReason] = useState("");

  const handleOpenAdjustment = (product: Product, type: "IN" | "OUT" | "ADJUSTMENT") => {
    setSelectedProduct(product);
    setAdjustmentType(type);
    setQuantity("");
    setNote("");
    setIsModalOpen(true);
  };

  const handleOpenReq = (product: Product) => {
    setSelectedProduct(product);
    setReqQuantity("");
    setReqReason("");
    setIsReqModalOpen(true);
  };

  const handleAdjust = async () => {
    if (!selectedProduct || !quantity || isNaN(parseInt(quantity))) {
      toast.error("Please enter a valid quantity");
      return;
    }

    if (!note.trim()) {
      toast.error("Please provide a reason for the stock adjustment");
      return;
    }

    try {
      await addMovement({
        productId: selectedProduct.id,
        type: adjustmentType,
        quantity: parseInt(quantity),
        note: note.trim()
      }).unwrap();
      
      toast.success("Inventory updated");
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Adjustment failed");
    }
  };

  const handleCreateReq = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const qty = parseInt(reqQuantity);
    if (!selectedProduct || isNaN(qty) || qty <= 0) return toast.error("Valid quantity required");

    try {
      await createRequisition({ productId: selectedProduct.id, quantity: qty, reason: reqReason }).unwrap();
      toast.success("Requisition requested successfully");
      setIsReqModalOpen(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create requisition");
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleFilterChange = (filter: "all" | "low") => {
    setStockFilter(filter);
    setPage(1);
  };

  return (
    <div className="space-y-8 pb-10 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-xl shadow-primary/20">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Stock Management</h2>
            <p className="text-muted-foreground text-sm font-medium">Monitor levels and perform manual overrides.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <Button 
            variant="outline" 
            size="icon" 
            onClick={() => refetch()} 
            disabled={isLoading || isFetching}
            className="h-10 w-10 cursor-pointer rounded-md border-border"
           >
              <RotateCw className={cn("h-4 w-4", (isLoading || isFetching) && "animate-spin")} />
           </Button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="relative md:col-span-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search SKU or product name..." 
            className="pl-9 h-12 bg-card border-border shadow-sm rounded-md"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        <div className="md:col-span-6 flex p-1 bg-muted/50 rounded-lg gap-1 h-12">
            <button
               onClick={() => handleFilterChange("all")}
               className={cn(
                 "flex-1 flex items-center justify-center gap-2 text-xs font-semibold rounded-lg transition-all uppercase tracking-widest cursor-pointer",
                 stockFilter === "all" ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
               )}
            >
               <CheckCircle2 className="h-3.5 w-3.5" />
               All Items
            </button>
            <button
               onClick={() => handleFilterChange("low")}
               className={cn(
                 "flex-1 flex items-center justify-center gap-2 text-xs font-semibold rounded-lg transition-all uppercase tracking-widest cursor-pointer",
                 stockFilter === "low" ? "bg-destructive/10 text-destructive shadow-sm" : "text-muted-foreground hover:text-foreground"
               )}
            >
               <AlertTriangle className={cn("h-3.5 w-3.5", stockFilter === "low" ? "animate-pulse" : "")} />
               Low Stock
            </button>
        </div>
      </div>

      {/* Stock Table */}
      <div className="rounded-lg border border-border bg-card shadow-md overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="py-6 px-6 font-semibold">Product Details</TableHead>
              <TableHead className="font-semibold">Category</TableHead>
              <TableHead className="text-center font-semibold">Current Stock</TableHead>
              <TableHead className="text-center font-semibold">Safety Status</TableHead>
              <TableHead className="text-right px-6 font-semibold">Quick Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(10)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="px-6 py-4"><Skeleton className="h-12 w-48 rounded-lg" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24 rounded-lg" /></TableCell>
                  <TableCell><Skeleton className="h-10 w-16 mx-auto rounded-lg" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 mx-auto rounded-full" /></TableCell>
                  <TableCell className="text-right px-6"><Skeleton className="h-10 w-24 ml-auto rounded-lg" /></TableCell>
                </TableRow>
              ))
            ) : data?.products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-[450px] text-center">
                  <div className="flex flex-col items-center justify-center space-y-4 animate-in fade-in zoom-in duration-500">
                     <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center ring-8 ring-primary/5">
                        <Package className="h-12 w-12 text-primary/40" />
                     </div>
                     <div className="space-y-2 max-w-[320px] mx-auto">
                        <p className="text-2xl font-bold tracking-tight text-foreground">No Inventory Found</p>
                        <p className="text-sm text-muted-foreground font-medium">
                          We couldn't find any items matching "{searchTerm}". Try broadening your search or check your spelling.
                        </p>
                     </div>
                     <Button 
                        variant="link" 
                        onClick={() => {
                          setSearchTerm("");
                          setPage(1);
                        }}
                        className="text-primary font-bold uppercase tracking-widest text-xs"
                     >
                        Reset Search
                     </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data?.products.map((product) => (
                <TableRow key={product.id} className="group transition-colors hover:bg-muted/20 border-b border-border">
                  <TableCell className="py-4 px-6">
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm tracking-tight group-hover:text-primary transition-colors cursor-pointer" onClick={() => navigate(`/inventory/products/${product.id}`)}>{product.name}</span>
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">{product.sku}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-muted border-none font-medium text-[10px]">{product.category?.name || "N/A"}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center">
                       <span className={cn(
                         "text-lg font-bold tracking-tighter",
                         product.isLowStock ? "text-destructive" : "text-foreground"
                       )}>{product.currentStock}</span>
                       <span className="text-[9px] font-semibold uppercase text-muted-foreground">{product.unit}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {product.isLowStock ? (
                      <Badge variant="destructive" className="animate-pulse px-3 py-1 font-semibold text-[9px] uppercase tracking-[0.15em] border-none shadow-lg">Critical</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-3 py-1 font-semibold text-[9px] uppercase tracking-[0.15em]">Healthy</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <div className="flex items-center justify-end gap-2">
                       <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 rounded-md bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground transition-all border border-border shadow-sm"
                        onClick={() => handleOpenReq(product)}
                        title="Request Restock"
                       >
                          <ClipboardList className="h-4 w-4" />
                       </Button>
                       {isAdmin && (
                         <>
                           <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 rounded-md bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground transition-all border border-border shadow-sm"
                            onClick={() => handleOpenAdjustment(product, "IN")}
                            title="Add Stock"
                           >
                              <Plus className="h-4 w-4" />
                           </Button>
                           <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 rounded-md bg-accent text-accent-foreground hover:bg-destructive hover:text-destructive-foreground transition-all border border-border shadow-sm"
                            onClick={() => handleOpenAdjustment(product, "OUT")}
                            title="Deduct Stock"
                           >
                              <Minus className="h-4 w-4" />
                           </Button>
                         </>
                       )}
                       <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 rounded-md bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground transition-all border border-border shadow-sm"
                        onClick={() => navigate(`/inventory/products/${product.id}`)}
                        title="View History"
                       >
                          <History className="h-4 w-4" />
                       </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!isLoading && data && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border rounded-lg p-6 bg-card shadow-sm mt-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-muted-foreground font-medium">
            <div>
              Showing <span className="text-foreground font-semibold">{data.products.length}</span> of <span className="text-foreground font-semibold">{data.pagination.total}</span> items
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
            <PaginationContent className="gap-2">
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  className={cn(
                    "rounded-md font-semibold border-border",
                    data.pagination.page <= 1 && "pointer-events-none opacity-50"
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    setPage(Math.max(1, page - 1));
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
                return pages.map((p, i) => {
                  if (typeof p === "string") {
                    return <PaginationItem key={`ellipsis-${i}`}><PaginationEllipsis /></PaginationItem>;
                  }
                  return (
                    <PaginationItem key={p}>
                      <PaginationLink
                        href="#"
                        isActive={currentPage === p}
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
                  className={cn(
                    "rounded-md font-semibold border-border",
                    data.pagination.page >= data.pagination.totalPages && "pointer-events-none opacity-50"
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    setPage(Math.min(data.pagination.totalPages, page + 1));
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Adjustment Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="rounded-lg border-none p-10 max-w-md bg-card">
           <DialogHeader className="space-y-4">
              <div className="flex items-center gap-4">
                 <div className={cn(
                   "h-14 w-14 rounded-lg flex items-center justify-center shadow-xl text-white",
                   adjustmentType === 'OUT' ? "bg-destructive shadow-destructive/20" : "bg-primary shadow-primary/20"
                 )}>
                    {adjustmentType === 'IN' ? <TrendingUp className="h-7 w-7" /> : <TrendingDown className="h-7 w-7" />}
                 </div>
                 <div className="text-left">
                    <DialogTitle className="text-3xl font-bold tracking-tighter text-foreground">Inventory Override</DialogTitle>
                    <DialogDescription className="font-medium text-muted-foreground uppercase text-[10px] tracking-widest">{selectedProduct?.name}</DialogDescription>
                 </div>
              </div>
           </DialogHeader>

           <div className="space-y-8 pt-6">
              <div className="grid gap-3">
                 <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">Adjustment Quantity</Label>
                 <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-muted flex items-center justify-center font-bold text-xs text-muted-foreground">
                       {adjustmentType === 'IN' ? '+' : '-'}
                    </div>
                    <Input 
                      type="number" 
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="h-16 pl-16 text-3xl font-bold border-none bg-muted/50 rounded-md shadow-inner text-foreground"
                      placeholder="0"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 font-semibold text-muted-foreground uppercase text-xs">
                       {selectedProduct?.unit}
                    </div>
                 </div>
              </div>

              <div className="grid gap-3">
                 <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">Reason for update</Label>
                 <Input 
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="h-14 border-none bg-muted/30 rounded-md text-foreground"
                  placeholder="e.g. Damage control, Audit correction..."
                 />
              </div>

              <Button 
                onClick={handleAdjust} 
                disabled={isAdjusting}
                className={cn(
                  "w-full h-16 rounded-md text-lg font-bold shadow-2xl transition-all cursor-pointer",
                  adjustmentType === 'OUT' ? "bg-destructive hover:bg-destructive/90 shadow-destructive/20" : "bg-primary hover:bg-primary/90 shadow-primary/20 text-primary-foreground"
                )}
              >
                 {isAdjusting ? <Loader2 className="h-6 w-6 animate-spin" /> : "Commit Stock Change"}
              </Button>
           </div>
        </DialogContent>
      </Dialog>
      {/* Requisition Dialog */}
      <Dialog open={isReqModalOpen} onOpenChange={setIsReqModalOpen}>
        <DialogContent className="rounded-lg border-none p-10 max-w-md bg-card">
           <DialogHeader className="space-y-4">
              <div className="flex items-center gap-4">
                 <div className="h-14 w-14 rounded-lg flex items-center justify-center shadow-xl text-white bg-primary shadow-primary/20">
                    <ClipboardList className="h-6 w-6" />
                 </div>
                 <div>
                    <DialogTitle className="text-2xl font-bold tracking-tight">Request Restock</DialogTitle>
                    <DialogDescription className="font-semibold uppercase tracking-widest text-[10px]">
                      Submit a requisition for {selectedProduct?.name}
                    </DialogDescription>
                 </div>
              </div>
           </DialogHeader>
           
           <form onSubmit={handleCreateReq} className="space-y-6 mt-6">
              <div className="space-y-2">
                 <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Quantity Needed ({selectedProduct?.unit})</Label>
                 <Input 
                   type="number" 
                   value={reqQuantity} 
                   onChange={(e) => setReqQuantity(e.target.value)} 
                   placeholder="e.g. 50"
                   className="h-14 border-none bg-muted/50 rounded-lg font-semibold text-lg text-foreground focus-visible:ring-primary/20"
                 />
              </div>

              <div className="space-y-2">
                 <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Reason (Optional)</Label>
                 <Input 
                   value={reqReason} 
                   onChange={(e) => setReqReason(e.target.value)} 
                   placeholder="Why do we need this?"
                   className="h-14 border-none bg-muted/50 rounded-lg font-semibold text-foreground focus-visible:ring-primary/20"
                 />
              </div>

              <Button 
                type="submit" 
                disabled={isCreatingReq}
                className="w-full h-16 rounded-lg text-lg font-semibold shadow-2xl shadow-primary/20 transition-all cursor-pointer"
              >
                 {isCreatingReq ? <Loader2 className="h-6 w-6 animate-spin" /> : "Submit Request"}
              </Button>
           </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inventory;
