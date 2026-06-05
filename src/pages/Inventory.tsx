import { useState } from "react";
import { 
  useGetProductsQuery,
  type Product 
} from "../features/inventory/productApiSlice";
import { useAddStockMovementMutation } from "../features/inventory/stockApiSlice";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
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
  Loader2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Skeleton } from "../components/ui/skeleton";
import { motion } from "framer-motion";

const Inventory = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "low">("all");

  const { data, isLoading, refetch, isFetching } = useGetProductsQuery({
    limit: 100, // Show many for easy tracking
    search: searchTerm,
    lowStock: stockFilter === "low" ? "true" : undefined
  });

  const [addMovement, { isLoading: isAdjusting }] = useAddStockMovementMutation();

  // Adjustment Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<"IN" | "OUT" | "ADJUSTMENT">("ADJUSTMENT");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");

  const handleOpenAdjustment = (product: Product, type: "IN" | "OUT" | "ADJUSTMENT") => {
    setSelectedProduct(product);
    setAdjustmentType(type);
    setQuantity("");
    setNote("");
    setIsModalOpen(true);
  };

  const handleAdjust = async () => {
    if (!selectedProduct || !quantity || isNaN(parseInt(quantity))) {
      toast.error("Please enter a valid quantity");
      return;
    }

    try {
      await addMovement({
        productId: selectedProduct.id,
        type: adjustmentType,
        quantity: parseInt(quantity),
        note: note || `Manual ${adjustmentType} adjustment`
      }).unwrap();
      
      toast.success("Inventory updated");
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Adjustment failed");
    }
  };

  return (
    <div className="space-y-8 pb-10 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-xl shadow-primary/20">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tight">Stock Management</h2>
            <p className="text-muted-foreground text-sm font-medium italic">Monitor levels and perform manual overrides.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <Button 
            variant="outline" 
            size="icon" 
            onClick={() => refetch()} 
            disabled={isLoading || isFetching}
            className="h-10 w-10 cursor-pointer rounded-xl border-border"
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
            className="pl-9 h-12 bg-card border-border shadow-sm rounded-2xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="md:col-span-6 flex p-1 bg-muted/50 rounded-2xl gap-1 h-12">
            <button
               onClick={() => setStockFilter("all")}
               className={cn(
                 "flex-1 flex items-center justify-center gap-2 text-xs font-black rounded-xl transition-all uppercase tracking-widest cursor-pointer",
                 stockFilter === "all" ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
               )}
            >
               <CheckCircle2 className="h-3.5 w-3.5" />
               All Items
            </button>
            <button
               onClick={() => setStockFilter("low")}
               className={cn(
                 "flex-1 flex items-center justify-center gap-2 text-xs font-black rounded-xl transition-all uppercase tracking-widest cursor-pointer",
                 stockFilter === "low" ? "bg-destructive/10 text-destructive shadow-sm" : "text-muted-foreground hover:text-foreground"
               )}
            >
               <AlertTriangle className={cn("h-3.5 w-3.5", stockFilter === "low" ? "animate-pulse" : "")} />
               Low Stock
            </button>
        </div>
      </div>

      {/* Stock Table */}
      <div className="rounded-[2rem] border border-border bg-card shadow-md overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="py-6 px-6">Product Details</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-center">Current Stock</TableHead>
              <TableHead className="text-center">Safety Status</TableHead>
              <TableHead className="text-right px-6">Quick Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="px-6 py-4"><Skeleton className="h-12 w-48 rounded-xl" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24 rounded-lg" /></TableCell>
                  <TableCell><Skeleton className="h-10 w-16 mx-auto rounded-xl" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 mx-auto rounded-full" /></TableCell>
                  <TableCell className="text-right px-6"><Skeleton className="h-10 w-24 ml-auto rounded-xl" /></TableCell>
                </TableRow>
              ))
            ) : data?.products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                     <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                        <Package className="h-8 w-8" />
                     </div>
                     <p className="text-lg font-bold text-muted-foreground">No matching inventory items found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data?.products.map((product) => (
                <TableRow key={product.id} className="group transition-colors hover:bg-muted/20 border-b border-border">
                  <TableCell className="py-4 px-6">
                    <div className="flex flex-col">
                      <span className="font-black text-sm tracking-tight group-hover:text-primary transition-colors cursor-pointer" onClick={() => navigate(`/inventory/products/${product.id}`)}>{product.name}</span>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{product.sku}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-muted border-none font-bold text-[10px]">{product.category?.name || "N/A"}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center">
                       <span className={cn(
                         "text-lg font-black tracking-tighter",
                         product.isLowStock ? "text-destructive" : "text-foreground"
                       )}>{product.currentStock}</span>
                       <span className="text-[9px] font-black uppercase text-muted-foreground">{product.unit}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {product.isLowStock ? (
                      <Badge variant="destructive" className="animate-pulse px-3 py-1 font-black text-[9px] uppercase tracking-[0.15em] border-none shadow-lg">Critical</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-3 py-1 font-black text-[9px] uppercase tracking-[0.15em]">Healthy</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <div className="flex items-center justify-end gap-2">
                       <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 rounded-xl bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground transition-all border border-border shadow-sm"
                        onClick={() => handleOpenAdjustment(product, "IN")}
                        title="Add Stock"
                       >
                          <Plus className="h-4 w-4" />
                       </Button>
                       <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 rounded-xl bg-accent text-accent-foreground hover:bg-destructive hover:text-destructive-foreground transition-all border border-border shadow-sm"
                        onClick={() => handleOpenAdjustment(product, "OUT")}
                        title="Deduct Stock"
                       >
                          <Minus className="h-4 w-4" />
                       </Button>
                       <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 rounded-xl bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground transition-all border border-border shadow-sm"
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

      {/* Adjustment Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="rounded-[2.5rem] border-none p-10 max-w-md bg-card">
           <DialogHeader className="space-y-4">
              <div className="flex items-center gap-4">
                 <div className={cn(
                   "h-14 w-14 rounded-3xl flex items-center justify-center shadow-xl text-white",
                   adjustmentType === 'OUT' ? "bg-destructive shadow-destructive/20" : "bg-primary shadow-primary/20"
                 )}>
                    {adjustmentType === 'IN' ? <TrendingUp className="h-7 w-7" /> : <TrendingDown className="h-7 w-7" />}
                 </div>
                 <div className="text-left">
                    <DialogTitle className="text-3xl font-black tracking-tighter text-foreground">Inventory Override</DialogTitle>
                    <DialogDescription className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest">{selectedProduct?.name}</DialogDescription>
                 </div>
              </div>
           </DialogHeader>

           <div className="space-y-8 pt-6">
              <div className="grid gap-3">
                 <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Adjustment Quantity</Label>
                 <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-muted flex items-center justify-center font-black text-xs text-muted-foreground">
                       {adjustmentType === 'IN' ? '+' : '-'}
                    </div>
                    <Input 
                      type="number" 
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="h-16 pl-16 text-3xl font-black border-none bg-muted/50 rounded-2xl shadow-inner text-foreground"
                      placeholder="0"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-muted-foreground uppercase text-xs italic">
                       {selectedProduct?.unit}
                    </div>
                 </div>
              </div>

              <div className="grid gap-3">
                 <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Reason for update</Label>
                 <Input 
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="h-14 border-none bg-muted/30 rounded-xl text-foreground"
                  placeholder="e.g. Damage control, Audit correction..."
                 />
              </div>

              <Button 
                onClick={handleAdjust} 
                disabled={isAdjusting}
                className={cn(
                  "w-full h-16 rounded-[1.5rem] text-lg font-black shadow-2xl transition-all cursor-pointer",
                  adjustmentType === 'OUT' ? "bg-destructive hover:bg-destructive/90 shadow-destructive/20" : "bg-primary hover:bg-primary/90 shadow-primary/20 text-primary-foreground"
                )}
              >
                 {isAdjusting ? <Loader2 className="h-6 w-6 animate-spin" /> : "Commit Stock Change"}
              </Button>
           </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inventory;
