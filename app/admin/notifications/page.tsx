"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getAllNotifications, sendNotification, getGroups, getUsers } from "@/lib/firebase-utils"
import { useAuth } from "@/contexts/auth-context"
import type { Notification, Group, User } from "@/types"
import { Bell, Users, UserCheck, Globe, Mail } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export default function AdminNotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [students, setStudents] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")

  // Form state
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [recipientType, setRecipientType] = useState<"individual" | "group" | "mode" | "bulk">("individual")
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([])
  const [selectedMode, setSelectedMode] = useState<"online" | "offline">("online")
  const [bulkEmails, setBulkEmails] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [notificationsData, groupsData, usersData] = await Promise.all([
        getAllNotifications(),
        getGroups(),
        getUsers()
      ])
      setNotifications(notificationsData)
      setGroups(groupsData)
      setStudents(usersData.filter(u => u.role === "student"))
      setLoading(false)
    } catch (error) {
      console.error("Error fetching data:", error)
      setError("Failed to load data")
      setLoading(false)
    }
  }

  const handleSendNotification = async () => {
    if (!title.trim() || !content.trim() || !user) return

    setSending(true)
    try {
      const recipients: Notification["recipients"] = {
        type: recipientType,
        ...(recipientType === "individual" && { userIds: selectedUserIds }),
        ...(recipientType === "group" && { groupIds: selectedGroupIds }),
        ...(recipientType === "mode" && { mode: selectedMode }),
        ...(recipientType === "bulk" && { 
          emails: bulkEmails.split(",").map(email => email.trim()).filter(Boolean)
        })
      }

      await sendNotification({
        title: title.trim(),
        content: content.trim(),
        createdBy: user.id,
        recipients
      })

      // Reset form
      setTitle("")
      setContent("")
      setSelectedUserIds([])
      setSelectedGroupIds([])
      setBulkEmails("")

      // Refresh notifications
      const newNotifications = await getAllNotifications()
      setNotifications(newNotifications)
    } catch (error) {
      console.error("Error sending notification:", error)
      setError("Failed to send notification")
    } finally {
      setSending(false)
    }
  }

  const formatDate = (date: Date | any) => {
    if (!date) return "Unknown"
    const dateObj = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date)
    return formatDistanceToNow(dateObj, { addSuffix: true })
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
        <MainLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </MainLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
      <MainLayout>
        <div className="space-y-8 max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
              <p className="text-gray-500">Send and manage notifications to students</p>
            </div>
          </div>

          {/* Send Notification Form */}
          <Card>
            <CardHeader>
              <CardTitle>Send New Notification</CardTitle>
              <CardDescription>Create and send notifications to students</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Input
                  placeholder="Notification Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Textarea
                  placeholder="Notification Content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Select
                  value={recipientType}
                  onValueChange={(value: any) => setRecipientType(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select recipient type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual Students</SelectItem>
                    <SelectItem value="group">Groups</SelectItem>
                    <SelectItem value="mode">By Mode (Online/Offline)</SelectItem>
                    <SelectItem value="bulk">Bulk Emails</SelectItem>
                  </SelectContent>
                </Select>

                {recipientType === "individual" && (
                  <Select
                    value={selectedUserIds[0]}
                    onValueChange={(value) => setSelectedUserIds([value])}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name} ({student.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {recipientType === "group" && (
                  <Select
                    value={selectedGroupIds[0]}
                    onValueChange={(value) => setSelectedGroupIds([value])}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select group" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {recipientType === "mode" && (
                  <Select
                    value={selectedMode}
                    onValueChange={(value: any) => setSelectedMode(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="online">Online Students</SelectItem>
                      <SelectItem value="offline">Offline Students</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                {recipientType === "bulk" && (
                  <Textarea
                    placeholder="Enter email addresses separated by commas"
                    value={bulkEmails}
                    onChange={(e) => setBulkEmails(e.target.value)}
                    rows={3}
                  />
                )}
              </div>

              <Button
                onClick={handleSendNotification}
                disabled={!title.trim() || !content.trim() || sending}
                className="w-full"
              >
                {sending ? "Sending..." : "Send Notification"}
              </Button>
            </CardContent>
          </Card>

          {/* Notifications List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Notifications</h2>
            
            {notifications.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-6">
                  <Bell className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">No notifications sent yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <Card key={notification.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{notification.title}</CardTitle>
                          <CardDescription>
                            Sent {formatDate(notification.createdAt)}
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="ml-2">
                          {notification.recipients.type === "individual" && (
                            <UserCheck className="h-3 w-3 mr-1" />
                          )}
                          {notification.recipients.type === "group" && (
                            <Users className="h-3 w-3 mr-1" />
                          )}
                          {notification.recipients.type === "mode" && (
                            <Globe className="h-3 w-3 mr-1" />
                          )}
                          {notification.recipients.type === "bulk" && (
                            <Mail className="h-3 w-3 mr-1" />
                          )}
                          {notification.recipients.type}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 whitespace-pre-wrap">{notification.content}</p>
                      <div className="mt-4 flex items-center gap-2">
                        <Badge variant="secondary">
                          {notification.readBy.length} read
                        </Badge>
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