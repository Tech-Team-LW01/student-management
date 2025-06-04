// components/maintenance-provider.tsx
"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { getPlatformSettings } from "@/lib/firebase-utils"
import { useRouter, usePathname } from "next/navigation"

interface MaintenanceContextType {
  isMaintenanceMode: boolean
  loading: boolean
}

const MaintenanceContext = createContext<MaintenanceContextType>({
  isMaintenanceMode: false,
  loading: true,
})

export const useMaintenanceMode = () => useContext(MaintenanceContext)

export function MaintenanceProvider({ children }: { children: React.ReactNode }) {
  const { user, isInitialized } = useAuth()
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // List of paths that should always be accessible
  const publicPaths = ['/auth/signin', '/auth/signup', '/maintenance']
  const adminRoles = ['super_admin', 'admin', 'group_admin']

  useEffect(() => {
    const checkMaintenanceMode = async () => {
      if (!isInitialized) return

      try {
        const settings = await getPlatformSettings()
        setIsMaintenanceMode(settings.maintenanceMode || false)
      } catch (error) {
        console.error("Error checking maintenance mode:", error)
        setIsMaintenanceMode(false)
      } finally {
        setLoading(false)
      }
    }

    checkMaintenanceMode()
  }, [isInitialized])

  useEffect(() => {
    if (loading || !isInitialized) return

    const isPublicPath = publicPaths.includes(pathname)
    const isAdmin = user && adminRoles.includes(user.role)
    const isMaintenancePage = pathname === '/maintenance'

    // If maintenance mode is ON
    if (isMaintenanceMode) {
      // If user is not an admin and not on maintenance page or auth pages
      if (!isAdmin && !isMaintenancePage && !pathname.startsWith('/auth')) {
        router.push('/maintenance')
      }
    } else {
      // If maintenance mode is OFF and user is on maintenance page
      if (isMaintenancePage) {
        router.push(user ? '/dashboard' : '/auth/signin')
      }
    }
  }, [isMaintenanceMode, user, pathname, loading, isInitialized, router])

  // Show loading state while checking
  if (loading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <MaintenanceContext.Provider value={{ isMaintenanceMode, loading }}>
      {children}
    </MaintenanceContext.Provider>
  )
}