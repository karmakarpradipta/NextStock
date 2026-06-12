import { useParams, useNavigate } from "react-router-dom";
import { useGetVendorQuery } from "../features/inventory/vendorApiSlice";
import { Button } from "../components/ui/button";
import { 
  ArrowLeft, 
  Edit, 
  Loader2, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  FileText,
  Package,
  Clock,
  Contact2
} from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Label } from "../components/ui/label";
import { useEffect } from "react";
import { useBreadcrumb } from "@/context/BreadcrumbContext";

const VendorDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setLabel } = useBreadcrumb();

  const { data: vendor, isLoading } = useGetVendorQuery(id!);

  useEffect(() => {
    if (vendor) {
      setLabel(id!, vendor.name);
    }
  }, [vendor, setLabel, id]);

  if (isLoading) return <div className="flex h-[400px] items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  if (!vendor) return (
    <div className="text-center py-20 space-y-4">
      <p className="text-xl font-semibold">Vendor not found</p>
      <Button onClick={() => navigate("/vendors")} variant="outline">Back to List</Button>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      {/* Header Section */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/vendors")} 
            className="-ml-3 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to vendors
          </Button>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate(`/vendors/${vendor.id}/edit`)} className="cursor-pointer">
              <Edit className="mr-2 h-4 w-4" />
              Edit Vendor
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold tracking-tight">{vendor.name}</h1>
              <Badge variant={vendor.isActive ? "outline" : "destructive"} className={`h-6 px-3 ${vendor.isActive ? "text-green-600 border-green-600/20 bg-green-50 dark:bg-green-950/20" : ""}`}>
                {vendor.isActive ? "Active Partner" : "Inactive"}
              </Badge>
            </div>
            <p className="text-lg text-muted-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Vendor ID: <span className="font-mono text-foreground/80">{vendor.id.slice(0, 12)}</span>
            </p>
          </div>

          <div className="flex gap-8 px-2">
            <div className="text-center md:text-right">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Performance</p>
              <div className="text-3xl font-bold text-primary flex items-baseline gap-1 justify-end">
                {vendor.performance?.onTimeDeliveryRate || 0}<span className="text-sm font-semibold">%</span>
              </div>
            </div>
            <Separator orientation="vertical" className="h-10 hidden md:block" />
            <div className="text-center md:text-right">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Total Orders</p>
              <div className="text-3xl font-bold">{vendor._count?.purchaseOrders || 0}</div>
            </div>
          </div>
        </div>
      </div>

      <Separator className="opacity-50" />

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
        {/* Sidebar Info */}
        <div className="lg:col-span-4 space-y-10">
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-primary font-semibold">
              <Contact2 className="h-5 w-5" />
              <h3 className="text-xl font-bold">Contact Information</h3>
            </div>
            
            <div className="space-y-6">
              <div className="grid gap-1">
                <Label className="text-[10px] text-muted-foreground uppercase font-semibold tracking-tighter">Primary Contact</Label>
                <p className="font-semibold text-lg">{vendor.contactPerson || "—"}</p>
              </div>

              <div className="grid gap-1">
                <Label className="text-[10px] text-muted-foreground uppercase font-semibold tracking-tighter">Email Address</Label>
                <div className="flex items-center gap-2 font-medium">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {vendor.email || "No email provided"}
                </div>
              </div>

              <div className="grid gap-1">
                <Label className="text-[10px] text-muted-foreground uppercase font-semibold tracking-tighter">Phone Number</Label>
                <div className="flex items-center gap-2 font-medium">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {vendor.phone || "No phone provided"}
                </div>
              </div>
            </div>
          </section>

          <Separator className="opacity-30" />

          <section className="space-y-6">
            <div className="flex items-center gap-3 text-primary font-semibold">
              <MapPin className="h-5 w-5" />
              <h3 className="text-xl font-bold">Office Address</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed border-l-2 border-primary/20 pl-4 py-1">
              {vendor.address || "No physical address specified."}
            </p>
          </section>

          <section className="space-y-6">
             <div className="flex items-center gap-3 text-primary font-semibold">
              <FileText className="h-5 w-5" />
              <h3 className="text-xl font-bold">Registration</h3>
            </div>
            <div className="grid gap-1">
                <Label className="text-[10px] text-muted-foreground uppercase font-semibold tracking-tighter">GST Number</Label>
                <p className="font-mono text-sm bg-muted/50 px-3 py-2 rounded-md w-fit border">{vendor.gstNumber || "Not Registered"}</p>
            </div>
          </section>
        </div>

        {/* Main Content Areas */}
        <div className="lg:col-span-8 space-y-16">
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 font-semibold">
                <Package className="h-5 w-5 text-primary" />
                <h3 className="text-2xl font-bold">Mapped Products</h3>
                <Badge variant="secondary" className="rounded-full h-6 w-6 p-0 flex items-center justify-center font-semibold">
                  {vendor._count?.vendorProducts || 0}
                </Badge>
              </div>
              <Button variant="link" className="text-primary font-semibold">Manage Mapping</Button>
            </div>
            <div className="border border-dashed rounded-lg h-48 flex items-center justify-center bg-muted/10">
               <div className="text-center space-y-1">
                  <p className="text-muted-foreground font-medium">Integrated product list coming soon</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-medium">Linked items for purchase ordering</p>
               </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 font-semibold">
                <Clock className="h-5 w-5 text-primary" />
                <h3 className="text-2xl font-bold">Recent Activity</h3>
              </div>
              <Button variant="link" className="text-primary font-semibold">View History</Button>
            </div>
            <div className="border border-dashed rounded-lg h-64 flex items-center justify-center bg-muted/10">
               <div className="text-center space-y-1">
                  <p className="text-muted-foreground font-medium">Order timeline & fulfillment history</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-medium">Tracking performance across transactions</p>
               </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default VendorDetail;
