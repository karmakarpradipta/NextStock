import { useParams, useNavigate } from "react-router-dom";
import { 
  useGetPurchaseQuery, 
  useConfirmPurchaseMutation,
  useCancelPurchaseMutation,
  useUpdatePurchasePaymentMutation,
  useUpdatePurchaseMutation
} from "../features/inventory/purchaseApiSlice";
import { Button } from "../components/ui/button";
import { 
  ArrowLeft, 
  Edit, 
  Loader2, 
  ShoppingCart, 
  Calendar, 
  User, 
  FileText,
  CheckCircle2,
  XCircle,
  CreditCard,
  Package,
  ExternalLink,
  Clock,
  IndianRupee,
  Mail,
  Phone,
  DollarSign
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

const PurchaseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setLabel } = useBreadcrumb();
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [paidAmount, setPaidAmount] = useState("");

  const { data: purchase, isLoading } = useGetPurchaseQuery(id!);
  const [confirmOrder, { isLoading: isConfirming }] = useConfirmPurchaseMutation();
  const [cancelOrder, { isLoading: isCancelling }] = useCancelPurchaseMutation();
  const [updatePayment, { isLoading: isPaying }] = useUpdatePurchasePaymentMutation();
  const [updatePurchase] = useUpdatePurchaseMutation();

  useEffect(() => {
    if (purchase) {
      setLabel(id!, purchase.orderNumber);
      setPaidAmount(purchase.paidAmount.toString());
    }
  }, [purchase, setLabel, id]);

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
        { method: "POST", body: formData }
      );
      const result = await response.json();
      if (result.secure_url) return result.secure_url;
      throw new Error("Upload failed");
    } catch (err) {
      console.error("Cloudinary error:", err);
      throw err;
    }
  };

  const handleInvoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file only");
      return;
    }

    try {
      setIsUploading(true);
      const url = await uploadToCloudinary(file);
      await updatePurchase({ id: id!, data: { invoiceUrl: url } }).unwrap();
      toast.success("Invoice uploaded successfully");
    } catch (err: any) {
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirm = async () => {
    if (!window.confirm("Confirming this order will automatically increment stock for all items. Proceed?")) return;
    try {
      await confirmOrder(id!).unwrap();
      toast.success("Order confirmed and stock updated");
    } catch (err: any) {
      toast.error(err?.data?.message || "Confirmation failed");
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel this order? If confirmed, stock will be reversed.")) return;
    try {
      await cancelOrder(id!).unwrap();
      toast.success("Order cancelled");
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
  if (!purchase) return <div className="text-center py-20">Purchase order not found</div>;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT": return <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">DRAFT</Badge>;
      case "CONFIRMED": return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">CONFIRMED</Badge>;
      case "DELIVERED": return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">DELIVERED</Badge>;
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
            onClick={() => navigate("/purchases")} 
            className="-ml-3 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to purchases
          </Button>
          <div className="flex items-center gap-3">
            {purchase.status === "DRAFT" && (
              <Button variant="outline" onClick={() => navigate(`/purchases/${purchase.id}/edit`)} className="cursor-pointer">
                <Edit className="mr-2 h-4 w-4" />
                Edit Draft
              </Button>
            )}
            {purchase.status !== "CANCELLED" && (
               <Button variant="ghost" onClick={handleCancel} disabled={isCancelling} className="text-red-600 hover:bg-red-50 cursor-pointer">
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel Order
               </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border">
                 <ShoppingCart className="h-7 w-7" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-bold tracking-tight">{purchase.orderNumber}</h1>
                  {getStatusBadge(purchase.status)}
                </div>
                <div className="flex items-center gap-4 text-muted-foreground mt-1">
                   <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest">
                      <Calendar className="h-3.5 w-3.5" />
                      Ordered: {new Date(purchase.purchaseDate).toLocaleDateString()}
                   </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
             {purchase.status === "DRAFT" && (
                <Button onClick={handleConfirm} disabled={isConfirming} className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 h-12 px-8 rounded-xl cursor-pointer">
                   {isConfirming ? <Loader2 className="animate-spin h-4 w-4" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                   Confirm & Receive Stock
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
         {/* Supplier & Logistics */}
         <div className="lg:col-span-4 space-y-10">
            <section className="space-y-6">
               <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-[10px]">
                  <User className="h-4 w-4" />
                  <span>Supplier Information</span>
               </div>
               <div className="space-y-4 bg-muted/20 p-6 rounded-2xl border border-muted-foreground/10">
                  <div className="space-y-1">
                     <p className="text-[10px] text-muted-foreground uppercase font-black">Vendor Name</p>
                     <p className="font-bold text-lg">{purchase.vendor.name}</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                     <div className="flex items-center gap-2 text-sm font-medium">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        {purchase.vendor.email || "No email"}
                     </div>
                     <div className="flex items-center gap-2 text-sm font-medium">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        {purchase.vendor.phone || "No phone"}
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
                     <p className="text-[10px] text-muted-foreground font-black uppercase">Order Created</p>
                     <p className="text-sm font-bold">{new Date(purchase.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="relative">
                     <div className={cn(
                        "absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-background",
                        purchase.expectedDelivery ? "bg-orange-500" : "bg-muted"
                     )} />
                     <p className="text-[10px] text-muted-foreground font-black uppercase">Expected Delivery</p>
                     <p className="text-sm font-bold">{purchase.expectedDelivery ? new Date(purchase.expectedDelivery).toLocaleDateString() : "Not set"}</p>
                  </div>
                  {purchase.deliveredAt && (
                     <div className="relative">
                        <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                        <p className="text-[10px] text-muted-foreground font-black uppercase">Received On</p>
                        <p className="text-sm font-bold">{new Date(purchase.deliveredAt).toLocaleDateString()}</p>
                     </div>
                  )}
               </div>
            </section>

            {purchase.invoiceUrl ? (
               <section className="space-y-4">
                  <Label className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Order Document</Label>
                  <Button variant="outline" className="w-full justify-start rounded-xl h-12 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all group" asChild>
                     <a href={purchase.invoiceUrl} target="_blank" rel="noreferrer">
                        <FileText className="mr-2 h-4 w-4 text-primary" />
                        <span className="truncate flex-1 font-semibold">View Invoice PDF</span>
                        <ExternalLink className="ml-auto h-3 w-3 opacity-50 group-hover:opacity-100" />
                     </a>
                  </Button>
                  <label className="text-[10px] text-center block text-muted-foreground hover:text-primary cursor-pointer transition-colors">
                     Change Invoice
                     <input type="file" className="hidden" accept=".pdf,image/*" onChange={handleInvoiceUpload} disabled={isUploading} />
                  </label>
               </section>
            ) : (
               <section className="space-y-4">
                  <Label className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Invoice Document</Label>
                  <label className="flex items-center justify-center gap-2 h-20 border-2 border-dashed border-muted-foreground/20 rounded-2xl hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group">
                     {isUploading ? (
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                     ) : (
                        <>
                           <FileText className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                           <span className="text-xs font-bold text-muted-foreground group-hover:text-primary">Attach PDF Invoice</span>
                        </>
                     )}
                     <input type="file" className="hidden" accept=".pdf" onChange={handleInvoiceUpload} disabled={isUploading} />
                  </label>
               </section>
            )}
         </div>

         {/* Order Items & Financials */}
         <div className="lg:col-span-8 space-y-10">
            <section className="space-y-6">
               <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-[10px]">
                  <Package className="h-4 w-4" />
                  <span>Itemized List</span>
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
                        {purchase.items?.map((item) => (
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
                     <p className="text-[10px] text-muted-foreground font-black uppercase">Notes</p>
                     <p className="text-sm italic leading-relaxed text-muted-foreground/80">
                        {purchase.notes || "No special instructions provided for this order."}
                     </p>
                  </div>
               </div>
               <div className="space-y-4">
                  <div className="flex justify-between items-center">
                     <span className="text-sm font-bold text-muted-foreground">Order Total</span>
                     <span className="text-lg font-black">₹{purchase.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-muted-foreground">Amount Paid</span>
                        {getPaymentBadge(purchase.paymentStatus)}
                     </div>
                     <span className="text-lg font-black text-emerald-600">₹{purchase.paidAmount.toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center pt-2">
                     <span className="text-sm font-black uppercase tracking-wider">Outstanding Balance</span>
                     <span className="text-2xl font-black text-primary">₹{(purchase.totalAmount - purchase.paidAmount).toLocaleString()}</span>
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
                  Update Payment
               </DialogTitle>
               <DialogDescription>
                  Enter the total amount paid to the vendor for this order.
               </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 pt-4">
               <div className="grid gap-2">
                  <Label className="text-sm font-bold">Paid Amount (₹)</Label>
                  <div className="relative">
                     <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                     <Input 
                       type="number" 
                       value={paidAmount} 
                       onChange={(e) => setPaidAmount(e.target.value)}
                       className="h-14 pl-10 text-xl font-black"
                     />
                  </div>
                  <p className="text-[10px] text-muted-foreground font-medium">Total Order Value: ₹{purchase.totalAmount.toLocaleString()}</p>
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

export default PurchaseDetail;
