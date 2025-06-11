







"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Users, 
  FileText, 
  Image, 
  Video, 
  Music, 
  Link, 
  BookOpen, 
  MessageSquare, 
  Calendar, 
  Search, 
  Download, 
  ChevronDown, 
  ChevronRight, 
  Paperclip, 
  ExternalLink,
  ImageIcon,
  File,
  Archive,
  Play,
  Pause,
  Volume2
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { getAnnouncements, getGroups, getStudentsByGroupId, getUsersByIds, getUsers } from "@/lib/firebase-utils"
import type { Announcement, Group, User } from "@/types"
import { Timestamp } from "firebase/firestore"
import { Progress } from "@/components/ui/progress"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)
  const [groupMembers, setGroupMembers] = useState<{ [key: string]: User[] }>({})
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false)
  const [membersLoading, setMembersLoading] = useState(false)
  const [announcementCreators, setAnnouncementCreators] = useState<{ [userId: string]: User }>({})
  const [expandedAttachments, setExpandedAttachments] = useState<Set<string>>(new Set())
  
  // Analytics state
  const [analytics, setAnalytics] = useState({
    totalAnnouncements: 0,
    totalGroups: 0,
    newAnnouncements: 0,
    totalFiles: 0,
  })

  useEffect(() => {
    if (user?.role === "admin" || user?.role === "super_admin") {
      router.replace("/admin/dashboard")
    }
  }, [user, router])

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredAnnouncements(announcements)
    } else {
      const filtered = announcements.filter((announcement) => {
        const creatorName = announcementCreators[announcement.createdBy]?.name || ""
        return (
          announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          announcement.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          creatorName.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })
      setFilteredAnnouncements(filtered)
    }
  }, [searchQuery, announcements, announcementCreators])

  const fetchData = async () => {
    if (!user) return
    setError("")
    setLoading(true)
    try {
      const [announcementsData, groupsData] = await Promise.all([
        getAnnouncements(),
        getGroups(),
      ])
      setGroups(groupsData)
      
      // For admins, show all announcements. For students, filter by assignedGroups.
      let filteredAnnouncements: Announcement[] = []
      let userGroups: Group[] = []
      if (user.role === "super_admin" || user.role === "admin") {
        filteredAnnouncements = announcementsData
        userGroups = groupsData
      } else {
        userGroups = groupsData.filter((group) => user.assignedGroups?.includes(group.id))
        filteredAnnouncements = announcementsData.filter((announcement) =>
          (announcement.groupIds ?? []).some((groupId) => user.assignedGroups?.includes(groupId))
        )
      }
      
      // Sort announcements by date (newest first)
      const sortedAnnouncements = filteredAnnouncements.sort((a, b) => {
        const dateA = a.createdAt instanceof Timestamp ? a.createdAt.toDate() : new Date(a.createdAt)
        const dateB = b.createdAt instanceof Timestamp ? b.createdAt.toDate() : new Date(b.createdAt)
        return dateB.getTime() - dateA.getTime()
      })
      
      setAnnouncements(sortedAnnouncements)
      
      // Fetch all unique creator user IDs
      const creatorIds = Array.from(new Set(sortedAnnouncements.map(a => a.createdBy)))
      if (creatorIds.length > 0) {
        const users = await getUsersByIds(creatorIds)
        const userMap: { [userId: string]: User } = {}
        users.forEach(u => { userMap[u.id] = u })
        setAnnouncementCreators(userMap)
      }
      
      // Analytics
      const now = new Date()
      const sevenDaysAgo = new Date(now)
      sevenDaysAgo.setDate(now.getDate() - 7)
      const newAnnouncements = sortedAnnouncements.filter(a => {
        const createdAt = a.createdAt instanceof Timestamp ? a.createdAt.toDate() : new Date(a.createdAt)
        return createdAt >= sevenDaysAgo
      }).length
      
      const totalFiles = sortedAnnouncements.reduce((total, announcement) => 
        total + (announcement.files?.length || 0), 0
      )
      
      setAnalytics({
        totalAnnouncements: sortedAnnouncements.length,
        totalGroups: userGroups.length,
        newAnnouncements,
        totalFiles,
      })
    } catch (err: any) {
      console.error("Dashboard fetch error:", err)
      setError("Failed to load data: " + (err?.message || err))
    } finally {
      setLoading(false)
    }
  }

  const toggleAttachments = (announcementId: string) => {
    setExpandedAttachments(prev => {
      const newSet = new Set(prev)
      if (newSet.has(announcementId)) {
        newSet.delete(announcementId)
      } else {
        newSet.add(announcementId)
      }
      return newSet
    })
  }

  const handleViewMembers = async (announcement: Announcement) => {
    setSelectedAnnouncement(announcement)
    setIsMembersDialogOpen(true)
    setMembersLoading(true)

    try {
      const membersPromises = announcement.groupIds.map(async (groupId) => {
        if (!groupMembers[groupId]) {
          const members = await getStudentsByGroupId(groupId)
          setGroupMembers((prev) => ({ ...prev, [groupId]: members }))
          return members
        }
        return groupMembers[groupId]
      })

      await Promise.all(membersPromises)
    } catch (error) {
      console.error("Error fetching group members:", error)
    } finally {
      setMembersLoading(false)
    }
  }

  const getFileIcon = (fileType: string, className: string = "h-4 w-4") => {
    const type = fileType.toLowerCase()
    if (type.startsWith("image/")) return <ImageIcon className={className} />
    if (type.startsWith("video/")) return <Video className={className} />
    if (type.startsWith("audio/")) return <Music className={className} />
    if (type.includes("pdf")) return <FileText className={className} />
    if (type.includes("zip") || type.includes("rar") || type.includes("tar")) return <Archive className={className} />
    return <File className={className} />
  }

  const getFileTypeColor = (fileType: string) => {
    const type = fileType.toLowerCase()
    if (type.startsWith("image/")) return "text-green-600 bg-green-50 border-green-200"
    if (type.startsWith("video/")) return "text-blue-600 bg-blue-50 border-blue-200"
    if (type.startsWith("audio/")) return "text-purple-600 bg-purple-50 border-purple-200"
    if (type.includes("pdf")) return "text-red-600 bg-red-50 border-red-200"
    if (type.includes("zip") || type.includes("rar") || type.includes("tar")) return "text-orange-600 bg-orange-50 border-orange-200"
    return "text-gray-600 bg-gray-50 border-gray-200"
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Size unknown'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const handleDownload = async (file: { name: string; url: string; type: string }) => {
    try {
      const response = await fetch(file.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = file.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading file:', error)
      window.open(file.url, '_blank')
    }
  }

  const renderFileContent = (file: { name: string; url: string; type: string; size?: number }, fileIndex: number, announcementId: string) => {
    const fileType = file.type.toLowerCase()

    if (fileType.startsWith('image/')) {
      return (
        <div className="mt-4 rounded-lg overflow-hidden border bg-white">
          <img 
            src={file.url} 
            alt={file.name}
            className="w-full h-auto max-h-96 object-contain"
            loading="lazy"
          />
        </div>
      )
    }

    if (fileType === 'application/pdf') {
      return (
        <div className="mt-4 rounded-lg overflow-hidden border bg-white">
          <div className="aspect-[4/3] w-full">
            <iframe
              src={`${file.url}#view=FitH`}
              className="w-full h-full"
              title={file.name}
            />
          </div>
        </div>
      )
    }

    if (fileType.startsWith('video/')) {
      return (
        <div className="mt-4 rounded-lg overflow-hidden border bg-black">
          <video 
            controls 
            className="w-full max-h-96"
            preload="metadata"
          >
            <source src={file.url} type={file.type} />
            Your browser does not support the video tag.
          </video>
        </div>
      )
    }

    if (fileType.startsWith('audio/')) {
      return (
        <div className="mt-4 p-4 rounded-lg border bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-shrink-0 p-2 rounded-full bg-purple-100">
              <Music className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">Audio file</p>
            </div>
          </div>
          <audio 
            controls 
            className="w-full h-10"
            preload="metadata"
          >
            <source src={file.url} type={file.type} />
            Your browser does not support the audio tag.
          </audio>
        </div>
      )
    }

    return (
      <div className="mt-4 p-4 rounded-lg border bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white border">
              {getFileIcon(file.type, "h-5 w-5")}
            </div>
            <div>
              <p className="text-sm font-medium">Preview not available</p>
              <p className="text-xs text-muted-foreground">Click to open in new tab</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open(file.url, '_blank')}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Open
          </Button>
        </div>
      </div>
    )
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

  const formatTime = (dateValue: Date | Timestamp | string | any) => {
    const d = dateValue instanceof Timestamp ? dateValue.toDate() : new Date(dateValue)
    const now = new Date()
    const diffInHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60)
      return `${minutes}m ago`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else if (diffInHours < 168) {
      return d.toLocaleDateString("en-US", { weekday: "short" })
    } else {
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    }
  }

  const getUserGroupCount = () => {
    if (!user?.assignedGroups) return 0
    return user.assignedGroups.filter(groupId => 
      groups.some(group => group.id === groupId)
    ).length
  }

  if (loading) {
    return (
      <ProtectedRoute>
      <MainLayout>
        <div className="min-h-screen bg-gray-50/50">
          <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
            {/* Loading Skeleton */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6">
              <div className="animate-pulse">
                <div className="h-8 bg-blue-200 rounded w-64 mb-2"></div>
                <div className="h-4 bg-blue-200 rounded w-96"></div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 bg-gray-200 rounded w-12 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-48"></div>
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
}

return (
  <ProtectedRoute>
    <MainLayout>
      <div className="min-h-screen bg-gray-50/50">
        <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
          {/* Welcome Header - Same as new code */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white rounded-xl p-6 sm:p-8 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                  Welcome back, {user?.name}! 👋
                </h1>
                <p className="text-blue-100 text-sm sm:text-base">
                  Stay updated with the latest announcements and course materials from LinuxWorld.
                </p>
              </div>
              <div className="flex-shrink-0">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 text-center">
                  <div className="text-lg font-bold">{getUserGroupCount()}</div>
                  <div className="text-xs text-blue-100">Active Groups</div>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="rounded-lg shadow">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {groups.length === 0 && (
            <Alert variant="destructive" className="rounded-lg shadow">
              <AlertDescription>No groups found. Please create a group first.</AlertDescription>
            </Alert>
          )}

          {user && (!user.assignedGroups || user.assignedGroups.length === 0) && (
            <Alert variant="destructive" className="rounded-lg shadow">
              <AlertDescription>You are not a member of any group. Please join a group to see announcements.</AlertDescription>
            </Alert>
          )}

          {/* Stats Cards - Same as new code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">My Groups</CardTitle>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{getUserGroupCount()}</div>
                <p className="text-xs text-muted-foreground mt-1">Active enrollments</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Announcements</CardTitle>
                <div className="p-2 bg-green-100 rounded-lg">
                  <MessageSquare className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{analytics.totalAnnouncements}</div>
                <p className="text-xs text-muted-foreground mt-1">Total messages</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Course Materials</CardTitle>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BookOpen className="h-4 w-4 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{analytics.totalFiles}</div>
                <p className="text-xs text-muted-foreground mt-1">Available files</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Last Activity</CardTitle>
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Calendar className="h-4 w-4 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {announcements.length > 0 ? formatTime(announcements[0].createdAt) : "N/A"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Latest update</p>
              </CardContent>
            </Card>
          </div>

          {/* Announcements Section */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-gray-900">Recent Announcements</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search announcements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full sm:w-80 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            {filteredAnnouncements.length === 0 ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  {searchQuery ? (
                    <>
                      <div className="p-4 bg-gray-100 rounded-full mb-4">
                        <Search className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2 text-gray-900">No matching announcements</h3>
                      <p className="text-gray-600 text-center max-w-md">
                        No announcements match "{searchQuery}". Try adjusting your search terms.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="p-4 bg-blue-100 rounded-full mb-4">
                        <MessageSquare className="h-8 w-8 text-blue-600" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2 text-gray-900">No announcements yet</h3>
                      <p className="text-gray-600 text-center max-w-md">
                        {getUserGroupCount() === 0
                          ? "You're not enrolled in any groups yet. Contact your administrator to get assigned to groups."
                          : "Your instructors haven't posted any announcements yet. Check back later for updates."}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {filteredAnnouncements.map((announcement) => {
                  const isAttachmentsExpanded = expandedAttachments.has(announcement.id)
                  const hasAttachments = announcement.files && announcement.files.length > 0

                  return (
                    <Card key={announcement.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden">
                      <CardHeader className="pb-4 bg-white">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="flex items-center space-x-4 flex-1">
                            <Avatar className="h-12 w-12 shadow border-2 border-blue-200">
                              <AvatarImage src={announcementCreators[announcement.createdBy]?.profileImage || undefined} />
                              <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">
                                {announcementCreators[announcement.createdBy]?.name
                                  ? announcementCreators[announcement.createdBy].name.charAt(0).toUpperCase()
                                  : announcement.createdBy.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <CardTitle className="text-lg font-bold text-blue-900 flex items-center gap-2">
                                {announcement.title}
                                {announcement.priority && (
                                  <Badge variant="destructive" className="text-xs">
                                    High Priority
                                  </Badge>
                                )}
                              </CardTitle>
                              <CardDescription className="text-sm text-blue-700">
                                <span className="font-medium">
                                  {announcementCreators[announcement.createdBy]?.name || announcement.createdBy}
                                </span>
                                <span className="mx-1">•</span>
                                {formatDate(announcement.createdAt)}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="flex items-center gap-1 bg-blue-100 text-blue-700 border-blue-300 font-semibold">
                              <Users className="h-3 w-3" />
                              {(announcement.groupIds?.length ?? 0)} Groups
                            </Badge>
                            {(user?.role === "admin" || user?.role === "super_admin") && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewMembers(announcement)}
                                className="flex items-center gap-1"
                              >
                                <Users className="h-4 w-4" />
                                View Members
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-6">
                        <div className="prose prose-sm max-w-none">
                          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {announcement.content}
                          </p>
                        </div>

                        {/* Attachments Section */}
                        {hasAttachments && (
                          <div className="space-y-4">
                            <button
                              onClick={() => toggleAttachments(announcement.id)}
                              className="flex items-center gap-3 w-full p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-150 group"
                            >
                              <div className="p-2 bg-white rounded-lg shadow-sm group-hover:shadow transition-shadow">
                                <Paperclip className="h-4 w-4 text-gray-600" />
                              </div>
                              <div className="flex-1 text-left">
                                <p className="font-medium text-gray-900">
                                  {announcement.files.length} Attachment{announcement.files.length !== 1 ? 's' : ''}
                                </p>
                                <p className="text-xs text-gray-600">
                                  Click to {isAttachmentsExpanded ? 'hide' : 'view'} files
                                </p>
                              </div>
                              <div className="p-1 rounded-full bg-white shadow-sm">
                                {isAttachmentsExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-gray-600" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-gray-600" />
                                )}
                              </div>
                            </button>

                            {isAttachmentsExpanded && (
                              <div className="space-y-4 pl-4 border-l-2 border-gray-100">
                                {announcement.files.map((file, index) => (
                                  <div
                                    key={file.id || index}
                                    className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
                                  >
                                    {/* File Header */}
                                    <div className="flex items-center justify-between mb-4">
                                      <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className={cn(
                                          "flex-shrink-0 p-2 rounded-lg border",
                                          getFileTypeColor(file.type)
                                        )}>
                                          {getFileIcon(file.type, "h-5 w-5")}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <p className="font-medium text-sm text-gray-900 truncate" title={file.name}>
                                            {file.name}
                                          </p>
                                          <p className="text-xs text-gray-500 mt-1">
                                            {formatFileSize(file.size)} • {file.type.split('/')[1]?.toUpperCase() || 'File'}
                                          </p>
                                        </div>
                                      </div>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleDownload(file)}
                                        className="flex-shrink-0 ml-3 bg-white hover:bg-gray-50 border-gray-200"
                                        title={`Download ${file.name}`}
                                      >
                                        <Download className="h-4 w-4" />
                                        <span className="sr-only">Download {file.name}</span>
                                      </Button>
                                    </div>
                                    
                                    {/* File Content Preview */}
                                    {renderFileContent(file, index, announcement.id)}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Group Tags */}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {(announcement.groupIds ?? []).map((groupId) => {
                            const group = groups.find((g) => g.id === groupId)
                            return (
                              <Badge key={groupId} variant="secondary" className="bg-teal-100 text-teal-800 border-teal-300 font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                                <BookOpen className="h-4 w-4 mr-1" />
                                {group?.name || "Unknown Group"}
                              </Badge>
                            )
                          })}
                        </div>

                        {/* Metadata Footer */}
                        <div className="pt-4 border-t border-gray-100">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2 text-gray-500">
                              <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium text-xs">
                                {(announcementCreators[announcement.createdBy]?.name || announcement.createdBy).charAt(0).toUpperCase()}
                              </div>
                              <span>Posted by <span className="font-medium text-gray-700">{announcementCreators[announcement.createdBy]?.name || announcement.createdBy}</span></span>
                            </div>
                            
                            {user?.role !== 'student' && announcement.viewedBy && (
                              <div className="flex items-center gap-1 text-gray-500">
                                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                <span>Viewed by {announcement.viewedBy.length} student{announcement.viewedBy.length !== 1 ? 's' : ''}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>

          {/* Quick Actions FAB for mobile */}
          {user?.role !== 'student' && (
            <div className="fixed bottom-6 right-6 sm:hidden">
              <Button 
                size="lg"
                className="rounded-full w-14 h-14 shadow-lg bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  window.location.href = '/announcements/new'
                }}
              >
                <MessageSquare className="h-6 w-6" />
                <span className="sr-only">Create announcement</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Members Dialog */}
      <Dialog open={isMembersDialogOpen} onOpenChange={setIsMembersDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedAnnouncement?.title} - Target Groups Members
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {membersLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-6">
                                  {(selectedAnnouncement?.groupIds ?? []).map((groupId) => {
                    const group = groups.find((g) => g.id === groupId)
                    const members = groupMembers[groupId] || []
                    return (
                      <div key={groupId} className="space-y-2">
                        <h3 className="font-medium flex items-center gap-2 text-blue-900">
                          <Users className="h-4 w-4 text-blue-500" />
                          {group?.name} ({members.length} members)
                        </h3>
                        <div className="space-y-2">
                          {members.map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center gap-4 p-4 rounded-lg border bg-blue-50 shadow"
                            >
                              <Avatar className="h-8 w-8 border-2 border-blue-200">
                                <AvatarImage src={member.profileImage} />
                                <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">
                                  {member.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate text-blue-900">{member.name}</p>
                                <p className="text-sm text-blue-700 truncate">{member.email}</p>
                              </div>
                              <Badge variant="outline" className="bg-teal-100 text-teal-800 border-teal-300 font-semibold px-2 py-1 rounded-full">
                                {member.role}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </MainLayout>
    </ProtectedRoute>
  )
}