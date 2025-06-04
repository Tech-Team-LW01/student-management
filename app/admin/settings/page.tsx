"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Database,
  Bell,
  Globe,
  Lock,
  AlertTriangle,
  CheckCircle,
  SettingsIcon,
  Crown,
  Wifi,
  WifiOff,
} from "lucide-react"
import { getPlatformSettings, savePlatformSettings } from "@/lib/firebase-utils"
import { useAuth } from "@/contexts/auth-context"

export default function PlatformSettingsPage() {
  const { user } = useAuth()
  const [settings, setSettings] = useState({
    platformName: "LinuxWorld Classroom",
    platformDescription: "LinuxWorld's comprehensive classroom group management platform",
    allowSelfRegistration: true,
    requireEmailVerification: false,
    autoApproveStudents: false,
    maxGroupsPerUser: 10,
    maxFileSizeMB: 50,
    allowedFileTypes: "pdf,doc,docx,xls,xlsx,ppt,pptx,jpg,jpeg,png,gif,mp4,mp3",
    emailNotifications: true,
    announcementNotifications: true,
    maintenanceMode: false,
    backupFrequency: "daily",
  })

  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const [isOnline, setIsOnline] = useState(true)
  const [settingsSource, setSettingsSource] = useState<"firestore" | "default">("default")

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setError("")
        console.log("🔄 Loading platform settings...")

        const platformSettings = await getPlatformSettings()
        console.log("📋 Loaded settings:", platformSettings)

        setSettings((prev) => ({ ...prev, ...platformSettings }))
        setSettingsSource("firestore")
        console.log("✅ Settings loaded successfully")
      } catch (error: any) {
        console.error("❌ Error loading settings:", error)
        setError(`Failed to load platform settings: ${error.message}`)
        setSettingsSource("default")

        // Use default settings if loading fails
        console.log("🔄 Using default settings as fallback")
      } finally {
        setInitialLoading(false)
      }
    }

    loadSettings()
  }, [])

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const handleSave = async () => {
    if (!user) {
      setError("You must be logged in to save settings.")
      return
    }

    if (user.role !== "super_admin") {
      setError("Only Super Admins can modify platform settings.")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      console.log("💾 Saving platform settings...")
      await savePlatformSettings(settings, user.id)
      setSuccess("Platform settings updated successfully!")
      setSettingsSource("firestore")
      setTimeout(() => setSuccess(""), 5000)
      console.log("✅ Settings saved successfully")
    } catch (err: any) {
      console.error("❌ Error saving settings:", err)
      setError(err.message || "Failed to update settings. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  if (initialLoading) {
    return (
      <ProtectedRoute allowedRoles={["super_admin"]}>
        <MainLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading LinuxWorld platform settings...</p>
            </div>
          </div>
        </MainLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["super_admin"]}>
      <MainLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Crown className="h-8 w-8 text-red-600" />
                Platform Settings
              </h1>
              <p className="text-muted-foreground">Configure global LinuxWorld platform settings (Super Admin Only)</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-red-100 text-red-800 border-red-200">
                <Crown className="h-3 w-3 mr-1" />
                Super Admin Access
              </Badge>
              <Badge variant={isOnline ? "default" : "destructive"}>
                {isOnline ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
                {isOnline ? "Online" : "Offline"}
              </Badge>
            </div>
          </div>

          {/* Connection Status */}
          {settingsSource === "default" && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Using default settings. Some features may be limited. Check your internet connection and Firestore
                permissions.
              </AlertDescription>
            </Alert>
          )}

          {/* Alerts */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Permission Check */}
          {user?.role !== "super_admin" && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Access Denied: Only Super Admins can access platform settings. Your current role:{" "}
                {user?.role || "Unknown"}
              </AlertDescription>
            </Alert>
          )}

          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                General Platform Settings
              </CardTitle>
              <CardDescription>Basic configuration for your LinuxWorld platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="platformName">Platform Name</Label>
                  <Input
                    id="platformName"
                    value={settings.platformName}
                    onChange={(e) => handleInputChange("platformName", e.target.value)}
                    placeholder="Enter platform name"
                    disabled={user?.role !== "super_admin"}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxGroupsPerUser">Max Groups per User</Label>
                  <Input
                    id="maxGroupsPerUser"
                    type="number"
                    value={settings.maxGroupsPerUser}
                    onChange={(e) => handleInputChange("maxGroupsPerUser", Number.parseInt(e.target.value))}
                    min="1"
                    max="50"
                    disabled={user?.role !== "super_admin"}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="platformDescription">Platform Description</Label>
                <Textarea
                  id="platformDescription"
                  value={settings.platformDescription}
                  onChange={(e) => handleInputChange("platformDescription", e.target.value)}
                  placeholder="Enter platform description"
                  rows={3}
                  disabled={user?.role !== "super_admin"}
                />
              </div>
            </CardContent>
          </Card>

          {/* User Registration Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                User Registration & Access
              </CardTitle>
              <CardDescription>Control how users can register and access the platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Self Registration</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow users to register themselves without admin invitation
                  </p>
                </div>
                <Switch
                  checked={settings.allowSelfRegistration}
                  onCheckedChange={(checked) => handleInputChange("allowSelfRegistration", checked)}
                  disabled={user?.role !== "super_admin"}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Email Verification</Label>
                  <p className="text-sm text-muted-foreground">
                    Users must verify their email before accessing the platform
                  </p>
                </div>
                <Switch
                  checked={settings.requireEmailVerification}
                  onCheckedChange={(checked) => handleInputChange("requireEmailVerification", checked)}
                  disabled={user?.role !== "super_admin"}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-Approve Students</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically approve student registrations without admin review
                  </p>
                </div>
                <Switch
                  checked={settings.autoApproveStudents}
                  onCheckedChange={(checked) => handleInputChange("autoApproveStudents", checked)}
                  disabled={user?.role !== "super_admin"}
                />
              </div>

              {settings.autoApproveStudents && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Auto-approval is enabled. New students will automatically get dashboard access without admin
                    approval.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* File Upload Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                File Upload Configuration
              </CardTitle>
              <CardDescription>Configure file upload limits and allowed file types</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxFileSizeMB">Max File Size (MB)</Label>
                  <Input
                    id="maxFileSizeMB"
                    type="number"
                    value={settings.maxFileSizeMB}
                    onChange={(e) => handleInputChange("maxFileSizeMB", Number.parseInt(e.target.value))}
                    min="1"
                    max="500"
                    disabled={user?.role !== "super_admin"}
                  />
                  <p className="text-xs text-muted-foreground">Maximum file size for uploads in megabytes</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="backupFrequency">Backup Frequency</Label>
                  <select
                    id="backupFrequency"
                    value={settings.backupFrequency}
                    onChange={(e) => handleInputChange("backupFrequency", e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md"
                    disabled={user?.role !== "super_admin"}
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="allowedFileTypes">Allowed File Types</Label>
                <Input
                  id="allowedFileTypes"
                  value={settings.allowedFileTypes}
                  onChange={(e) => handleInputChange("allowedFileTypes", e.target.value)}
                  placeholder="pdf,doc,docx,jpg,png..."
                  disabled={user?.role !== "super_admin"}
                />
                <p className="text-xs text-muted-foreground">Comma-separated list of allowed file extensions</p>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>Configure platform-wide notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Send email notifications for important platform events
                  </p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => handleInputChange("emailNotifications", checked)}
                  disabled={user?.role !== "super_admin"}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Announcement Notifications</Label>
                  <p className="text-sm text-muted-foreground">Notify users when new announcements are posted</p>
                </div>
                <Switch
                  checked={settings.announcementNotifications}
                  onCheckedChange={(checked) => handleInputChange("announcementNotifications", checked)}
                  disabled={user?.role !== "super_admin"}
                />
              </div>
            </CardContent>
          </Card>

          {/* Security & Maintenance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Security & Maintenance
              </CardTitle>
              <CardDescription>Platform security and maintenance settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    Maintenance Mode
                  </Label>
                  <p className="text-sm text-muted-foreground">Enable maintenance mode to restrict platform access</p>
                </div>
                <Switch
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => handleInputChange("maintenanceMode", checked)}
                  disabled={user?.role !== "super_admin"}
                />
              </div>

              {settings.maintenanceMode && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Maintenance mode is enabled. Only Super Admins can access the platform.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={loading || user?.role !== "super_admin" || !isOnline} size="lg">
              {loading ? "Saving..." : "Save All Settings"}
            </Button>
          </div>

          {/* Debug Info */}
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle className="text-sm">Debug Information</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              <p>
                <strong>User Role:</strong> {user?.role || "Unknown"}
              </p>
              <p>
                <strong>Settings Source:</strong> {settingsSource}
              </p>
              <p>
                <strong>Online Status:</strong> {isOnline ? "Connected" : "Disconnected"}
              </p>
              <p>
                <strong>Can Save:</strong> {user?.role === "super_admin" && isOnline ? "Yes" : "No"}
              </p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
}
