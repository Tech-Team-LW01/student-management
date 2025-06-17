"use client"

import { cn } from "@/lib/utils"
import {
  Users,
  Settings,
  Bell,
  FileText,
  LayoutDashboard,
  UserPlus,
  Megaphone,
  UserCog,
  Group
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const navItems = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users
  },
  {
    title: "Groups",
    href: "/admin/groups",
    icon: Group
  },
  {
    title: "Create Admin",
    href: "/admin/create-admin",
    icon: UserPlus
  },
  {
    title: "Announcements",
    href: "/admin/announcements",
    icon: Megaphone
  },
  {
    title: "Bulk Create",
    href: "/admin/bulk-create",
    icon: Users
  },
  {
    title: "Notifications",
    href: "/admin/notifications",
    icon: Bell
  },
  {
    title: "NDA Documents",
    href: "/admin/nda",
    icon: FileText
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings
  }
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="grid items-start gap-2">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900",
            pathname === item.href
              ? "bg-gray-100 text-gray-900"
              : "text-gray-600"
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.title}
        </Link>
      ))}
    </nav>
  )
} 