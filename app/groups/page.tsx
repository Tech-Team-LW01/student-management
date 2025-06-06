"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getGroups, getAnnouncements } from "@/lib/firebase-utils"
import type { Group, Announcement } from "@/types"
import { BookOpen, ExternalLink, FileText, Download, Eye, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { Timestamp } from "firebase/firestore"

export default function GroupsPage() {
  const { user } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [previewedAttachment, setPreviewedAttachment] = useState<{ announcementId: string, fileIndex: number } | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !user.assignedGroups?.length) {
        setLoading(false)
        return
      }

      try {
        const validGroupIds = user.assignedGroups.filter((id) => id && id.trim() !== "")

        if (validGroupIds.length > 0) {
          // Fetch all groups and announcements
          const [allGroups, allAnnouncements] = await Promise.all([
            getGroups(), 
            getAnnouncements() // Get all announcements first
          ])

          // Filter groups that user is assigned to
          const userGroups = allGroups.filter((group) => validGroupIds.includes(group.id))
          setGroups(userGroups)

          // Filter announcements that belong to user's assigned groups
          const filteredAnnouncements = allAnnouncements.filter((announcement) => {
            // Check if announcement has groupIds and if any of them match user's assigned groups
            if (announcement.groupIds && announcement.groupIds.length > 0) {
              return announcement.groupIds.some(groupId => validGroupIds.includes(groupId))
            }
            // For backward compatibility, check if announcement has a single groupId
            if (announcement.groupId) {
              return validGroupIds.includes(announcement.groupId)
            }
            return false
          })

          // Sort announcements by creation date (newest first)
          const sortedAnnouncements = filteredAnnouncements.sort((a, b) => {
            const dateA = a.createdAt instanceof Timestamp ? a.createdAt.toDate() : new Date(a.createdAt)
            const dateB = b.createdAt instanceof Timestamp ? b.createdAt.toDate() : new Date(b.createdAt)
            return dateB.getTime() - dateA.getTime()
          })

          setAnnouncements(sortedAnnouncements)

          // Debug logs
          console.log("User assigned groups:", validGroupIds)
          console.log("User groups found:", userGroups.map(g => ({ id: g.id, name: g.name })))
          console.log("All announcements:", allAnnouncements.length)
          console.log("Filtered announcements:", sortedAnnouncements.length)
          console.log("Announcements details:", sortedAnnouncements.map(a => ({ 
            id: a.id, 
            title: a.title, 
            groupIds: a.groupIds,
            groupId: a.groupId 
          })))
        }
      } catch (error) {
        console.error("Error fetching groups data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  const formatDate = (date: Date | Timestamp | string) => {
    let dateObj: Date
    
    if (date instanceof Timestamp) {
      dateObj = date.toDate()
    } else if (typeof date === 'string') {
      dateObj = new Date(date)
    } else {
      dateObj = date
    }

    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long", 
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getAnnouncementCount = (groupId: string) => {
    return announcements.filter(announcement => 
      (announcement.groupIds && announcement.groupIds.includes(groupId)) ||
      announcement.groupId === groupId
    ).length
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["student"]}>
        <MainLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </MainLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <MainLayout>
        <div className="space-y-8 max-w-5xl mx-auto px-2 sm:px-4 md:px-8">
          <div className="mb-2">
            <h1 className="text-4xl font-extrabold tracking-tight text-blue-900 mb-1 flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-blue-500 bg-blue-100 rounded-full p-1 shadow" />
              My Groups
            </h1>
            <p className="text-lg text-blue-700 font-medium">Your assigned groups and announcements</p>
          </div>

          {groups.length === 0 ? (
            <Card className="rounded-xl shadow bg-gray-50">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-blue-300 mb-4" />
                <h3 className="text-lg font-medium mb-2 text-blue-900">No Groups Assigned</h3>
                <p className="text-blue-700 text-center">
                  You haven't been assigned to any groups yet. Contact your administrator for group assignment.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {/* Groups Overview */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {groups.map((group) => (
                  <Card key={group.id} className="rounded-xl shadow border-l-4 border-blue-400 bg-white hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-12 w-12 shadow border-2 border-blue-200">
                          <AvatarImage src={group.groupImage || "/placeholder.svg"} />
                          <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">
                            {group.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="truncate text-blue-900 font-bold text-lg">{group.name}</CardTitle>
                          <CardDescription className="text-blue-700 flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            {getAnnouncementCount(group.id)} announcements
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-blue-800">{group.description}</p>

                      <div className="flex gap-2">
                        {group.discordLink && (
                          <Button size="sm" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50" asChild>
                            <a href={group.discordLink} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-1 text-blue-500" />
                              Discord
                            </a>
                          </Button>
                        )}
                        {group.hash13Link && (
                          <Button size="sm" variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50" asChild>
                            <a href={group.hash13Link} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-1 text-purple-500" />
                              Hash13
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Announcements */}
              <div>
                <h2 className="text-2xl font-bold text-blue-900 mb-4 flex items-center gap-2">
                  <MessageSquare className="h-6 w-6 text-blue-500" /> 
                  Group Announcements
                  <Badge variant="outline" className="ml-2 bg-blue-100 text-blue-700 border-blue-300">
                    {announcements.length} total
                  </Badge>
                </h2>
                {announcements.length === 0 ? (
                  <Card className="rounded-xl shadow bg-gray-50">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <MessageSquare className="h-12 w-12 text-blue-300 mb-4" />
                      <h3 className="text-lg font-medium mb-2 text-blue-900">No Announcements</h3>
                      <p className="text-blue-700 text-center">
                        No announcements have been posted to your groups yet.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {announcements.map((announcement) => (
                      <Card key={announcement.id} className="rounded-xl shadow-lg border-t-4 border-blue-400 hover:shadow-xl transition-shadow bg-white">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg font-bold text-blue-900 flex items-center gap-2">
                                {announcement.title}
                                {announcement.priority && (
                                  <Badge variant="destructive" className="text-xs">
                                    High Priority
                                  </Badge>
                                )}
                              </CardTitle>
                              <CardDescription className="flex flex-wrap items-center gap-2 mt-2 text-blue-700">
                                {/* Show which groups this announcement belongs to */}
                                {(announcement.groupIds || (announcement.groupId ? [announcement.groupId] : [])).map((groupId) => {
                                  const group = groups.find((g) => g.id === groupId)
                                  return (
                                    <Badge key={groupId} variant="secondary" className="bg-teal-100 text-teal-800 border-teal-300 font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                                      <BookOpen className="h-3 w-3" />
                                      {group?.name || "Unknown Group"}
                                    </Badge>
                                  )
                                })}
                                <span>•</span>
                                <span className="text-sm">
                                  {formatDate(announcement.createdAt)}
                                </span>
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="prose prose-sm max-w-none text-gray-800">
                            <p className="whitespace-pre-wrap">{announcement.content}</p>
                          </div>

                          {announcement.files && announcement.files.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                                <FileText className="h-4 w-4 text-blue-500" /> 
                                Attachments ({announcement.files.length})
                              </h4>
                              <div className="grid gap-3">
                                {announcement.files.map((file, index) => (
                                  <div
                                    key={file.id || index}
                                    className="flex flex-col gap-2 p-3 rounded-lg border bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer shadow-sm"
                                    onClick={() => setPreviewedAttachment(
                                      previewedAttachment && 
                                      previewedAttachment.announcementId === announcement.id && 
                                      previewedAttachment.fileIndex === index 
                                        ? null 
                                        : { announcementId: announcement.id, fileIndex: index }
                                    )}
                                    title="Click to preview"
                                  >
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-5 w-5 text-blue-500" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-blue-900 truncate">{file.name}</p>
                                        <p className="text-xs text-blue-700">
                                          {file.size ? (file.size / 1024 / 1024).toFixed(2) : "-"} MB • {file.type.split("/")[1]?.toUpperCase() || "FILE"}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="bg-blue-200 text-blue-800 font-semibold text-xs">
                                          {file.type.split("/")[1] || "file"}
                                        </Badge>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            window.open(file.url, '_blank')
                                          }}
                                          className="h-8 w-8 p-0"
                                          title="Download file"
                                        >
                                          <Download className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                    
                                    {/* File Preview */}
                                    {previewedAttachment && 
                                     previewedAttachment.announcementId === announcement.id && 
                                     previewedAttachment.fileIndex === index && (
                                      <div className="mt-2 border-t pt-2">
                                        {file.type.startsWith("image/") ? (
                                          <img src={file.url} alt={file.name} className="max-h-64 rounded border mx-auto shadow" />
                                        ) : file.type.startsWith("video/") ? (
                                          <video controls className="max-h-64 rounded border mx-auto shadow">
                                            <source src={file.url} type={file.type} />
                                            Your browser does not support the video tag.
                                          </video>
                                        ) : file.type.startsWith("audio/") ? (
                                          <audio controls className="w-full">
                                            <source src={file.url} type={file.type} />
                                            Your browser does not support the audio tag.
                                          </audio>
                                        ) : file.type === "application/pdf" ? (
                                          <iframe src={file.url} title={file.name} className="w-full h-96 border rounded shadow" />
                                        ) : (
                                          <div className="text-center py-4 text-gray-600">
                                            <FileText className="h-8 w-8 mx-auto mb-2" />
                                            <p className="text-sm">Preview not available for this file type</p>
                                            <Button 
                                              size="sm" 
                                              variant="outline" 
                                              onClick={() => window.open(file.url, '_blank')}
                                              className="mt-2"
                                            >
                                              Open in new tab
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    )}
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
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
}