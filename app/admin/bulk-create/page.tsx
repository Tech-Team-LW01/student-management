"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle2, XCircle, Copy, RefreshCw, Users } from "lucide-react"
import { toast } from "sonner"
import { getGroups, assignUserToGroups } from "@/lib/firebase-utils"
import type { Group } from "@/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface UserCreationResult {
  email: string
  status: "success" | "error"
  message: string
  password?: string
  userId?: string
}

export default function BulkCreatePage() {
  const [emails, setEmails] = useState("")
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<UserCreationResult[]>([])
  const [error, setError] = useState("")
  const [showPasswords, setShowPasswords] = useState(true)
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false)
  const [assigningGroups, setAssigningGroups] = useState(false)
  const [selectedMode, setSelectedMode] = useState<"online" | "offline" | "">("")

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    try {
      const groupsData = await getGroups()
      setGroups(groupsData)
    } catch (error) {
      console.error("Error fetching groups:", error)
    }
  }

  const handleGroupSelection = (groupId: string, checked: boolean) => {
    if (checked) {
      setSelectedGroups(prev => [...prev, groupId])
    } else {
      setSelectedGroups(prev => prev.filter(id => id !== groupId))
    }
  }

  const handleAssignGroups = async () => {
    if (!selectedGroups.length) {
      toast.error("Please select at least one group")
      return
    }

    setAssigningGroups(true)
    try {
      // Get all successful user IDs from results
      const userIds = results
        .filter(result => result.status === "success" && result.userId)
        .map(result => result.userId!)

      if (userIds.length === 0) {
        toast.error("No users to assign to groups")
        return
      }

      // Assign each user to the selected groups
      for (const userId of userIds) {
        await assignUserToGroups(userId, selectedGroups)
      }

      toast.success(`Successfully assigned ${userIds.length} users to ${selectedGroups.length} groups`)
      setIsGroupDialogOpen(false)
    } catch (error) {
      console.error("Error assigning users to groups:", error)
      toast.error("Failed to assign users to groups")
    } finally {
      setAssigningGroups(false)
    }
  }

  const validateEmails = (emailList: string[]): string[] => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailList
      .map(email => email.trim())
      .filter(email => email && emailRegex.test(email))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
  }

  const regeneratePassword = async (userId: string, email: string) => {
    try {
      const response = await fetch('/api/regenerate-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, email }),
      })

      if (!response.ok) {
        throw new Error('Failed to regenerate password')
      }

      const data = await response.json()
      
      // Update results with new password
      setResults(prev => prev.map(result => 
        result.userId === userId 
          ? { ...result, password: data.password }
          : result
      ))

      toast.success("Password regenerated and sent to user")
    } catch (error) {
      toast.error("Failed to regenerate password")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setResults([])

    try {
      const emailList = emails.split(",")
      const validEmails = validateEmails(emailList)

      if (validEmails.length === 0) {
        setError("Please enter valid email addresses")
        setLoading(false)
        return
      }

      if (!selectedMode) {
        setError("Please select a batch mode")
        setLoading(false)
        return
      }

      // Call the API route
      const response = await fetch('/api/bulk-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          users: validEmails.map(email => ({
            email,
            role: 'student',
            status: 'active',
            mode: selectedMode as "online" | "offline",
            createdAt: new Date().toISOString(),
          })),
          selectedGroups: selectedGroups
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create users')
      }

      const data = await response.json()
      
      if (data.errors && data.errors.length > 0) {
        setError(`Failed to create some users: ${data.errors.map((e: any) => e.email).join(', ')}`)
      }

      if (data.results && data.results.length > 0) {
        setResults(data.results)
        toast.success("Users created successfully")
      }
    } catch (error: any) {
      setError(error.message || "An error occurred")
      toast.error("Failed to create users")
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
      <MainLayout>
        <div className="container mx-auto py-6 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Bulk Create Students</CardTitle>
                {results.length > 0 && (
                  <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Users className="h-4 w-4 mr-2" />
                        Assign to Groups
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Assign to Groups</DialogTitle>
                        <DialogDescription>
                          Select the groups to assign the newly created users to
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <ScrollArea className="h-[300px] pr-4">
                          <div className="space-y-2">
                            {groups.map((group) => (
                              <label
                                key={group.id}
                                className="flex items-start space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors"
                              >
                                <Checkbox
                                  id={`group-${group.id}`}
                                  checked={selectedGroups.includes(group.id)}
                                  onCheckedChange={(checked) =>
                                    handleGroupSelection(group.id, checked as boolean)
                                  }
                                  className="mt-0.5"
                                />
                                <div className="flex-1">
                                  <p className="text-sm font-medium leading-none">
                                    {group.name}
                                  </p>
                                  {group.description && (
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                      {group.description}
                                    </p>
                                  )}
                                </div>
                              </label>
                            ))}
                          </div>
                        </ScrollArea>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">
                            {selectedGroups.length} group{selectedGroups.length !== 1 ? 's' : ''} selected
                          </span>
                          {selectedGroups.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedGroups([])}
                              className="h-auto p-1 text-xs"
                            >
                              Clear all
                            </Button>
                          )}
                        </div>
                        <Button 
                          onClick={handleAssignGroups} 
                          disabled={assigningGroups || !selectedGroups.length}
                          className="w-full"
                        >
                          {assigningGroups ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Assigning...
                            </>
                          ) : (
                            "Assign to Selected Groups"
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Enter email addresses (comma-separated)
                  </label>
                  <Textarea
                    placeholder="student1@example.com, student2@example.com, ..."
                    value={emails}
                    onChange={(e) => setEmails(e.target.value)}
                    className="h-32"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Batch Mode *
                  </label>
                  <Select value={selectedMode} onValueChange={(value: "online" | "offline") => setSelectedMode(value)}>
                    <SelectTrigger className={!selectedMode ? "border-red-300 focus:border-red-500" : ""}>
                      <SelectValue placeholder="Please select batch mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="online">Online Batch</SelectItem>
                      <SelectItem value="offline">Offline Batch</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    All users will be assigned to the selected batch mode.
                  </p>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Users
                </Button>
              </form>

              {results.length > 0 && (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Created Accounts</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPasswords(!showPasswords)}
                    >
                      {showPasswords ? "Hide Passwords" : "Show Passwords"}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {results.map((result, index) => (
                      <Alert
                        key={index}
                        variant={result.status === "success" ? "default" : "destructive"}
                        className="relative"
                      >
                        {result.status === "success" ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        <AlertTitle>{result.email}</AlertTitle>
                        <AlertDescription>
                          {result.message}
                          {result.password && showPasswords && (
                            <div className="mt-2 space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                                  {result.password}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(result.password!)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => regeneratePassword(result.userId!, result.email)}
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>

                  {/* New Group Assignment Section */}
                  <div className="mt-6 pt-6 border-t">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-medium">Group Assignment</h3>
                        <p className="text-sm text-muted-foreground">
                          Assign the newly created users to groups
                        </p>
                      </div>
                      <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
                        <DialogTrigger asChild>
                          <Button>
                            <Users className="h-4 w-4 mr-2" />
                            Assign to Groups
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Assign to Groups</DialogTitle>
                            <DialogDescription>
                              Select the groups to assign the newly created users to
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <ScrollArea className="h-[300px] pr-4">
                              <div className="space-y-2">
                                {groups.map((group) => (
                                  <label
                                    key={group.id}
                                    className="flex items-start space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors"
                                  >
                                    <Checkbox
                                      id={`group-${group.id}`}
                                      checked={selectedGroups.includes(group.id)}
                                      onCheckedChange={(checked) =>
                                        handleGroupSelection(group.id, checked as boolean)
                                      }
                                      className="mt-0.5"
                                    />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium leading-none">
                                        {group.name}
                                      </p>
                                      {group.description && (
                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                          {group.description}
                                        </p>
                                      )}
                                    </div>
                                  </label>
                                ))}
                              </div>
                            </ScrollArea>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-muted-foreground">
                                {selectedGroups.length} group{selectedGroups.length !== 1 ? 's' : ''} selected
                              </span>
                              {selectedGroups.length > 0 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedGroups([])}
                                  className="h-auto p-1 text-xs"
                                >
                                  Clear all
                                </Button>
                              )}
                            </div>
                            <Button 
                              onClick={handleAssignGroups} 
                              disabled={assigningGroups || !selectedGroups.length}
                              className="w-full"
                            >
                              {assigningGroups ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Assigning...
                                </>
                              ) : (
                                "Assign to Selected Groups"
                              )}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    {selectedGroups.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedGroups.map(groupId => {
                          const group = groups.find(g => g.id === groupId)
                          return group ? (
                            <Badge key={groupId} variant="secondary" className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {group.name}
                            </Badge>
                          ) : null
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
} 