"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
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
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  getGroups,
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  uploadFile,
  getAnnouncementViewers,
  canViewAllUsers,
} from "@/lib/firebase-utils"
import { useAuth } from "@/contexts/auth-context"
import type { Group, Announcement, AnnouncementFile, User } from "@/types"
import {
  Plus,
  Download,
  Eye,
  AlertCircle,
  Send,
  Paperclip,
  ImageIcon,
  File,
  Video,
  Clock,
  CheckCheck,
  Search,
  Trash2,
  MoreVertical,
  Users,
  EyeIcon,
  Mail,
  CheckCircle,
  XCircle,
  Loader2,
  MessageSquare,
  FileText,
  Music,
  Archive,
  X,
  Calendar,
  Hash,
  ArrowLeft,
  Upload,
  Settings,
  Bell,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { Timestamp } from "firebase/firestore"

// Enhanced notification component
const NotificationToast = ({ 
  notification, 
  onClose 
}: { 
  notification: any;
  onClose: () => void;
}) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'info': return <Mail className="h-5 w-5 text-blue-600 animate-pulse" />
      case 'warning': return <AlertCircle className="h-5 w-5 text-yellow-600" />
      case 'error': return <XCircle className="h-5 w-5 text-red-600" />
      default: return <Bell className="h-5 w-5" />
    }
  }

  const getBgColor = () => {
    switch (notification.type) {
      case 'success': return 'bg-green-50 border-green-200 text-green-800'
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'error': return 'bg-red-50 border-red-200 text-red-800'
      default: return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  return (
    <div className={cn(
      "fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg max-w-sm border-2",
      "animate-in slide-in-from-top-2 duration-300",
      getBgColor()
    )}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{notification.message}</p>
          {notification.details && (
            <div className="mt-2 space-y-1">
              {notification.details.notified > 0 && (
                <p className="text-xs opacity-90">
                  ✅ Sent to {notification.details.notified} student{notification.details.notified !== 1 ? 's' : ''}
                </p>
              )}
              {notification.details.failed > 0 && (
                <p className="text-xs opacity-90">
                  ❌ Failed: {notification.details.failed}
                </p>
              )}
              {notification.details.total && (
                <p className="text-xs opacity-90">
                  📊 Total recipients: {notification.details.total}
                </p>
              )}
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 ml-2 hover:opacity-70 transition-opacity"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// Enhanced file upload component
const FileUploadArea = ({ 
  files, 
  filePermissions, 
  onFileChange, 
  onPermissionChange, 
  onRemoveFile,
  loading 
}: {
  files: File[];
  filePermissions: Record<string, boolean>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPermissionChange: (fileName: string, downloadable: boolean) => void;
  onRemoveFile: (fileName: string) => void;
  loading: boolean;
}) => {
  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase()
    if (type.startsWith("image/")) return <ImageIcon className="h-5 w-5 text-green-600" />
    if (type.startsWith("video/")) return <Video className="h-5 w-5 text-blue-600" />
    if (type.startsWith("audio/")) return <Music className="h-5 w-5 text-purple-600" />
    if (type.includes("pdf")) return <FileText className="h-5 w-5 text-red-600" />
    if (type.includes("zip") || type.includes("rar")) return <Archive className="h-5 w-5 text-orange-600" />
    return <File className="h-5 w-5 text-gray-600" />
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="files" className="text-sm font-medium">
          Attachments
        </Label>
        <div className="relative">
          <Input
            id="files"
            type="file"
            multiple
            onChange={onFileChange}
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
            disabled={loading}
            className="hidden"
          />
          <div
            onClick={() => !loading && document.getElementById("files")?.click()}
            className={cn(
              "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200",
              "hover:border-blue-400 hover:bg-blue-50/50",
              loading && "opacity-50 cursor-not-allowed",
              files.length > 0 ? "border-blue-300 bg-blue-50/30" : "border-gray-300"
            )}
          >
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">
              Click to attach files
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Images, videos, documents, archives (Max 25MB each)
            </p>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Attached Files ({files.length})
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => files.forEach(file => onRemoveFile(file.name))}
              disabled={loading}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Clear all
            </Button>
          </div>
          
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {files.map((file, index) => (
              <div 
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-3 bg-white border rounded-lg hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    {getFileIcon(file.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)} • {file.type.split('/')[1]?.toUpperCase() || 'File'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 flex-shrink-0">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`download-${file.name}`}
                      checked={filePermissions[file.name] || false}
                      onCheckedChange={(checked) => onPermissionChange(file.name, checked as boolean)}
                      disabled={loading}
                    />
                    <label 
                      htmlFor={`download-${file.name}`} 
                      className="text-xs text-gray-600 cursor-pointer"
                    >
                      Downloadable
                    </label>
                  </div>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveFile(file.name)}
                    disabled={loading}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Enhanced message bubble component
const MessageBubble = ({
  announcement,
  groups,
  user,
  onView,
  onDelete,
  deleteLoading,
  canViewUsers
}: {
  announcement: Announcement;
  groups: Group[];
  user: any;
  onView: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  deleteLoading: string | null;
  canViewUsers: boolean;
}) => {
  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase()
    if (type.startsWith("image/")) return <ImageIcon className="h-4 w-4" />
    if (type.startsWith("video/")) return <Video className="h-4 w-4" />
    if (type.startsWith("audio/")) return <Music className="h-4 w-4" />
    if (type.includes("pdf")) return <FileText className="h-4 w-4" />
    if (type.includes("zip") || type.includes("rar") || type.includes("tar")) return <Archive className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Size unknown'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`
  }

  const formatTime = (date: Date | Timestamp) => {
    if (!date) return ""
    const d = date instanceof Date ? date : date.toDate()
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
    })
  }

  const formatFullDateTime = (date: Date | Timestamp) => {
    if (!date) return ""
    const d = date instanceof Date ? date : date.toDate()
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      timeZoneName: "short",
    })
  }

  const groupNames = announcement.groupIds && announcement.groupIds.length > 0
    ? announcement.groupIds
        .map(id => groups.find(g => g.id === id)?.name || "Unknown Group")
        .join(", ")
    : "All Groups"

  return (
    <Card className="bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-medium">
                {groupNames}
              </Badge>
              <span className="text-xs text-muted-foreground">•</span>
              <span
                className="text-xs text-muted-foreground font-medium"
                title={formatFullDateTime(announcement.createdAt)}
              >
                {formatTime(announcement.createdAt)}
              </span>
            </div>
            <CardTitle className="text-lg sm:text-xl leading-tight text-gray-900">
              {announcement.title}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {canViewUsers && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onView(announcement.id, announcement.title)}
                className="text-muted-foreground hover:text-foreground"
              >
                <Users className="h-4 w-4 mr-2" />
                View
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(announcement.id)}
              disabled={deleteLoading === announcement.id}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              {deleteLoading === announcement.id ? (
                <div className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="prose prose-sm max-w-none">
          {announcement.content}
        </div>
        {announcement.files && announcement.files.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900">Attachments</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {announcement.files.map((file, index) => (
                <div
                  key={file.id}
                  className="flex items-center gap-2 p-2 rounded-lg border bg-gray-50"
                >
                  {getFileIcon(file.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  {file.isDownloadable && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:text-blue-700"
                      onClick={() => window.open(file.url, "_blank")}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Loading skeleton components
const AnnouncementSkeleton = () => (
  <div className="flex justify-end mb-6">
    <div className="max-w-2xl w-full">
      <div className="bg-gray-200 rounded-2xl rounded-br-md p-4 animate-pulse">
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-6 w-3/4 mb-3" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
        <div className="flex items-center justify-between mt-4 pt-3">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
      <div className="flex items-center justify-end mt-2 mr-2">
        <Skeleton className="h-7 w-16" />
      </div>
    </div>
  </div>
)

export default function AnnouncementsPage() {
  const { user } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isViewersDialogOpen, setIsViewersDialogOpen] = useState(false)
  const [selectedAnnouncementViewers, setSelectedAnnouncementViewers] = useState<User[]>([])
  const [selectedAnnouncementTitle, setSelectedAnnouncementTitle] = useState("")
  const [viewersLoading, setViewersLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    groupIds: [] as string[],
  })
  const [files, setFiles] = useState<File[]>([])
  const [filePermissions, setFilePermissions] = useState<Record<string, boolean>>({})
  const [formLoading, setFormLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [error, setError] = useState("")
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  
  // Enhanced notification status state
  const [notificationStatus, setNotificationStatus] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'info' | 'warning' | 'error';
    details?: {
      notified?: number;
      failed?: number;
      total?: number;
    };
  } | null>(null)

  const canViewUsers = user ? canViewAllUsers(user.role) : false

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredAnnouncements(announcements)
    } else {
      const filtered = announcements.filter((announcement) => {
        const groupNames = announcement.groupIds
          .map(id => groups.find(g => g.id === id)?.name || "")
          .join(" ")
        return (
          announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          announcement.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          groupNames.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })
      setFilteredAnnouncements(filtered)
    }
  }, [searchQuery, announcements, groups])

  useEffect(() => {
    if (notificationStatus?.show) {
      const timer = setTimeout(() => {
        setNotificationStatus(null)
      }, 10000)
      return () => clearTimeout(timer)
    }
  }, [notificationStatus])

  const fetchData = async () => {
    try {
      const [groupsData, announcementsData] = await Promise.all([getGroups(), getAnnouncements()])
      setGroups(groupsData)
      setAnnouncements(announcementsData)
    } catch (error) {
      console.error("Error fetching data:", error)
      setError("Failed to load data. Please refresh the page.")
    } finally {
      setLoading(false)
    }
  }

  const handleViewAnnouncement = async (announcementId: string, title: string) => {
    if (!canViewUsers) return

    setViewersLoading(true)
    setSelectedAnnouncementTitle(title)
    setIsViewersDialogOpen(true)

    try {
      const viewers = await getAnnouncementViewers(announcementId)
      setSelectedAnnouncementViewers(viewers)
    } catch (error) {
      console.error("Error fetching viewers:", error)
      setSelectedAnnouncementViewers([])
    } finally {
      setViewersLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({ title: "", content: "", groupIds: [] })
    setFiles([])
    setFilePermissions({})
    setUploadProgress({})
    setError("")
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    setFiles(selectedFiles)

    const permissions: Record<string, boolean> = {}
    selectedFiles.forEach((file) => {
      permissions[file.name] = true
    })
    setFilePermissions(permissions)
  }

  const handleFilePermissionChange = (fileName: string, downloadable: boolean) => {
    setFilePermissions(prev => ({ ...prev, [fileName]: downloadable }))
  }

  const handleRemoveFile = (fileName: string) => {
    setFiles(prev => prev.filter(file => file.name !== fileName))
    setFilePermissions(prev => {
      const newPerms = { ...prev }
      delete newPerms[fileName]
      return newPerms
    })
    setUploadProgress(prev => {
      const newProgress = { ...prev }
      delete newProgress[fileName]
      return newProgress
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError("You must be logged in to create announcements.")
      return
    }

    if (!formData.content.trim()) {
      setError("Message content is required.")
      return
    }

    if (formData.groupIds.length === 0) {
      setError("Please select at least one group.")
      return
    }

    setFormLoading(true)
    setError("")

    try {
      const uploadedFiles: AnnouncementFile[] = []

      // Upload files with progress tracking
      for (const file of files) {
        try {
          setUploadProgress(prev => ({ ...prev, [file.name]: 0 }))
          
          const filePath = `announcements/${Date.now()}-${file.name}`
          const fileUrl = await uploadFile(file, filePath)

          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }))

          uploadedFiles.push({
            id: crypto.randomUUID(),
            name: file.name,
            url: fileUrl,
            type: file.type,
            size: file.size,
            isDownloadable: filePermissions[file.name] || false,
          })
        } catch (fileError) {
          console.error(`Error uploading file ${file.name}:`, fileError)
          setError(`Failed to upload file: ${file.name}`)
          setFormLoading(false)
          return
        }
      }

      const announcementData = {
        title: formData.title.trim() || "New Announcement",
        content: formData.content.trim(),
        groupIds: formData.groupIds,
        createdBy: user.id,
        files: uploadedFiles,
        viewCount: 0,
        viewedBy: [],
      }

      const announcementId = await createAnnouncement(announcementData)

      const newAnnouncement: Announcement = {
        id: announcementId,
        ...announcementData,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      setAnnouncements((prev) => [newAnnouncement, ...prev])
      
      setNotificationStatus({
        show: true,
        message: "Announcement created! Sending email notifications...",
        type: 'info'
      })
      
      // Check notification status
      setTimeout(async () => {
        try {
          const response = await fetch('/api/check-notification-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ announcementId, groupIds: formData.groupIds }),
          })
          
          if (response.ok) {
            const data = await response.json()
            if (data.notified > 0) {
              setNotificationStatus({
                show: true,
                message: `Email notifications sent successfully!`,
                type: 'success',
                details: {
                  notified: data.notified,
                  failed: data.failed,
                  total: data.total
                }
              })
            }
          }
        } catch (error) {
          console.error('Error checking notification status:', error)
        }
      }, 3000)
      
      resetForm()
      setIsCreateDialogOpen(false)
    } catch (error: any) {
      console.error("Error creating announcement:", error)
      setError(`Failed to create announcement: ${error.message || "Unknown error"}`)
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteAnnouncement = async (announcementId: string) => {
    if (!user) return

    setDeleteLoading(announcementId)
    try {
      await deleteAnnouncement(announcementId, user.id)
      setAnnouncements((prev) => prev.filter((a) => a.id !== announcementId))
      
      setNotificationStatus({
        show: true,
        message: "Announcement deleted successfully",
        type: 'success'
      })
    } catch (error: any) {
      console.error("Error deleting announcement:", error)
      setNotificationStatus({
        show: true,
        message: `Failed to delete announcement: ${error.message || "Unknown error"}`,
        type: 'error'
      })
    } finally {
      setDeleteLoading(null)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["super_admin", "admin", "group_admin"]}>
        <MainLayout>
          <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header Skeleton */}
            <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <Skeleton className="h-8 w-64 mb-2" />
                  <Skeleton className="h-4 w-96" />
                </div>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-64" />
                  <Skeleton className="h-10 w-32" />
                </div>
              </div>
            </div>

            {/* Content Skeleton */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
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
    <ProtectedRoute allowedRoles={["super_admin", "admin", "group_admin"]}>
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          {/* Enhanced Notification Toast */}
          {notificationStatus?.show && (
            <NotificationToast 
              notification={notificationStatus}
              onClose={() => setNotificationStatus(null)}
            />
          )}

          {/* Enhanced Header */}
          <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    LinuxWorld Announcements
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Share important updates with your LinuxWorld community
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Enhanced Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search announcements..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full sm:w-80 border-gray-200 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
                
                {/* Enhanced Create Button */}
                <Dialog
                  open={isCreateDialogOpen}
                  onOpenChange={(open) => {
                    setIsCreateDialogOpen(open)
                    if (!open) resetForm()
                  }}
                >
                  <DialogTrigger asChild>
                    <Button 
                      className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transition-all duration-200"
                      size="lg"
                    >
                      <Plus className="mr-2 h-5 w-5" />
                      <span className="hidden sm:inline">New Message</span>
                      <span className="sm:hidden">New</span>
                    </Button>
                  </DialogTrigger>
                  
                  {/* Enhanced Create Dialog */}
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="pb-4">
                      <DialogTitle className="flex items-center gap-3 text-xl">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Send className="h-5 w-5 text-green-600" />
                        </div>
                        Send New Announcement
                      </DialogTitle>
                      <DialogDescription className="text-gray-600">
                        Create and share a message with your group. Students will receive email notifications automatically.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {error && (
                        <Alert variant="destructive" className="border-red-200 bg-red-50">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-red-800">{error}</AlertDescription>
                        </Alert>
                      )}

                      {/* Group Selection */}
                      <div className="space-y-2">
                        <Label htmlFor="groups" className="text-sm font-medium flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          Select Groups *
                        </Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {groups.map((group) => (
                            <div key={group.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`group-${group.id}`}
                                checked={formData.groupIds.includes(group.id)}
                                onCheckedChange={(checked) => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    groupIds: checked
                                      ? [...prev.groupIds, group.id]
                                      : prev.groupIds.filter((id) => id !== group.id),
                                  }))
                                }}
                                disabled={formLoading}
                              />
                              <Label
                                htmlFor={`group-${group.id}`}
                                className="text-sm font-normal cursor-pointer"
                              >
                                {group.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                        {formData.groupIds.length === 0 && (
                          <p className="text-xs text-red-500 mt-1">Please select at least one group</p>
                        )}
                      </div>

                      {/* Title Input */}
                      <div className="space-y-2">
                        <Label htmlFor="title" className="text-sm font-medium">
                          Title (Optional)
                        </Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                          placeholder="Enter a title for your announcement..."
                          disabled={formLoading}
                          className="border-gray-200 focus:border-green-500"
                        />
                      </div>

                      {/* Message Content */}
                      <div className="space-y-2">
                        <Label htmlFor="content" className="text-sm font-medium flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-gray-500" />
                          Message *
                        </Label>
                        <Textarea
                          id="content"
                          value={formData.content}
                          onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                          required
                          placeholder="Type your message here..."
                          rows={6}
                          disabled={formLoading}
                          className="resize-none border-gray-200 focus:border-green-500"
                        />
                        <p className="text-xs text-gray-500">
                          Use line breaks to format your message. Recipients will see it exactly as you type it.
                        </p>
                      </div>

                      {/* Enhanced File Upload */}
                      <FileUploadArea
                        files={files}
                        filePermissions={filePermissions}
                        onFileChange={handleFileChange}
                        onPermissionChange={handleFilePermissionChange}
                        onRemoveFile={handleRemoveFile}
                        loading={formLoading}
                      />

                      {/* Upload Progress */}
                      {formLoading && files.length > 0 && (
                        <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center gap-2 text-blue-800">
                            <Upload className="h-4 w-4" />
                            <span className="text-sm font-medium">Uploading files...</span>
                          </div>
                          {Object.entries(uploadProgress).map(([fileName, progress]) => (
                            <div key={fileName} className="space-y-1">
                              <div className="flex justify-between text-xs text-blue-700">
                                <span className="truncate">{fileName}</span>
                                <span>{progress}%</span>
                              </div>
                              <Progress value={progress} className="h-2" />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Email Notification Info */}
                      <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-xl p-4">
                        <div className="flex items-start space-x-3">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            <Mail className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900 mb-1">
                              Email Notifications
                            </h4>
                            <p className="text-sm text-gray-600">
                              All students in the selected groups will receive an email notification with your message and any attachments.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsCreateDialogOpen(false)}
                          disabled={formLoading}
                          className="flex-1 border-gray-200"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={formLoading || !formData.content.trim() || formData.groupIds.length === 0 || groups.length === 0}
                          className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg"
                        >
                          {formLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              <span>Sending...</span>
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              <span>Send Message</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          {/* Enhanced Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {filteredAnnouncements.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-500 rounded-full blur-lg opacity-20 animate-pulse"></div>
                  <div className="relative bg-white rounded-full p-8 shadow-lg">
                    {searchQuery ? (
                      <Search className="h-16 w-16 text-gray-400 mx-auto" />
                    ) : (
                      <MessageSquare className="h-16 w-16 text-gray-400 mx-auto" />
                    )}
                  </div>
                </div>
                
                <div className="max-w-md">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {searchQuery ? "No matching messages found" : "No messages yet"}
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {searchQuery
                      ? `No announcements match "${searchQuery}". Try adjusting your search terms or browse all messages.`
                      : "Start engaging with your LinuxWorld community by sending your first announcement to a group."}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    {searchQuery ? (
                      <Button
                        onClick={() => setSearchQuery("")}
                        variant="outline"
                        className="border-gray-300"
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        View All Messages
                      </Button>
                    ) : (
                      <Button
                        onClick={() => setIsCreateDialogOpen(true)}
                        disabled={groups.length === 0}
                        className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transition-all duration-200"
                        size="lg"
                      >
                        <Plus className="mr-2 h-5 w-5" />
                        Send First Message
                      </Button>
                    )}
                  </div>
                  
                  {groups.length === 0 && !searchQuery && (
                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2 text-yellow-800">
                        <AlertCircle className="h-5 w-5" />
                        <p className="text-sm font-medium">
                          No groups available. Create groups first to start messaging.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Messages Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {searchQuery ? 'Search Results' : 'Recent Messages'}
                    </h2>
                    <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                      {filteredAnnouncements.length} message{filteredAnnouncements.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  
                  {searchQuery && (
                    <Button
                      onClick={() => setSearchQuery("")}
                      variant="ghost"
                      size="sm"
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear search
                    </Button>
                  )}
                </div>

                {/* Messages List */}
                <div className="space-y-6">
                  {filteredAnnouncements.map((announcement) => (
                    <MessageBubble
                      key={announcement.id}
                      announcement={announcement}
                      groups={groups}
                      user={user}
                      onView={handleViewAnnouncement}
                      onDelete={handleDeleteAnnouncement}
                      deleteLoading={deleteLoading}
                      canViewUsers={canViewUsers}
                    />
                  ))}
                </div>

                {/* Load More Placeholder */}
                {filteredAnnouncements.length >= 10 && (
                  <div className="flex justify-center pt-6">
                    <Button 
                      variant="outline" 
                      className="bg-white hover:bg-gray-50 border-gray-200"
                      disabled
                    >
                      <Loader2 className="h-4 w-4 mr-2" />
                      Load more messages (Coming soon)
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Viewers Dialog */}
        <Dialog open={isViewersDialogOpen} onOpenChange={setIsViewersDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader className="pb-4">
              <DialogTitle className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <EyeIcon className="h-5 w-5 text-blue-600" />
                </div>
                Message Readers
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Students who have viewed: <span className="font-medium">{selectedAnnouncementTitle || "this announcement"}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {viewersLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-sm text-gray-500">Loading readers...</p>
                </div>
              ) : selectedAnnouncementViewers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-4">
                    <EyeIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">No readers yet</h3>
                  <p className="text-gray-500 text-sm">
                    No one has viewed this announcement yet. Readers will appear here once they open the message.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 text-blue-800">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">
                        {selectedAnnouncementViewers.length} reader{selectedAnnouncementViewers.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">
                      {Math.round((selectedAnnouncementViewers.length / (selectedAnnouncementViewers.length + 5)) * 100)}% read rate
                    </Badge>
                  </div>

                  <ScrollArea className="max-h-80">
                    <div className="space-y-3">
                      {selectedAnnouncementViewers.map((viewer) => (
                        <div 
                          key={viewer.id} 
                          className="flex items-center space-x-3 p-3 rounded-lg bg-white border border-gray-200 hover:border-gray-300 transition-colors"
                        >
                          <Avatar className="h-10 w-10 border-2 border-gray-200">
                            <AvatarImage src={viewer.profileImage} />
                            <AvatarFallback className="text-sm bg-blue-100 text-blue-700">
                              {viewer.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {viewer.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {viewer.email}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className="text-xs bg-gray-50 text-gray-700 border-gray-300"
                            >
                              {viewer.role.replace("_", " ")}
                            </Badge>
                            <div className="w-2 h-2 bg-green-400 rounded-full" title="Read"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </>
              )}

              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-sm text-gray-500">
                  {selectedAnnouncementViewers.length > 0 && (
                    <>Total: {selectedAnnouncementViewers.length} reader{selectedAnnouncementViewers.length !== 1 ? 's' : ''}</>
                  )}
                </span>
                <Button 
                  variant="outline" 
                  onClick={() => setIsViewersDialogOpen(false)}
                  className="border-gray-200"
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Mobile FAB for quick access */}
        <div className="fixed bottom-6 right-6 lg:hidden">
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            disabled={groups.length === 0}
            size="lg"
            className="rounded-full w-14 h-14 shadow-xl bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 hover:shadow-2xl transition-all duration-200"
          >
            <Plus className="h-6 w-6" />
            <span className="sr-only">Create new announcement</span>
          </Button>
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
}
