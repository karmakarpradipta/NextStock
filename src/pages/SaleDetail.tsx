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
  Printer,
  Download
} from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { useEffect, useState } from "react";
import { useBreadcrumb } from "@/context/BreadcrumbContext";
import { downloadFilteredReport } from "../utils/downloadFile";
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
  const [isExporting, setIsExporting] = useState(false);

  const { data: sale, isLoading } = useGetSaleQuery(id!);
  const [confirmSale, { isLoading: isConfirming }] = useConfirmSaleMutation();
  const [cancelSale, { isLoading: isCancelling }] = useCancelSaleMutation();
  const [updatePayment, { isLoading: isPaying }] = useUpdateSalePaymentMutation();

  const handleDownloadInvoice = async () => {
    if (!sale) return;
    try {
      setIsExporting(true);
      await downloadFilteredReport(`/reports/sales?search=${sale.invoiceNumber}`, `invoice_${sale.invoiceNumber}`, "pdf");
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    if (sale) {
      setLabel(id!, sale.invoiceNumber);
      // Pre-fill with remaining balance (needed amount)
      const remaining = sale.totalAmount - sale.paidAmount;
      setPaidAmount(remaining > 0 ? remaining.toString() : "0");
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
    const additionalAmount = parseFloat(paidAmount);
    if (isNaN(additionalAmount) || additionalAmount < 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!sale) return;

    // Calculate new total paid amount
    const newTotalPaid = sale.paidAmount + additionalAmount;
    
    if (newTotalPaid > sale.totalAmount) {
      if (!window.confirm(`The total paid amount (₹${newTotalPaid.toLocaleString()}) exceeds the invoice total (₹${sale.totalAmount.toLocaleString()}). Do you want to proceed?`)) {
        return;
      }
    }

    try {
      await updatePayment({ id: id!, paidAmount: newTotalPaid }).unwrap();
      toast.success("Payment information updated");
      setIsPaymentModalOpen(false);
    } catch (err: any) {
      toast.error(err?.data?.message || "Payment update failed");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) return <div className="flex h-[400px] items-center justify-center no-print"><Loader2 className="animate-spin text-primary" /></div>;
  if (!sale) return <div className="text-center py-20 font-sans no-print">Sales order not found</div>;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT": return <Badge variant="secondary">DRAFT</Badge>;
      case "CONFIRMED": return <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">CONFIRMED</Badge>;
      case "CANCELLED": return <Badge variant="destructive">CANCELLED</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "PENDING": return <Badge variant="outline">PENDING</Badge>;
      case "PARTIAL": return <Badge variant="outline" className="bg-accent text-accent-foreground border-border">PARTIAL</Badge>;
      case "PAID": return <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">PAID</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <>
    <div className="max-w-6xl mx-auto space-y-12 pb-20 font-sans no-print">
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
            {sale.status === "DRAFT" && (
              <Button variant="outline" size="sm" onClick={() => navigate(`/sales/${sale.id}/edit`)} className="cursor-pointer border-border">
                <Edit className="mr-2 h-4 w-4" />
                Edit Draft
              </Button>
            )}
            {sale.status !== "CANCELLED" && (
               <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isCancelling} className="text-destructive hover:bg-destructive/10 cursor-pointer">
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel Sale
               </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-border">
                 <Banknote className="h-7 w-7" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-bold tracking-tight text-foreground">{sale.invoiceNumber}</h1>
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

          <div className="flex flex-wrap gap-4">
             <Button 
              variant="outline" 
              onClick={handlePrint} 
              className="h-12 px-6 rounded-xl cursor-pointer border-border hover:bg-accent font-bold"
             >
                <Printer className="mr-2 h-4 w-4" />
                Print Invoice
             </Button>
             {sale.status === "DRAFT" && (
                <Button onClick={handleConfirm} disabled={isConfirming} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 h-12 px-8 rounded-xl cursor-pointer">
                   {isConfirming ? <Loader2 className="animate-spin h-4 w-4" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                   Confirm & Deduct Stock
                </Button>
             )}
             <Button variant="outline" onClick={() => setIsPaymentModalOpen(true)} className="h-12 px-8 rounded-xl cursor-pointer border-border hover:bg-accent text-foreground font-bold">
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
               <div className="space-y-4 bg-muted/20 p-6 rounded-2xl border border-border">
                  <div className="space-y-1">
                     <p className="text-[10px] text-muted-foreground uppercase font-black">Full Name</p>
                     <p className="font-bold text-lg text-foreground">{sale.customerName || "Walk-in Customer"}</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 text-foreground">
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
                     <p className="text-sm font-bold text-foreground">{new Date(sale.createdAt).toLocaleString()}</p>
                  </div>
                  {sale.status === 'CONFIRMED' && (
                     <div className="relative">
                        <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-primary border-2 border-background opacity-70" />
                        <p className="text-[10px] text-muted-foreground font-black uppercase">Order Confirmed</p>
                        <p className="text-sm font-bold text-foreground">Inventory levels updated</p>
                     </div>
                  )}
               </div>
            </section>
         </div>

         {/* Sale Items & Financials */}
         <div className="lg:col-span-8 space-y-10 text-foreground">
            <section className="space-y-6">
               <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-[10px]">
                  <Package className="h-4 w-4" />
                  <span>Sold Items</span>
               </div>
               <div className="rounded-2xl border border-border overflow-hidden bg-background shadow-sm">
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
                           <TableRow key={item.id} className="border-border">
                              <TableCell>
                                 <div className="flex flex-col">
                                    <span className="font-bold text-sm">{item.product.name}</span>
                                    <span className="text-[10px] text-muted-foreground font-mono">{item.product.sku}</span>
                                 </div>
                              </TableCell>
                              <TableCell className="text-center font-bold">
                                 {item.quantity} <span className="text-[10px] text-muted-foreground uppercase">{item.product.unit}</span>
                              </TableCell>
                              <TableCell className="text-right font-medium text-muted-foreground">
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
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-muted/10 p-8 rounded-3xl border border-border">
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
                     <span className="text-lg font-black text-primary">₹{sale.paidAmount.toLocaleString()}</span>
                  </div>
                  <Separator className="bg-border" />
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
         <DialogContent className="max-w-md rounded-3xl border-border bg-card">
            <DialogHeader>
               <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-foreground">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-border">
                     <CreditCard className="h-5 w-5" />
                  </div>
                  Record Payment
               </DialogTitle>
               <DialogDescription className="text-muted-foreground">
                  Enter the amount currently received from the customer. This will be added to the total paid amount.
               </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 pt-4">
               <div className="grid gap-2">
                  <Label className="text-sm font-bold text-foreground">Amount to Pay (₹)</Label>
                  <div className="relative">
                     <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                     <Input 
                       type="number" 
                       value={paidAmount} 
                       onChange={(e) => setPaidAmount(e.target.value)}
                       className="h-14 pl-10 text-xl font-black border-border bg-muted/50 text-foreground"
                       placeholder="0.00"
                     />
                  </div>
                  <div className="flex justify-between text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                    <span>Invoice Total: ₹{sale.totalAmount.toLocaleString()}</span>
                    <span>Remaining: ₹{(sale.totalAmount - sale.paidAmount).toLocaleString()}</span>
                  </div>
               </div>

               <Button 
                  onClick={handlePayment} 
                  disabled={isPaying} 
                  className="w-full h-14 bg-primary text-primary-foreground text-base font-bold shadow-lg shadow-primary/20 rounded-2xl cursor-pointer"
               >
                  {isPaying ? <Loader2 className="h-5 w-5 animate-spin" /> : "Update Payment Status"}
               </Button>
            </div>
         </DialogContent>
      </Dialog>
    </div>

    {/* Print-Only Invoice Template */}
    <div className="print-only p-10 font-sans text-black bg-white min-h-screen">
      <div className="flex justify-between items-start border-b-2 border-black pb-8">
        <div>
           <h1 className="text-4xl font-black tracking-tighter uppercase">NextStock</h1>
           <p className="text-sm font-bold uppercase tracking-widest mt-1">Management System</p>
        </div>
        <div className="text-right">
           <h2 className="text-3xl font-bold uppercase">Invoice</h2>
           <p className="text-sm font-black mt-2">#{sale.invoiceNumber}</p>
           <p className="text-xs font-bold text-gray-600 uppercase">Date: {new Date(sale.saleDate).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-20 py-12">
        <div className="space-y-4">
           <h3 className="text-[10px] font-black uppercase tracking-widest border-b border-gray-200 pb-1">Customer Details</h3>
           <div className="space-y-1">
              <p className="font-bold text-lg">{sale.customerName || "Walk-in Customer"}</p>
              <p className="text-sm">{sale.customerEmail || "No email provided"}</p>
              <p className="text-sm">{sale.customerPhone || "No phone provided"}</p>
           </div>
        </div>
        <div className="space-y-4">
           <h3 className="text-[10px] font-black uppercase tracking-widest border-b border-gray-200 pb-1">Status Summary</h3>
           <div className="space-y-1">
              <p className="text-sm font-bold uppercase">Order: {sale.status}</p>
              <p className="text-sm font-bold uppercase">Payment: {sale.paymentStatus}</p>
           </div>
        </div>
      </div>

      <div className="py-8">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-black text-[10px] font-black uppercase text-left">
              <th className="py-3">Description</th>
              <th className="py-3 text-center">Qty</th>
              <th className="py-3 text-right">Unit Price</th>
              <th className="py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {sale.items?.map((item) => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="py-4">
                   <p className="font-bold">{item.product.name}</p>
                   <p className="text-[10px] font-mono text-gray-500 uppercase">{item.product.sku}</p>
                </td>
                <td className="py-4 text-center font-bold">{item.quantity} {item.product.unit}</td>
                <td className="py-4 text-right">₹{item.unitPrice.toLocaleString()}</td>
                <td className="py-4 text-right font-black">₹{item.totalPrice.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end pt-12">
        <div className="w-64 space-y-4">
           <div className="flex justify-between items-center text-sm font-bold text-gray-600">
              <span>Subtotal</span>
              <span>₹{sale.totalAmount.toLocaleString()}</span>
           </div>
           <div className="flex justify-between items-center text-sm font-bold text-gray-600">
              <span>Amount Received</span>
              <span>₹{sale.paidAmount.toLocaleString()}</span>
           </div>
           <div className="border-t-2 border-black pt-4 flex justify-between items-center">
              <span className="text-base font-black uppercase tracking-widest">Balance Due</span>
              <span className="text-2xl font-black">₹{(sale.totalAmount - sale.paidAmount).toLocaleString()}</span>
           </div>
        </div>
      </div>

      {sale.notes && (
        <div className="mt-20 p-6 bg-gray-50 border border-gray-100 rounded-xl">
           <h4 className="text-[10px] font-black uppercase tracking-widest mb-2">Terms & Notes</h4>
           <p className="text-xs leading-relaxed text-gray-600 italic">{sale.notes}</p>
        </div>
      )}

      <div className="mt-auto pt-20 text-center border-t border-gray-100">
         <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
           Thank you for your business. This is a computer generated invoice.
         </p>
      </div>
    </div>
    </>
  );
};

export default SaleDetail;
