"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getAnnouncements, getUserGroups, markAnnouncementAsViewed } from "@/lib/firebase-utils"
import { useAuth } from "@/contexts/auth-context"
import type { Announcement, Group } from "@/types"
import { Users, MessageSquare, BookOpen, Calendar, Search, Download, Clock, ImageIcon, File, Video } from "lucide-react"

export default function DashboardPage() {
  const { user } = useAuth()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([])
  const [userGroups, setUserGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  useEffect(() => {
    // Filter announcements based on search query
    if (!searchQuery.trim()) {
      setFilteredAnnouncements(announcements)
    } else {
      const filtered = announcements.filter((announcement) => {
        const groupName = userGroups.find((g) => g.id === announcement.groupId)?.name || ""
        return (
          announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          announcement.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          groupName.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })
      setFilteredAnnouncements(filtered)
    }
  }, [searchQuery, announcements, userGroups])

  const fetchData = async () => {
    if (!user) return

    try {
      // Get user's groups first
      const groups = await getUserGroups(user.assignedGroups || [])
      setUserGroups(groups)

      // Get announcements for user's groups
      const groupIds = user.assignedGroups || []
      const announcementsData = await getAnnouncements(groupIds)
      setAnnouncements(announcementsData)

      // Mark announcements as viewed by this user (for students)
      if (user.role === "student" && announcementsData.length > 0) {
        // Mark the latest announcements as viewed (limit to prevent too many calls)
        const recentAnnouncements = announcementsData.slice(0, 10)
        for (const announcement of recentAnnouncements) {
          if (!announcement.viewedBy?.includes(user.id)) {
            await markAnnouncementAsViewed(announcement.id, user.id)
          }
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <ImageIcon className="h-4 w-4" />
    if (fileType.startsWith("video/")) return <Video className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const formatTime = (date: Date | string | { toDate: () => Date }) => {
    let d: Date
    if (typeof date === "object" && date !== null && typeof (date as any).toDate === "function") {
      d = (date as any).toDate()
    } else if (date instanceof Date) {
      d = date
    } else if (typeof date === "string" || typeof date === "number" || date instanceof Date) {
      d = new Date(date as string | number | Date)
    } else {
      throw new Error("Invalid date format")
    }
    const now = new Date()
    const diffInHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60)
  
    if (diffInHours < 24) {
      return d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    } else if (diffInHours < 168) {
      // Less than a week
      return d.toLocaleDateString("en-US", { weekday: "short" })
    } else {
      return d.toLocaleString("en-US", {
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    }
  }

  const formatFullDateTime = (date: Date | string | { toDate: () => Date }) => {
    let d: Date
    if (typeof date === "object" && date !== null && typeof (date as any).toDate === "function") {
      d = (date as any).toDate()
    } else if (date instanceof Date) {
      d = date
    } else if (typeof date === "string" || typeof date === "number") {
      d = new Date(date)
    } else {
      throw new Error("Invalid date format")
    }
    return d.toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["student", "group_admin", "admin", "super_admin"]}>
        <MainLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </MainLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["student", "group_admin", "admin", "super_admin"]}>
      <MainLayout>
        <div className="space-y-6">
          {/* Welcome Header */}
          <div className="bg-gradient-to-r from-[#520000] via-[#710000] via-[#a50000] to-[#ce0000] text-white rounded-lg p-6">
            <h1 className="text-3xl font-bold mb-2">Welcome to LinuxWorld, {user?.name}!</h1>
            <p className="text-blue-100">Stay updated with the latest announcements and course materials.</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Groups</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userGroups.length}</div>
                <p className="text-xs text-muted-foreground">Active enrollments</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Announcements</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{announcements.length}</div>
                <p className="text-xs text-muted-foreground">Total messages</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Course Materials</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {announcements.reduce((total, announcement) => total + announcement.files.length, 0)}
                </div>
                <p className="text-xs text-muted-foreground">Available files</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Last Activity</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {announcements.length > 0 ? formatTime(announcements[0].createdAt) : "N/A"}
                </div>
                <p className="text-xs text-muted-foreground">Latest announcement</p>
              </CardContent>
            </Card>
          </div>

          {/* Announcements Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Recent Announcements</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search announcements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>

            {filteredAnnouncements.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  {searchQuery ? (
                    <>
                      <Search className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No matching announcements found</h3>
                      <p className="text-muted-foreground text-center">
                        No announcements match "{searchQuery}". Try a different search term.
                      </p>
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No announcements yet</h3>
                      <p className="text-muted-foreground text-center">
                        {userGroups.length === 0
                          ? "You're not enrolled in any groups yet. Contact your administrator to get assigned to groups."
                          : "Your instructors haven't posted any announcements yet. Check back later for updates."}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredAnnouncements.map((announcement) => (
                  <Card key={announcement.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary">
                              {userGroups.find((g) => g.id === announcement.groupId)?.name || "Unknown Group"}
                            </Badge>
                            <span className="text-sm text-muted-foreground">•</span>
                            <span
                              className="text-sm text-muted-foreground"
                              title={formatFullDateTime(announcement.createdAt)}
                            >
                              {formatFullDateTime(announcement.createdAt)}
                            </span>
                          </div>
                          <CardTitle className="text-lg">{announcement.title}</CardTitle>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{formatTime(announcement.createdAt)}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{announcement.content}</p>

                      {/* File Attachments */}
                      {announcement.files.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-muted-foreground">Attachments</h4>
                          <div className="grid gap-2">
                            {announcement.files.map((file) => (
                              <div
                                key={file.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                              >
                                <div className="flex items-center gap-2">
                                  {getFileIcon(file.type)}
                                  <span>{file.name}</span>
                                </div>
                                <Button variant="ghost">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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
