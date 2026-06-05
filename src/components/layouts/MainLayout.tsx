import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "../AppSidebar";
import { ThemeToggle } from "../ThemeToggle";
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

const MainLayout = () => {
  const location = useLocation();
  const { dynamicLabels } = useBreadcrumb();
  const pathnames = location.pathname.split("/").filter((x) => x);

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

      return { label, routeTo, name };
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
                      <Link to="/dashboard" className="flex items-center gap-1">
                        Home
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>

                  {breadcrumbItems.map((item, index) => (
                    <React.Fragment key={item.routeTo}>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        {index === breadcrumbItems.length - 1 ? (
                          <BreadcrumbPage>{item.label}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink asChild>
                            <Link to={item.routeTo}>{item.label}</Link>
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
            <ThemeToggle />
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
