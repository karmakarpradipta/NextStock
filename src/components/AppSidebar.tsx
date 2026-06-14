import {
  LayoutDashboard,
  Package2,
  Users,
  UserCog,
  Settings,
  LogOut,
  ChevronUp,
  User2,
  FolderTree,
  Package,
  ShoppingCart,
  Banknote,
  FileText,
  Activity,
  ClipboardList
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useAppDispatch, useAppSelector } from "../store/hooks"
import { logOut, selectCurrentUser } from "../features/auth/authSlice"
import { useLogoutMutation } from "../features/auth/authApiSlice"
import { useGetRequisitionsQuery } from "../features/inventory/requisitionApiSlice"
import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";

export function AppSidebar() {
  const user = useAppSelector(selectCurrentUser)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const [logout] = useLogoutMutation()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const { data: pendingReqs } = useGetRequisitionsQuery(
    { status: "PENDING", limit: 1 },
    { skip: user?.role !== "ADMIN" }
  )
  const pendingCount = pendingReqs?.pagination.total || 0

  const handleLogout = async () => {
    try {
      setShowLogoutConfirm(false)
      await logout({}).unwrap()
    } catch (err) {
      console.error("Failed to logout:", err)
    } finally {
      dispatch(logOut())
      navigate("/login")
    }
  }

  const items = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Products",
      url: "/inventory/products",
      icon: Package,
    },
    {
      title: "Stock Management",
      url: "/inventory/stock",
      icon: Activity,
    },
    {
      title: "Categories",
      url: "/inventory/categories",
      icon: FolderTree,
    },
    {
      title: "Vendors",
      url: "/vendors",
      icon: Users,
    },
    {
      title: "Purchases",
      url: "/purchases",
      icon: ShoppingCart,
    },
    {
      title: "Sales",
      url: "/sales",
      icon: Banknote,
    },
    {
      title: "Reports",
      url: "/reports",
      icon: FileText,
    },
    {
      title: "Requisitions",
      url: "/requisitions",
      icon: ClipboardList,
      badge: user?.role === "ADMIN" && pendingCount > 0 ? pendingCount : undefined,
    },
    ...(user?.role === "ADMIN" ? [
      {
        title: "User Management",
        url: "/users",
        icon: UserCog,
      },
      {
        title: "Audit Log",
        url: "/audit",
        icon: Activity,
      }
    ] : []),
  ]

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 border-b flex flex-row items-center px-4 md:px-6 group-data-[state=collapsed]:!px-0 group-data-[state=collapsed]:justify-center">
        <Link to="/dashboard" className="flex items-center gap-2 font-semibold">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground shrink-0">
            <Package2 className="h-5 w-5" />
          </div>
          <span className="group-data-[state=collapsed]:hidden font-bold text-xl truncate">NextStock</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="group-data-[state=collapsed]:px-2">
          <SidebarGroupLabel className="group-data-[state=collapsed]:hidden text-muted-foreground/70">Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === item.url || location.pathname.startsWith(item.url)} 
                    tooltip={item.title}
                  >
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                  {item.badge && (
                    <SidebarMenuBadge className="bg-primary text-primary-foreground text-[10px] h-5 min-w-5 rounded-full px-1">
                      {item.badge}
                    </SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-2 group-data-[state=collapsed]:!p-0 group-data-[state=collapsed]:flex group-data-[state=collapsed]:justify-center">
        <SidebarMenu className="group-data-[state=collapsed]:w-full group-data-[state=collapsed]:flex group-data-[state=collapsed]:justify-center">
          <SidebarMenuItem className="group-data-[state=collapsed]:w-full group-data-[state=collapsed]:flex group-data-[state=collapsed]:justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="h-12 w-full justify-start gap-2 px-2 group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:!p-0 group-data-[state=collapsed]:!size-12">
                  <User2 className="h-5 w-5 shrink-0" />
                  <span className="group-data-[state=collapsed]:hidden flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                    {user?.name || "User"}
                  </span>
                  <ChevronUp className="group-data-[state=collapsed]:hidden ml-auto h-4 w-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width] rounded-md"
              >
                <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Profile & Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowLogoutConfirm(true)} className="text-destructive cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You will be redirected to the login page and will need to provide your credentials again to access your account.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Logout
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
