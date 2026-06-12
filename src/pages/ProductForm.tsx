import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation
} from "../features/inventory/productApiSlice";
import { useBreadcrumb } from "../context/BreadcrumbContext";
import { useGetCategoriesQuery } from "../features/inventory/categoryApiSlice";
import { productSchema, type ProductValues } from "../lib/schemas";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import { Separator } from "../components/ui/separator";
import { 
  Loader2, 
  ArrowLeft, 
  Save, 
  Wand2,
  ImagePlus,
  X
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../lib/utils";
import { UnsavedChangesDialog } from "../components/common/UnsavedChangesDialog";

const ProductForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const { setLabel } = useBreadcrumb();

  const { data: product, isLoading: isProductLoading } = useGetProductQuery(id!, { skip: !isEditMode });
  const { data: categories } = useGetCategoriesQuery();

  useEffect(() => {
    if (isEditMode && product && id) {
      setLabel(id, product.sku || product.name);
    }
  }, [product, id, isEditMode, setLabel]);
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [isImageUploading, setIsImageUploading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ProductValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      sku: "",
      description: "",
      minStockThreshold: 5,
      unit: "pcs",
      categoryId: "",
      isActive: true,
      imageUrl: "",
    },
  });

  const formImageUrl = useWatch({
    control,
    name: "imageUrl",
  });
  const displayPreview = localPreview || formImageUrl;
useEffect(() => {
  if (isEditMode && product && categories && categories.length > 0) {
    const catId = product.categoryId || (product as any).category?.id || "";
    const catIdStr = catId ? String(catId) : "";
    const unitVal = product.unit || "pcs";

    // Reset all fields at once
    reset({
      name: product.name,
      sku: product.sku,
      description: product.description || "",
      minStockThreshold: Number(product.minStockThreshold) || 0,
      unit: unitVal,
      categoryId: catIdStr,
      isActive: product.isActive,
      imageUrl: product.imageUrl || "",
    });

    // Force-sync Select fields after reset to ensure Radix UI Select picks them up
    const timer = setTimeout(() => {
      if (catIdStr) setValue("categoryId", catIdStr, { shouldDirty: false });
      setValue("unit", unitVal, { shouldDirty: false });
    }, 0);

    return () => clearTimeout(timer);
  }
}, [product, categories, reset, setValue, isEditMode]);

  const generateSKU = () => {
    const sku = "PROD-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    setValue("sku", sku, { shouldValidate: true });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setLocalPreview(null);
    setValue("imageUrl", "");
  };

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await response.json();
      if (data.secure_url) {
        return data.secure_url;
      } else {
        throw new Error("Cloudinary upload failed");
      }
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      throw err;
    }
  };

  const onSubmit = async (data: ProductValues) => {
    try {
      let finalImageUrl = data.imageUrl;

      if (imageFile) {
        setIsImageUploading(true);
        finalImageUrl = await uploadToCloudinary(imageFile);
        setIsImageUploading(false);
      }

      const finalData = { ...data, imageUrl: finalImageUrl };

      if (isEditMode) {
        await updateProduct({ id: id!, data: finalData }).unwrap();
        toast.success("Product updated");
      } else {
        await createProduct(finalData).unwrap();
        toast.success("Product created");
      }
      navigate("/inventory/products");
    } catch (err: any) {
      setIsImageUploading(false);
      toast.error(err?.message || err?.data?.message || "Action failed");
    }
  };

  if (isEditMode && isProductLoading) return <div className="flex h-[400px] items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20 px-4">
      <UnsavedChangesDialog isDirty={isDirty || !!imageFile} />
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/inventory/products")} className="rounded-full cursor-pointer">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{isEditMode ? "Edit Product" : "Add New Product"}</h2>
          <p className="text-muted-foreground text-sm">Provide essential details and an image for your product.</p>
        </div>
      </div>

      <Separator className="opacity-50" />

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Form Details */}
        <div className="lg:col-span-8 space-y-8">
          <div className="space-y-6">
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="prod-name" className="text-sm font-semibold">Product Name</Label>
                <Input id="prod-name" {...register("name")} placeholder="e.g. Wireless Mouse" className="h-12 bg-background/50 text-base rounded-md" />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="prod-sku" className="text-sm font-semibold">SKU / Product Code</Label>
                <div className="flex gap-2">
                  <Input id="prod-sku" {...register("sku")} placeholder="e.g. MS-001" className="h-12 font-mono bg-background/50 text-base rounded-md" />
                  <Button type="button" variant="outline" onClick={generateSKU} className="h-12 px-3 cursor-pointer border-dashed hover:border-primary transition-all rounded-md" title="Generate SKU">
                    <Wand2 className="h-5 w-5" />
                  </Button>
                </div>
                {errors.sku && <p className="text-xs text-destructive">{errors.sku.message}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="prod-desc" className="text-sm font-semibold">Description</Label>
                <Textarea id="prod-desc" {...register("description")} placeholder="Provide a detailed description..." className="min-h-[120px] bg-background/50 text-base py-3 rounded-md" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="grid gap-2">
                <Label htmlFor="prod-category" className="text-sm font-semibold">Category</Label>
                <Controller
                  name="categoryId"
                  control={control}
                  render={({ field }) => (
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value ? String(field.value) : ""}
                    >
                      <SelectTrigger className="h-12 bg-background/50 text-base cursor-pointer rounded-md">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map(c => (
                          <SelectItem key={c.id} value={String(c.id)} className="cursor-pointer">
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.categoryId && <p className="text-xs text-destructive">{errors.categoryId.message}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="prod-unit" className="text-sm font-semibold">Unit of Measurement</Label>
                <Controller
                  name="unit"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-12 bg-background/50 text-base cursor-pointer rounded-md">
                        <SelectValue placeholder="Select Unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {["pcs", "kg", "litre", "box", "meter", "packet"].map(u => (
                          <SelectItem key={u} value={u}>{u}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.unit && <p className="text-xs text-destructive">{errors.unit.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="grid gap-2">
                <Label htmlFor="prod-threshold" className="text-sm font-semibold">Min Threshold</Label>
                <Input id="prod-threshold" type="number" {...register("minStockThreshold", { valueAsNumber: true })} className="h-12 bg-background/50 text-base rounded-md" />
                {errors.minStockThreshold && <p className="text-xs text-destructive">{errors.minStockThreshold.message}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Media & Actions */}
        <div className="lg:col-span-4 space-y-8">
          <section className="space-y-4">
            <Label className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Product Image</Label>
            <div 
              className={cn(
                "relative group aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden bg-muted/20",
                !displayPreview && "hover:bg-muted/40 hover:border-primary/50 cursor-pointer"
              )}
              onClick={() => !displayPreview && document.getElementById('image-upload')?.click()}
            >
              <AnimatePresence mode="wait">
                {displayPreview ? (
                  <motion.div 
                    key="preview"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full w-full relative"
                  >
                    <img src={displayPreview} alt="Preview" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="icon" 
                        onClick={(e) => { e.stopPropagation(); removeImage(); }}
                        className="rounded-full h-10 w-10 cursor-pointer"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-2 p-6 text-center"
                  >
                    <div className="h-12 w-12 rounded-lg bg-background flex items-center justify-center text-muted-foreground shadow-sm group-hover:text-primary transition-colors">
                      <ImagePlus className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Upload Image</p>
                      <p className="text-[11px] text-muted-foreground leading-tight">PNG, JPG or WEBP<br/>Max size 5MB</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <input 
                id="image-upload" 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange} 
                className="hidden" 
              />
            </div>
          </section>

          <section className="bg-muted/30 p-6 rounded-lg border border-muted-foreground/10 space-y-4">
            <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Product Status</Label>
            <div className="flex items-center justify-between bg-background p-4 rounded-lg border shadow-sm">
              <span className="text-sm font-medium">Active Visibility</span>
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} className="cursor-pointer" />
                )}
              />
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              When inactive, the product will be hidden from the storefront but remain in the dashboard.
            </p>
          </section>

          <div className="flex flex-col gap-4">
             <Button 
              type="submit" 
              disabled={isCreating || isUpdating || isImageUploading} 
              className="w-full h-14 text-base font-semibold shadow-xl shadow-primary/20 cursor-pointer rounded-md"
            >
              {isCreating || isUpdating || isImageUploading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {isImageUploading ? "Uploading Image..." : "Processing..."}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" />
                  {isEditMode ? "Update Product" : "Create Product"}
                </>
              )}
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => navigate("/inventory/products")} 
              className="w-full h-12 cursor-pointer hover:bg-muted/50 rounded-md text-muted-foreground"
            >
              Cancel & Exit
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
