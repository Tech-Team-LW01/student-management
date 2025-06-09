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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
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
  MoreVertical,
  Filter,
  X,
  ChevronRight,
  Building2,
  Clock,
  Edit,
} from "lucide-react"

// Skeleton loader for user cards
const UserCardSkeleton = () => (
  <Card className="overflow-hidden animate-pulse">
    <div className="p-6">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 bg-gray-200 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-32 bg-gray-200 rounded" />
          <div className="h-4 w-48 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  </Card>
)

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [selectedRole, setSelectedRole] = useState<UserRole>("student")
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [bulkSearchEmails, setBulkSearchEmails] = useState("")
  const [bulkSearchResults, setBulkSearchResults] = useState<{
    inGroups: User[];
    notInGroups: User[];
  }>({ inGroups: [], notInGroups: [] })
  const [bulkGroupDialogOpen, setBulkGroupDialogOpen] = useState(false)
  const [selectedBulkGroups, setSelectedBulkGroups] = useState<string[]>([])
  const [bulkAssigning, setBulkAssigning] = useState(false)

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
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.mobileNumber && user.mobileNumber.includes(searchTerm)),
      )
    }

    // Filter by role
    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter)
    }

    // Filter by status
    if (statusFilter === "approved") {
      filtered = filtered.filter((user) => user.isApproved)
    } else if (statusFilter === "pending") {
      filtered = filtered.filter((user) => !user.isApproved)
    }

    setFilteredUsers(filtered)
  }, [users, searchTerm, roleFilter, statusFilter])

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
    setDialogOpen(true)
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
      setDialogOpen(false)
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
    const iconClass = "h-4 w-4"
    switch (role) {
      case "super_admin":
        return <Crown className={iconClass} />
      case "admin":
        return <Shield className={iconClass} />
      case "group_admin":
        return <UserCog className={iconClass} />
      case "student":
        return <GraduationCap className={iconClass} />
      default:
        return <Users className={iconClass} />
    }
  }

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case "super_admin":
        return "bg-red-50 text-red-700 border-red-200"
      case "admin":
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "group_admin":
        return "bg-purple-50 text-purple-700 border-purple-200"
      case "student":
        return "bg-green-50 text-green-700 border-green-200"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200"
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

  const clearFilters = () => {
    setSearchTerm("")
    setRoleFilter("all")
    setStatusFilter("all")
  }

  const hasActiveFilters = searchTerm || roleFilter !== "all" || statusFilter !== "all"

  const handleBulkSearch = () => {
    const emailList = bulkSearchEmails.split(',').map(email => email.trim().toLowerCase())
    const matchedUsers = users.filter(user => emailList.includes(user.email.toLowerCase()))
    
    const inGroups = matchedUsers.filter(user => user.assignedGroups && user.assignedGroups.length > 0)
    const notInGroups = matchedUsers.filter(user => !user.assignedGroups || user.assignedGroups.length === 0)
    
    setBulkSearchResults({ inGroups, notInGroups })
  }

  const handleBulkGroupAssignment = async () => {
    if (!currentUser || selectedBulkGroups.length === 0) return
    
    setBulkAssigning(true)
    setError(null)
    setSuccess(null)

    try {
      const promises = bulkSearchResults.notInGroups.map(user => 
        assignUserToGroups(user.id, selectedBulkGroups, currentUser.id)
      )
      
      await Promise.all(promises)
      
      // Update local state
      setUsers(prev => prev.map(user => {
        if (bulkSearchResults.notInGroups.some(u => u.id === user.id)) {
          return { ...user, assignedGroups: selectedBulkGroups }
        }
        return user
      }))

      setSuccess(`Successfully assigned ${bulkSearchResults.notInGroups.length} users to selected groups.`)
      setBulkGroupDialogOpen(false)
      setSelectedBulkGroups([])
      setBulkSearchResults({ inGroups: [], notInGroups: [] })
      setBulkSearchEmails("")
    } catch (error: any) {
      console.error("Error assigning groups:", error)
      setError(error.message || "Failed to assign groups.")
    } finally {
      setBulkAssigning(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
        <MainLayout>
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {/* Header Skeleton */}
            <div className="space-y-2 mb-6 animate-pulse">
              <div className="h-8 w-48 bg-gray-200 rounded" />
              <div className="h-4 w-64 bg-gray-200 rounded" />
            </div>

            {/* Filter Skeleton */}
            <div className="h-32 bg-gray-100 rounded-lg mb-6 animate-pulse" />

            {/* User Cards Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <UserCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </MainLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
      <MainLayout>
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Users Management</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                Manage all LinuxWorld users, their roles, and group assignments
              </p>
            </div>

            {/* Alerts */}
            {error && (
              <Alert variant="destructive" className="animate-in fade-in-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 animate-in fade-in-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                            <Card className="border-blue-200">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Total Users</p>
                      <p className="text-xl sm:text-2xl font-bold">{users.length}</p>
                    </div>
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-200">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Approved</p>
                      <p className="text-xl sm:text-2xl font-bold">{users.filter(u => u.isApproved).length}</p>
                    </div>
                    <div className="p-2 bg-green-100 rounded-full">
                      <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-orange-200">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Pending</p>
                      <p className="text-xl sm:text-2xl font-bold">{users.filter(u => !u.isApproved).length}</p>
                    </div>
                    <div className="p-2 bg-orange-100 rounded-full">
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-200">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Groups</p>
                      <p className="text-xl sm:text-2xl font-bold">{groups.length}</p>
                    </div>
                    <div className="p-2 bg-purple-100 rounded-full">
                      <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base sm:text-lg">Filters</CardTitle>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-8 px-2 text-xs"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Clear filters
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, email, or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-10"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className="w-full sm:w-40 h-10">
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

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-40 h-10">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {hasActiveFilters && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Filter className="h-4 w-4" />
                    <span>Showing {filteredUsers.length} of {users.length} users</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bulk Group Assignment Section */}
            <Card>
              <CardHeader>
                <CardTitle>Bulk Group Assignment</CardTitle>
                <CardDescription>
                  Search users by email and assign them to groups in bulk
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Input
                    placeholder="Enter emails separated by commas..."
                    value={bulkSearchEmails}
                    onChange={(e) => setBulkSearchEmails(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleBulkSearch}>
                    Search
                  </Button>
                </div>

                {(bulkSearchResults.inGroups.length > 0 || bulkSearchResults.notInGroups.length > 0) && (
                  <div className="space-y-6">
                    {/* Users in Groups Table */}
                    {bulkSearchResults.inGroups.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">Users in Groups ({bulkSearchResults.inGroups.length})</h4>
                        </div>
                        <div className="border rounded-lg overflow-hidden">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-gray-50 border-b">
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Groups</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {bulkSearchResults.inGroups.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                      <Avatar className="h-8 w-8">
                                        <AvatarImage src={user.profileImage || "/placeholder.svg"} />
                                        <AvatarFallback className="text-sm bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                          {user.name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="font-medium">{user.name}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                    {user.email}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <Badge className={`${getRoleColor(user.role)} border flex items-center gap-1`}>
                                      {getRoleIcon(user.role)}
                                      <span className="text-xs">{getRoleDisplayName(user.role)}</span>
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-1">
                                      {user.assignedGroups?.map(groupId => {
                                        const group = groups.find(g => g.id === groupId)
                                        return group ? (
                                          <Badge key={groupId} variant="outline" className="text-xs">
                                            {group.name}
                                          </Badge>
                                        ) : null
                                      })}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Users not in Groups Table */}
                    {bulkSearchResults.notInGroups.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">
                            Users not in Groups ({bulkSearchResults.notInGroups.length})
                          </h4>
                          <Button
                            size="sm"
                            onClick={() => setBulkGroupDialogOpen(true)}
                          >
                            Assign to Groups
                          </Button>
                        </div>
                        <div className="border rounded-lg overflow-hidden">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-gray-50 border-b">
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {bulkSearchResults.notInGroups.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                      <Avatar className="h-8 w-8">
                                        <AvatarImage src={user.profileImage || "/placeholder.svg"} />
                                        <AvatarFallback className="text-sm bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                          {user.name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="font-medium">{user.name}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                    {user.email}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <Badge className={`${getRoleColor(user.role)} border flex items-center gap-1`}>
                                      {getRoleIcon(user.role)}
                                      <span className="text-xs">{getRoleDisplayName(user.role)}</span>
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <Badge 
                                      variant={user.isApproved ? "default" : "secondary"}
                                      className={user.isApproved ? "bg-green-100 text-green-800" : ""}
                                    >
                                      {user.isApproved ? (
                                        <>
                                          <CheckCircle className="h-3 w-3 mr-1" />
                                          Approved
                                        </>
                                      ) : (
                                        <>
                                          <Clock className="h-3 w-3 mr-1" />
                                          Pending
                                        </>
                                      )}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Users List */}
            {filteredUsers.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Users Found</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-sm">
                    {searchTerm || roleFilter !== "all" || statusFilter !== "all"
                      ? "No users match your search criteria. Try adjusting your filters."
                      : "No users have been registered yet."}
                  </p>
                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      className="mt-4"
                    >
                      Clear filters
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Groups</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registration</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 group">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={user.profileImage || "/placeholder.svg"} />
                              <AvatarFallback className="text-base bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                {user.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{user.name}</p>
                                {user.id === currentUser?.id && (
                                  <Badge variant="secondary" className="text-xs">
                                    You
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                              {user.mobileNumber && (
                                <p className="text-sm text-muted-foreground">{user.mobileNumber}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge className={`${getRoleColor(user.role)} border flex items-center gap-1`}>
                            {getRoleIcon(user.role)}
                            <span className="text-xs">{getRoleDisplayName(user.role)}</span>
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge 
                            variant={user.isApproved ? "default" : "secondary"}
                            className={user.isApproved ? "bg-green-100 text-green-800" : ""}
                          >
                            {user.isApproved ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Approved
                              </>
                            ) : (
                              <>
                                <Clock className="h-3 w-3 mr-1" />
                                Pending
                              </>
                            )}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {user.assignedGroups && user.assignedGroups.length > 0 ? (
                              <>
                                {user.assignedGroups.slice(0, 3).map((groupId) => {
                                  const group = groups.find((g) => g.id === groupId)
                                  return group ? (
                                    <Badge 
                                      key={groupId} 
                                      variant="outline" 
                                      className="text-xs"
                                    >
                                      {group.name}
                                    </Badge>
                                  ) : null
                                })}
                                {user.assignedGroups.length > 3 && (
                                  <Badge 
                                    variant="outline" 
                                    className="text-xs"
                                  >
                                    +{user.assignedGroups.length - 3} more
                                  </Badge>
                                )}
                              </>
                            ) : (
                              <span className="text-sm text-muted-foreground">No groups</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                          {user.registrationDate instanceof Date
                            ? user.registrationDate.toLocaleDateString()
                            : "Unknown"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditUser(user)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                            {user.id !== currentUser?.id && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Edit User Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Manage User</DialogTitle>
                  <DialogDescription>
                    Update user role and group assignments for {selectedUser?.name}
                  </DialogDescription>
                </DialogHeader>

                {selectedUser && (
                  <div className="space-y-6 mt-4">
                    {/* User Info Summary */}
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={selectedUser.profileImage || "/placeholder.svg"} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                          {selectedUser.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{selectedUser.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                      </div>
                      <Badge className={`${getRoleColor(selectedUser.role)} border`}>
                        {getRoleIcon(selectedUser.role)}
                        <span className="ml-1">{getRoleDisplayName(selectedUser.role)}</span>
                      </Badge>
                    </div>

                    <Separator />

                    {/* Role Selection */}
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium mb-1">User Role</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          {currentUser?.role === "super_admin"
                            ? "As a Super Admin, you can assign any role"
                            : "As an Admin, you can assign Student and Group Admin roles"}
                        </p>
                      </div>
                      
                      <Tabs value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
                        <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full">
                          {getAvailableRoles().map((role) => (
                            <TabsTrigger
                              key={role}
                              value={role}
                              disabled={!canAssignRoles(currentUser?.role!, role)}
                              className="text-xs sm:text-sm"
                            >
                              <div className="flex items-center gap-1">
                                {getRoleIcon(role)}
                                <span className="hidden sm:inline">{getRoleDisplayName(role)}</span>
                                <span className="sm:hidden">{getRoleDisplayName(role).split(' ')[0]}</span>
                              </div>
                            </TabsTrigger>
                          ))}
                        </TabsList>
                      </Tabs>
                    </div>

                    {/* Group Assignment */}
                    {(selectedRole === "student" || selectedRole === "group_admin") && (
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium mb-1">Group Assignments</h4>
                          <p className="text-sm text-muted-foreground mb-3">
                            Select the groups this user should have access to
                          </p>
                        </div>

                        {groups.length === 0 ? (
                          <Card>
                            <CardContent className="flex flex-col items-center justify-center py-8">
                              <Building2 className="h-8 w-8 text-muted-foreground mb-2" />
                              <p className="text-sm text-muted-foreground">No groups available</p>
                            </CardContent>
                          </Card>
                        ) : (
                          <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {groups.map((group) => (
                                <label
                                  key={group.id}
                                  className="flex items-start space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors"
                                >
                                  <Checkbox
                                    id={`group-${group.id}`}
                                    checked={selectedGroups.includes(group.id)}
                                    onCheckedChange={(checked) =>
                                      handleGroupSelection(group.id, checked as boolean)
                                    }
                                    className="mt-0.5"
                                  />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium leading-none">
                                      {group.name}
                                    </p>
                                    {group.description && (
                                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                        {group.description}
                                      </p>
                                    )}
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">
                            {selectedGroups.length} group{selectedGroups.length !== 1 ? 's' : ''} selected
                          </span>
                          {selectedGroups.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedGroups([])}
                              className="h-auto p-1 text-xs"
                            >
                              Clear all
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                      <Button 
                        onClick={handleUpdateUser} 
                        disabled={updating} 
                        className="flex-1"
                      >
                        {updating ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Update User
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setDialogOpen(false)
                          setSelectedUser(null)
                          setSelectedGroups([])
                        }}
                        disabled={updating}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* Bulk Group Assignment Dialog */}
            <Dialog open={bulkGroupDialogOpen} onOpenChange={setBulkGroupDialogOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Assign Users to Groups</DialogTitle>
                  <DialogDescription>
                    Select groups to assign to {bulkSearchResults.notInGroups.length} users
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {groups.map((group) => (
                        <label
                          key={group.id}
                          className="flex items-start space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors"
                        >
                          <Checkbox
                            id={`bulk-group-${group.id}`}
                            checked={selectedBulkGroups.includes(group.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedBulkGroups(prev => [...prev, group.id])
                              } else {
                                setSelectedBulkGroups(prev => prev.filter(id => id !== group.id))
                              }
                            }}
                            className="mt-0.5"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium leading-none">
                              {group.name}
                            </p>
                            {group.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {group.description}
                              </p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">
                      {selectedBulkGroups.length} group{selectedBulkGroups.length !== 1 ? 's' : ''} selected
                    </span>
                    {selectedBulkGroups.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedBulkGroups([])}
                        className="h-auto p-1 text-xs"
                      >
                        Clear all
                      </Button>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button 
                      onClick={handleBulkGroupAssignment} 
                      disabled={bulkAssigning || selectedBulkGroups.length === 0} 
                      className="flex-1"
                    >
                      {bulkAssigning ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Assigning...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Assign to Selected Groups
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setBulkGroupDialogOpen(false)
                        setSelectedBulkGroups([])
                      }}
                      disabled={bulkAssigning}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
}
