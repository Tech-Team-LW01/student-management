// components/protected-route.tsx
"use client"

import type React from "react"
import { useAuth } from "@/contexts/auth-context"
import type { UserRole } from "@/types"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { getPlatformSettings } from "@/lib/firebase-utils"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
  requireApproval?: boolean
}

export function ProtectedRoute({ children, allowedRoles, requireApproval = true }: ProtectedRouteProps) {
  const { user, authLoading, isInitialized } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [maintenanceLoading, setMaintenanceLoading] = useState(true)

  // Admin roles that can bypass maintenance mode
  const adminRoles: UserRole[] = ['super_admin', 'admin', 'group_admin']

  // Pages that don't require approval
  const approvalExemptPaths = ['/pending-approval', '/auth/signin', '/auth/signup']

  // Check maintenance mode status
  useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        const settings = await getPlatformSettings()
        setMaintenanceMode(settings.maintenanceMode || false)
      } catch (error) {
        console.error("Error checking maintenance mode:", error)
        setMaintenanceMode(false)
      } finally {
        setMaintenanceLoading(false)
      }
    }

    if (isInitialized) {
      checkMaintenanceMode()
    }
  }, [isInitialized])

  useEffect(() => {
    // Only proceed with checks if auth is fully initialized and not loading
    if (isInitialized && !authLoading && !maintenanceLoading) {
      console.log("ProtectedRoute: Auth initialized, checking user...", { 
        user, 
        isApproved: user?.isApproved,
        requireApproval,
        pathname 
      })
      
      // Check if user is authenticated
      if (!user) {
        console.log("ProtectedRoute: No user found, redirecting to signin")
        router.push("/auth/signin")
        return
      }

      // Check maintenance mode (skip if user is admin)
      if (maintenanceMode && !adminRoles.includes(user.role)) {
        console.log("ProtectedRoute: Maintenance mode active, non-admin user, redirecting to maintenance page")
        router.push("/maintenance")
        return
      }

      // Check if user needs approval
      // Only check if requireApproval is true, user is not approved, and not on an exempt path
      if (requireApproval && !user.isApproved && !approvalExemptPaths.includes(pathname)) {
        console.log("ProtectedRoute: User not approved, redirecting to pending approval", {
          isApproved: user.isApproved,
          requireApproval,
          pathname
        })
        router.push("/pending-approval")
        return
      }

      // Check role-based access
      if (allowedRoles && !allowedRoles.includes(user.role)) {
        console.log("ProtectedRoute: User role not allowed, redirecting to unauthorized", {
          userRole: user.role,
          allowedRoles
        })
        router.push("/unauthorized")
        return
      }

      console.log("ProtectedRoute: All checks passed, user can access", {
        userEmail: user.email,
        isApproved: user.isApproved,
        role: user.role
      })
    }
  }, [user, authLoading, isInitialized, maintenanceMode, maintenanceLoading, router, allowedRoles, requireApproval, pathname])

  // Show loading state while auth is initializing or loading
  if (!isInitialized || authLoading || maintenanceLoading) {
    console.log("ProtectedRoute: Showing loading state", { isInitialized, authLoading, maintenanceLoading })
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading LinuxWorld...</p>
        </div>
      </div>
    )
  }

  // After initialization, check authentication and authorization
  if (!user) {
    console.log("ProtectedRoute: No user after initialization, should redirect")
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // Check maintenance mode for non-admin users
  if (maintenanceMode && !adminRoles.includes(user.role)) {
    console.log("ProtectedRoute: Maintenance mode active for non-admin user")
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to maintenance page...</p>
        </div>
      </div>
    )
  }

  if (requireApproval && !user.isApproved && !approvalExemptPaths.includes(pathname)) {
    console.log("ProtectedRoute: User not approved after initialization, should redirect")
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to approval page...</p>
        </div>
      </div>
    )
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.log("ProtectedRoute: User role not allowed after initialization, should redirect")
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to unauthorized page...</p>
        </div>
      </div>
    )
  }

  console.log("ProtectedRoute: Rendering children for user", user.email)
  return <>{children}</>
}