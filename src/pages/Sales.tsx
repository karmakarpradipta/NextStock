import { useState } from "react";
import { 
  useGetSalesQuery, 
  type SaleFilters 
} from "../features/inventory/salesApiSlice";
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
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "../components/ui/pagination";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { 
  Plus, 
  Search, 
  Banknote, 
  Calendar,
  User,
  ArrowRight,
  RotateCw
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import { selectCurrentUser } from "../features/auth/authSlice";
import { cn } from "@/lib/utils";
import { Skeleton } from "../components/ui/skeleton";

const Sales = () => {
  const navigate = useNavigate();
  const user = useAppSelector(selectCurrentUser);
  const isAdmin = user?.role === "ADMIN";

  const [filters, setFilters] = useState<SaleFilters>({
    page: 1,
    limit: 10,
    search: "",
    status: undefined,
    paymentStatus: undefined,
  });

  const { data, isLoading, refetch, isFetching } = useGetSalesQuery(filters);

  const handleSearch = (val: string) => {
    setFilters(prev => ({ ...prev, search: val, page: 1 }));
  };

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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Banknote className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Sales Orders</h2>
            <p className="text-muted-foreground text-sm">Track customer transactions and outgoing inventory.</p>
          </div>
        </div>
        {isAdmin && (
          <Button onClick={() => navigate("/sales/add")} className="cursor-pointer shadow-lg shadow-primary/20">
            <Plus className="mr-2 h-4 w-4" />
            New Sale
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search invoice # or customer..." 
            className="pl-9 bg-background/50"
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        
        <Select onValueChange={(val) => setFilters(prev => ({ ...prev, status: val === "all" ? undefined : val as any, page: 1 }))}>
          <SelectTrigger className="bg-background/50">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select onValueChange={(val) => setFilters(prev => ({ ...prev, paymentStatus: val === "all" ? undefined : val as any, page: 1 }))}>
          <SelectTrigger className="bg-background/50">
            <SelectValue placeholder="Payment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="PARTIAL">Partial</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
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
        <div className="rounded-2xl border bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Invoice Details</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Total Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-10 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded-full" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="py-4">Invoice Info</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Total Value</TableHead>
                <TableHead>Order Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.sales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">
                    No sales orders found.
                  </TableCell>
                </TableRow>
              ) : (
                data?.sales.map((sale) => (
                  <TableRow key={sale.id} className="group hover:bg-muted/20 cursor-pointer transition-colors" onClick={() => navigate(`/sales/${sale.id}`)}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-black text-sm tracking-tight">{sale.invoiceNumber}</span>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                          <Calendar className="h-3 w-3" />
                          {new Date(sale.saleDate).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-md bg-primary/5 flex items-center justify-center border text-primary">
                          <User className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">{sale.customerName || "Walk-in Customer"}</span>
                          {sale.customerPhone && <span className="text-[10px] text-muted-foreground font-medium">{sale.customerPhone}</span>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-black">₹{sale.totalAmount.toLocaleString()}</span>
                        <span className="text-[10px] text-muted-foreground font-medium italic">{sale._count?.items || 0} items</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(sale.status)}</TableCell>
                    <TableCell>{getPaymentBadge(sale.paymentStatus)}</TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                       <Button variant="ghost" size="icon" onClick={() => navigate(`/sales/${sale.id}`)} className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
                          <ArrowRight className="h-4 w-4" />
                       </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </motion.div>
      )}

      {/* Pagination */}
      {!isLoading && data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border rounded-xl p-4 bg-card shadow-sm mt-4">
          <div className="text-sm text-muted-foreground font-medium">
            Showing <span className="text-foreground font-bold">{data.sales.length}</span> of <span className="text-foreground font-bold">{data.pagination.total}</span> sales
          </div>
          <Pagination className="w-auto mx-0">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  className={cn("cursor-pointer", data.pagination.page <= 1 && "pointer-events-none opacity-50")} 
                  onClick={() => setFilters(p => ({ ...p, page: Math.max(1, (p.page || 1) - 1) }))} 
                />
              </PaginationItem>
              <div className="px-4 text-xs font-black uppercase tracking-widest text-muted-foreground">
                Page {data.pagination.page} / {data.pagination.totalPages}
              </div>
              <PaginationItem>
                <PaginationNext 
                  className={cn("cursor-pointer", data.pagination.page >= data.pagination.totalPages && "pointer-events-none opacity-50")} 
                  onClick={() => setFilters(p => ({ ...p, page: Math.min(data.pagination.totalPages, (p.page || 1) + 1) }))} 
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default Sales;
