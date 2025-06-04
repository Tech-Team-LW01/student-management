"use client"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation" // Add this
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Clock, Mail } from "lucide-react"

export default function PendingApprovalPage() {
  const { signOutUser } = useAuth()
  const router = useRouter() // Add this

  const handleSignOut = async () => {
    await signOutUser()
    router.push('/auth/signin')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Clock className="h-12 w-12 text-orange-500" />
          </div>
          <CardTitle className="text-2xl">LinuxWorld Account Pending</CardTitle>
          <CardDescription>
            Your LinuxWorld account has been created successfully and is currently under review by our administrators.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Mail className="h-5 w-5 text-orange-500 mt-0.5" />
              <div>
                <h3 className="font-medium text-orange-800">What happens next?</h3>
                <p className="text-sm text-orange-700 mt-1">
                  An administrator will review your registration and approve your account. You'll receive an email
                  notification once your account is approved.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <BookOpen className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-800">Need help?</h3>
                <p className="text-sm text-blue-700 mt-1">
                  If you have any questions about your LinuxWorld registration, please contact your course
                  administrator.
                </p>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleSignOut} 
            variant="outline" 
            className="w-full"
          >
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}