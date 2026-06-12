import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "../AppSidebar";
import { ThemeToggle } from "../ThemeToggle";
import { Maximize, Minimize, Home, Package, FolderTree, Users, ShoppingCart, Banknote, FileText, ClipboardList, Activity, UserCog } from "lucide-react";
import { Button } from "../ui/button";
import { motion } from "framer-motion";
import { Separator } from "../ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useBreadcrumb } from "@/context/BreadcrumbContext";

const ID_PATTERN = /^\d+$/;

const HIDDEN_SEGMENTS = ["dashboard", "inventory", "edit", "add"];

const labels: Record<string, string> = {
  products: "Products",
  categories: "Categories",
  add: "Add New",
  edit: "Edit",
  users: "User Management",
};

const icons: Record<string, any> = {
  products: Package,
  categories: FolderTree,
  vendors: Users,
  purchases: ShoppingCart,
  sales: Banknote,
  reports: FileText,
  requisitions: ClipboardList,
  users: UserCog,
  audit: Activity,
  stock: Activity,
};

const MainLayout = () => {
  const location = useLocation();
  const { dynamicLabels } = useBreadcrumb();
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const pathnames = location.pathname.split("/").filter((x) => x);

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const breadcrumbItems = pathnames
    .reduce<{ name: string; originalIndex: number }[]>((acc, name, i) => {
      if (!HIDDEN_SEGMENTS.includes(name)) {
        acc.push({ name, originalIndex: i });
      }
      return acc;
    }, [])
    .map((item, index, filtered) => {
      const { name, originalIndex } = item;
      const routeTo = `/${pathnames.slice(0, originalIndex + 1).join("/")}`;
      const isLast = index === filtered.length - 1;

      // For last segment: if it's a generic label like "Edit", prefer dynamic label (entity name/SKU)
      const dynamicLabel = dynamicLabels[name];
      let label: string;

      if (isLast && labels[name] && dynamicLabel) {
        label = dynamicLabel;
      } else {
        label =
          dynamicLabel ||
          labels[name] ||
          (ID_PATTERN.test(name)
            ? "Detail"
            : name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, " "));
      }

      return { label, routeTo, name, Icon: icons[name] };
    });

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background transition-colors duration-500">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 md:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <div className="hidden md:block">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to="/dashboard" className="flex items-center gap-1.5 transition-colors hover:text-primary">
                        <Home className="h-4 w-4" />
                        <span className="font-medium">Home</span>
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>

                  {breadcrumbItems.map((item, index) => (
                    <React.Fragment key={item.routeTo}>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        {index === breadcrumbItems.length - 1 ? (
                          <BreadcrumbPage className="flex items-center gap-1.5 font-semibold text-foreground">
                            {item.Icon && <item.Icon className="h-3.5 w-3.5" />}
                            {item.label}
                          </BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink asChild>
                            <Link to={item.routeTo} className="flex items-center gap-1.5 transition-colors hover:text-primary">
                              {item.Icon && <item.Icon className="h-3.5 w-3.5" />}
                              {item.label}
                            </Link>
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                    </React.Fragment>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <h1 className="md:hidden text-sm font-medium text-muted-foreground truncate">
              NextStock
            </h1>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                className="h-9 w-9 rounded-md hover:bg-accent transition-colors cursor-pointer"
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize className="h-[1.2rem] w-[1.2rem]" />
                ) : (
                  <Maximize className="h-[1.2rem] w-[1.2rem]" />
                )}
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <motion.main 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6"
        >
          <Outlet />
        </motion.main>
        <footer className="mt-auto border-t bg-background px-4 py-4 md:px-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} NextStock Management System. All rights reserved.
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default MainLayout;
