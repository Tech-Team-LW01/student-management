"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getNotificationsForUser, markNotificationAsRead } from "@/lib/firebase-utils"
import { useAuth } from "@/contexts/auth-context"
import type { Notification } from "@/types"
import { Bell, Users, UserCheck, Globe, Mail } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export default function NotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (user) {
      fetchNotifications()
    }
  }, [user])

  const fetchNotifications = async () => {
    if (!user) return

    try {
      const notificationsData = await getNotificationsForUser(user.id)
      setNotifications(notificationsData)
      setLoading(false)

      // Mark unread notifications as read
      const unreadNotifications = notificationsData.filter(
        n => !n.readBy.includes(user.id)
      )
      await Promise.all(
        unreadNotifications.map(n => markNotificationAsRead(n.id, user.id))
      )
    } catch (error) {
      console.error("Error fetching notifications:", error)
      setError("Failed to load notifications")
      setLoading(false)
    }
  }

  const formatDate = (date: Date | any) => {
    if (!date) return "Unknown"
    const dateObj = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date)
    return formatDistanceToNow(dateObj, { addSuffix: true })
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
        <div className="space-y-8 max-w-3xl mx-auto px-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Notifications</h1>
            <p className="text-gray-500">View your notifications and updates</p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {notifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-6">
                <Bell className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No notifications yet</p>
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
                          Received {formatDate(notification.createdAt)}
                        </CardDescription>
                      </div>
                      {!notification.readBy.includes(user?.id || "") && (
                        <Badge>New</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 whitespace-pre-wrap">{notification.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
} 