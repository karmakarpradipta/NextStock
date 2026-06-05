import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  useGetCategoriesQuery, 
  useCreateCategoryMutation, 
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  type Category
} from "../features/inventory/categoryApiSlice";
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
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
import { Badge } from "../components/ui/badge";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Loader2, 
  Search,
  FolderTree,
  RotateCw
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useAppSelector } from "../store/hooks";
import { selectCurrentUser } from "../features/auth/authSlice";
import { Skeleton } from "../components/ui/skeleton";
import { cn } from "@/lib/utils";

const Categories = () => {
  const user = useAppSelector(selectCurrentUser);
  const isAdmin = user?.role === "ADMIN";
  
  const { data: categories, isLoading, isError, refetch, isFetching } = useGetCategoriesQuery();
  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation();

  const [searchTerm, setSearchSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const {
    register,
    handleSubmit,
    control,
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
        toast.success("Category updated");
      } else {
        await createCategory(data).unwrap();
        toast.success("Category created");
      }
      handleCloseModal();
    } catch (err: any) {
      toast.error(err?.data?.message || "Action failed");
    }
  };

  const handleDelete = async (id: string, productCount: number) => {
    if (productCount > 0) {
      toast.error("Cannot delete category with linked products");
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

  const filteredCategories = categories?.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <FolderTree className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Categories</h2>
            <p className="text-muted-foreground text-sm">Organize your inventory with logical groupings.</p>
          </div>
        </div>
        {isAdmin && (
          <Button onClick={() => handleOpenModal()} className="cursor-pointer">
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search categories..." 
            value={searchTerm}
            onChange={(e) => setSearchSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => refetch()} 
          disabled={isLoading || isFetching}
          className="h-10 w-10 cursor-pointer shrink-0"
        >
          <RotateCw className={cn("h-4 w-4", (isLoading || isFetching) && "animate-spin")} />
        </Button>
      </div>

      {isLoading ? (
        <div className="rounded-md border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Status</TableHead>
                {isAdmin && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-12 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                  {isAdmin && <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto rounded-md" /></TableCell>}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : isError || !categories ? (
        <div className="flex h-[400px] flex-col items-center justify-center gap-4 text-center border rounded-md bg-card">
          <p className="text-muted-foreground font-medium">Unable to load categories.<br/>Please check your connection or backend status.</p>
          <Button onClick={() => window.location.reload()} variant="outline" className="cursor-pointer">Retry Connection</Button>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-md border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Status</TableHead>
                {isAdmin && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 4 : 3} className="h-24 text-center text-muted-foreground">
                    No categories found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCategories?.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-semibold">{category._count?.products || 0}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={category.isActive ? "outline" : "destructive"} className={category.isActive ? "text-green-600 border-green-600/20" : ""}>
                        {category.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenModal(category)} className="h-8 w-8 cursor-pointer hover:bg-primary/10 hover:text-primary">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(category.id, category._count?.products || 0)}
                          className="h-8 w-8 text-destructive cursor-pointer hover:bg-destructive/10"
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </motion.div>
      )}

      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "New Category"}</DialogTitle>
            <DialogDescription>Provide a name and description for this category.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <div className="grid gap-2">
              <Label htmlFor="cat-name">Name</Label>
              <Input id="cat-name" {...register("name")} disabled={isCreating || isUpdating} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg border">
              <Label htmlFor="cat-active" className="cursor-pointer">Active Visibility</Label>
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <Switch 
                    id="cat-active" 
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="cursor-pointer"
                  />
                )}
              />
            </div>
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isCreating || isUpdating} className="cursor-pointer">
                {(isCreating || isUpdating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingCategory ? "Save Changes" : "Create Category"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Categories;
