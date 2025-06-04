// app/(authenticated)/settings/page.tsx
"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { MainLayout } from "@/components/layout/main-layout"
import { NotificationPreferences } from "../../admin/settings/notification-preferences"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Bell } from "lucide-react"

export default function SettingsPage() {
  return (
    <ProtectedRoute allowedRoles={["student", "group_admin", "admin", "super_admin"]}>
      <MainLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your account settings and preferences</p>
          </div>

          <Tabs defaultValue="notifications" className="space-y-4">
            <TabsList>
              <TabsTrigger value="profile">
                <User className="h-4 w-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="notifications">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Settings</CardTitle>
                  <CardDescription>Update your profile information</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Add profile settings here */}
                  <p className="text-muted-foreground">Profile settings coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <NotificationPreferences />
            </TabsContent>
          </Tabs>
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
}