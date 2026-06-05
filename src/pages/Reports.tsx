import { 
  FileText, 
  Download, 
  Search, 
  Calendar, 
  Filter, 
  AlertTriangle,
  ShoppingCart,
  Banknote,
  Users,
  ChevronRight,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { useAppSelector } from "../store/hooks";
import { selectCurrentUser } from "../features/auth/authSlice";
import { downloadReport } from "../utils/downloadFile";
import { cn } from "@/lib/utils";

const Reports = () => {
  const user = useAppSelector(selectCurrentUser);
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const handleDownload = async (endpoint: string, filename: string, format: "pdf" | "csv") => {
    try {
      setIsExporting(`${endpoint}-${format}`);
      await downloadReport(endpoint, filename, format);
    } finally {
      setIsExporting(null);
    }
  };

  const reportModules = [
    {
      title: "Inventory Reports",
      description: "Stock levels, low stock alerts, and valuation.",
      icon: AlertTriangle,
      reports: [
        { name: "Low Stock Alert", endpoint: "/reports/low-stock", filename: "low_stock_report" },
        { name: "Current Stock Summary", endpoint: "/reports/stock-summary", filename: "inventory_summary" }
      ]
    },
    {
      title: "Sales Reports",
      description: "Sales transactions and revenue summaries.",
      icon: Banknote,
      reports: [
        { name: "Top Selling Products", endpoint: "/reports/top-selling", filename: "top_selling_report" },
        { name: "Sales Ledger", endpoint: "/reports/sales", filename: "sales_report" }
      ]
    },
    {
      title: "Purchase Reports",
      description: "Purchase orders and vendor spending.",
      icon: ShoppingCart,
      reports: [
        { name: "Purchase History", endpoint: "/reports/purchases", filename: "purchase_report" },
        { name: "Purchase vs Sales Trend", endpoint: "/reports/purchase-vs-sales", filename: "revenue_trend" }
      ]
    },
    {
      title: "Vendor Reports",
      description: "Vendor performance and outstanding payments.",
      icon: Users,
      reports: [
        { name: "Vendor Payment Summary", endpoint: "/reports/vendor-payments", filename: "vendor_payments" }
      ]
    }
  ];

  return (
    <div className="space-y-8 pb-10 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-xl shadow-primary/20">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tight">Reports & Exports</h2>
            <p className="text-muted-foreground text-sm font-medium">Generate and download business intelligence reports.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {reportModules.map((module) => (
          <Card key={module.title} className="border border-border shadow-sm overflow-hidden group bg-card rounded-[2rem]">
            <CardHeader className="pb-4">
               <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-muted text-primary border border-border shadow-sm">
                     <module.icon className="h-5 w-5" />
                  </div>
                  <div>
                     <CardTitle className="text-xl font-bold">{module.title}</CardTitle>
                     <CardDescription>{module.description}</CardDescription>
                  </div>
               </div>
            </CardHeader>
            <CardContent className="space-y-3">
               {module.reports.map((report) => (
                 <div key={report.name} className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-transparent hover:border-border hover:bg-muted/50 transition-all group/item">
                    <div className="flex items-center gap-3">
                       <div className="h-2 w-2 rounded-full bg-primary/40 group-hover/item:bg-primary" />
                       <span className="text-sm font-bold">{report.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <Button 
                         variant="ghost" 
                         size="sm" 
                         className="h-8 px-3 text-[10px] font-black uppercase tracking-widest hover:bg-accent hover:text-accent-foreground cursor-pointer"
                         onClick={() => handleDownload(report.endpoint, report.filename, "csv")}
                         disabled={!!isExporting}
                       >
                          {isExporting === `${report.endpoint}-csv` ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Download className="h-3 w-3 mr-1" />}
                          CSV
                       </Button>
                       <Button 
                         variant="ghost" 
                         size="sm" 
                         className="h-8 px-3 text-[10px] font-black uppercase tracking-widest hover:bg-accent hover:text-accent-foreground cursor-pointer"
                         onClick={() => handleDownload(report.endpoint, report.filename, "pdf")}
                         disabled={!!isExporting}
                       >
                          {isExporting === `${report.endpoint}-pdf` ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Download className="h-3 w-3 mr-1" />}
                          PDF
                       </Button>
                    </div>
                 </div>
               ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm bg-primary text-primary-foreground p-8 rounded-[2.5rem] overflow-hidden relative">
         <div className="absolute top-0 right-0 w-64 h-64 -mr-20 -mt-20 rounded-full bg-white/5" />
         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 text-center md:text-left">
               <h3 className="text-3xl font-black tracking-tight">Need custom insights?</h3>
               <p className="text-primary-foreground/70 max-w-md font-medium">
                  If you require a specialized report not listed here, please contact the administrator for a custom data export request.
               </p>
            </div>
            <Button variant="secondary" className="h-14 px-8 rounded-2xl font-bold text-base shadow-xl text-primary" onClick={() => window.location.href = "mailto:admin@nextstock.com"}>
               Request Custom Report
               <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
         </div>
      </Card>
    </div>
  );
};

export default Reports;
