import { useParams, useNavigate } from "react-router-dom";
import { useGetProductQuery } from "../features/inventory/productApiSlice";
import { 
  useGetStockHistoryQuery, 
  useAddStockMovementMutation 
} from "../features/inventory/stockApiSlice";
import { Button } from "../components/ui/button";
import { 
  ArrowLeft, 
  Edit, 
  Loader2, 
  Package, 
  TrendingUp, 
  TrendingDown, 
  History,
  Plus,
  Minus,
  Settings2,
  AlertCircle,
  RotateCw
} from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { useEffect, useState } from "react";
import { useBreadcrumb } from "@/context/BreadcrumbContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setLabel } = useBreadcrumb();
  
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<"IN" | "OUT" | "ADJUSTMENT">("IN");
  const [adjustmentQuantity, setAdjustmentQuantity] = useState("");
  const [adjustmentNote, setAdjustmentNote] = useState("");

  const { data: product, isLoading: isProductLoading } = useGetProductQuery(id!);
  const { data: history, isLoading: isHistoryLoading, refetch: refetchHistory, isFetching: isFetchingHistory } = useGetStockHistoryQuery({ productId: id! });
  const [addMovement, { isLoading: isSubmitting }] = useAddStockMovementMutation();

  useEffect(() => {
    if (product) {
      setLabel(id!, product.sku || product.name);
    }
  }, [product, setLabel, id]);

  const handleAdjustStock = async () => {
    const qty = parseInt(adjustmentQuantity);
    if (isNaN(qty) || qty === 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    try {
      await addMovement({
        productId: id!,
        type: adjustmentType,
        quantity: qty,
        note: adjustmentNote
      }).unwrap();
      
      toast.success(`Stock ${adjustmentType} adjustment successful`);
      setIsAdjustmentModalOpen(false);
      setAdjustmentQuantity("");
      setAdjustmentNote("");
    } catch (err: any) {
      toast.error(err?.data?.message || "Adjustment failed");
    }
  };

  if (isProductLoading) return <div className="flex h-[400px] items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  if (!product) return <div className="text-center py-20 font-sans">Product not found</div>;

  const stockPercentage = Math.min(100, (product.currentStock / (product.minStockThreshold * 3)) * 100);
  const isHealthy = product.currentStock > product.minStockThreshold;

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20 font-sans">
      {/* Header */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/inventory/products")} 
            className="-ml-3 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to products
          </Button>
          <Button variant="outline" onClick={() => navigate(`/inventory/products/${product.id}/edit`)} className="cursor-pointer border-border hover:bg-accent">
            <Edit className="mr-2 h-4 w-4" />
            Edit Item
          </Button>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-start gap-6">
            <div className="h-24 w-24 rounded-2xl border border-border bg-muted flex items-center justify-center overflow-hidden shrink-0">
               {product.imageUrl ? (
                 <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
               ) : (
                 <Package className="h-10 w-10 text-muted-foreground/40" />
               )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-bold tracking-tight text-foreground">{product.name}</h1>
                <Badge variant={product.isActive ? "outline" : "destructive"} className={product.isActive ? "text-primary border-primary/20 bg-primary/10" : ""}>
                  {product.isActive ? "Active" : "Archived"}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-muted-foreground">
                <span className="bg-muted px-2 py-0.5 rounded text-xs font-mono font-bold tracking-tighter">SKU: {product.sku}</span>
                <Separator orientation="vertical" className="h-4 bg-border" />
                <span className="text-sm font-medium">{product.category?.name || "Uncategorized"}</span>
                <Separator orientation="vertical" className="h-4 bg-border" />
                <span className="text-sm uppercase font-bold text-[10px]">{product.unit}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
             <Button onClick={() => { setAdjustmentType("IN"); setIsAdjustmentModalOpen(true); }} className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-lg shadow-primary/20 rounded-xl px-6 h-12 font-bold">
                <Plus className="mr-2 h-4 w-4" />
                Add Stock
             </Button>
             <Button onClick={() => { setAdjustmentType("OUT"); setIsAdjustmentModalOpen(true); }} variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive/10 cursor-pointer rounded-xl px-6 h-12 font-bold">
                <Minus className="mr-2 h-4 w-4" />
                Deduct
             </Button>
          </div>
        </div>
      </div>

      <Separator className="opacity-50" />

      {/* Analytics Bento */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Stock Health */}
        <div className="lg:col-span-4 space-y-8">
           <section className="space-y-6">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-xs">
                    <TrendingUp className="h-4 w-4" />
                    <span>Inventory Health</span>
                 </div>
                 {product.isLowStock && (
                   <Badge variant="destructive" className="animate-pulse h-5 px-2 text-[10px]">CRITICAL</Badge>
                 )}
              </div>

              <div className="space-y-4">
                 <div className="flex items-baseline justify-between text-foreground">
                    <div className="text-5xl font-black">{product.currentStock}</div>
                    <div className="text-muted-foreground text-sm font-medium uppercase">{product.unit} available</div>
                 </div>

                 <div className="space-y-2">
                    <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                       <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${stockPercentage}%` }}
                          className={cn(
                            "h-full rounded-full transition-colors",
                            isHealthy ? "bg-primary" : "bg-destructive"
                          )}
                       />
                    </div>
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter text-muted-foreground">
                       <span>Empty</span>
                       <span>Threshold ({product.minStockThreshold})</span>
                       <span>Healthy</span>
                    </div>
                 </div>

                 {!isHealthy && (
                   <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-xl flex gap-3 text-destructive">
                      <AlertCircle className="h-5 w-5 shrink-0" />
                      <div className="space-y-1">
                         <p className="text-xs font-bold leading-none uppercase tracking-widest">Low Stock Alert</p>
                         <p className="text-[11px] font-medium leading-tight opacity-90">This item is {product.minStockThreshold - product.currentStock} {product.unit} below safety threshold.</p>
                      </div>
                   </div>
                 )}
              </div>
           </section>

           <Separator className="opacity-30" />

           <section className="space-y-6">
              <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-xs">
                 <Settings2 className="h-4 w-4" />
                 <span>Description</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                 {product.description || "No description provided for this item."}
              </p>
           </section>
        </div>

        {/* History Table */}
        <div className="lg:col-span-8 space-y-6">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-xl text-foreground">
                 <History className="h-5 w-5 text-primary" />
                 <h3>Movement History</h3>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => refetchHistory()} 
                  disabled={isHistoryLoading || isFetchingHistory}
                  className="h-8 w-8 cursor-pointer rounded-full border-border hover:bg-accent"
                  title="Refresh History"
                >
                  <RotateCw className={cn("h-3.5 w-3.5", (isHistoryLoading || isFetchingHistory) && "animate-spin")} />
                </Button>
                <Button variant="ghost" className="text-primary font-black text-[10px] uppercase tracking-widest" onClick={() => setIsAdjustmentModalOpen(true)}>
                  Manual Override
                </Button>
              </div>
           </div>

           <div className="rounded-2xl border border-border overflow-hidden bg-background shadow-sm">
              <Table>
                 <TableHeader className="bg-muted/50 text-muted-foreground font-black uppercase text-[10px]">
                    <TableRow className="border-border hover:bg-transparent">
                       <TableHead className="h-12">Type</TableHead>
                       <TableHead className="h-12">Quantity</TableHead>
                       <TableHead className="h-12">Reason / Note</TableHead>
                       <TableHead className="text-right h-12">Date</TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                    {isHistoryLoading ? (
                      [...Array(3)].map((_, i) => (
                        <TableRow key={i} className="border-border">
                           <TableCell colSpan={4} className="h-12"><Skeleton className="h-4 w-full rounded" /></TableCell>
                        </TableRow>
                      ))
                    ) : history?.movements.length === 0 ? (
                       <TableRow>
                          <TableCell colSpan={4} className="h-32 text-center text-muted-foreground italic font-medium">No stock movements recorded yet.</TableCell>
                       </TableRow>
                    ) : (
                       history?.movements.map((move) => (
                         <TableRow key={move.id} className="group hover:bg-muted/30 transition-colors border-border">
                            <TableCell>
                               <div className="flex items-center gap-2">
                                  <div className={cn(
                                     "h-7 w-7 rounded-full flex items-center justify-center border border-border bg-muted",
                                     move.type === 'IN' ? "text-primary" : move.type === 'OUT' ? "text-destructive" : "text-foreground"
                                  )}>
                                     {move.type === 'IN' ? <Plus className="h-3 w-3" /> : move.type === 'OUT' ? <Minus className="h-3 w-3" /> : <Settings2 className="h-3 w-3" />}
                                  </div>
                                  <span className="text-[10px] font-black uppercase tracking-widest text-foreground">{move.type}</span>
                               </div>
                            </TableCell>
                            <TableCell>
                               <span className={cn(
                                 "font-black text-sm",
                                 move.type === 'IN' ? "text-primary" : move.type === 'OUT' ? "text-destructive" : "text-foreground"
                               )}>
                                  {move.type === 'IN' ? '+' : move.type === 'OUT' ? '-' : ''}{move.quantity}
                               </span>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs font-medium">
                               {move.note || "—"}
                            </TableCell>
                            <TableCell className="text-right text-[11px] font-black text-muted-foreground uppercase">
                               {new Date(move.createdAt).toLocaleDateString()}
                            </TableCell>
                         </TableRow>
                       ))
                    )}
                 </TableBody>
              </Table>
           </div>
        </div>
      </div>

      {/* Adjustment Modal */}
      <Dialog open={isAdjustmentModalOpen} onOpenChange={setIsAdjustmentModalOpen}>
         <DialogContent className="max-w-md rounded-3xl border-border bg-card">
            <DialogHeader>
               <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-foreground">
                  <div className={cn(
                     "h-10 w-10 rounded-xl flex items-center justify-center bg-muted text-primary border border-border shadow-sm",
                     adjustmentType === 'OUT' ? "text-destructive" : "text-primary"
                  )}>
                     {adjustmentType === 'IN' ? <Plus className="h-5 w-5" /> : adjustmentType === 'OUT' ? <Minus className="h-5 w-5" /> : <Settings2 className="h-5 w-5" />}
                  </div>
                  Stock Adjustment
               </DialogTitle>
               <DialogDescription className="text-muted-foreground font-medium">
                  Manually adjust the inventory levels for {product.name}.
               </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 pt-4">
               <div className="flex p-1 bg-muted rounded-xl gap-1 border border-border">
                  {(["IN", "OUT", "ADJUSTMENT"] as const).map((t) => (
                    <button
                       key={t}
                       onClick={() => setAdjustmentType(t)}
                       className={cn(
                         "flex-1 py-2 text-[10px] font-black rounded-lg transition-all uppercase tracking-widest cursor-pointer",
                         adjustmentType === t ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                       )}
                    >
                       {t}
                    </button>
                  ))}
               </div>

               <div className="space-y-4">
                  <div className="grid gap-2">
                     <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Quantity ({product.unit})</Label>
                     <Input 
                       type="number" 
                       value={adjustmentQuantity} 
                       onChange={(e) => setAdjustmentQuantity(e.target.value)}
                       placeholder="Enter amount"
                       className="h-12 text-lg font-bold border-border bg-muted/30 text-foreground"
                     />
                  </div>
                  <div className="grid gap-2">
                     <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Reason / Note</Label>
                     <Input 
                       value={adjustmentNote} 
                       onChange={(e) => setAdjustmentNote(e.target.value)}
                       placeholder="e.g. Damaged during handling"
                       className="h-12 border-border bg-muted/30 text-foreground"
                     />
                  </div>
               </div>

               <Button 
                  onClick={handleAdjustStock} 
                  disabled={isSubmitting} 
                  className={cn(
                    "w-full h-14 text-base font-black uppercase tracking-widest shadow-xl rounded-2xl cursor-pointer transition-all",
                    adjustmentType === 'OUT' ? "bg-destructive hover:bg-destructive/90 shadow-destructive/20 text-destructive-foreground" : 
                    "bg-primary hover:bg-primary/90 shadow-primary/20 text-primary-foreground"
                  )}
               >
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Commit Stock Change"}
               </Button>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductDetail;
