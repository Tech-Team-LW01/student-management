"use client"

import { useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, Database, Shield, Users, BookOpen } from "lucide-react"
import Link from "next/link"

export default function SetupPage() {
  const [copied, setCopied] = useState(false)

  const firestoreRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user is admin (with better error handling)
    function isAdmin() {
      return request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'super_admin'];
    }
    
    // Helper function to check if user is group admin
    function isGroupAdmin() {
      return request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'group_admin';
    }
    
    // Helper function to check if user can write announcements
    function canWriteAnnouncements() {
      return request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'super_admin', 'group_admin'];
    }
    
    // Users collection
    match /users/{userId} {
      // Users can read and write their own user document
      allow read, write: if isAuthenticated() && request.auth.uid == userId;
      
      // Admins can read all users
      allow read: if isAdmin();
      
      // Admins can write to any user document (for approval, group assignment, etc.)
      allow write: if isAdmin();
      
      // Allow user creation during signup (before user document exists)
      allow create: if isAuthenticated() && request.auth.uid == userId;
      
      // Allow admins to update user approval status and group assignments
      allow update: if isAdmin() && 
        (request.resource.data.diff(resource.data).affectedKeys().hasOnly(['isApproved', 'assignedGroups', 'updatedAt']) ||
         request.resource.data.diff(resource.data).affectedKeys().hasOnly(['isApproved', 'updatedAt']) ||
         request.resource.data.diff(resource.data).affectedKeys().hasOnly(['assignedGroups', 'updatedAt']));
    }
    
    // Groups - readable by all authenticated users, writable by admins
    match /groups/{groupId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
      allow create: if isAdmin();
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }
    
    // Announcements - readable by all authenticated users, writable by admins and group admins
    match /announcements/{announcementId} {
      allow read: if isAuthenticated();
      allow write: if canWriteAnnouncements();
      allow create: if canWriteAnnouncements();
      allow update: if canWriteAnnouncements();
      allow delete: if canWriteAnnouncements();
    }
  }
}`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(firestoreRules)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const setupSteps = [
    {
      title: "Set up Firestore Security Rules",
      description: "Configure proper security rules to allow admin operations",
      icon: Shield,
      status: "required",
      action: "Copy rules below and paste them in Firebase Console → Firestore → Rules",
    },
    {
      title: "Create Your First Group",
      description: "Set up groups for organizing students",
      icon: BookOpen,
      status: "recommended",
      action: "Go to Groups Management",
      link: "/admin/groups",
    },
    {
      title: "Review Student Registrations",
      description: "Approve students who have registered",
      icon: Users,
      status: "ongoing",
      action: "Check Pending Approvals",
      link: "/admin/approvals",
    },
    {
      title: "Create Announcements",
      description: "Share information with your groups",
      icon: Database,
      status: "optional",
      action: "Create Announcement",
      link: "/admin/announcements",
    },
  ]

  return (
    <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
      <MainLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">System Setup</h1>
            <p className="text-muted-foreground">Configure your classroom management system</p>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              If you're experiencing permission errors, make sure to complete the Firestore security rules setup below
              and refresh your browser after applying the rules.
            </AlertDescription>
          </Alert>

          <div className="grid gap-6">
            {setupSteps.map((step, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <step.icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{step.title}</CardTitle>
                        <CardDescription>{step.description}</CardDescription>
                      </div>
                    </div>
                    <Badge
                      variant={
                        step.status === "required"
                          ? "destructive"
                          : step.status === "recommended"
                            ? "default"
                            : "secondary"
                      }
                    >
                      {step.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{step.action}</p>
                  {step.link ? (
                    <Button asChild>
                      <Link href={step.link}>Get Started</Link>
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">Firestore Security Rules</h4>
                          <Button size="sm" variant="outline" onClick={copyToClipboard}>
                            {copied ? (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Copied!
                              </>
                            ) : (
                              "Copy Rules"
                            )}
                          </Button>
                        </div>
                        <pre className="text-xs bg-white p-3 rounded border overflow-x-auto max-h-96">
                          <code>{firestoreRules}</code>
                        </pre>
                      </div>
                      <div className="space-y-2">
                        <h5 className="font-medium text-sm">How to apply these rules:</h5>
                        <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                          <li>Go to your Firebase Console</li>
                          <li>Select your project</li>
                          <li>Navigate to Firestore Database</li>
                          <li>Click on the "Rules" tab</li>
                          <li>Replace the existing rules with the rules above</li>
                          <li>Click "Publish" to save the changes</li>
                          <li>
                            <strong>Refresh your browser</strong> after applying the rules
                          </li>
                        </ol>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <CardTitle className="text-green-900">Setup Complete!</CardTitle>
              </div>
              <CardDescription className="text-green-700">
                Once you've completed the required steps above, your classroom management system will be fully
                functional. Remember to refresh your browser after applying the Firestore rules.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
}
