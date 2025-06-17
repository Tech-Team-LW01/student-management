"use client"

import type React from "react"
import { useAuth } from "@/contexts/auth-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MaintenanceBanner } from "../maintenance-banner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  UserCheck,
  MessageSquare,
  Settings,
  LogOut,
  Home,
  Shield,
  BookOpen,
  UserPlus,
  BarChart3,
  Bell,
  FileText,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { useEffect, useState } from "react"
import { getNotificationsForUser } from "@/lib/firebase-utils"
import type { Notification } from "@/types"

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user, signOutUser } = useAuth()
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (user && user.role === "student") {
      fetchUnreadNotifications()
    }
  }, [user])

  const fetchUnreadNotifications = async () => {
    if (!user) return

    try {
      const notifications = await getNotificationsForUser(user.id)
      const unread = notifications.filter(n => !n.readBy.includes(user.id))
      setUnreadCount(unread.length)
    } catch (error) {
      console.error("Error fetching notifications:", error)
    }
  }

  const getNavigationItems = () => {
    const baseItems = [{ title: "Dashboard", url: "/dashboard", icon: Home }]

    // Student role - very limited access
    if (user?.role === "student") {
      return [
        ...baseItems,
        { title: "My Groups", url: "/groups", icon: BookOpen },
        { title: "Notifications", url: "/notifications", icon: Bell },
        { title: "NDA Documents", url: "/nda", icon: FileText },
        { title: "Profile", url: "/profile", icon: Settings },
      ]
    }

    // Group Admin role - limited to announcements for assigned groups
    if (user?.role === "group_admin") {
      return [
        ...baseItems,
        { title: "My Groups", url: "/groups", icon: BookOpen },
        { title: "Announcements", url: "/admin/announcements", icon: MessageSquare },
        { title: "Notifications", url: "/admin/notifications", icon: Bell },
        { title: "Profile", url: "/profile", icon: Settings },
      ]
    }

    // Admin role - can manage users and groups, but cannot create other admins
    if (user?.role === "admin") {
      return [
        ...baseItems,
        { title: "Users Management", url: "/admin/users", icon: Users },
        { title: "Groups Management", url: "/admin/groups", icon: BookOpen },
        { title: "Pending Approvals", url: "/admin/approvals", icon: UserCheck },
        { title: "Announcements", url: "/admin/announcements", icon: MessageSquare },
        { title: "Bulk Create", url: "/admin/bulk-create", icon: UserPlus },
        { title: "Notifications", url: "/admin/notifications", icon: Bell },
        { title: "NDA Documents", url: "/admin/nda", icon: FileText },
        { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
        { title: "Profile", url: "/profile", icon: Settings },
      ]
    }

    // Super Admin role - full platform control
    if (user?.role === "super_admin") {
      return [
        ...baseItems,
        { title: "Users Management", url: "/admin/users", icon: Users },
        { title: "Groups Management", url: "/admin/groups", icon: BookOpen },
        { title: "Pending Approvals", url: "/admin/approvals", icon: UserCheck },
        { title: "Announcements", url: "/admin/announcements", icon: MessageSquare },
        { title: "Bulk Create", url: "/admin/bulk-create", icon: UserPlus },
        { title: "Notifications", url: "/admin/notifications", icon: Bell },
        { title: "NDA Documents", url: "/admin/nda", icon: FileText },
        { title: "Platform Settings", url: "/admin/settings", icon: Shield },
        { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
        { title: "Profile", url: "/profile", icon: Settings },
      ]
    }

    return baseItems
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-red-100 text-red-800 border-red-200"
      case "admin":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "group_admin":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "student":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "super_admin":
        return "Super Admin"
      case "admin":
        return "Admin"
      case "group_admin":
        return "Group Admin"
      case "student":
        return "Student"
      default:
        return "Unknown"
    }
  }

  const navigationItems = getNavigationItems()

  return (<>
    <MaintenanceBanner />
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 px-4 py-2">
            <div className="relative h-12 w-12">
              <Image
                src="/assets/LW@4x1.png"
                alt="LinuxWorld Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-gray-900">LinuxWorld</span>
              <span className="text-xs text-gray-500">Classroom Management</span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarMenu>
            {navigationItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={pathname === item.url}>
                  <Link href={item.url}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton>
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user?.profileImage || "/placeholder.svg"} />
                      <AvatarFallback>{user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start">
                      <span className="truncate text-sm font-medium">{user?.name}</span>
                      <Badge variant="outline" className={`text-xs ${getRoleBadgeColor(user?.role || "")}`}>
                        {getRoleDisplayName(user?.role || "")}
                      </Badge>
                    </div>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" className="w-[--radix-popper-anchor-width]">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user?.name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                      <Badge variant="outline" className={`text-xs w-fit ${getRoleBadgeColor(user?.role || "")}`}>
                        {getRoleDisplayName(user?.role || "")}
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <Settings className="mr-2 h-4 w-4" />
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOutUser}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center space-x-2">
                <Image
                  src="/assets/LW@4x1.png"
                  alt="Logo"
                  width={100}
                  height={40}
                  priority
                />
              </Link>
            </div>
            <div className="flex items-center gap-2">
              {user?.role === "student" && (
                <Link
                  href="/notifications"
                  className="relative inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              )}
              <Badge variant="outline" className={`${getRoleBadgeColor(user?.role || "")} hidden sm:inline-flex`}>
                {getRoleDisplayName(user?.role || "")}
              </Badge>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
    </>
  )
}
