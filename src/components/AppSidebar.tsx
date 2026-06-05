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
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAppDispatch, useAppSelector } from "../store/hooks"
import { logOut, selectCurrentUser } from "../features/auth/authSlice"
import { useLogoutMutation } from "../features/auth/authApiSlice"
import { useNavigate, Link, useLocation } from "react-router-dom"

export function AppSidebar() {
  const user = useAppSelector(selectCurrentUser)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const [logout] = useLogoutMutation()

  const handleLogout = async () => {
    try {
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
    ...(user?.role === "ADMIN" ? [
      {
        title: "User Management",
        url: "/users",
        icon: UserCog,
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
                    className="group-data-[state=collapsed]:justify-center"
                  >
                    <Link to={item.url}>
                      <item.icon className="shrink-0" />
                      <span className="group-data-[state=collapsed]:hidden">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
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
                className="w-[--radix-popper-anchor-width]"
              >
                <DropdownMenuItem disabled>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
