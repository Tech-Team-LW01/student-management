"use client"

import { useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle2, XCircle, Copy, RefreshCw } from "lucide-react"
import { toast } from "sonner"

interface UserCreationResult {
  email: string
  status: "success" | "error"
  message: string
  password?: string
  userId?: string
}

export default function BulkCreatePage() {
  const [emails, setEmails] = useState("")
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<UserCreationResult[]>([])
  const [error, setError] = useState("")
  const [showPasswords, setShowPasswords] = useState(true)

  const validateEmails = (emailList: string[]): string[] => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailList
      .map(email => email.trim())
      .filter(email => email && emailRegex.test(email))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
  }

  const regeneratePassword = async (userId: string, email: string) => {
    try {
      const response = await fetch('/api/regenerate-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, email }),
      })

      if (!response.ok) {
        throw new Error('Failed to regenerate password')
      }

      const data = await response.json()
      
      // Update results with new password
      setResults(prev => prev.map(result => 
        result.userId === userId 
          ? { ...result, password: data.password }
          : result
      ))

      toast.success("Password regenerated and sent to user")
    } catch (error) {
      toast.error("Failed to regenerate password")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setResults([])

    try {
      const emailList = emails.split(",")
      const validEmails = validateEmails(emailList)

      if (validEmails.length === 0) {
        setError("Please enter valid email addresses")
        setLoading(false)
        return
      }

      // Call the API route
      const response = await fetch('/api/bulk-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          users: validEmails.map(email => ({
            email,
            role: 'student',
            status: 'active',
            createdAt: new Date().toISOString(),
          }))
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create users')
      }

      const data = await response.json()
      
      if (data.errors && data.errors.length > 0) {
        setError(`Failed to create some users: ${data.errors.map((e: any) => e.email).join(', ')}`)
      }

      if (data.results && data.results.length > 0) {
        setResults(data.results.map((result: any) => ({
          email: result.email,
          status: "success",
          message: "User created successfully",
          password: result.password,
          userId: result.userId
        })))
        toast.success("Users created successfully")
      }
    } catch (error: any) {
      setError(error.message || "An error occurred")
      toast.error("Failed to create users")
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
      <MainLayout>
        <div className="container mx-auto py-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Create Students</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Enter email addresses (comma-separated)
                  </label>
                  <Textarea
                    placeholder="student1@example.com, student2@example.com, ..."
                    value={emails}
                    onChange={(e) => setEmails(e.target.value)}
                    className="h-32"
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Users
                </Button>
              </form>

              {results.length > 0 && (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Created Accounts</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPasswords(!showPasswords)}
                    >
                      {showPasswords ? "Hide Passwords" : "Show Passwords"}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {results.map((result, index) => (
                      <Alert
                        key={index}
                        variant={result.status === "success" ? "default" : "destructive"}
                        className="relative"
                      >
                        {result.status === "success" ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        <AlertTitle>{result.email}</AlertTitle>
                        <AlertDescription>
                          {result.message}
                          {result.password && showPasswords && (
                            <div className="mt-2 space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                                  {result.password}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(result.password!)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => regeneratePassword(result.userId!, result.email)}
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
} 