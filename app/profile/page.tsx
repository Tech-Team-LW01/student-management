"use client"

import type React from "react"
import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { uploadFile } from "@/lib/firebase-utils"
import { Upload, Save } from "lucide-react"

export default function ProfilePage() {
  const { user, updateUser } = useAuth() // Changed from updateProfile to updateUser
  const [formData, setFormData] = useState({
    name: user?.name || "",
    mobileNumber: user?.mobileNumber || "",
    profileImage: user?.profileImage || "",
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    try {
      setLoading(true)
      setError("") // Clear any previous errors
      const imagePath = `profiles/${user.id}/${Date.now()}-${file.name}`
      const imageUrl = await uploadFile(file, imagePath)
      setFormData((prev) => ({ ...prev, profileImage: imageUrl }))
      setSuccess("Image uploaded successfully!")
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000)
    } catch (error) {
      console.error("Error uploading image:", error)
      setError("Failed to upload image")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      await updateUser(formData) // Changed from updateProfile to updateUser
      setSuccess("Profile updated successfully!")
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000)
    } catch (error) {
      console.error("Error updating profile:", error)
      setError("Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  // Helper function to format date
  const formatDate = (date: any) => {
    if (!date) return "Unknown"
    
    // Handle Firestore Timestamp
    if (date?.toDate && typeof date.toDate === 'function') {
      return date.toDate().toLocaleDateString()
    }
    
    // Handle Date object
    if (date instanceof Date) {
      return date.toLocaleDateString()
    }
    
    // Handle string date
    if (typeof date === 'string') {
      return new Date(date).toLocaleDateString()
    }
    
    return "Unknown"
  }

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold">LinuxWorld Profile Settings</h1>
            <p className="text-muted-foreground">Manage your LinuxWorld account information</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your profile details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="bg-green-50 border-green-200">
                    <AlertDescription className="text-green-800">{success}</AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-center">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={formData.profileImage || "/placeholder.svg"} />
                      <AvatarFallback className="text-lg">
                        {formData.name ? formData.name.charAt(0).toUpperCase() : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <label 
                      className={`absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 ${
                        loading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <Upload className="h-4 w-4" />
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                        className="hidden" 
                        disabled={loading}
                      />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={user?.email || ""} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobileNumber">Mobile Number</Label>
                  <Input
                    id="mobileNumber"
                    type="tel"
                    value={formData.mobileNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, mobileNumber: e.target.value }))}
                    placeholder="Enter your mobile number"
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Role</Label>
                  <p className="text-sm text-muted-foreground capitalize">
                    {user?.role?.replace(/_/g, " ") || "N/A"}
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Registration Date</Label>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(user?.registrationDate)}
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Account Status</Label>
                  <p className={`text-sm ${user?.isApproved ? 'text-green-600' : 'text-yellow-600'}`}>
                    {user?.isApproved ? "✓ Approved" : "⏳ Pending Approval"}
                  </p>
                </div>

                {user?.role === "student" && (
                  <div>
                    <Label className="text-sm font-medium">Assigned Groups</Label>
                    <p className="text-sm text-muted-foreground">
                      {user?.assignedGroups?.length || 0} group{(user?.assignedGroups?.length || 0) !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
}