import { useParams, useNavigate } from "react-router-dom";
import { 
  useGetSaleQuery, 
  useConfirmSaleMutation,
  useCancelSaleMutation,
  useUpdateSalePaymentMutation
} from "../features/inventory/salesApiSlice";
import { Button } from "../components/ui/button";
import { 
  ArrowLeft, 
  Edit, 
  Loader2, 
  Banknote, 
  Calendar, 
  User, 
  CheckCircle2,
  XCircle,
  CreditCard,
  Package,
  Clock,
  IndianRupee,
  Mail,
  Phone,
  Printer
} from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { useEffect, useState } from "react";
import { useBreadcrumb } from "@/context/BreadcrumbContext";
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

const SaleDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setLabel } = useBreadcrumb();
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paidAmount, setPaidAmount] = useState("");

  const { data: sale, isLoading } = useGetSaleQuery(id!);
  const [confirmSale, { isLoading: isConfirming }] = useConfirmSaleMutation();
  const [cancelSale, { isLoading: isCancelling }] = useCancelSaleMutation();
  const [updatePayment, { isLoading: isPaying }] = useUpdateSalePaymentMutation();

  useEffect(() => {
    if (sale) {
      setLabel(id!, sale.invoiceNumber);
      setPaidAmount(sale.paidAmount.toString());
    }
  }, [sale, setLabel, id]);

  const handleConfirm = async () => {
    if (!window.confirm("Confirming this sale will check and deduct stock for all items. Proceed?")) return;
    try {
      await confirmSale(id!).unwrap();
      toast.success("Sale confirmed and stock deducted");
    } catch (err: any) {
      toast.error(err?.data?.message || "Confirmation failed");
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel this sale? If confirmed, stock will be reversed.")) return;
    try {
      await cancelSale(id!).unwrap();
      toast.success("Sale cancelled");
    } catch (err: any) {
      toast.error(err?.data?.message || "Cancellation failed");
    }
  };

  const handlePayment = async () => {
    const amount = parseFloat(paidAmount);
    if (isNaN(amount) || amount < 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    try {
      await updatePayment({ id: id!, paidAmount: amount }).unwrap();
      toast.success("Payment information updated");
      setIsPaymentModalOpen(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Payment update failed");
    }
  };

  if (isLoading) return <div className="flex h-[400px] items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  if (!sale) return <div className="text-center py-20">Sales order not found</div>;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT": return <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">DRAFT</Badge>;
      case "CONFIRMED": return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">CONFIRMED</Badge>;
      case "CANCELLED": return <Badge variant="destructive">CANCELLED</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "PENDING": return <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200">PENDING</Badge>;
      case "PARTIAL": return <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">PARTIAL</Badge>;
      case "PAID": return <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">PAID</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/sales")} 
            className="-ml-3 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to sales
          </Button>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => window.print()} className="cursor-pointer">
               <Printer className="mr-2 h-4 w-4" />
               Print Invoice
            </Button>
            {sale.status === "DRAFT" && (
              <Button variant="outline" size="sm" onClick={() => navigate(`/sales/${sale.id}/edit`)} className="cursor-pointer">
                <Edit className="mr-2 h-4 w-4" />
                Edit Draft
              </Button>
            )}
            {sale.status !== "CANCELLED" && (
               <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isCancelling} className="text-red-600 hover:bg-red-50 cursor-pointer">
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel Sale
               </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border">
                 <Banknote className="h-7 w-7" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-bold tracking-tight">{sale.invoiceNumber}</h1>
                  {getStatusBadge(sale.status)}
                </div>
                <div className="flex items-center gap-4 text-muted-foreground mt-1">
                   <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest">
                      <Calendar className="h-3.5 w-3.5" />
                      Date: {new Date(sale.saleDate).toLocaleDateString()}
                   </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
             {sale.status === "DRAFT" && (
                <Button onClick={handleConfirm} disabled={isConfirming} className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 h-12 px-8 rounded-xl cursor-pointer">
                   {isConfirming ? <Loader2 className="animate-spin h-4 w-4" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                   Confirm & Deduct Stock
                </Button>
             )}
             <Button variant="outline" onClick={() => setIsPaymentModalOpen(true)} className="h-12 px-8 rounded-xl cursor-pointer border-primary/20 hover:bg-primary/5 text-primary font-bold">
                <CreditCard className="mr-2 h-4 w-4" />
                Update Payment
             </Button>
          </div>
        </div>
      </div>

      <Separator className="opacity-50" />

      {/* Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
         {/* Customer Info */}
         <div className="lg:col-span-4 space-y-10">
            <section className="space-y-6">
               <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-[10px]">
                  <User className="h-4 w-4" />
                  <span>Customer Details</span>
               </div>
               <div className="space-y-4 bg-muted/20 p-6 rounded-2xl border border-muted-foreground/10">
                  <div className="space-y-1">
                     <p className="text-[10px] text-muted-foreground uppercase font-black">Full Name</p>
                     <p className="font-bold text-lg">{sale.customerName || "Walk-in Customer"}</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                     <div className="flex items-center gap-2 text-sm font-medium">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        {sale.customerEmail || "No email"}
                     </div>
                     <div className="flex items-center gap-2 text-sm font-medium">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        {sale.customerPhone || "No phone"}
                     </div>
                  </div>
               </div>
            </section>

            <section className="space-y-6">
               <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-[10px]">
                  <Clock className="h-4 w-4" />
                  <span>Timeline</span>
               </div>
               <div className="space-y-6 pl-4 border-l-2 border-muted">
                  <div className="relative">
                     <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                     <p className="text-[10px] text-muted-foreground font-black uppercase">Invoice Generated</p>
                     <p className="text-sm font-bold">{new Date(sale.createdAt).toLocaleString()}</p>
                  </div>
                  {sale.status === 'CONFIRMED' && (
                     <div className="relative">
                        <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-blue-500 border-2 border-background" />
                        <p className="text-[10px] text-muted-foreground font-black uppercase">Order Confirmed</p>
                        <p className="text-sm font-bold">Inventory levels updated</p>
                     </div>
                  )}
               </div>
            </section>
         </div>

         {/* Sale Items & Financials */}
         <div className="lg:col-span-8 space-y-10">
            <section className="space-y-6">
               <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-[10px]">
                  <Package className="h-4 w-4" />
                  <span>Sold Items</span>
               </div>
               <div className="rounded-2xl border overflow-hidden bg-background shadow-sm">
                  <Table>
                     <TableHeader className="bg-muted/50">
                        <TableRow>
                           <TableHead>Product</TableHead>
                           <TableHead className="text-center">Quantity</TableHead>
                           <TableHead className="text-right">Unit Price</TableHead>
                           <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                     </TableHeader>
                     <TableBody>
                        {sale.items?.map((item) => (
                           <TableRow key={item.id}>
                              <TableCell>
                                 <div className="flex flex-col">
                                    <span className="font-bold text-sm">{item.product.name}</span>
                                    <span className="text-[10px] text-muted-foreground font-mono">{item.product.sku}</span>
                                 </div>
                              </TableCell>
                              <TableCell className="text-center font-bold">
                                 {item.quantity} <span className="text-[10px] text-muted-foreground uppercase">{item.product.unit}</span>
                              </TableCell>
                              <TableCell className="text-right font-medium text-slate-600">
                                 ₹{item.unitPrice.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right font-black">
                                 ₹{item.totalPrice.toLocaleString()}
                              </TableCell>
                           </TableRow>
                        ))}
                     </TableBody>
                  </Table>
               </div>
            </section>

            {/* Financial Summary */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-muted/10 p-8 rounded-3xl border border-muted-foreground/10">
               <div className="space-y-6">
                  <div className="space-y-1">
                     <p className="text-[10px] text-muted-foreground font-black uppercase">Internal Notes</p>
                     <p className="text-sm italic leading-relaxed text-muted-foreground/80">
                        {sale.notes || "No internal notes for this sale."}
                     </p>
                  </div>
               </div>
               <div className="space-y-4">
                  <div className="flex justify-between items-center">
                     <span className="text-sm font-bold text-muted-foreground">Invoice Total</span>
                     <span className="text-lg font-black">₹{sale.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-muted-foreground">Amount Received</span>
                        {getPaymentBadge(sale.paymentStatus)}
                     </div>
                     <span className="text-lg font-black text-emerald-600">₹{sale.paidAmount.toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center pt-2">
                     <span className="text-sm font-black uppercase tracking-wider">Remaining Balance</span>
                     <span className="text-2xl font-black text-primary">₹{(sale.totalAmount - sale.paidAmount).toLocaleString()}</span>
                  </div>
               </div>
            </section>
         </div>
      </div>

      {/* Payment Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
         <DialogContent className="max-w-md rounded-3xl">
            <DialogHeader>
               <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                     <CreditCard className="h-5 w-5" />
                  </div>
                  Receive Payment
               </DialogTitle>
               <DialogDescription>
                  Enter the total amount received from the customer for this invoice.
               </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 pt-4">
               <div className="grid gap-2">
                  <Label className="text-sm font-bold">Received Amount (₹)</Label>
                  <div className="relative">
                     <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                     <Input 
                       type="number" 
                       value={paidAmount} 
                       onChange={(e) => setPaidAmount(e.target.value)}
                       className="h-14 pl-10 text-xl font-black"
                     />
                  </div>
                  <p className="text-[10px] text-muted-foreground font-medium">Total Sale Value: ₹{sale.totalAmount.toLocaleString()}</p>
               </div>

               <Button 
                  onClick={handlePayment} 
                  disabled={isPaying} 
                  className="w-full h-14 bg-primary text-white text-base font-bold shadow-lg shadow-primary/20 rounded-2xl cursor-pointer"
               >
                  {isPaying ? <Loader2 className="h-5 w-5 animate-spin" /> : "Update Payment Status"}
               </Button>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
};

export default SaleDetail;
