import { 
  LayoutDashboard, 
  Package, 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowRight,
  ShoppingCart,
  Flame,
  BarChart3,
  MousePointerClick
} from "lucide-react";
import { 
  useGetDashboardStatsQuery, 
  useGetPurchaseVsSalesQuery, 
  useGetTopSellingQuery 
} from "../features/inventory/reportApiSlice";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend
} from "recharts";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const Dashboard = () => {
  const navigate = useNavigate();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data: stats, isLoading: isStatsLoading, isError } = useGetDashboardStatsQuery();
  const { data: trendData, isLoading: isTrendLoading } = useGetPurchaseVsSalesQuery({});
  const { data: topSelling, isLoading: isTopSellingLoading } = useGetTopSellingQuery({ limit: 5 });

  if (isError) {
    return (
      <div className="flex h-[450px] flex-col items-center justify-center gap-6 text-center bg-card rounded-3xl border border-dashed border-destructive/50 mx-auto max-w-2xl">
        <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive">
           <AlertTriangle className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-black tracking-tight">System Connection Error</h3>
          <p className="text-muted-foreground text-sm max-w-sm font-medium">We couldn't reach the analytics server. Please check your network or backend status.</p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline" className="h-12 px-8 rounded-xl font-bold">
          Refresh Dashboard
        </Button>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Products",
      value: stats?.totalProducts ?? 0,
      description: `${stats?.totalCategories ?? 0} active categories`,
      icon: Package,
      link: "/inventory/products"
    },
    {
      title: "Total Vendors",
      value: stats?.totalVendors ?? 0,
      description: "Supply chain partners",
      icon: Users,
      link: "/vendors"
    },
    {
      title: "Today's Sales",
      value: `₹${stats?.todaySales.total.toLocaleString() ?? 0}`,
      description: `${stats?.todaySales.count ?? 0} transactions today`,
      icon: TrendingUp,
      link: "/sales"
    },
    {
      title: "Today's Purchases",
      value: `₹${stats?.todayPurchases.total.toLocaleString() ?? 0}`,
      description: `${stats?.todayPurchases.count ?? 0} replenishment orders`,
      icon: ShoppingCart,
      link: "/purchases"
    }
  ];

  const pieData = [
    { name: "Receivables", value: stats?.outstandingReceivables ?? 0, color: "var(--primary)" },
    { name: "Payables", value: stats?.outstandingPayables ?? 0, color: "var(--muted-foreground)" },
  ];

  return (
    <div className="space-y-8 pb-10 font-sans">
      {/* Low Stock Banner */}
      <AnimatePresence>
        {stats?.lowStockCount && stats.lowStockCount > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative overflow-hidden bg-accent border border-border rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm"
          >
            <div className="flex items-center gap-4 relative z-10">
               <div className="h-12 w-12 rounded-2xl bg-background flex items-center justify-center text-foreground border border-border shadow-inner">
                  <AlertTriangle className="h-6 w-6" />
               </div>
               <div className="space-y-0.5">
                  <p className="text-base font-black text-foreground uppercase tracking-tight">Critical Inventory Alert</p>
                  <p className="text-sm text-muted-foreground font-medium">
                    <span className="font-black underline">{stats.lowStockCount} items</span> are currently below safety levels and require immediate restocking.
                  </p>
               </div>
            </div>
            <Button 
              size="lg" 
              variant="default"
              className="font-bold rounded-2xl h-12 px-8 relative z-10" 
              onClick={() => navigate("/inventory/products?lowStock=true")}
            >
               Resolve Stock Issues
               <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Title Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-3xl bg-primary text-primary-foreground flex items-center justify-center shadow-xl shadow-primary/20 border-4 border-background">
            <LayoutDashboard className="h-7 w-7" />
          </div>
          <div className="space-y-0.5">
            <h2 className="text-4xl font-black tracking-tighter">Business Overview</h2>
            <div className="flex items-center gap-2 text-muted-foreground text-sm font-bold uppercase tracking-widest">
               <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
               Live System Performance
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" className="h-12 px-6 rounded-2xl font-bold border-border hover:bg-accent cursor-pointer" onClick={() => navigate("/reports")}>
              Advanced Reports
           </Button>
           <Button className="h-12 px-6 rounded-2xl font-black bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl cursor-pointer" onClick={() => navigate("/sales/add")}>
              <TrendingUp className="mr-2 h-4 w-4" />
              Process New Sale
           </Button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isStatsLoading ? (
          [...Array(4)].map((_, i) => (
            <Card key={i} className="border-none shadow-sm bg-muted/20 rounded-3xl h-36">
              <CardContent className="h-full flex flex-col justify-center p-6 space-y-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-3 w-40" />
              </CardContent>
            </Card>
          ))
        ) : (
          statCards.map((stat, i) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card 
                className="group relative overflow-hidden cursor-pointer hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border border-border shadow-sm rounded-3xl bg-card"
                onClick={() => navigate(stat.link)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{stat.title}</CardTitle>
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center border border-border transition-all duration-500 group-hover:bg-primary group-hover:text-primary-foreground shadow-sm bg-muted/50">
                      <stat.icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="text-3xl font-black tracking-tighter">{stat.value}</div>
                  <p className="text-xs text-muted-foreground font-bold opacity-70 italic group-hover:opacity-100 transition-opacity">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
         {/* Sales vs Purchases Chart */}
         <Card className="lg:col-span-8 border border-border shadow-md rounded-[2rem] bg-card overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between bg-muted/10 p-8 border-b border-border">
               <div className="space-y-1">
                  <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                     <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10">
                        <BarChart3 className="h-5 w-5" />
                     </div>
                     Revenue Trends
                  </CardTitle>
                  <CardDescription className="text-sm font-medium">Monthly comparison of inbound and outbound transactions.</CardDescription>
               </div>
               <Badge variant="outline" className="font-black px-4 py-1.5 rounded-full border-border text-[10px] uppercase tracking-widest">12-Month Analytics</Badge>
            </CardHeader>
            <CardContent className="p-8">
               <div className="h-[340px] w-full min-h-[340px]">
                  {!isMounted || isTrendLoading ? (
                    <div className="flex h-full items-center justify-center"><Skeleton className="h-full w-full rounded-3xl" /></div>
                  ) : (
                    <ResponsiveContainer width="100%" height={340} minWidth={0} minHeight={0}>
                       <BarChart data={trendData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                          <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: 'var(--muted-foreground)' }} dy={15} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: 'var(--muted-foreground)' }} dx={-10} />
                          <Tooltip 
                            cursor={{ fill: 'var(--accent)', opacity: 0.4 }}
                            contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '20px', background: 'var(--card)', color: 'var(--card-foreground)' }}
                            itemStyle={{ fontWeight: 800, fontSize: '12px' }}
                          />
                          <Legend verticalAlign="top" align="right" height={36} iconType="circle" iconSize={8} wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                          <Bar dataKey="sales" fill="var(--primary)" radius={[8, 8, 0, 0]} barSize={24} name="Sales Revenue" />
                          <Bar dataKey="purchases" fill="var(--muted-foreground)" radius={[8, 8, 0, 0]} barSize={24} name="Purchase Cost" opacity={0.5} />
                       </BarChart>
                    </ResponsiveContainer>
                  )}
               </div>
            </CardContent>
         </Card>

         {/* Top Selling Products */}
         <Card className="lg:col-span-4 border border-border shadow-md rounded-[2rem] bg-card overflow-hidden flex flex-col">
            <CardHeader className="bg-muted/10 p-8 border-b border-border">
               <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10 shadow-sm">
                     <Flame className="h-5 w-5" />
                  </div>
                  Hot Products
               </CardTitle>
               <CardDescription className="text-sm font-medium">Your highest performing inventory items.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 flex-1">
               <div className="space-y-6">
                  {isTopSellingLoading ? (
                     [...Array(5)].map((_, i) => (
                       <div key={i} className="flex items-center gap-4">
                          <Skeleton className="h-10 w-10 rounded-2xl" />
                          <div className="space-y-1.5 flex-1">
                             <Skeleton className="h-4 w-32" />
                             <Skeleton className="h-3 w-20" />
                          </div>
                          <Skeleton className="h-6 w-12 rounded-lg" />
                       </div>
                     ))
                  ) : (
                    topSelling?.map((product, i) => (
                      <motion.div 
                        key={product.id} 
                        initial={{ opacity: 0, x: 20 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center gap-4 group cursor-pointer"
                        onClick={() => navigate(`/inventory/products/${product.id}`)}
                      >
                         <div className="h-10 w-10 rounded-2xl bg-muted text-foreground flex items-center justify-center font-black text-xs border border-border group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300">
                            #{i + 1}
                         </div>
                         <div className="flex-1 min-w-0">
                            <p className="text-sm font-black truncate leading-tight">{product.name}</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                               {product.sku}
                            </p>
                         </div>
                         <div className="text-right">
                            <Badge variant="secondary" className="font-black text-[10px] rounded-lg h-7 px-3 bg-muted border-none">
                              {product.totalQuantity} {product.unit}
                            </Badge>
                         </div>
                      </motion.div>
                    ))
                  )}
               </div>
            </CardContent>
            <div className="p-8 pt-0 mt-auto">
               <Button variant="ghost" className="w-full h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-dashed border-border group transition-all" onClick={() => navigate("/inventory/products")}>
                  Full Inventory Insights
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
               </Button>
            </div>
         </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Ledger */}
        <Card className="lg:col-span-5 border border-border shadow-md rounded-[2rem] bg-card overflow-hidden relative">
          <CardHeader className="p-8">
             <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10 shadow-sm">
                   <Wallet className="h-5 w-5" />
                </div>
                <div>
                   <CardTitle className="text-2xl font-black tracking-tight">Financial Health</CardTitle>
                   <CardDescription className="text-sm font-medium">Liquidity and outstanding exposure.</CardDescription>
                </div>
             </div>
          </CardHeader>
          <CardContent className="px-8 pb-10 flex flex-col items-center">
            <div className="h-[240px] w-full relative min-h-[240px]">
              {!isMounted || isStatsLoading ? (
                <div className="flex h-full items-center justify-center">
                   <Skeleton className="h-44 w-44 rounded-full" />
                </div>
              ) : (
                <>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                     <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Total Flux</span>
                     <span className="text-3xl font-black tracking-tighter">
                        ₹{((stats?.outstandingReceivables ?? 0) + (stats?.outstandingPayables ?? 0)).toLocaleString()}
                     </span>
                  </div>
                  <ResponsiveContainer width="100%" height={240} minWidth={0} minHeight={0}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={85}
                        outerRadius={105}
                        paddingAngle={12}
                        dataKey="value"
                        stroke="none"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '15px', background: 'var(--card)', color: 'var(--card-foreground)' }}
                        formatter={(value: number) => [`₹${value.toLocaleString()}`, '']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </>
              )}
            </div>
            
            <div className="w-full grid grid-cols-2 gap-4 mt-8">
               <div className="space-y-3 p-5 rounded-3xl bg-muted/30 border border-border">
                  <div className="flex items-center gap-2">
                     <TrendingUp className="h-3.5 w-3.5 text-primary" />
                     <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Receivables</span>
                  </div>
                  <div className="text-xl font-black text-primary">₹{stats?.outstandingReceivables.toLocaleString() ?? 0}</div>
               </div>
               <div className="space-y-3 p-5 rounded-3xl bg-muted/10 border border-border">
                  <div className="flex items-center gap-2">
                     <TrendingDown className="h-3.5 w-3.5 text-muted-foreground" />
                     <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Payables</span>
                  </div>
                  <div className="text-xl font-black text-muted-foreground">₹{stats?.outstandingPayables.toLocaleString() ?? 0}</div>
               </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Access Grid */}
        <Card className="lg:col-span-7 border border-border shadow-md rounded-[2rem] bg-card overflow-hidden flex flex-col">
              <CardHeader className="p-8">
                 <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20">
                       <MousePointerClick className="h-5 w-5" />
                    </div>
                    <div>
                       <CardTitle className="text-2xl font-black tracking-tight">Command Center</CardTitle>
                       <CardDescription className="text-sm font-medium">Instant access to critical workflows.</CardDescription>
                    </div>
                 </div>
              </CardHeader>
              <CardContent className="px-8 pb-10 grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                 {[
                   { label: "Products", icon: Package },
                   { label: "Categories", icon: LayoutDashboard, link: "/inventory/categories" },
                   { label: "Vendors", icon: Users, link: "/vendors" },
                   { label: "Staff", icon: Users, link: "/users" },
                   { label: "Purchases", icon: ShoppingCart, link: "/purchases/add" },
                   { label: "Sales", icon: TrendingUp, link: "/sales/add" },
                   { label: "Reports", icon: BarChart3, link: "/reports" },
                   { label: "Settings", icon: Wallet, link: "/profile" },
                 ].map((action) => (
                   <Button 
                    key={action.label}
                    variant="outline" 
                    className="h-full min-h-[110px] py-6 flex-col gap-3 rounded-[1.5rem] cursor-pointer hover:bg-accent hover:text-accent-foreground hover:border-border hover:shadow-lg transition-all border-border flex justify-center items-center group" 
                    onClick={() => navigate((action as any).link || "/inventory/products")}
                   >
                      <div className="h-10 w-10 rounded-2xl bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                        <action.icon className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">{action.label}</span>
                   </Button>
                 ))}
              </CardContent>
           </Card>
      </div>
    </div>
  );
};

export default Dashboard;
