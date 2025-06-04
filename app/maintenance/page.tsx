// app/maintenance/page.tsx
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { Wrench, AlertCircle, Mail, Clock, RefreshCw } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function MaintenancePage() {
  const { signOutUser, user } = useAuth()
  const router = useRouter()
  const [checking, setChecking] = useState(false)

  const handleCheckAgain = async () => {
    setChecking(true)
    // Force a page reload to re-check maintenance status
    window.location.reload()
  }

  const handleSignOut = async () => {
    await signOutUser()
    router.push('/auth/signin')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Wrench className="h-16 w-16 text-orange-500" />
              <AlertCircle className="h-6 w-6 text-orange-600 absolute -bottom-1 -right-1" />
            </div>
          </div>
          <CardTitle className="text-2xl">LinuxWorld Under Maintenance</CardTitle>
          <CardDescription className="text-base">
            We're currently performing scheduled maintenance to improve your experience.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Clock className="h-5 w-5 text-orange-500 mt-0.5" />
              <div>
                <h3 className="font-medium text-orange-800">What's happening?</h3>
                <p className="text-sm text-orange-700 mt-1">
                  Our team is working on system improvements and updates. The platform will be back online shortly.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Mail className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-800">Need immediate assistance?</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Please contact your course administrator or check back later.
                </p>
              </div>
            </div>
          </div>

          {user && (
            <div className="text-center text-sm text-muted-foreground">
              Logged in as: {user.email}
            </div>
          )}

          <div className="pt-4 space-y-3">
            <Button 
              onClick={handleCheckAgain} 
              variant="outline" 
                            className="w-full"
              disabled={checking}
            >
              {checking ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Check Again
                </>
              )}
            </Button>
            
            <Button 
              onClick={handleSignOut} 
              variant="ghost" 
              className="w-full text-muted-foreground"
            >
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}