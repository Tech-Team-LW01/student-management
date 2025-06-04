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
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

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
    groupId: "",
  })
  const [files, setFiles] = useState<File[]>([])
  const [filePermissions, setFilePermissions] = useState<Record<string, boolean>>({})
  const [formLoading, setFormLoading] = useState(false)
  const [error, setError] = useState("")
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)

  const canViewUsers = user ? canViewAllUsers(user.role) : false

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    // Filter announcements based on search query
    if (!searchQuery.trim()) {
      setFilteredAnnouncements(announcements)
    } else {
      const filtered = announcements.filter((announcement) => {
        const groupName = groups.find((g) => g.id === announcement.groupId)?.name || ""
        return (
          announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          announcement.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          groupName.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })
      setFilteredAnnouncements(filtered)
    }
  }, [searchQuery, announcements, groups])

  const fetchData = async () => {
    try {
      console.log("Fetching announcements data...")
      const [groupsData, announcementsData] = await Promise.all([getGroups(), getAnnouncements()])
      console.log("Fetched groups:", groupsData.length)
      console.log("Fetched announcements:", announcementsData.length)
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
    setFormData({
      title: "",
      content: "",
      groupId: "",
    })
    setFiles([])
    setFilePermissions({})
    setError("")
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    setFiles(selectedFiles)

    // Initialize file permissions (default to downloadable)
    const permissions: Record<string, boolean> = {}
    selectedFiles.forEach((file) => {
      permissions[file.name] = true
    })
    setFilePermissions(permissions)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError("You must be logged in to create announcements.")
      return
    }

    // Validation
    if (!formData.content.trim()) {
      setError("Message content is required.")
      return
    }

    if (!formData.groupId) {
      setError("Please select a group.")
      return
    }

    setFormLoading(true)
    setError("")

    try {
      // Upload files first
      const uploadedFiles: AnnouncementFile[] = []

      for (const file of files) {
        try {
          const filePath = `announcements/${Date.now()}-${file.name}`
          const fileUrl = await uploadFile(file, filePath)

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
          return
        }
      }

      const announcementData = {
        title: formData.title.trim() || "New Announcement",
        content: formData.content.trim(),
        groupId: formData.groupId,
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
      resetForm()
      setIsCreateDialogOpen(false)
    } catch (error: any) {
      console.error("Error creating announcement:", error)
      if (error.code === "permission-denied") {
        setError("Permission denied. Please check your admin privileges and refresh your session.")
      } else if (error.code === "unauthenticated") {
        setError("Authentication required. Please sign out and sign in again.")
      } else {
        setError(`Failed to create announcement: ${error.message || "Unknown error"}`)
      }
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
    } catch (error: any) {
      console.error("Error deleting announcement:", error)
      setError(`Failed to delete announcement: ${error.message || "Unknown error"}`)
    } finally {
      setDeleteLoading(null)
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <ImageIcon className="h-4 w-4" />
    if (fileType.startsWith("video/")) return <Video className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const formatTime = (date: Date | string) => {
    const d = date instanceof Date ? date : new Date(date)
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
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    }
  }

  const formatFullDateTime = (date: Date | string) => {
    const d = date instanceof Date ? date : new Date(date)
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
      <ProtectedRoute allowedRoles={["super_admin", "admin", "group_admin"]}>
        <MainLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </MainLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["super_admin", "admin", "group_admin"]}>
      <MainLayout>
        <div className="h-[calc(100vh-8rem)] flex flex-col bg-gray-50">
          {/* Header */}
          <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">LinuxWorld Announcements</h1>
              <p className="text-sm text-gray-500">Share important updates with your LinuxWorld groups</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search announcements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Dialog
                open={isCreateDialogOpen}
                onOpenChange={(open) => {
                  setIsCreateDialogOpen(open)
                  if (!open) resetForm()
                }}
              >
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="mr-2 h-4 w-4" />
                    New Message
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Send New Announcement</DialogTitle>
                    <DialogDescription>Share a message with your group</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="groupId">Send to Group</Label>
                      <Select
                        value={formData.groupId}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, groupId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a group" />
                        </SelectTrigger>
                        <SelectContent>
                          {groups.length === 0 ? (
                            <SelectItem value="" disabled>
                              No groups available
                            </SelectItem>
                          ) : (
                            groups.map((group) => (
                              <SelectItem key={group.id} value={group.id}>
                                {group.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="content">Message</Label>
                      <Textarea
                        id="content"
                        value={formData.content}
                        onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                        required
                        placeholder="Type your message here..."
                        rows={4}
                        disabled={formLoading}
                        className="resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="files">Attachments</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="files"
                          type="file"
                          multiple
                          onChange={handleFileChange}
                          accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                          disabled={formLoading}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById("files")?.click()}
                          disabled={formLoading}
                          className="w-full"
                        >
                          <Paperclip className="h-4 w-4 mr-2" />
                          Attach Files
                        </Button>
                      </div>
                    </div>

                    {files.length > 0 && (
                      <div className="space-y-2">
                        <Label>Attached Files</Label>
                        {files.map((file) => (
                          <div key={file.name} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              {getFileIcon(file.type)}
                              <div>
                                <p className="text-sm font-medium">{file.name}</p>
                                <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`download-${file.name}`}
                                checked={filePermissions[file.name] || false}
                                onCheckedChange={(checked) =>
                                  setFilePermissions((prev) => ({
                                    ...prev,
                                    [file.name]: checked as boolean,
                                  }))
                                }
                                disabled={formLoading}
                              />
                              <label htmlFor={`download-${file.name}`} className="text-xs">
                                Downloadable
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateDialogOpen(false)}
                        disabled={formLoading}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={formLoading || !formData.groupId || groups.length === 0}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {formLoading ? "Sending..." : "Send"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Chat Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {filteredAnnouncements.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="bg-white rounded-full p-6 mb-4 shadow-sm">
                  {searchQuery ? (
                    <Search className="h-12 w-12 text-gray-400" />
                  ) : (
                    <Send className="h-12 w-12 text-gray-400" />
                  )}
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery ? "No matching messages found" : "No LinuxWorld messages yet"}
                </h3>
                <p className="text-gray-500 mb-4 max-w-sm">
                  {searchQuery
                    ? `No announcements match "${searchQuery}". Try a different search term.`
                    : "Start a conversation by sending your first LinuxWorld announcement to a group."}
                </p>
                {!searchQuery && (
                  <Button
                    onClick={() => setIsCreateDialogOpen(true)}
                    disabled={groups.length === 0}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Send First Message
                  </Button>
                )}
                {groups.length === 0 && !searchQuery && (
                  <p className="text-sm text-gray-400 mt-2">Create groups first to start messaging</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAnnouncements.map((announcement) => (
                  <div key={announcement.id} className="flex justify-end">
                    <div className="max-w-2xl">
                      {/* Message Bubble */}
                      <div className="bg-green-500 text-white rounded-lg rounded-br-sm p-4 shadow-sm relative group">
                        {/* Message Options */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-white hover:bg-green-600">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {canViewUsers && (
                                <DropdownMenuItem
                                  onClick={() => handleViewAnnouncement(announcement.id, announcement.title)}
                                >
                                  <EyeIcon className="h-4 w-4 mr-2" />
                                  View Readers ({announcement.viewCount})
                                </DropdownMenuItem>
                              )}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem
                                    onSelect={(e) => e.preventDefault()}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Message
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this announcement? This action cannot be undone
                                      and will remove the message and all its attachments.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteAnnouncement(announcement.id)}
                                      disabled={deleteLoading === announcement.id}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      {deleteLoading === announcement.id ? "Deleting..." : "Delete"}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Group Badge */}
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="bg-green-600 text-white text-xs">
                            {groups.find((g) => g.id === announcement.groupId)?.name || "Unknown Group"}
                          </Badge>
                        </div>

                        {/* Message Content */}
                        <div className="space-y-3">
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{announcement.content}</p>

                          {/* File Attachments */}
                          {announcement.files.length > 0 && (
                            <div className="space-y-2">
                              {announcement.files.map((file) => (
                                <div
                                  key={file.id}
                                  className="bg-green-600 rounded-lg p-3 flex items-center justify-between"
                                >
                                  <div className="flex items-center space-x-3">
                                    {getFileIcon(file.type)}
                                    <div>
                                      <p className="text-sm font-medium">{file.name}</p>
                                      <p className="text-xs opacity-75">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    {file.isDownloadable ? (
                                      <Download className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Message Footer */}
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-green-600">
                          <div className="flex items-center space-x-2 text-xs opacity-75">
                            <Clock className="h-3 w-3" />
                            <span title={formatFullDateTime(announcement.createdAt)}>
                              {formatTime(announcement.createdAt)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <span className="text-xs opacity-75">{announcement.viewCount} views</span>
                            <CheckCheck className="h-4 w-4 opacity-75" />
                          </div>
                        </div>
                      </div>

                      {/* Sender Info */}
                      <div className="flex items-center justify-end mt-1 mr-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">You</span>
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={user?.profileImage || "/placeholder.svg"} />
                            <AvatarFallback className="text-xs">
                              {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </div>

                      {/* Full Date/Time on hover */}
                      <div className="text-xs text-gray-400 text-right mr-2 mt-1">
                        {formatFullDateTime(announcement.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Viewers Dialog */}
        <Dialog open={isViewersDialogOpen} onOpenChange={setIsViewersDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Message Readers
              </DialogTitle>
              <DialogDescription>
                Users who have viewed: {selectedAnnouncementTitle || "this announcement"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {viewersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : selectedAnnouncementViewers.length === 0 ? (
                <div className="text-center py-8">
                  <EyeIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No one has viewed this announcement yet</p>
                </div>
              ) : (
                <ScrollArea className="max-h-80">
                  <div className="space-y-3">
                    {selectedAnnouncementViewers.map((viewer) => (
                      <div key={viewer.id} className="flex items-center space-x-3 p-2 rounded-lg bg-gray-50">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={viewer.profileImage || "/placeholder.svg"} />
                          <AvatarFallback className="text-xs">{viewer.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{viewer.name}</p>
                          <p className="text-xs text-gray-500 truncate">{viewer.email}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {viewer.role.replace("_", " ")}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm text-gray-500">
                  Total: {selectedAnnouncementViewers.length} reader
                  {selectedAnnouncementViewers.length !== 1 ? "s" : ""}
                </span>
                <Button variant="outline" onClick={() => setIsViewersDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </MainLayout>
    </ProtectedRoute>
  )
}
