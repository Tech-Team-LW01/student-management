"use client"

import type React from "react"
import { useAuth } from "@/contexts/auth-context"
import type { UserRole } from "@/types"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
  requireApproval?: boolean
}

export function ProtectedRoute({ children, allowedRoles, requireApproval = true }: ProtectedRouteProps) {
  const { user, authLoading, isInitialized } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Only proceed with checks if auth is fully initialized and not loading
    if (isInitialized && !authLoading) {
      console.log("ProtectedRoute: Auth initialized, checking user...", { user, isInitialized, authLoading })
      
      // Check if user is authenticated
      if (!user) {
        console.log("ProtectedRoute: No user found, redirecting to signin")
        router.push("/auth/signin")
        return
      }

      // Check if user needs approval
      if (requireApproval && !user.isApproved) {
        console.log("ProtectedRoute: User not approved, redirecting to pending approval")
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

      console.log("ProtectedRoute: All checks passed, rendering children")
    }
  }, [user, authLoading, isInitialized, router, allowedRoles, requireApproval])

  // Show loading state while auth is initializing or loading
  if (!isInitialized || authLoading) {
    console.log("ProtectedRoute: Showing loading state", { isInitialized, authLoading })
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

  if (requireApproval && !user.isApproved) {
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