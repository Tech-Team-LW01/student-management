"use client"

import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function UnauthorizedPage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-red-500" />
          </div>
          <CardTitle className="text-2xl">Access Denied</CardTitle>
          <CardDescription>You don't have permission to access this page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              Your current role ({user?.role?.replace("_", " ")}) doesn't have access to this resource. Contact your
              administrator if you believe this is an error.
            </p>
          </div>

          <Button asChild className="w-full">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
