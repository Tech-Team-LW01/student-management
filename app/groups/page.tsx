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
import { BookOpen, ExternalLink, FileText, Download, Eye } from "lucide-react"

export default function GroupsPage() {
  const { user } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !user.assignedGroups?.length) {
        setLoading(false)
        return
      }

      try {
        const validGroupIds = user.assignedGroups.filter((id) => id && id.trim() !== "")

        if (validGroupIds.length > 0) {
          const [allGroups, groupAnnouncements] = await Promise.all([getGroups(), getAnnouncements(validGroupIds)])

          const userGroups = allGroups.filter((group) => validGroupIds.includes(group.id))
          setGroups(userGroups)
          setAnnouncements(groupAnnouncements)
        }
      } catch (error) {
        console.error("Error fetching groups data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

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
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">My Groups</h1>
            <p className="text-muted-foreground">Your assigned groups and announcements</p>
          </div>

          {groups.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Groups Assigned</h3>
                <p className="text-muted-foreground text-center">
                  You haven't been assigned to any groups yet. Contact your administrator for group assignment.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Groups Overview */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {groups.map((group) => (
                  <Card key={group.id}>
                    <CardHeader>
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarImage src={group.groupImage || "/placeholder.svg"} />
                          <AvatarFallback>{group.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="truncate">{group.name}</CardTitle>
                          <CardDescription>Group Information</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">{group.description}</p>

                      <div className="flex gap-2">
                        {group.discordLink && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={group.discordLink} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Discord
                            </a>
                          </Button>
                        )}
                        {group.hash13Link && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={group.hash13Link} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3 mr-1" />
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
                <h2 className="text-2xl font-bold mb-4">Announcements</h2>
                {announcements.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Announcements</h3>
                      <p className="text-muted-foreground text-center">
                        No announcements have been posted to your groups yet.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {announcements.map((announcement) => (
                      <Card key={announcement.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle>{announcement.title}</CardTitle>
                              <CardDescription className="flex items-center gap-2 mt-2">
                                <Badge variant="secondary">
                                  {groups.find((g) => g.id === announcement.groupId)?.name || "Unknown Group"}
                                </Badge>
                                <span>•</span>
                                <span>
                                  {announcement.createdAt instanceof Date
                                    ? announcement.createdAt.toLocaleDateString()
                                    : "Recently"}
                                </span>
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="prose prose-sm max-w-none">
                            <p>{announcement.content}</p>
                          </div>

                          {announcement.files.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="text-sm font-medium">Attachments</h4>
                              <div className="grid gap-3">
                                {announcement.files.map((file) => (
                                  <div
                                    key={file.id}
                                    className="flex items-center justify-between p-3 border rounded-lg"
                                  >
                                    <div className="flex items-center space-x-3">
                                      <FileText className="h-5 w-5 text-muted-foreground" />
                                      <div>
                                        <p className="text-sm font-medium">{file.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {(file.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Badge variant={file.isDownloadable ? "default" : "secondary"}>
                                        {file.isDownloadable ? (
                                          <>
                                            <Download className="h-3 w-3 mr-1" />
                                            Downloadable
                                          </>
                                        ) : (
                                          <>
                                            <Eye className="h-3 w-3 mr-1" />
                                            View Only
                                          </>
                                        )}
                                      </Badge>
                                      <Button size="sm" variant="outline" asChild>
                                        <a
                                          href={file.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          {...(file.isDownloadable ? { download: file.name } : {})}
                                        >
                                          {file.isDownloadable ? "Download" : "View"}
                                        </a>
                                      </Button>
                                    </div>
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
