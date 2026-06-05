import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useGetPurchaseQuery,
  useCreatePurchaseMutation,
  useUpdatePurchaseMutation
} from "../features/inventory/purchaseApiSlice";
import { useGetVendorsQuery } from "../features/inventory/vendorApiSlice";
import { useGetProductsQuery } from "../features/inventory/productApiSlice";
import { purchaseSchema, type PurchaseValues } from "../lib/schemas";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { 
  Loader2, 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  ShoppingCart,
  Calendar,
  Building2,
  Package,
  IndianRupee,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useBreadcrumb } from "@/context/BreadcrumbContext";

const PurchaseForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const { setLabel } = useBreadcrumb();

  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: purchase, isLoading: isPurchaseLoading } = useGetPurchaseQuery(id!, { skip: !isEditMode });
  const { data: vendorsData } = useGetVendorsQuery({ limit: 100 });
  const { data: productsData } = useGetProductsQuery({ limit: 100 });
  
  const [createPurchase, { isLoading: isCreating }] = useCreatePurchaseMutation();
  const [updatePurchase, { isLoading: isUpdating }] = useUpdatePurchaseMutation();

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<PurchaseValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      vendorId: "",
      purchaseDate: new Date().toISOString().split("T")[0],
      expectedDelivery: "",
      notes: "",
      items: [{ productId: "", quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchItems = watch("items");
  const totalAmount = watchItems?.reduce((sum, item) => sum + (item.quantity * item.unitPrice || 0), 0) || 0;

  useEffect(() => {
    if (isEditMode && purchase) {
      if (purchase.status !== "DRAFT") {
        toast.error("Only draft orders can be edited");
        navigate(`/purchases/${id}`);
        return;
      }
      
      reset({
        vendorId: purchase.vendor.id,
        purchaseDate: new Date(purchase.purchaseDate).toISOString().split("T")[0],
        expectedDelivery: purchase.expectedDelivery ? new Date(purchase.expectedDelivery).toISOString().split("T")[0] : "",
        notes: purchase.notes || "",
        items: purchase.items?.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })) || [],
      });
      setLabel(id!, purchase.orderNumber);
    }
  }, [purchase, reset, isEditMode, setLabel, id, navigate]);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast.error("Please upload a PDF file only");
        return;
      }
      setInvoiceFile(file);
    }
  };

  const onSubmit = async (data: PurchaseValues) => {
    try {
      let finalInvoiceUrl = purchase?.invoiceUrl || "";

      if (invoiceFile) {
        setIsUploading(true);
        finalInvoiceUrl = await uploadToCloudinary(invoiceFile);
        setIsUploading(false);
      }

      const finalData = { ...data, invoiceUrl: finalInvoiceUrl };

      if (isEditMode) {
        await updatePurchase({ id: id!, data: finalData }).unwrap();
        toast.success("Purchase order updated");
      } else {
        await createPurchase(finalData).unwrap();
        toast.success("Purchase order created as DRAFT");
      }
      navigate("/purchases");
    } catch (err: any) {
      setIsUploading(false);
      toast.error(err?.data?.message || "Action failed");
    }
  };

  if (isEditMode && isPurchaseLoading) return <div className="flex h-[400px] items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20 px-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/purchases")} className="rounded-full cursor-pointer">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              {isEditMode ? `Edit ${purchase?.orderNumber}` : "New Purchase Order"}
            </h2>
            <p className="text-muted-foreground text-sm">
              Create a draft order to request items from a supplier.
            </p>
          </div>
        </div>
      </div>

      <Separator className="opacity-50" />

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Main Form Fields */}
        <div className="lg:col-span-8 space-y-12">
           {/* Section 1: Vendor & Schedule */}
           <section className="space-y-6">
              <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-[10px]">
                 <Building2 className="h-4 w-4" />
                 <span>Vendor & Schedule</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="md:col-span-1 grid gap-2">
                    <Label className="text-sm font-semibold">Select Vendor</Label>
                    <Controller
                      name="vendorId"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="h-12 bg-background/50 cursor-pointer">
                            <SelectValue placeholder="Choose Supplier" />
                          </SelectTrigger>
                          <SelectContent>
                            {vendorsData?.vendors.filter(v => v.isActive).map(v => (
                              <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.vendorId && <p className="text-xs text-destructive">{errors.vendorId.message}</p>}
                 </div>

                 <div className="grid gap-2">
                    <Label className="text-sm font-semibold">Order Date</Label>
                    <Input type="date" {...register("purchaseDate")} className="h-12 bg-background/50" />
                 </div>

                 <div className="grid gap-2">
                    <Label className="text-sm font-semibold">Expected Delivery</Label>
                    <Input type="date" {...register("expectedDelivery")} className="h-12 bg-background/50" />
                 </div>
              </div>
           </section>

           <Separator className="opacity-30" />

           {/* Section 2: Items List */}
           <section className="space-y-6">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-[10px]">
                    <Package className="h-4 w-4" />
                    <span>Line Items</span>
                 </div>
                 <Button 
                   type="button" 
                   variant="outline" 
                   size="sm" 
                   onClick={() => append({ productId: "", quantity: 1, unitPrice: 0 })}
                   className="h-8 rounded-full border-dashed hover:border-primary hover:text-primary cursor-pointer"
                 >
                    <Plus className="mr-1 h-3 w-3" /> Add Item
                 </Button>
              </div>

              <div className="space-y-4">
                 <AnimatePresence>
                    {fields.map((field, index) => (
                      <motion.div 
                        key={field.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-muted/20 p-4 rounded-xl border border-muted-foreground/10 group"
                      >
                         <div className="md:col-span-6 grid gap-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Product</Label>
                            <Controller
                              name={`items.${index}.productId`}
                              control={control}
                              render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <SelectTrigger className="h-10 bg-background cursor-pointer">
                                    <SelectValue placeholder="Select Item" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {productsData?.products.filter(p => p.isActive).map(p => (
                                      <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            />
                         </div>

                         <div className="md:col-span-2 grid gap-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Quantity</Label>
                            <Input 
                              type="number" 
                              {...register(`items.${index}.quantity`, { valueAsNumber: true })} 
                              className="h-10 bg-background font-bold text-center" 
                            />
                         </div>

                         <div className="md:col-span-3 grid gap-2">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Unit Price</Label>
                            <div className="relative">
                               <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                               <Input 
                                 type="number" 
                                 step="0.01" 
                                 {...register(`items.${index}.unitPrice`, { valueAsNumber: true })} 
                                 className="h-10 pl-7 bg-background font-bold" 
                               />
                            </div>
                         </div>

                         <div className="md:col-span-1 flex justify-center pb-1">
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => remove(index)}
                              disabled={fields.length === 1}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full cursor-pointer"
                            >
                               <Trash2 className="h-4 w-4" />
                            </Button>
                         </div>
                      </motion.div>
                    ))}
                 </AnimatePresence>
              </div>
              {errors.items && <p className="text-xs text-destructive font-medium">{errors.items.message || (errors.items as any).root?.message}</p>}
           </section>
        </div>

        {/* Sidebar: Summary & Actions */}
        <div className="lg:col-span-4 space-y-6">
           <div className="rounded-2xl border bg-card p-6 space-y-6 shadow-sm sticky top-24">
              <div className="space-y-4">
                 <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-[10px]">
                    <ShoppingCart className="h-4 w-4" />
                    <span>Order Summary</span>
                 </div>
                 
                 <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                       <span className="text-muted-foreground">Total Items</span>
                       <span className="font-bold">{watchItems?.length || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                       <span className="text-muted-foreground">Status</span>
                       <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">DRAFT</Badge>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-baseline pt-2">
                       <span className="font-bold text-base">Grand Total</span>
                       <span className="text-3xl font-black text-primary">₹{totalAmount.toLocaleString()}</span>
                    </div>
                 </div>
              </div>

              <div className="grid gap-4 pt-4">
                 <div className="grid gap-2">
                    <Label className="text-xs font-bold uppercase tracking-tighter text-muted-foreground">Invoice Document (Optional)</Label>
                    <div className="flex items-center gap-3">
                       <label className="flex-1 flex items-center justify-center gap-2 h-12 border-2 border-dashed border-muted-foreground/20 rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group overflow-hidden px-4">
                          <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
                          <span className="text-xs font-medium text-muted-foreground group-hover:text-primary truncate">
                             {invoiceFile ? invoiceFile.name : (purchase?.invoiceUrl ? "Replace current invoice" : "Upload Invoice (PDF)")}
                          </span>
                          <input type="file" className="hidden" accept=".pdf" onChange={handleFileChange} />
                       </label>
                       {invoiceFile && (
                         <Button type="button" variant="ghost" size="icon" onClick={() => setInvoiceFile(null)} className="h-12 w-12 rounded-xl text-destructive">
                            <Trash2 className="h-4 w-4" />
                         </Button>
                       )}
                    </div>
                 </div>

                 <div className="grid gap-2">
                    <Label className="text-xs font-bold uppercase tracking-tighter text-muted-foreground">Notes / Comments</Label>
                    <textarea 
                      {...register("notes")} 
                      className="min-h-[100px] w-full rounded-xl border bg-muted/10 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                      placeholder="Shipping instructions, etc."
                    />
                 </div>
              </div>

              <div className="space-y-3 pt-4">
                 <Button 
                   type="submit" 
                   disabled={isCreating || isUpdating || (!isDirty && !invoiceFile) || isUploading} 
                   className="w-full h-14 text-base font-bold rounded-2xl shadow-xl shadow-primary/20 cursor-pointer"
                 >
                    {isCreating || isUpdating || isUploading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Save className="mr-2 h-5 w-5" />
                        {isEditMode ? "Update Order" : "Save as Draft"}
                      </>
                    )}
                 </Button>
                 <Button 
                   type="button" 
                   variant="ghost" 
                   onClick={() => navigate("/purchases")} 
                   className="w-full h-12 rounded-xl text-muted-foreground cursor-pointer hover:bg-muted/50"
                 >
                    Cancel
                 </Button>
              </div>
           </div>
        </div>
      </form>
    </div>
  );
};

export default PurchaseForm;
