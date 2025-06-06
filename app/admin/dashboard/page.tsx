"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getAnalytics, getAnnouncements, getGroups, getUsersByIds } from "@/lib/firebase-utils"
import { useAuth } from "@/contexts/auth-context"
import type { Announcement, Group } from "@/types"
import {
  Users,
  MessageSquare,
  BookOpen,
  TrendingUp,
  Clock,
  BarChart3,
  UserCheck,
  Calendar,
  Crown,
  Shield,
  UserCog,
  GraduationCap,
  File,
  Download,
} from "lucide-react"
import { Timestamp } from "firebase/firestore"

interface AnalyticsData {
  totalUsers: number
  approvedUsers: number
  pendingUsers: number
  totalGroups: number
  totalAnnouncements: number
  usersByRole: Record<string, number>
  recentUsers: number
  recentAnnouncements: number
}

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [announcementCreators, setAnnouncementCreators] = useState<{ [userId: string]: { name: string } }>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!user) return
    if (user.role !== "admin" && user.role !== "super_admin") return
    fetchData()
  }, [user])

  const fetchData = async () => {
    setLoading(true)
    setError("")
    try {
      const [analyticsData, announcementsData, groupsData] = await Promise.all([
        getAnalytics(),
        getAnnouncements(),
        getGroups(),
      ])
      setAnalytics(analyticsData as AnalyticsData)
      setAnnouncements(announcementsData)
      setGroups(groupsData)
      // Fetch creator user details
      const creatorIds = Array.from(new Set(announcementsData.map(a => a.createdBy)))
      if (creatorIds.length > 0) {
        const users = await getUsersByIds(creatorIds)
        const userMap: { [userId: string]: { name: string } } = {}
        users.forEach(u => { userMap[u.id] = { name: u.name } })
        setAnnouncementCreators(userMap)
      }
    } catch (err: any) {
      setError("Failed to load dashboard data: " + (err?.message || err))
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

  const formatDate = (date: Date | Timestamp) => {
    const dateObj = date instanceof Timestamp ? date.toDate() : new Date(date)
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
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

  if (error) {
    return (
      <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
        <MainLayout>
          <div className="text-center py-12">
            <p className="text-muted-foreground">{error}</p>
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

  return (
    <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
      <MainLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Welcome, {user?.name}. Here are your platform analytics and updates.</p>
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
                <p className="text-xs text-muted-foreground">{analytics.pendingUsers} pending approval</p>
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
                <CardTitle className="text-sm font-medium">Approved Users</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.approvedUsers}</div>
                <p className="text-xs text-muted-foreground">Active accounts</p>
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

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity (7 Days)
              </CardTitle>
              <CardDescription>Platform activity in the last week</CardDescription>
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
                  {analytics.recentUsers}
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
                  {analytics.recentAnnouncements}
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
                  {analytics.pendingUsers}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Announcements Section */}
          <div className="space-y-6 mt-8">
            <h2 className="text-xl font-semibold mb-4">All Announcements</h2>
            {announcements.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground">No announcements available.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {announcements.map((announcement) => (
                  <Card key={announcement.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>{announcement.title}</CardTitle>
                          <CardDescription>
                            Posted by {announcementCreators[announcement.createdBy]?.name || announcement.createdBy} on {formatDate(announcement.createdAt)}
                          </CardDescription>
                        </div>
                        <Badge variant="outline">{announcement.groupIds?.length ?? 0} Groups</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="prose prose-sm max-w-none">
                        <p className="whitespace-pre-wrap">{announcement.content}</p>
                      </div>
                      {announcement.files && announcement.files.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Attachments</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {announcement.files.map((file, index) => (
                              <div key={file.id || index} className="flex items-center gap-2 p-2 rounded-lg border bg-gray-50">
                                <File className="h-5 w-5 text-muted-foreground" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                                  <p className="text-xs text-gray-500">{file.size ? (file.size / 1024 / 1024).toFixed(2) : "-"} MB</p>
                                </div>
                                <button
                                  className="text-blue-600 hover:text-blue-700"
                                  onClick={() => window.open(file.url, "_blank")}
                                  title={file.isDownloadable ? "Download" : "View"}
                                >
                                  <Download className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {(announcement.groupIds ?? []).map((groupId) => {
                          const group = groups.find((g) => g.id === groupId)
                          return (
                            <Badge key={groupId} variant="secondary">
                              {group?.name || groupId}
                            </Badge>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
} 