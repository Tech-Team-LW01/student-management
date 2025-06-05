// "use client"

// import { useEffect, useState } from "react"
// import { ProtectedRoute } from "@/components/protected-route"
// import { MainLayout } from "@/components/layout/main-layout"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"
// import { getUsers, getGroups, getAnnouncements } from "@/lib/firebase-utils"
// import type { Group } from "@/types"
// import {
//   BarChart3,
//   Users,
//   BookOpen,
//   MessageSquare,
//   TrendingUp,
//   Calendar,
//   UserCheck,
//   Clock,
//   Crown,
//   Shield,
//   UserCog,
//   GraduationCap,
// } from "lucide-react"

// interface AnalyticsData {
//   totalUsers: number
//   totalGroups: number
//   totalAnnouncements: number
//   pendingApprovals: number
//   usersByRole: Record<string, number>
//   groupsWithMostMembers: Group[]
//   recentActivity: {
//     newUsers: number
//     newAnnouncements: number
//   }
//   userGrowth: {
//     thisMonth: number
//     lastMonth: number
//   }
// }

// export default function AnalyticsPage() {
//   const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
//   const [loading, setLoading] = useState(true)

//   useEffect(() => {
//     fetchAnalytics()
//   }, [])

//   const fetchAnalytics = async () => {
//     try {
//       const [users, groups, announcements] = await Promise.all([getUsers(), getGroups(), getAnnouncements()])

//       // Calculate user statistics
//       const usersByRole = users.reduce(
//         (acc, user) => {
//           acc[user.role] = (acc[user.role] || 0) + 1
//           return acc
//         },
//         {} as Record<string, number>,
//       )

//       // Calculate recent activity (last 30 days)
//       const thirtyDaysAgo = new Date()
//       thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

//       const recentUsers = users.filter((user) => {
//         const registrationDate =
//           user.registrationDate instanceof Date ? user.registrationDate : new Date(user.registrationDate)
//         return registrationDate >= thirtyDaysAgo
//       })

//       const recentAnnouncements = announcements.filter((announcement) => {
//         const createdDate =
//           announcement.createdAt instanceof Date ? announcement.createdAt : new Date(announcement.createdAt)
//         return createdDate >= thirtyDaysAgo
//       })

//       // Calculate user growth
//       const sixtyDaysAgo = new Date()
//       sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

//       const thisMonthUsers = users.filter((user) => {
//         const registrationDate =
//           user.registrationDate instanceof Date ? user.registrationDate : new Date(user.registrationDate)
//         return registrationDate >= thirtyDaysAgo
//       }).length

//       const lastMonthUsers = users.filter((user) => {
//         const registrationDate =
//           user.registrationDate instanceof Date ? user.registrationDate : new Date(user.registrationDate)
//         return registrationDate >= sixtyDaysAgo && registrationDate < thirtyDaysAgo
//       }).length

//       // Find groups with most members
//       const groupsWithMemberCount = groups
//         .map((group) => ({
//           ...group,
//           actualMemberCount: users.filter((user) => user.assignedGroups?.includes(group.id)).length,
//         }))
//         .sort((a, b) => b.actualMemberCount - a.actualMemberCount)

//       setAnalytics({
//         totalUsers: users.length,
//         totalGroups: groups.length,
//         totalAnnouncements: announcements.length,
//         pendingApprovals: users.filter((user) => !user.isApproved).length,
//         usersByRole,
//         groupsWithMostMembers: groupsWithMemberCount.slice(0, 5),
//         recentActivity: {
//           newUsers: recentUsers.length,
//           newAnnouncements: recentAnnouncements.length,
//         },
//         userGrowth: {
//           thisMonth: thisMonthUsers,
//           lastMonth: lastMonthUsers,
//         },
//       })
//     } catch (error) {
//       console.error("Error fetching analytics:", error)
//     } finally {
//       setLoading(false)
//     }
//   }

//   const getRoleIcon = (role: string) => {
//     switch (role) {
//       case "super_admin":
//         return <Crown className="h-4 w-4" />
//       case "admin":
//         return <Shield className="h-4 w-4" />
//       case "group_admin":
//         return <UserCog className="h-4 w-4" />
//       case "student":
//         return <GraduationCap className="h-4 w-4" />
//       default:
//         return <Users className="h-4 w-4" />
//     }
//   }

//   const getRoleColor = (role: string) => {
//     switch (role) {
//       case "super_admin":
//         return "bg-red-100 text-red-800"
//       case "admin":
//         return "bg-blue-100 text-blue-800"
//       case "group_admin":
//         return "bg-purple-100 text-purple-800"
//       case "student":
//         return "bg-green-100 text-green-800"
//       default:
//         return "bg-gray-100 text-gray-800"
//     }
//   }

//   const getRoleDisplayName = (role: string) => {
//     switch (role) {
//       case "super_admin":
//         return "Super Admins"
//       case "admin":
//         return "Admins"
//       case "group_admin":
//         return "Group Admins"
//       case "student":
//         return "Students"
//       default:
//         return "Unknown"
//     }
//   }

//   const calculateGrowthPercentage = (current: number, previous: number) => {
//     if (previous === 0) return current > 0 ? 100 : 0
//     return Math.round(((current - previous) / previous) * 100)
//   }

//   if (loading) {
//     return (
//       <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
//         <MainLayout>
//           <div className="flex items-center justify-center h-64">
//             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
//           </div>
//         </MainLayout>
//       </ProtectedRoute>
//     )
//   }

//   if (!analytics) {
//     return (
//       <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
//         <MainLayout>
//           <div className="text-center py-12">
//             <p className="text-muted-foreground">Failed to load analytics data.</p>
//           </div>
//         </MainLayout>
//       </ProtectedRoute>
//     )
//   }

//   const growthPercentage = calculateGrowthPercentage(analytics.userGrowth.thisMonth, analytics.userGrowth.lastMonth)

//   return (
//     <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
//       <MainLayout>
//         <div className="space-y-6">
//           {/* Header */}
//           <div>
//             <h1 className="text-3xl font-bold">LinuxWorld Platform Analytics</h1>
//             <p className="text-muted-foreground">Comprehensive insights into your LinuxWorld classroom platform</p>
//           </div>

//           {/* Key Metrics */}
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//             <Card>
//               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                 <CardTitle className="text-sm font-medium">Total Users</CardTitle>
//                 <Users className="h-4 w-4 text-muted-foreground" />
//               </CardHeader>
//               <CardContent>
//                 <div className="text-2xl font-bold">{analytics.totalUsers}</div>
//                 <p className="text-xs text-muted-foreground">{analytics.pendingApprovals} pending approval</p>
//               </CardContent>
//             </Card>

//             <Card>
//               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                 <CardTitle className="text-sm font-medium">Active Groups</CardTitle>
//                 <BookOpen className="h-4 w-4 text-muted-foreground" />
//               </CardHeader>
//               <CardContent>
//                 <div className="text-2xl font-bold">{analytics.totalGroups}</div>
//                 <p className="text-xs text-muted-foreground">Learning communities</p>
//               </CardContent>
//             </Card>

//             <Card>
//               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                 <CardTitle className="text-sm font-medium">Announcements</CardTitle>
//                 <MessageSquare className="h-4 w-4 text-muted-foreground" />
//               </CardHeader>
//               <CardContent>
//                 <div className="text-2xl font-bold">{analytics.totalAnnouncements}</div>
//                 <p className="text-xs text-muted-foreground">Total messages sent</p>
//               </CardContent>
//             </Card>

//             <Card>
//               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                 <CardTitle className="text-sm font-medium">User Growth</CardTitle>
//                 <TrendingUp className="h-4 w-4 text-muted-foreground" />
//               </CardHeader>
//               <CardContent>
//                 <div className="text-2xl font-bold">{analytics.userGrowth.thisMonth}</div>
//                 <p className="text-xs text-muted-foreground">
//                   {growthPercentage >= 0 ? "+" : ""}
//                   {growthPercentage}% from last month
//                 </p>
//               </CardContent>
//             </Card>
//           </div>

//           {/* User Roles Distribution */}
//           <Card>
//             <CardHeader>
//               <CardTitle>User Roles Distribution</CardTitle>
//               <CardDescription>Breakdown of users by their assigned roles</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//                 {Object.entries(analytics.usersByRole).map(([role, count]) => (
//                   <div key={role} className="flex items-center justify-between p-4 border rounded-lg">
//                     <div className="flex items-center gap-3">
//                       {getRoleIcon(role)}
//                       <div>
//                         <p className="font-medium">{getRoleDisplayName(role)}</p>
//                         <p className="text-sm text-muted-foreground">{count} users</p>
//                       </div>
//                     </div>
//                     <Badge className={getRoleColor(role)}>{Math.round((count / analytics.totalUsers) * 100)}%</Badge>
//                   </div>
//                 ))}
//               </div>
//             </CardContent>
//           </Card>

//           {/* Recent Activity & Top Groups */}
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//             {/* Recent Activity */}
//             <Card>
//               <CardHeader>
//                 <CardTitle className="flex items-center gap-2">
//                   <Clock className="h-5 w-5" />
//                   Recent Activity (30 Days)
//                 </CardTitle>
//                 <CardDescription>Platform activity in the last month</CardDescription>
//               </CardHeader>
//               <CardContent className="space-y-4">
//                 <div className="flex items-center justify-between p-4 border rounded-lg">
//                   <div className="flex items-center gap-3">
//                     <UserCheck className="h-5 w-5 text-green-600" />
//                     <div>
//                       <p className="font-medium">New User Registrations</p>
//                       <p className="text-sm text-muted-foreground">Users who joined recently</p>
//                     </div>
//                   </div>
//                   <Badge variant="outline" className="text-lg font-bold">
//                     {analytics.recentActivity.newUsers}
//                   </Badge>
//                 </div>

//                 <div className="flex items-center justify-between p-4 border rounded-lg">
//                   <div className="flex items-center gap-3">
//                     <MessageSquare className="h-5 w-5 text-blue-600" />
//                     <div>
//                       <p className="font-medium">New Announcements</p>
//                       <p className="text-sm text-muted-foreground">Messages posted recently</p>
//                     </div>
//                   </div>
//                   <Badge variant="outline" className="text-lg font-bold">
//                     {analytics.recentActivity.newAnnouncements}
//                   </Badge>
//                 </div>

//                 <div className="flex items-center justify-between p-4 border rounded-lg">
//                   <div className="flex items-center gap-3">
//                     <Calendar className="h-5 w-5 text-purple-600" />
//                     <div>
//                       <p className="font-medium">Pending Approvals</p>
//                       <p className="text-sm text-muted-foreground">Users awaiting approval</p>
//                     </div>
//                   </div>
//                   <Badge variant="outline" className="text-lg font-bold">
//                     {analytics.pendingApprovals}
//                   </Badge>
//                 </div>
//               </CardContent>
//             </Card>

//             {/* Top Groups */}
//             <Card>
//               <CardHeader>
//                 <CardTitle className="flex items-center gap-2">
//                   <BarChart3 className="h-5 w-5" />
//                   Most Active Groups
//                 </CardTitle>
//                 <CardDescription>Groups with the highest member count</CardDescription>
//               </CardHeader>
//               <CardContent>
//                 {analytics.groupsWithMostMembers.length === 0 ? (
//                   <div className="text-center py-8">
//                     <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
//                     <p className="text-muted-foreground">No groups created yet</p>
//                   </div>
//                 ) : (
//                   <div className="space-y-4">
//                     {analytics.groupsWithMostMembers.map((group, index) => (
//                       <div key={group.id} className="flex items-center justify-between p-4 border rounded-lg">
//                         <div className="flex items-center gap-3">
//                           <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-bold text-sm">
//                             {index + 1}
//                           </div>
//                           <div>
//                             <p className="font-medium">{group.name}</p>
//                             <p className="text-sm text-muted-foreground truncate max-w-48">{group.description}</p>
//                           </div>
//                         </div>
//                         <Badge variant="outline" className="text-lg font-bold">
//                           {group.actualMemberCount} members
//                         </Badge>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
//           </div>

//           {/* Platform Health */}
//           <Card>
//             <CardHeader>
//               <CardTitle>Platform Health Overview</CardTitle>
//               <CardDescription>Key indicators of platform engagement and growth</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                 <div className="text-center p-6 border rounded-lg">
//                   <div className="text-3xl font-bold text-green-600 mb-2">
//                     {Math.round(((analytics.totalUsers - analytics.pendingApprovals) / analytics.totalUsers) * 100)}%
//                   </div>
//                   <p className="text-sm font-medium">User Approval Rate</p>
//                   <p className="text-xs text-muted-foreground mt-1">Approved vs Total Users</p>
//                 </div>

//                 <div className="text-center p-6 border rounded-lg">
//                   <div className="text-3xl font-bold text-blue-600 mb-2">
//                     {analytics.totalGroups > 0 ? Math.round(analytics.totalUsers / analytics.totalGroups) : 0}
//                   </div>
//                   <p className="text-sm font-medium">Avg Users per Group</p>
//                   <p className="text-xs text-muted-foreground mt-1">Distribution efficiency</p>
//                 </div>

//                 <div className="text-center p-6 border rounded-lg">
//                   <div className="text-3xl font-bold text-purple-600 mb-2">
//                     {analytics.totalGroups > 0 ? Math.round(analytics.totalAnnouncements / analytics.totalGroups) : 0}
//                   </div>
//                   <p className="text-sm font-medium">Avg Announcements per Group</p>
//                   <p className="text-xs text-muted-foreground mt-1">Communication activity</p>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         </div>
//       </MainLayout>
//     </ProtectedRoute>
//   )
// }












"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getUsers, getGroups, getAnnouncements } from "@/lib/firebase-utils"
import type { Group } from "@/types"
import {
  BarChart3,
  Users,
  BookOpen,
  MessageSquare,
  TrendingUp,
  Calendar,
  UserCheck,
  Clock,
  Crown,
  Shield,
  UserCog,
  GraduationCap,
  Activity,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"

interface AnalyticsData {
  totalUsers: number
  totalGroups: number
  totalAnnouncements: number
  pendingApprovals: number
  usersByRole: Record<string, number>
  groupsWithMostMembers: Group[]
  recentActivity: {
    newUsers: number
    newAnnouncements: number
  }
  userGrowth: {
    thisMonth: number
    lastMonth: number
  }
}

// Skeleton loader component
const SkeletonCard = () => (
  <Card className="animate-pulse">
    <CardHeader className="space-y-2">
      <div className="h-4 w-24 bg-gray-200 rounded" />
      <div className="h-8 w-16 bg-gray-200 rounded" />
    </CardHeader>
  </Card>
)

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      setError(null)
      const [users, groups, announcements] = await Promise.all([
        getUsers(),
        getGroups(),
        getAnnouncements(),
      ])

      // Calculate user statistics
      const usersByRole = users.reduce(
        (acc, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

      // Calculate recent activity (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const recentUsers = users.filter((user) => {
        const registrationDate =
          user.registrationDate instanceof Date ? user.registrationDate : new Date(user.registrationDate)
        return registrationDate >= thirtyDaysAgo
      })

      const recentAnnouncements = announcements.filter((announcement) => {
        const createdDate =
          announcement.createdAt instanceof Date ? announcement.createdAt : new Date(announcement.createdAt)
        return createdDate >= thirtyDaysAgo
      })

      // Calculate user growth
      const sixtyDaysAgo = new Date()
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

      const thisMonthUsers = users.filter((user) => {
        const registrationDate =
          user.registrationDate instanceof Date ? user.registrationDate : new Date(user.registrationDate)
        return registrationDate >= thirtyDaysAgo
      }).length

      const lastMonthUsers = users.filter((user) => {
        const registrationDate =
          user.registrationDate instanceof Date ? user.registrationDate : new Date(user.registrationDate)
        return registrationDate >= sixtyDaysAgo && registrationDate < thirtyDaysAgo
      }).length

      // Find groups with most members
      const groupsWithMemberCount = groups
        .map((group) => ({
          ...group,
          actualMemberCount: users.filter((user) => user.assignedGroups?.includes(group.id)).length,
        }))
        .sort((a, b) => b.actualMemberCount - a.actualMemberCount)

      setAnalytics({
        totalUsers: users.length,
        totalGroups: groups.length,
        totalAnnouncements: announcements.length,
        pendingApprovals: users.filter((user) => !user.isApproved).length,
        usersByRole,
        groupsWithMostMembers: groupsWithMemberCount.slice(0, 5),
        recentActivity: {
          newUsers: recentUsers.length,
          newAnnouncements: recentAnnouncements.length,
        },
        userGrowth: {
          thisMonth: thisMonthUsers,
          lastMonth: lastMonthUsers,
        },
      })
    } catch (error) {
      console.error("Error fetching analytics:", error)
      setError("Failed to load analytics data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const getRoleIcon = (role: string) => {
    const iconClass = "h-4 w-4 sm:h-5 sm:w-5"
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

  const getRoleColor = (role: string) => {
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

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "super_admin":
        return "Super Admins"
      case "admin":
        return "Admins"
      case "group_admin":
        return "Group Admins"
      case "student":
        return "Students"
      default:
        return "Unknown"
    }
  }

  const calculateGrowthPercentage = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
        <MainLayout>
          <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Header Skeleton */}
            <div className="space-y-2 animate-pulse">
              <div className="h-8 w-48 bg-gray-200 rounded" />
              <div className="h-4 w-64 bg-gray-200 rounded" />
            </div>

            {/* Metrics Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(4)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>

            {/* Content Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        </MainLayout>
      </ProtectedRoute>
    )
  }

  if (error || !analytics) {
    return (
      <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
        <MainLayout>
          <div className="min-h-[60vh] flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="p-3 bg-red-100 text-red-600 rounded-full">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">Error Loading Analytics</h3>
                    <p className="text-sm text-muted-foreground">
                      {error || "Failed to load analytics data."}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setLoading(true)
                      fetchAnalytics()
                    }}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </MainLayout>
      </ProtectedRoute>
    )
  }

  const growthPercentage = calculateGrowthPercentage(analytics.userGrowth.thisMonth, analytics.userGrowth.lastMonth)

  return (
    <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
      <MainLayout>
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <div className="space-y-6 sm:space-y-8">
            {/* Header */}
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Platform Analytics</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Comprehensive insights into your LinuxWorld classroom
              </p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalUsers}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {analytics.pendingApprovals > 0 && (
                      <span className="text-orange-600 font-medium">
                        {analytics.pendingApprovals} pending approval
                      </span>
                    )}
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Groups</CardTitle>
                  <div className="p-2 bg-purple-100 rounded-full">
                    <BookOpen className="h-4 w-4 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalGroups}</div>
                  <p className="text-xs text-muted-foreground mt-1">Learning communities</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Announcements</CardTitle>
                  <div className="p-2 bg-green-100 rounded-full">
                    <MessageSquare className="h-4 w-4 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.totalAnnouncements}</div>
                  <p className="text-xs text-muted-foreground mt-1">Total messages sent</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">User Growth</CardTitle>
                  <div className={`p-2 rounded-full ${growthPercentage >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                    {growthPercentage >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.userGrowth.thisMonth}</div>
                  <div className="flex items-center gap-1 mt-1">
                    {growthPercentage >= 0 ? (
                      <ArrowUpRight className="h-3 w-3 text-green-600" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-red-600" />
                    )}
                    <p className={`text-xs font-medium ${
                      growthPercentage >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                                            {Math.abs(growthPercentage)}% from last month
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs for Better Mobile Experience */}
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="groups">Groups</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                {/* Platform Health */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Platform Health
                    </CardTitle>
                    <CardDescription>Key indicators of platform engagement</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>User Approval Rate</span>
                          <span className="font-medium">
                            {Math.round(((analytics.totalUsers - analytics.pendingApprovals) / analytics.totalUsers) * 100)}%
                          </span>
                        </div>
                        <Progress 
                          value={((analytics.totalUsers - analytics.pendingApprovals) / analytics.totalUsers) * 100} 
                          className="h-2"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Avg Users/Group</span>
                          <span className="font-medium">
                            {analytics.totalGroups > 0 ? Math.round(analytics.totalUsers / analytics.totalGroups) : 0}
                          </span>
                        </div>
                        <Progress 
                          value={analytics.totalGroups > 0 ? Math.min((analytics.totalUsers / analytics.totalGroups) * 10, 100) : 0} 
                          className="h-2"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Communication Activity</span>
                          <span className="font-medium">
                            {analytics.totalGroups > 0 ? Math.round(analytics.totalAnnouncements / analytics.totalGroups) : 0}
                          </span>
                        </div>
                        <Progress 
                          value={analytics.totalGroups > 0 ? Math.min((analytics.totalAnnouncements / analytics.totalGroups) * 5, 100) : 0} 
                          className="h-2"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Card className="text-center p-4">
                    <UserCheck className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <p className="text-2xl font-bold">{analytics.recentActivity.newUsers}</p>
                    <p className="text-xs text-muted-foreground">New Users (30d)</p>
                  </Card>
                  
                  <Card className="text-center p-4">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <p className="text-2xl font-bold">{analytics.recentActivity.newAnnouncements}</p>
                    <p className="text-xs text-muted-foreground">New Messages (30d)</p>
                  </Card>
                  
                  <Card className="text-center p-4">
                    <Clock className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                    <p className="text-2xl font-bold">{analytics.pendingApprovals}</p>
                    <p className="text-xs text-muted-foreground">Pending Approvals</p>
                  </Card>
                  
                  <Card className="text-center p-4">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <p className="text-2xl font-bold">
                      {analytics.totalUsers > 0 ? Math.round((analytics.recentActivity.newUsers / analytics.totalUsers) * 100) : 0}%
                    </p>
                    <p className="text-xs text-muted-foreground">Growth Rate</p>
                  </Card>
                </div>
              </TabsContent>

              {/* Users Tab */}
              <TabsContent value="users" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>User Distribution by Role</CardTitle>
                    <CardDescription>Breakdown of users across different roles</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(analytics.usersByRole).map(([role, count]) => {
                        const percentage = Math.round((count / analytics.totalUsers) * 100)
                        return (
                          <div key={role} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {getRoleIcon(role)}
                                <span className="font-medium text-sm sm:text-base">
                                  {getRoleDisplayName(role)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{count} users</span>
                                <Badge variant="outline" className={`${getRoleColor(role)} border`}>
                                  {percentage}%
                                </Badge>
                              </div>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* User Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Registration Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">This Month</span>
                          <span className="font-bold">{analytics.userGrowth.thisMonth}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Last Month</span>
                          <span className="font-bold">{analytics.userGrowth.lastMonth}</span>
                        </div>
                        <div className="pt-2 border-t">
                          <div className="flex items-center gap-2">
                            {growthPercentage >= 0 ? (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : (
                              <ArrowDownRight className="h-4 w-4 text-red-600" />
                            )}
                            <span className={`text-sm font-medium ${
                              growthPercentage >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {Math.abs(growthPercentage)}% {growthPercentage >= 0 ? 'increase' : 'decrease'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Approval Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Approved Users</span>
                          <span className="font-bold text-green-600">
                            {analytics.totalUsers - analytics.pendingApprovals}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Pending Approval</span>
                          <span className="font-bold text-orange-600">{analytics.pendingApprovals}</span>
                        </div>
                        <Progress 
                          value={((analytics.totalUsers - analytics.pendingApprovals) / analytics.totalUsers) * 100} 
                          className="h-2 mt-2"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Groups Tab */}
              <TabsContent value="groups" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Top Groups by Members
                    </CardTitle>
                    <CardDescription>Most populated learning communities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analytics.groupsWithMostMembers.length === 0 ? (
                      <div className="text-center py-8">
                        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No groups created yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {analytics.groupsWithMostMembers.map((group, index) => (
                          <div
                            key={group.id}
                            className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                          >
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm
                              ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                                index === 1 ? 'bg-gray-100 text-gray-700' : 
                                index === 2 ? 'bg-orange-100 text-orange-700' : 
                                'bg-blue-100 text-blue-700'}`}>
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{group.name}</p>
                              <p className="text-sm text-muted-foreground truncate">
                                {group.description}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">{group.actualMemberCount}</p>
                              <p className="text-xs text-muted-foreground">members</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Group Statistics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card className="text-center p-4">
                    <p className="text-3xl font-bold text-blue-600">
                      {analytics.totalGroups > 0 ? Math.round(analytics.totalUsers / analytics.totalGroups) : 0}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">Avg Members per Group</p>
                  </Card>
                  
                  <Card className="text-center p-4">
                    <p className="text-3xl font-bold text-green-600">
                      {analytics.groupsWithMostMembers[0]?.actualMemberCount || 0}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">Largest Group Size</p>
                  </Card>
                  
                  <Card className="text-center p-4">
                    <p className="text-3xl font-bold text-purple-600">
                      {analytics.totalGroups > 0 ? Math.round(analytics.totalAnnouncements / analytics.totalGroups) : 0}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">Avg Announcements</p>
                  </Card>
                </div>
              </TabsContent>

              {/* Activity Tab */}
              <TabsContent value="activity" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Recent Activity (Last 30 Days)
                    </CardTitle>
                    <CardDescription>Platform activity overview</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-full">
                            <UserCheck className="h-5 w-5 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">New Registrations</p>
                            <p className="text-sm text-muted-foreground">Users joined recently</p>
                          </div>
                        </div>
                        <p className="text-3xl font-bold">{analytics.recentActivity.newUsers}</p>
                        <Progress 
                          value={(analytics.recentActivity.newUsers / analytics.totalUsers) * 100} 
                          className="h-2"
                        />
                      </div>

                      <div className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-full">
                            <MessageSquare className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">New Announcements</p>
                            <p className="text-sm text-muted-foreground">Messages posted</p>
                          </div>
                        </div>
                        <p className="text-3xl font-bold">{analytics.recentActivity.newAnnouncements}</p>
                        <Progress 
                          value={Math.min((analytics.recentActivity.newAnnouncements / analytics.totalAnnouncements) * 100, 100)} 
                          className="h-2"                        />
                      </div>
                    </div>

                    {/* Activity Timeline */}
                    <div className="mt-6">
                      <h4 className="font-medium mb-4">Activity Timeline</h4>
                      <div className="space-y-4">
                        <div className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-3 bg-green-600 rounded-full" />
                            <div className="w-0.5 h-full bg-gray-200" />
                          </div>
                          <div className="flex-1 pb-4">
                            <p className="font-medium text-sm">User Registration Spike</p>
                            <p className="text-xs text-muted-foreground">
                              {analytics.recentActivity.newUsers} new users joined in the last 30 days
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-3 bg-blue-600 rounded-full" />
                            <div className="w-0.5 h-full bg-gray-200" />
                          </div>
                          <div className="flex-1 pb-4">
                            <p className="font-medium text-sm">Communication Activity</p>
                            <p className="text-xs text-muted-foreground">
                              {analytics.recentActivity.newAnnouncements} announcements posted
                            </p>
                          </div>
                        </div>

                        {analytics.pendingApprovals > 0 && (
                          <div className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className="w-3 h-3 bg-orange-600 rounded-full" />
                              <div className="w-0.5 h-full bg-transparent" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">Pending Actions</p>
                              <p className="text-xs text-muted-foreground">
                                {analytics.pendingApprovals} users awaiting approval
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Engagement Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Engagement Metrics</CardTitle>
                    <CardDescription>Platform usage and interaction rates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Active User Rate</span>
                            <span className="text-sm text-muted-foreground">
                              {Math.round((analytics.recentActivity.newUsers / analytics.totalUsers) * 100)}%
                            </span>
                          </div>
                          <Progress 
                            value={(analytics.recentActivity.newUsers / analytics.totalUsers) * 100} 
                            className="h-2"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Message Engagement</span>
                            <span className="text-sm text-muted-foreground">
                              {Math.round((analytics.recentActivity.newAnnouncements / analytics.totalAnnouncements) * 100)}%
                            </span>
                          </div>
                          <Progress 
                            value={(analytics.recentActivity.newAnnouncements / analytics.totalAnnouncements) * 100} 
                            className="h-2"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Group Utilization</span>
                            <span className="text-sm text-muted-foreground">
                              {analytics.totalGroups > 0 ? Math.round((analytics.groupsWithMostMembers.filter(g => g.actualMemberCount > 0).length / analytics.totalGroups) * 100) : 0}%
                            </span>
                          </div>
                          <Progress 
                            value={analytics.totalGroups > 0 ? (analytics.groupsWithMostMembers.filter(g => g.actualMemberCount > 0).length / analytics.totalGroups) * 100 : 0} 
                            className="h-2"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Approval Efficiency</span>
                            <span className="text-sm text-muted-foreground">
                              {Math.round(((analytics.totalUsers - analytics.pendingApprovals) / analytics.totalUsers) * 100)}%
                            </span>
                          </div>
                          <Progress 
                            value={((analytics.totalUsers - analytics.pendingApprovals) / analytics.totalUsers) * 100} 
                            className="h-2"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Summary Cards - Always Visible */}
            <div className="mt-8">
              <h2 className="text-lg font-semibold mb-4">Quick Actions & Insights</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {analytics.pendingApprovals > 0 && (
                  <Card className="bg-orange-50 border-orange-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-full">
                          <AlertCircle className="h-5 w-5 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">Action Required</p>
                          <p className="text-xs text-muted-foreground">
                            {analytics.pendingApprovals} users pending approval
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">Growth Status</p>
                        <p className="text-xs text-muted-foreground">
                          {growthPercentage >= 0 ? '+' : ''}{growthPercentage}% user growth
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-full">
                        <Activity className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">Platform Health</p>
                        <p className="text-xs text-muted-foreground">
                          {((analytics.totalUsers - analytics.pendingApprovals) / analytics.totalUsers * 100).toFixed(0)}% active users
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
}
