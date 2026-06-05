import { LayoutDashboard } from "lucide-react";

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <LayoutDashboard className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground text-sm">System summary and analytics.</p>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="rounded-xl border border-dashed p-20 flex flex-col items-center justify-center text-center bg-muted/5">
           <LayoutDashboard className="h-12 w-12 text-muted-foreground/20 mb-4" />
           <h3 className="text-lg font-semibold text-muted-foreground">Dashboard content is being updated</h3>
           <p className="text-sm text-muted-foreground/60 max-w-xs">
              We are refocusing on core modules. Dashboard statistics will be restored once Stock, Purchases, and Sales are finalized.
           </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
