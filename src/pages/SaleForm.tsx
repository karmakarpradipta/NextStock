import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useGetSaleQuery,
  useCreateSaleMutation,
  useUpdateSaleMutation
} from "../features/inventory/salesApiSlice";
import { useGetProductsQuery } from "../features/inventory/productApiSlice";
import { salesSchema, type SalesValues } from "../lib/schemas";
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
  Banknote,
  Calendar,
  User,
  Package,
  IndianRupee,
  Phone,
  Mail,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useBreadcrumb } from "@/context/BreadcrumbContext";
import { cn } from "@/lib/utils";

const SaleForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const { setLabel } = useBreadcrumb();

  const { data: sale, isLoading: isSaleLoading } = useGetSaleQuery(id!, { skip: !isEditMode });
  const { data: productsData } = useGetProductsQuery({ limit: 100 });
  
  const [createSale, { isLoading: isCreating }] = useCreateSaleMutation();
  const [updateSale, { isLoading: isUpdating }] = useUpdateSaleMutation();

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<SalesValues>({
    resolver: zodResolver(salesSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      saleDate: new Date().toISOString().split("T")[0],
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
    if (isEditMode && sale) {
      if (sale.status !== "DRAFT") {
        toast.error("Only draft sales can be edited");
        navigate(`/sales/${id}`);
        return;
      }
      
      reset({
        customerName: sale.customerName || "",
        customerPhone: sale.customerPhone || "",
        customerEmail: sale.customerEmail || "",
        saleDate: new Date(sale.saleDate).toISOString().split("T")[0],
        notes: sale.notes || "",
        items: sale.items?.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })) || [],
      });
      setLabel(id!, sale.invoiceNumber);
    }
  }, [sale, reset, isEditMode, setLabel, id, navigate]);

  const onSubmit = async (data: SalesValues) => {
    try {
      if (isEditMode) {
        await updateSale({ id: id!, data }).unwrap();
        toast.success("Sale order updated");
      } else {
        await createSale(data).unwrap();
        toast.success("Sale order created as DRAFT");
      }
      navigate("/sales");
    } catch (err: any) {
      toast.error(err?.data?.message || "Action failed");
    }
  };

  if (isEditMode && isSaleLoading) return <div className="flex h-[400px] items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20 px-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/sales")} className="rounded-full cursor-pointer">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              {isEditMode ? `Edit ${sale?.invoiceNumber}` : "New Sales Order"}
            </h2>
            <p className="text-muted-foreground text-sm">
              Create a draft invoice for customer checkout.
            </p>
          </div>
        </div>
      </div>

      <Separator className="opacity-50" />

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Main Form Fields */}
        <div className="lg:col-span-8 space-y-12">
           {/* Section 1: Customer Details */}
           <section className="space-y-6">
              <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-[10px]">
                 <User className="h-4 w-4" />
                 <span>Customer Information</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="grid gap-2">
                    <Label className="text-sm font-semibold">Customer Name</Label>
                    <Input {...register("customerName")} placeholder="e.g. Arjun Mehta" className="h-12 bg-background/50" />
                 </div>
                 <div className="grid gap-2">
                    <Label className="text-sm font-semibold">Phone Number</Label>
                    <Input {...register("customerPhone")} placeholder="91XXXXXXXX" className="h-12 bg-background/50" />
                 </div>
                 <div className="grid gap-2">
                    <Label className="text-sm font-semibold">Email Address</Label>
                    <Input type="email" {...register("customerEmail")} placeholder="customer@example.com" className="h-12 bg-background/50" />
                    {errors.customerEmail && <p className="text-xs text-destructive">{errors.customerEmail.message}</p>}
                 </div>
                 <div className="grid gap-2">
                    <Label className="text-sm font-semibold">Sale Date</Label>
                    <Input type="date" {...register("saleDate")} className="h-12 bg-background/50" />
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
                                      <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku}) — Stock: {p.currentStock}</SelectItem>
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
                    <Banknote className="h-4 w-4" />
                    <span>Sale Summary</span>
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
                    <Label className="text-xs font-bold uppercase tracking-tighter text-muted-foreground">Internal Notes</Label>
                    <textarea 
                      {...register("notes")} 
                      className="min-h-[100px] w-full rounded-xl border bg-muted/10 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                      placeholder="Special customer requests..."
                    />
                 </div>
              </div>

              <div className="space-y-3 pt-4">
                 <Button 
                   type="submit" 
                   disabled={isCreating || isUpdating || !isDirty} 
                   className="w-full h-14 text-base font-bold rounded-2xl shadow-xl shadow-primary/20 cursor-pointer"
                 >
                    {isCreating || isUpdating ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Save className="mr-2 h-5 w-5" />
                        {isEditMode ? "Update Invoice" : "Save as Draft"}
                      </>
                    )}
                 </Button>
                 <Button 
                   type="button" 
                   variant="ghost" 
                   onClick={() => navigate("/sales")} 
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

export default SaleForm;
