import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useGetVendorQuery,
  useCreateVendorMutation,
  useUpdateVendorMutation
} from "../features/inventory/vendorApiSlice";
import { vendorSchema, type VendorValues } from "../lib/schemas";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Separator } from "../components/ui/separator";
import { Loader2, ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { useBreadcrumb } from "@/context/BreadcrumbContext";

const FieldError = ({ message }: { message?: string }) =>
  message ? <p className="text-xs text-destructive mt-1">{message}</p> : null;

const VendorForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const { setLabel } = useBreadcrumb();

  const { data: vendor, isLoading: isVendorLoading } = useGetVendorQuery(id!, { skip: !isEditMode });
  const [createVendor, { isLoading: isCreating }] = useCreateVendorMutation();
  const [updateVendor, { isLoading: isUpdating }] = useUpdateVendorMutation();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty },
  } = useForm<VendorValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      gstNumber: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (isEditMode && vendor) {
      reset({
        name: vendor.name,
        contactPerson: vendor.contactPerson || "",
        email: vendor.email || "",
        phone: vendor.phone || "",
        address: vendor.address || "",
        gstNumber: vendor.gstNumber || "",
        isActive: vendor.isActive,
      });
      setLabel(id!, vendor.name);
    }
  }, [vendor, reset, isEditMode, setLabel, id]);

  const onSubmit = async (data: VendorValues) => {
    try {
      if (isEditMode) {
        await updateVendor({ id: id!, data }).unwrap();
        toast.success("Vendor updated successfully");
      } else {
        await createVendor(data).unwrap();
        toast.success("Vendor created successfully");
      }
      navigate("/vendors");
    } catch (err: any) {
      toast.error(err?.data?.message || "Action failed");
    }
  };

  const loading = isCreating || isUpdating;

  if (isEditMode && isVendorLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="animate-spin text-primary h-6 w-6" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20 px-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/vendors")} className="rounded-full cursor-pointer">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {isEditMode ? "Edit Vendor" : "Add New Vendor"}
          </h2>
          <p className="text-muted-foreground text-sm">
            {isEditMode ? "Update vendor details and contact information." : "Register a new supplier in your network."}
          </p>
        </div>
      </div>

      <Separator className="opacity-50" />

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Form fields */}
        <div className="lg:col-span-8 space-y-8">
          {/* Business Details */}
          <div className="space-y-6">
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-sm font-semibold">Company / Vendor Name</Label>
                <Input id="name" {...register("name")} placeholder="e.g. Acme Supplies Ltd." className="h-12 bg-background/50 text-base" />
                <FieldError message={errors.name?.message} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="contact" className="text-sm font-semibold">Contact Person</Label>
                <Input id="contact" {...register("contactPerson")} placeholder="Full name" className="h-12 bg-background/50 text-base" />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="gst" className="text-sm font-semibold">GST Number</Label>
                <Input id="gst" {...register("gstNumber")} placeholder="Optional" className="h-12 bg-background/50 text-base font-mono" />
              </div>
            </div>
          </div>

          <Separator className="opacity-30" />

          {/* Contact Information */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
                <Input id="email" type="email" {...register("email")} placeholder="vendor@example.com" className="h-12 bg-background/50 text-base" />
                <FieldError message={errors.email?.message} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone" className="text-sm font-semibold">Phone</Label>
                <Input id="phone" {...register("phone")} placeholder="+91 98765 43210" className="h-12 bg-background/50 text-base" />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address" className="text-sm font-semibold">Address</Label>
              <textarea
                id="address"
                {...register("address")}
                placeholder="Street, City, State, ZIP"
                rows={3}
                className="w-full rounded-md border border-input bg-background/50 px-3 py-3 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>
          </div>
        </div>

        {/* Right: Sidebar */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24 lg:self-start">
          {/* Status */}
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isActive" className="text-sm font-semibold cursor-pointer">Active Vendor</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Available for purchase orders</p>
              </div>
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <Switch id="isActive" checked={field.value} onCheckedChange={field.onChange} className="cursor-pointer" />
                )}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button
              type="submit"
              disabled={loading || !isDirty}
              className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/15 cursor-pointer rounded-xl"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {loading ? "Saving..." : isEditMode ? "Update Vendor" : "Create Vendor"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate("/vendors")}
              className="w-full h-11 cursor-pointer text-muted-foreground hover:bg-muted/50 rounded-xl"
            >
              Cancel
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default VendorForm;
