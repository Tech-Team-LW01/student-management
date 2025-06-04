"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import {
  getUsers,
  getGroups,
  assignUserToGroups,
  updateUserRole,
  deleteUser,
  canAssignRoles,
} from "@/lib/firebase-utils"
import { useAuth } from "@/contexts/auth-context"
import type { User, Group, UserRole } from "@/types"
import {
  Users,
  Search,
  Settings,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  AlertCircle,
  Trash2,
  UserCog,
  Shield,
  Crown,
  GraduationCap,
  UserCheck,
} from "lucide-react"

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [selectedRole, setSelectedRole] = useState<UserRole>("student")
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    let filtered = users

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filter by role
    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter)
    }

    setFilteredUsers(filtered)
  }, [users, searchTerm, roleFilter])

  const fetchData = async () => {
    try {
      setError(null)
      const [usersData, groupsData] = await Promise.all([getUsers(), getGroups()])
      setUsers(usersData)
      setGroups(groupsData)
    } catch (error) {
      console.error("Error fetching data:", error)
      setError("Failed to load users data.")
    } finally {
      setLoading(false)
    }
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setSelectedGroups(user.assignedGroups || [])
    setSelectedRole(user.role)
  }

  const handleGroupSelection = (groupId: string, checked: boolean) => {
    if (checked) {
      setSelectedGroups((prev) => [...prev, groupId])
    } else {
      setSelectedGroups((prev) => prev.filter((id) => id !== groupId))
    }
  }

  const handleUpdateUser = async () => {
    if (!selectedUser || !currentUser) return

    setUpdating(true)
    setError(null)
    setSuccess(null)

    try {
      // Update groups if changed
      if (JSON.stringify(selectedGroups.sort()) !== JSON.stringify((selectedUser.assignedGroups || []).sort())) {
        await assignUserToGroups(selectedUser.id, selectedGroups, currentUser.id)
      }

      // Update role if changed
      if (selectedRole !== selectedUser.role) {
        await updateUserRole(selectedUser.id, selectedRole, currentUser.id)
      }

      // Update local state
      setUsers((prev) =>
        prev.map((user) =>
          user.id === selectedUser.id ? { ...user, assignedGroups: selectedGroups, role: selectedRole } : user,
        ),
      )

      setSuccess(`Successfully updated ${selectedUser.name}'s information.`)
      setSelectedUser(null)
      setSelectedGroups([])

      setTimeout(() => setSuccess(null), 5000)
    } catch (error: any) {
      console.error("Error updating user:", error)
      setError(error.message || "Failed to update user.")
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!currentUser) return

    try {
      await deleteUser(userId, currentUser.id)
      setUsers((prev) => prev.filter((user) => user.id !== userId))
      setSuccess(`Successfully deleted ${userName}.`)
      setTimeout(() => setSuccess(null), 5000)
    } catch (error: any) {
      console.error("Error deleting user:", error)
      setError(error.message || "Failed to delete user.")
    }
  }

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "super_admin":
        return <Crown className="h-4 w-4" />
      case "admin":
        return <Shield className="h-4 w-4" />
      case "group_admin":
        return <UserCog className="h-4 w-4" />
      case "student":
        return <GraduationCap className="h-4 w-4" />
      default:
        return <Users className="h-4 w-4" />
    }
  }

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case "super_admin":
        return "bg-red-100 text-red-800 border-red-200"
      case "admin":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "group_admin":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "student":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getRoleDisplayName = (role: UserRole) => {
    switch (role) {
      case "super_admin":
        return "Super Admin"
      case "admin":
        return "Admin"
      case "group_admin":
        return "Group Admin"
      case "student":
        return "Student"
      default:
        return "Unknown"
    }
  }

  const getAvailableRoles = (): UserRole[] => {
    if (!currentUser) return []

    if (currentUser.role === "super_admin") {
      return ["student", "group_admin", "admin", "super_admin"]
    }

    if (currentUser.role === "admin") {
      return ["student", "group_admin"]
    }

    return []
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
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">LinuxWorld Users Management</h1>
              <p className="text-muted-foreground">Manage all LinuxWorld users, their roles, and group assignments</p>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Search & Filter Users</CardTitle>
              <CardDescription>Find users by name, email, or role</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="student">Students</SelectItem>
                    <SelectItem value="group_admin">Group Admins</SelectItem>
                    <SelectItem value="admin">Admins</SelectItem>
                    <SelectItem value="super_admin">Super Admins</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Total Users: {users.length}</span>
                <span>•</span>
                <span>Filtered: {filteredUsers.length}</span>
                <span>•</span>
                <span>Approved: {users.filter((u) => u.isApproved).length}</span>
              </div>
            </CardContent>
          </Card>

          {/* Users List */}
          {filteredUsers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Users Found</h3>
                <p className="text-muted-foreground text-center">
                  {searchTerm || roleFilter !== "all"
                    ? "No users match your search criteria."
                    : "No users have been registered yet."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {filteredUsers.map((user) => (
                <Card key={user.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={user.profileImage || "/placeholder.svg"} />
                          <AvatarFallback className="text-lg">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <CardTitle className="text-xl flex items-center gap-2">
                            {user.name}
                            {user.id === currentUser?.id && (
                              <Badge variant="outline" className="text-xs">
                                You
                              </Badge>
                            )}
                          </CardTitle>
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
                              {user.registrationDate instanceof Date
                                ? user.registrationDate.toLocaleDateString()
                                : "Unknown"}
                            </span>
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${getRoleColor(user.role)} flex items-center gap-1`}>
                          {getRoleIcon(user.role)}
                          {getRoleDisplayName(user.role)}
                        </Badge>
                        <Badge variant={user.isApproved ? "default" : "secondary"}>
                          {user.isApproved ? (
                            <>
                              <UserCheck className="h-3 w-3 mr-1" />
                              Approved
                            </>
                          ) : (
                            "Pending"
                          )}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Assigned to {user.assignedGroups?.length || 0} group(s)
                        </p>
                        {user.assignedGroups && user.assignedGroups.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {user.assignedGroups.slice(0, 3).map((groupId) => {
                              const group = groups.find((g) => g.id === groupId)
                              return group ? (
                                <Badge key={groupId} variant="outline" className="text-xs">
                                  {group.name}
                                </Badge>
                              ) : null
                            })}
                            {user.assignedGroups.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{user.assignedGroups.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {/* Edit User Dialog */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" onClick={() => handleEditUser(user)}>
                              <Settings className="h-4 w-4 mr-2" />
                              Manage
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Manage User: {user.name}</DialogTitle>
                              <DialogDescription>Update user role and group assignments</DialogDescription>
                            </DialogHeader>

                            <div className="space-y-6">
                              {/* Role Selection */}
                              <div className="space-y-3">
                                <h4 className="font-medium">User Role</h4>
                                <Select
                                  value={selectedRole}
                                  onValueChange={(value) => setSelectedRole(value as UserRole)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {getAvailableRoles().map((role) => (
                                      <SelectItem
                                        key={role}
                                        value={role}
                                        disabled={!canAssignRoles(currentUser?.role!, role)}
                                      >
                                        <div className="flex items-center gap-2">
                                          {getRoleIcon(role)}
                                          {getRoleDisplayName(role)}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                  {currentUser?.role === "super_admin"
                                    ? "Super Admins can assign any role"
                                    : "Admins can only assign Student and Group Admin roles"}
                                </p>
                              </div>

                              {/* Group Assignment */}
                              {(selectedRole === "student" || selectedRole === "group_admin") && (
                                <div className="space-y-3">
                                  <h4 className="font-medium">Group Assignments</h4>
                                  {groups.length === 0 ? (
                                    <p className="text-muted-foreground">No groups available.</p>
                                  ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                                      {groups.map((group) => (
                                        <div key={group.id} className="flex items-center space-x-2">
                                          <Checkbox
                                            id={`group-${group.id}`}
                                            checked={selectedGroups.includes(group.id)}
                                            onCheckedChange={(checked) =>
                                              handleGroupSelection(group.id, checked as boolean)
                                            }
                                          />
                                          <label
                                            htmlFor={`group-${group.id}`}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                                          >
                                            {group.name}
                                          </label>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Action Buttons */}
                              <div className="flex gap-3">
                                <Button onClick={handleUpdateUser} disabled={updating} className="flex-1">
                                  {updating ? "Updating..." : "Update User"}
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedUser(null)
                                    setSelectedGroups([])
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        {/* Delete User */}
                        {user.id !== currentUser?.id && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="icon" className="text-red-600 hover:text-red-700">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete User</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {user.name}? This action cannot be undone and will
                                  remove all their data from the platform.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteUser(user.id, user.name)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete User
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
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
