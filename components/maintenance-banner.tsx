// components/maintenance-banner.tsx
"use client"

import { useAuth } from "@/contexts/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { getPlatformSettings } from "@/lib/firebase-utils"

export function MaintenanceBanner() {
  const { user } = useAuth()
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [loading, setLoading] = useState(true)
  
  const adminRoles = ['super_admin', 'admin', 'group_admin']
  const isAdmin = user && adminRoles.includes(user.role)

  useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        const settings = await getPlatformSettings()
        setMaintenanceMode(settings.maintenanceMode || false)
      } catch (error) {
        console.error("Error checking maintenance mode:", error)
      } finally {
        setLoading(false)
      }
    }

    if (isAdmin) {
      checkMaintenanceMode()
    } else {
      setLoading(false)
    }
  }, [isAdmin])

  if (loading || !maintenanceMode || !isAdmin) return null

  return (
    <Alert className="rounded-none border-x-0 border-t-0 bg-orange-50 border-orange-200">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertDescription className="text-orange-800 flex items-center justify-between">
        <span>
          <strong>Maintenance Mode Active:</strong> Only administrators can access the platform. Students see a maintenance page.
        </span>
        {user.role === 'super_admin' && (
          <Link href="/platform-settings" className="ml-2 underline hover:text-orange-900">
            Manage Settings
          </Link>
        )}
      </AlertDescription>
    </Alert>
  )
}