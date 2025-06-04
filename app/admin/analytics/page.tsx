"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const [users, groups, announcements] = await Promise.all([getUsers(), getGroups(), getAnnouncements()])

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
    } finally {
      setLoading(false)
    }
  }

  const getRoleIcon = (role: string) => {
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-red-100 text-red-800"
      case "admin":
        return "bg-blue-100 text-blue-800"
      case "group_admin":
        return "bg-purple-100 text-purple-800"
      case "student":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
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
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </MainLayout>
      </ProtectedRoute>
    )
  }

  if (!analytics) {
    return (
      <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
        <MainLayout>
          <div className="text-center py-12">
            <p className="text-muted-foreground">Failed to load analytics data.</p>
          </div>
        </MainLayout>
      </ProtectedRoute>
    )
  }

  const growthPercentage = calculateGrowthPercentage(analytics.userGrowth.thisMonth, analytics.userGrowth.lastMonth)

  return (
    <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
      <MainLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">LinuxWorld Platform Analytics</h1>
            <p className="text-muted-foreground">Comprehensive insights into your LinuxWorld classroom platform</p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalUsers}</div>
                <p className="text-xs text-muted-foreground">{analytics.pendingApprovals} pending approval</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Groups</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalGroups}</div>
                <p className="text-xs text-muted-foreground">Learning communities</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Announcements</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalAnnouncements}</div>
                <p className="text-xs text-muted-foreground">Total messages sent</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">User Growth</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.userGrowth.thisMonth}</div>
                <p className="text-xs text-muted-foreground">
                  {growthPercentage >= 0 ? "+" : ""}
                  {growthPercentage}% from last month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* User Roles Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>User Roles Distribution</CardTitle>
              <CardDescription>Breakdown of users by their assigned roles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(analytics.usersByRole).map(([role, count]) => (
                  <div key={role} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getRoleIcon(role)}
                      <div>
                        <p className="font-medium">{getRoleDisplayName(role)}</p>
                        <p className="text-sm text-muted-foreground">{count} users</p>
                      </div>
                    </div>
                    <Badge className={getRoleColor(role)}>{Math.round((count / analytics.totalUsers) * 100)}%</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity & Top Groups */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Activity (30 Days)
                </CardTitle>
                <CardDescription>Platform activity in the last month</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <UserCheck className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">New User Registrations</p>
                      <p className="text-sm text-muted-foreground">Users who joined recently</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-lg font-bold">
                    {analytics.recentActivity.newUsers}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">New Announcements</p>
                      <p className="text-sm text-muted-foreground">Messages posted recently</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-lg font-bold">
                    {analytics.recentActivity.newAnnouncements}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium">Pending Approvals</p>
                      <p className="text-sm text-muted-foreground">Users awaiting approval</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-lg font-bold">
                    {analytics.pendingApprovals}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Top Groups */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Most Active Groups
                </CardTitle>
                <CardDescription>Groups with the highest member count</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.groupsWithMostMembers.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No groups created yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {analytics.groupsWithMostMembers.map((group, index) => (
                      <div key={group.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{group.name}</p>
                            <p className="text-sm text-muted-foreground truncate max-w-48">{group.description}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-lg font-bold">
                          {group.actualMemberCount} members
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Platform Health */}
          <Card>
            <CardHeader>
              <CardTitle>Platform Health Overview</CardTitle>
              <CardDescription>Key indicators of platform engagement and growth</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 border rounded-lg">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {Math.round(((analytics.totalUsers - analytics.pendingApprovals) / analytics.totalUsers) * 100)}%
                  </div>
                  <p className="text-sm font-medium">User Approval Rate</p>
                  <p className="text-xs text-muted-foreground mt-1">Approved vs Total Users</p>
                </div>

                <div className="text-center p-6 border rounded-lg">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {analytics.totalGroups > 0 ? Math.round(analytics.totalUsers / analytics.totalGroups) : 0}
                  </div>
                  <p className="text-sm font-medium">Avg Users per Group</p>
                  <p className="text-xs text-muted-foreground mt-1">Distribution efficiency</p>
                </div>

                <div className="text-center p-6 border rounded-lg">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {analytics.totalGroups > 0 ? Math.round(analytics.totalAnnouncements / analytics.totalGroups) : 0}
                  </div>
                  <p className="text-sm font-medium">Avg Announcements per Group</p>
                  <p className="text-xs text-muted-foreground mt-1">Communication activity</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
}
