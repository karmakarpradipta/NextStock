import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  useGetCategoriesQuery, 
  useCreateCategoryMutation, 
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  type Category
} from "../features/inventory/categoryApiSlice";
import { useGetProductsQuery } from "../features/inventory/productApiSlice";
import { categorySchema, type CategoryValues } from "../lib/schemas";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Badge } from "../components/ui/badge";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Loader2, 
  Search,
  FolderTree,
  RotateCw,
  Activity,
  ArrowRight,
  TrendingUp,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { useAppSelector } from "../store/hooks";
import { selectCurrentUser } from "../features/auth/authSlice";
import { Skeleton } from "../components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const Categories = () => {
  const navigate = useNavigate();
  const user = useAppSelector(selectCurrentUser);
  const isAdmin = user?.role === "ADMIN";
  
  const { data: categories = [], isLoading, isError, refetch, isFetching } = useGetCategoriesQuery();
  const { data: productsData } = useGetProductsQuery({ limit: 1000 }); // Fetch products to calculate valuation/health
  
  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation();

  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      isActive: true,
    },
  });

  const onSubmit = async (data: CategoryValues) => {
    try {
      if (editingCategory) {
        await updateCategory({ id: editingCategory.id, data }).unwrap();
        toast.success("Category updated successfully");
      } else {
        await createCategory(data).unwrap();
        toast.success("New category created");
      }
      handleCloseModal();
    } catch (err: any) {
      toast.error(err?.data?.message || "Action failed");
    }
  };

  const handleDelete = async (id: string, productCount: number) => {
    if (productCount > 0) {
      toast.error("Cannot delete category with linked products. Reassign items first.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    
    try {
      await deleteCategory(id).unwrap();
      toast.success("Category deleted");
    } catch (err: any) {
      toast.error(err?.data?.message || "Delete failed");
    }
  };

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      reset({
        name: category.name,
        isActive: category.isActive,
      });
    } else {
      setEditingCategory(null);
      reset({ name: "", isActive: true });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    reset();
  };

  const filteredCategories = (categories || []).filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper to get stats for a category
  const getCategoryStats = (categoryId: string) => {
    const categoryProducts = productsData?.products.filter(p => p.categoryId === categoryId) || [];
    const totalStock = categoryProducts.reduce((sum, p) => sum + p.currentStock, 0);
    const lowStockCount = categoryProducts.filter(p => p.isLowStock).length;
    return { totalStock, lowStockCount, productCount: categoryProducts.length };
  };

  return (
    <div className="space-y-10 pb-20 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-3xl bg-primary text-primary-foreground flex items-center justify-center shadow-xl shadow-primary/20 border-4 border-background">
            <FolderTree className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-4xl font-black tracking-tighter">Categories</h2>
            <div className="flex items-center gap-2 text-muted-foreground text-sm font-bold uppercase tracking-widest mt-1">
               <Activity className="h-3.5 w-3.5 text-primary" />
               Taxonomy & Organization
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <div className="relative w-64 hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Find category..." 
                className="pl-9 h-11 border-none bg-card shadow-sm rounded-xl text-foreground"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           {isAdmin && (
             <Button onClick={() => handleOpenModal()} className="h-11 px-6 rounded-xl font-black shadow-lg cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90">
               <Plus className="mr-2 h-4 w-4" />
               New Category
             </Button>
           )}
           <Button variant="outline" size="icon" onClick={() => refetch()} className="h-11 w-11 rounded-xl cursor-pointer border-border">
              <RotateCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
           </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
           {[...Array(5)].map((_, i) => (
             <Skeleton key={i} className="h-16 w-full rounded-xl" />
           ))}
        </div>
      ) : isError ? (
        <div className="text-center py-20 bg-card rounded-[2.5rem] border-2 border-dashed border-destructive/20">
           <p className="text-xl font-bold text-muted-foreground">Failed to load categories</p>
           <Button variant="link" onClick={() => refetch()} className="text-primary font-bold">Try Again</Button>
        </div>
      ) : (
        <div className="rounded-[2rem] border border-border bg-card shadow-md overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="py-6 px-8 text-foreground font-black uppercase text-[10px] tracking-widest">Category Name</TableHead>
                <TableHead className="text-center text-foreground font-black uppercase text-[10px] tracking-widest">Products</TableHead>
                <TableHead className="text-center text-foreground font-black uppercase text-[10px] tracking-widest">Total Stock</TableHead>
                <TableHead className="text-center text-foreground font-black uppercase text-[10px] tracking-widest">Health Status</TableHead>
                <TableHead className="text-right px-8 text-foreground font-black uppercase text-[10px] tracking-widest">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                       <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                          <FolderTree className="h-8 w-8" />
                       </div>
                       <p className="text-lg font-bold text-muted-foreground">No categories found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCategories.map((category) => {
                  const stats = getCategoryStats(category.id);
                  const isHealthy = stats.lowStockCount === 0;
                  
                  return (
                    <TableRow key={category.id} className="group transition-colors hover:bg-muted/20 border-b border-border">
                      <TableCell className="py-5 px-8">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                             <span className="font-black text-sm tracking-tight group-hover:text-primary transition-colors cursor-pointer text-foreground" onClick={() => handleOpenModal(category)}>
                               {category.name}
                             </span>
                             {category.isActive ? (
                               <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-black text-[8px] uppercase tracking-widest px-1.5 py-0">Active</Badge>
                             ) : (
                               <Badge variant="secondary" className="font-black text-[8px] uppercase tracking-widest px-1.5 py-0">Inactive</Badge>
                             )}
                          </div>
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5 italic">ID: {category.id.slice(0, 8)}...</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                         <span className="font-black text-sm text-foreground">{stats.productCount}</span>
                      </TableCell>
                      <TableCell className="text-center font-bold text-sm text-foreground">
                         {stats.totalStock}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1.5">
                           {isHealthy ? (
                             <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 px-3 py-0.5 font-black text-[9px] uppercase tracking-widest">Optimal</Badge>
                           ) : (
                             <Badge variant="destructive" className="animate-pulse px-3 py-0.5 font-black text-[9px] uppercase tracking-widest border-none">
                               {stats.lowStockCount} Critical
                             </Badge>
                           )}
                           <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                              <div 
                                className={cn("h-full", isHealthy ? "bg-primary" : "bg-destructive")}
                                style={{ width: stats.productCount > 0 ? `${((stats.productCount - stats.lowStockCount) / stats.productCount) * 100}%` : '0%' }}
                              />
                           </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right px-8">
                        <div className="flex items-center justify-end gap-2">
                           <Button 
                            variant="ghost" 
                            className="h-9 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground transition-all border border-border shadow-sm group/btn"
                            onClick={() => navigate(`/inventory/products?categoryId=${category.id}`)}
                           >
                              Items
                              <ArrowRight className="ml-1.5 h-3 w-3 transition-transform group-hover/btn:translate-x-0.5" />
                           </Button>
                           {isAdmin && (
                             <>
                               <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-9 w-9 rounded-xl bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground transition-all border border-border shadow-sm"
                                onClick={() => handleOpenModal(category)}
                                title="Edit Category"
                               >
                                  <Edit className="h-4 w-4" />
                               </Button>
                               <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-9 w-9 rounded-xl bg-accent text-accent-foreground hover:bg-destructive hover:text-destructive-foreground transition-all border border-border shadow-sm"
                                onClick={() => handleDelete(category.id, stats.productCount)}
                                title="Delete Category"
                               >
                                  <Trash2 className="h-4 w-4" />
                               </Button>
                             </>
                           )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Category Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="rounded-[2.5rem] border-none p-10 max-w-md bg-card">
           <DialogHeader className="space-y-4">
              <div className="flex items-center gap-4">
                 <div className="h-14 w-14 rounded-3xl bg-primary text-primary-foreground flex items-center justify-center shadow-xl shadow-primary/20">
                    <FolderTree className="h-7 w-7" />
                 </div>
                 <div className="text-left">
                    <DialogTitle className="text-3xl font-black tracking-tighter text-foreground">
                       {editingCategory ? "Update Category" : "New Category"}
                    </DialogTitle>
                    <DialogDescription className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest">
                       Organize your catalog items
                    </DialogDescription>
                 </div>
              </div>
           </DialogHeader>

           <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 pt-6 text-foreground">
              <div className="space-y-2">
                 <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Category Name</Label>
                 <Input 
                   id="name" 
                   {...register("name")} 
                   className="h-14 border-none bg-muted/50 rounded-2xl font-bold text-lg text-foreground"
                   placeholder="e.g. Raw Materials, Finished Goods..."
                 />
                 {errors.name && <p className="text-[10px] font-black text-destructive uppercase tracking-widest px-1">{errors.name.message}</p>}
              </div>

              <div className="flex items-center justify-between p-5 bg-muted/30 rounded-2xl border border-border">
                 <div className="space-y-0.5">
                    <Label className="text-sm font-black text-foreground">Active Status</Label>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest italic">Allow items in this category</p>
                 </div>
                 <Switch 
                   checked={editingCategory?.isActive ?? true}
                   onCheckedChange={(val) => reset(prev => ({ ...prev, isActive: val }))}
                 />
              </div>

              <Button 
                type="submit" 
                disabled={isCreating || isUpdating}
                className="w-full h-16 rounded-[1.5rem] text-lg font-black bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xl shadow-primary/20 transition-all cursor-pointer"
              >
                 {isCreating || isUpdating ? <Loader2 className="h-6 w-6 animate-spin" /> : editingCategory ? "Commit Changes" : "Establish Category"}
              </Button>
           </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Categories;
