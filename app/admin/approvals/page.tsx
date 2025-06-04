"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getPendingUsers, approveUser, getGroups, assignUserToGroups } from "@/lib/firebase-utils"
import { useAuth } from "@/contexts/auth-context"
import type { User, Group } from "@/types"
import { UserCheck, Calendar, Mail, Phone, AlertCircle, CheckCircle, RefreshCw } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

export default function ApprovalsPage() {
  const { user: currentUser } = useAuth()
  const [pendingUsers, setPendingUsers] = useState<User[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [processingUsers, setProcessingUsers] = useState<Set<string>>(new Set())
  const [selectedGroups, setSelectedGroups] = useState<Record<string, string[]>>({})
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setError(null)
      console.log("Fetching approvals data...")

      const [users, groupsData] = await Promise.all([getPendingUsers(), getGroups()])

      console.log("Fetched pending users:", users.length)
      console.log("Fetched groups:", groupsData.length)

      setPendingUsers(users)
      setGroups(groupsData)
    } catch (error) {
      console.error("Error fetching data:", error)
      setError("Failed to load pending approvals. Please refresh the page.")
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (userId: string) => {
    if (!currentUser) {
      setError("You must be logged in to approve users.")
      return
    }

    console.log("=== APPROVAL ATTEMPT START ===")
    console.log("Current user:", {
      id: currentUser.id,
      email: currentUser.email,
      role: currentUser.role,
      isApproved: currentUser.isApproved,
    })
    console.log("Target user ID:", userId)

    setProcessingUsers((prev) => new Set(prev).add(userId))
    setError(null)
    setSuccessMessage(null)

    try {
      console.log("Calling approveUser function...")

      // Approve the user
      await approveUser(userId, currentUser.id)
      console.log("✅ User approval successful!")

      // Assign selected groups if any
      const userGroups = selectedGroups[userId] || []
      if (userGroups.length > 0) {
        console.log("Assigning groups to user:", { userId, groups: userGroups })
        await assignUserToGroups(userId, userGroups, currentUser.id)
        console.log("✅ Group assignment successful!")
      }

      // Remove from pending list
      const approvedUser = pendingUsers.find((user) => user.id === userId)
      setPendingUsers((prev) => prev.filter((user) => user.id !== userId))

      // Clear selected groups for this user
      setSelectedGroups((prev) => {
        const updated = { ...prev }
        delete updated[userId]
        return updated
      })

      setSuccessMessage(
        `Successfully approved ${approvedUser?.name || "user"}${
          userGroups.length > 0 ? ` and assigned to ${userGroups.length} group(s)` : ""
        }.`,
      )

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (error: any) {
      console.error("❌ Error approving user:", error)

      // Show detailed error message
      const errorMessage = error.message || "Failed to approve user. Please try again."
      setError(errorMessage)

      // If it's a permission error, suggest solutions
      if (error.message?.includes("Permission denied") || error.message?.includes("insufficient permissions")) {
        setError(
          `${errorMessage}\n\n` +
            "Troubleshooting steps:\n" +
            "1. Make sure you've applied the correct Firestore security rules\n" +
            "2. Refresh your browser completely (Ctrl+F5)\n" +
            "3. Sign out and sign back in\n" +
            "4. Check that your account has admin privileges",
        )
      }
    } finally {
      setProcessingUsers((prev) => {
        const updated = new Set(prev)
        updated.delete(userId)
        return updated
      })
      console.log("=== APPROVAL ATTEMPT END ===")
    }
  }

  const handleGroupSelection = (userId: string, groupId: string, checked: boolean) => {
    setSelectedGroups((prev) => {
      const userGroups = prev[userId] || []
      const updated = { ...prev }

      if (checked) {
        updated[userId] = [...userGroups, groupId]
      } else {
        updated[userId] = userGroups.filter((id) => id !== groupId)
      }

      return updated
    })
  }

  const handleRefresh = () => {
    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    fetchData()
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
        <MainLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </MainLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">LinuxWorld Pending Approvals</h1>
              <p className="text-muted-foreground">Review and approve LinuxWorld student registrations</p>
            </div>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          {!currentUser?.role ||
            (!["admin", "super_admin"].includes(currentUser.role) && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You don't have permission to approve users. Please ensure you have admin privileges. Current role:{" "}
                  {currentUser?.role || "unknown"}
                </AlertDescription>
              </Alert>
            ))}

          {/* Debug Information */}
          {currentUser && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Debug Info:</strong> Logged in as {currentUser.email} with role "{currentUser.role}".
                {currentUser.role === "admin" || currentUser.role === "super_admin"
                  ? " ✅ You have admin privileges."
                  : " ❌ You need admin or super_admin role."}
              </AlertDescription>
            </Alert>
          )}

          {pendingUsers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <UserCheck className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Pending Approvals</h3>
                <p className="text-muted-foreground text-center">
                  All student registrations have been reviewed. New registrations will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {pendingUsers.map((user) => (
                <Card key={user.id}>
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={user.profileImage || "/placeholder.svg"} />
                        <AvatarFallback className="text-lg">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <CardTitle className="text-xl">{user.name}</CardTitle>
                        <CardDescription className="flex items-center gap-4 mt-2">
                          <span className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {user.email}
                          </span>
                          {user.mobileNumber && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              {user.mobileNumber}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Registered{" "}
                            {user.registrationDate instanceof Date
                              ? user.registrationDate.toLocaleDateString()
                              : "Recently"}
                          </span>
                        </CardDescription>
                      </div>
                      <Badge variant="secondary">Pending</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {groups.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3">Assign to Groups (Optional)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {groups.map((group) => (
                            <div key={group.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`${user.id}-${group.id}`}
                                checked={selectedGroups[user.id]?.includes(group.id) || false}
                                onCheckedChange={(checked) =>
                                  handleGroupSelection(user.id, group.id, checked as boolean)
                                }
                              />
                              <label
                                htmlFor={`${user.id}-${group.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {group.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleApprove(user.id)}
                        disabled={
                          processingUsers.has(user.id) ||
                          !currentUser?.role ||
                          !["admin", "super_admin"].includes(currentUser.role)
                        }
                        className="flex-1"
                      >
                        <UserCheck className="mr-2 h-4 w-4" />
                        {processingUsers.has(user.id) ? "Approving..." : "Approve User"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
}
