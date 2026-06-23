import { useState } from "react";
import { 
  useGetProductsQuery, 
  useDeleteProductMutation,
  type ProductFilters 
} from "../features/inventory/productApiSlice";
import { useGetCategoriesQuery } from "../features/inventory/categoryApiSlice";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../components/ui/pagination";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Package, 
  RotateCw,
  Image as ImageIcon
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import { selectCurrentUser } from "../features/auth/authSlice";
import { cn } from "@/lib/utils";
import { Skeleton } from "../components/ui/skeleton";
import { useEffect } from "react";

const Products = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useAppSelector(selectCurrentUser);
  const canManage = user?.role === "ADMIN" || user?.role === "STAFF";

  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    limit: 10,
    search: "",
    categoryId: "",
    isActive: "",
    lowStock: searchParams.get("lowStock") === "true" ? "true" : "",
  });

  useEffect(() => {
    const lowStock = searchParams.get("lowStock");
    if (lowStock === "true") {
      setFilters(prev => ({ ...prev, lowStock: "true", page: 1 }));
    }
  }, [searchParams]);

  const { data, isLoading, refetch, isFetching } = useGetProductsQuery(filters);
  const { data: categories } = useGetCategoriesQuery();
  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();

  const handleSearch = (val: string) => {
    setFilters(prev => ({ ...prev, search: val, page: 1 }));
  };

  const handleCategoryChange = (val: string) => {
    setFilters(prev => ({ ...prev, categoryId: val === "all" ? "" : val, page: 1 }));
  };

  const handleStatusChange = (val: string) => {
    setFilters(prev => ({ ...prev, isActive: val === "all" ? "" : val, page: 1 }));
  };

  const handleStockFilter = (val: string) => {
    setFilters(prev => ({ ...prev, lowStock: val === "all" ? "" : val, page: 1 }));
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteProduct(id).unwrap();
      toast.success("Product deleted");
    } catch (err: any) {
      toast.error(err?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Products</h2>
            <p className="text-muted-foreground text-sm">Manage your inventory items and stock levels.</p>
          </div>
        </div>
        {canManage && (
          <Button onClick={() => navigate("/inventory/products/add")} className="cursor-pointer">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search name or SKU..." 
            className="pl-9"
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        
        <Select onValueChange={handleCategoryChange} value={filters.categoryId || "all"}>
          <SelectTrigger>
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories?.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select onValueChange={handleStatusChange} value={filters.isActive === "" ? "all" : String(filters.isActive)}>
          <SelectTrigger>
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Select onValueChange={handleStockFilter} value={String(filters.lowStock || "all")}>
          <SelectTrigger>
            <SelectValue placeholder="Stock Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="true">Low Stock Only</SelectItem>
          </SelectContent>
        </Select>

        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => refetch()} 
          disabled={isLoading || isFetching}
          className="h-10 w-10 cursor-pointer hover:bg-primary/5 hover:text-primary transition-all"
          title="Refresh Data"
        >
          <RotateCw className={cn("h-4 w-4", (isLoading || isFetching) && "animate-spin")} />
        </Button>
      </div>

      {isLoading ? (
        <div className="rounded-md border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Product Info</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Stock / Unit</TableHead>
                <TableHead>Min Threshold</TableHead>
                <TableHead>Status</TableHead>
                {canManage && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-10 w-10 rounded" /></TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[150px]" />
                      <Skeleton className="h-3 w-[80px]" />
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-12" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                   {canManage && <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto rounded-md" /></TableCell>}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-md border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Product Info</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Stock / Unit</TableHead>
                <TableHead>Min Threshold</TableHead>
                <TableHead>Status</TableHead>
                 {canManage && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.products.length === 0 ? (
                <TableRow>
                   <TableCell colSpan={canManage ? 7 : 6} className="h-[400px] text-center">
                    <div className="flex flex-col items-center justify-center space-y-4 animate-in fade-in zoom-in duration-500">
                      <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center ring-8 ring-muted/20">
                        <Search className="h-10 w-10 text-muted-foreground/40" />
                      </div>
                      <div className="space-y-2 max-w-[280px] mx-auto">
                        <p className="text-xl font-bold tracking-tight">No products found</p>
                        <p className="text-sm text-muted-foreground font-medium">Try adjusting your filters or search terms to find what you're looking for.</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setFilters({
                          page: 1,
                          limit: 10,
                          search: "",
                          categoryId: "",
                          isActive: "",
                          lowStock: "",
                        })}
                        className="rounded-full px-6 font-semibold"
                      >
                        Clear all filters
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data?.products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="h-10 w-10 rounded border bg-muted flex items-center justify-center overflow-hidden">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col cursor-pointer group/name" onClick={() => navigate(`/inventory/products/${product.id}`)}>
                        <span className="font-medium group-hover/name:text-primary transition-colors">{product.name}</span>
                        <span className="text-xs text-muted-foreground font-mono">SKU: {product.sku}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">{product.category?.name || "Uncategorized"}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 py-1">
                        <div className="flex items-baseline gap-1">
                          <span className={cn("text-base font-bold tabular-nums", product.isLowStock && "text-red-600")}>
                            {product.currentStock ?? 0}
                          </span>
                          <span className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                            {product.unit}
                          </span>
                        </div>
                        {product.isLowStock && (
                          <div className="flex items-center">
                            <Badge 
                              variant="outline" 
                              className="rounded-full bg-red-50/50 text-red-600 border-red-200/60 px-2 py-0 text-[10px] font-medium leading-5 h-5 flex items-center justify-center tracking-tight shadow-[0_1px_2px_rgba(220,38,38,0.05)]"
                            >
                              LOW STOCK
                            </Badge>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-muted-foreground">
                        {product.minStockThreshold ?? 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.isActive ? "outline" : "destructive"} className={product.isActive ? "text-green-600 border-green-600/20" : ""}>
                        {product.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    {canManage && (
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/inventory/products/${product.id}/edit`)} className="h-8 w-8 cursor-pointer hover:bg-primary/10 hover:text-primary">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(product.id)}
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

      {/* Pagination Controls */}
      {!isLoading && data && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border rounded-lg p-4 bg-card shadow-sm mt-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-muted-foreground font-medium">
            <div>
              Showing <span className="font-medium text-foreground">{data.products.length}</span> of <span className="font-medium text-foreground">{data.pagination.total}</span> products
            </div>

            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <Select 
                value={String(filters.limit)} 
                onValueChange={(val) => setFilters(p => ({ ...p, limit: parseInt(val), page: 1 }))}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={filters.limit} />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 20, 50, 100].map((pageSize) => (
                    <SelectItem key={pageSize} value={String(pageSize)}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Pagination className="w-auto mx-0">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  href="#"
                  className={cn(
                    data.pagination.page <= 1 && "pointer-events-none opacity-50"
                  )} 
                  onClick={(e) => {
                    e.preventDefault();
                    setFilters(p => ({ ...p, page: Math.max(1, (p.page || 1) - 1) }));
                  }}
                />
              </PaginationItem>
              
              {/* Page Numbers */}
              {(() => {
                const totalPages = data.pagination.totalPages;
                const currentPage = data.pagination.page;
                const pages = [];
                if (totalPages <= 5) {
                  for (let i = 1; i <= totalPages; i++) pages.push(i);
                } else {
                  pages.push(1);
                  if (currentPage > 3) pages.push("ellipsis-1");
                  const start = Math.max(2, currentPage - 1);
                  const end = Math.min(totalPages - 1, currentPage + 1);
                  for (let i = start; i <= end; i++) { if (!pages.includes(i)) pages.push(i); }
                  if (currentPage < totalPages - 2) pages.push("ellipsis-2");
                  if (!pages.includes(totalPages)) pages.push(totalPages);
                }
                return pages.map((page, i) => {
                  if (typeof page === "string") {
                    return <PaginationItem key={`ellipsis-${i}`}><PaginationEllipsis /></PaginationItem>;
                  }
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        isActive={currentPage === page}
                        onClick={(e) => {
                          e.preventDefault();
                          setFilters(p => ({ ...p, page }));
                        }}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                });
              })()}

              <PaginationItem>
                <PaginationNext 
                  href="#"
                  className={cn(
                    data.pagination.page >= data.pagination.totalPages && "pointer-events-none opacity-50"
                  )} 
                  onClick={(e) => {
                    e.preventDefault();
                    setFilters(p => ({ ...p, page: Math.min(data.pagination.totalPages, (p.page || 1) + 1) }));
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default Products;
