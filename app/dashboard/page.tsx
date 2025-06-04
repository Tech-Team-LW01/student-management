"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { getAnnouncements, getGroups, markAnnouncementAsViewed } from "@/lib/firebase-utils"
import { useAuth } from "@/contexts/auth-context"
import type { Announcement, Group, User } from "@/types"
import { 
  Users, 
  MessageSquare, 
  BookOpen, 
  Calendar, 
  Search, 
  Download, 
  ChevronDown, 
  ChevronRight, 
  Paperclip, 
  ExternalLink,
  ImageIcon,
  File,
  Video,
  Music,
  FileText,
  Archive,
  Play,
  Pause,
  Volume2
} from "lucide-react"
import { Timestamp } from "firebase/firestore"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { cn } from "@/lib/utils"

// Loading Skeleton Components
const StatCardSkeleton = () => (
  <Card className="animate-pulse">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-4" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-8 w-12 mb-1" />
      <Skeleton className="h-3 w-24" />
    </CardContent>
  </Card>
)

const AnnouncementSkeleton = () => (
  <Card className="animate-pulse">
    <CardHeader>
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
          <Skeleton className="h-6 w-3/4" />
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-4/6" />
    </CardContent>
  </Card>
)

export default function DashboardPage() {
  const { user } = useAuth()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([])
  const [allGroups, setAllGroups] = useState<Group[]>([])
  const [userNames, setUserNames] = useState<Map<string, string>>(new Map())
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedAttachments, setExpandedAttachments] = useState<Set<string>>(new Set())
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredAnnouncements(announcements)
    } else {
      const filtered = announcements.filter((announcement) => {
        const group = allGroups.find(g => g.id === announcement.groupId)
        const groupName = group?.name || ""
        const posterName = userNames.get(announcement.createdBy) || ""
        return (
          announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          announcement.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          groupName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          posterName.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })
      setFilteredAnnouncements(filtered)
    }
  }, [searchQuery, announcements, allGroups, userNames])

  const fetchData = async () => {
    if (!user) return

    try {
      const groupsData = await getGroups()
      setAllGroups(groupsData)
      
      const groupIds = user.assignedGroups || []
      const announcementsData = await getAnnouncements(groupIds)
      setAnnouncements(announcementsData)
      
      const creatorIds = [...new Set(announcementsData.map(a => a.createdBy))]
      const namesMap = new Map<string, string>()
      
      for (const creatorId of creatorIds) {
        try {
          const userDoc = await getDoc(doc(db, "users", creatorId))
          if (userDoc.exists()) {
            const userData = userDoc.data() as User
            namesMap.set(creatorId, userData.name)
          }
        } catch (error) {
          console.error(`Error fetching user ${creatorId}:`, error)
        }
      }
      
      setUserNames(namesMap)

      if (user.role === "student" && announcementsData.length > 0) {
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

  const toDate = (dateValue: Date | Timestamp | string | any): Date => {
    if (!dateValue) return new Date()
    if (dateValue instanceof Date) return dateValue
    if (dateValue instanceof Timestamp) return dateValue.toDate()
    if (dateValue && typeof dateValue === 'object' && 'toDate' in dateValue) {
      return (dateValue as any).toDate()
    }
    if (typeof dateValue === 'string') return new Date(dateValue)
    return new Date()
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

  const renderFileContent = (file: { name: string; url: string; type: string; size?: number }, fileIndex: number, announcementId: string) => {
    const fileType = file.type.toLowerCase()
    const fileId = `${announcementId}-${fileIndex}`

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

  const formatTime = (dateValue: Date | Timestamp | string | any) => {
    const d = toDate(dateValue)
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

  const formatFullDateTime = (dateValue: Date | Timestamp | string | any) => {
    const d = toDate(dateValue)
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
  const getGroupName = (groupId: string) => {
    const group = allGroups.find(g => g.id === groupId)
    return group?.name || `Group ${groupId.substring(0, 6)}`
  }

  const getUserName = (userId: string) => {
    return userNames.get(userId) || 'Unknown User'
  }

  const getUserGroupCount = () => {
    if (!user?.assignedGroups) return 0
    return user.assignedGroups.filter(groupId => 
      allGroups.some(group => group.id === groupId)
    ).length
  }

  const getGroupColor = (groupId: string) => {
    const colors = [
      "bg-blue-100 text-blue-800 border-blue-200",
      "bg-green-100 text-green-800 border-green-200", 
      "bg-purple-100 text-purple-800 border-purple-200",
      "bg-orange-100 text-orange-800 border-orange-200",
      "bg-pink-100 text-pink-800 border-pink-200",
      "bg-indigo-100 text-indigo-800 border-indigo-200"
    ]
    const index = groupId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
    return colors[index]
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["student", "group_admin", "admin", "super_admin"]}>
        <MainLayout>
          <div className="space-y-6 p-4 sm:p-6">
            {/* Header Skeleton */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6">
              <Skeleton className="h-8 w-64 mb-2 bg-blue-200" />
              <Skeleton className="h-4 w-96 bg-blue-200" />
            </div>
            
            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <StatCardSkeleton key={i} />
              ))}
            </div>
            
            {/* Announcements Skeleton */}
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              {Array.from({ length: 3 }).map((_, i) => (
                <AnnouncementSkeleton key={i} />
              ))}
            </div>
          </div>
        </MainLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["student", "group_admin", "admin", "super_admin"]}>
      <MainLayout>
        <div className="min-h-screen bg-gray-50/50">
          <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
            {/* Welcome Header */}
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

            {/* Stats Cards */}
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
                  <div className="text-2xl font-bold text-gray-900">{announcements.length}</div>
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
                  <div className="text-2xl font-bold text-gray-900">
                    {announcements.reduce((total, announcement) => total + (announcement.files?.length || 0), 0)}
                  </div>
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
                            <div className="flex-1 space-y-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge 
                                  variant="outline" 
                                  className={cn(
                                    "font-medium border text-xs px-2 py-1",
                                    getGroupColor(announcement.groupId)
                                  )}
                                >
                                  {getGroupName(announcement.groupId)}
                                </Badge>
                                <span className="text-xs text-muted-foreground">•</span>
                                <span
                                  className="text-xs text-muted-foreground font-medium"
                                  title={formatFullDateTime(announcement.createdAt)}
                                >
                                  {formatTime(announcement.createdAt)}
                                </span>
                                {announcement.priority && (
                                  <>
                                    <span className="text-xs text-muted-foreground">•</span>
                                    <Badge variant="destructive" className="text-xs">
                                      High Priority
                                    </Badge>
                                  </>
                                )}
                              </div>
                              <CardTitle className="text-lg sm:text-xl leading-tight text-gray-900">
                                {announcement.title}
                              </CardTitle>
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

                          {/* Metadata Footer */}
                          <div className="pt-4 border-t border-gray-100">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                              <div className="flex items-center gap-2 text-gray-500">
                                <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium text-xs">
                                  {getUserName(announcement.createdBy).charAt(0).toUpperCase()}
                                </div>
                                <span>Posted by <span className="font-medium text-gray-700">{getUserName(announcement.createdBy)}</span></span>
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

              {/* Load More Button (if needed) */}
              {filteredAnnouncements.length > 0 && announcements.length > filteredAnnouncements.length && (
                <div className="flex justify-center pt-6">
                  <Button 
                    variant="outline" 
                    className="bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
                  >
                    Load more announcements
                  </Button>
                </div>
              )}
            </div>

            {/* Quick Actions (Mobile FAB style for smaller screens) */}
            {user?.role !== 'student' && (
              <div className="fixed bottom-6 right-6 sm:hidden">
                <Button 
                  size="lg"
                  className="rounded-full w-14 h-14 shadow-lg bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    // Navigate to create announcement
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
      </MainLayout>
    </ProtectedRoute>
  )
}
