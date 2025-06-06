"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { getGroups, createGroup, updateGroup, deleteGroup, uploadFile, getStudentsByGroupId, removeUserFromGroup } from "@/lib/firebase-utils"
import { useAuth } from "@/contexts/auth-context"
import type { Group, User } from "@/types"
import { Plus, Edit, Trash2, Upload, ExternalLink, Users, UserMinus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function GroupsPage() {
  const { user } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    discordLink: "",
    hash13Link: "",
    groupImage: "",
  })
  const [formLoading, setFormLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [groupMembers, setGroupMembers] = useState<User[]>([])
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false)
  const [membersLoading, setMembersLoading] = useState(false)
  const [removingMember, setRemovingMember] = useState<string | null>(null)

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    try {
      const groupsData = await getGroups()
      setGroups(groupsData)
    } catch (error) {
      console.error("Error fetching groups:", error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      discordLink: "",
      hash13Link: "",
      groupImage: "",
    })
    setEditingGroup(null)
    setError("")
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setFormLoading(true)
      const imagePath = `groups/${Date.now()}-${file.name}`
      const imageUrl = await uploadFile(file, imagePath)
      setFormData((prev) => ({ ...prev, groupImage: imageUrl }))
    } catch (error) {
      console.error("Error uploading image:", error)
      setError("Failed to upload image")
    } finally {
      setFormLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setFormLoading(true)
    setError("")

    try {
      const groupData = {
        ...formData,
        createdBy: user.id,
        memberCount: 0,
        members: [],
      }

      if (editingGroup) {
        await updateGroup(editingGroup.id, groupData)
        setGroups((prev) =>
          prev.map((group) =>
            group.id === editingGroup.id ? { ...group, ...groupData, updatedAt: new Date() } : group,
          ),
        )
      } else {
        const groupId = await createGroup(groupData)
        const newGroup: Group = {
          id: groupId,
          ...groupData,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        setGroups((prev) => [newGroup, ...prev])
      }

      resetForm()
      setIsCreateDialogOpen(false)
    } catch (error) {
      console.error("Error saving group:", error)
      setError("Failed to save group")
    } finally {
      setFormLoading(false)
    }
  }

  const handleEdit = (group: Group) => {
    setFormData({
      name: group.name || "",
      description: group.description || "",
      discordLink: group.discordLink || "",
      hash13Link: group.hash13Link || "",
      groupImage: group.groupImage || "",
    })
    setEditingGroup(group)
    setIsCreateDialogOpen(true)
  }

  const handleDelete = async (groupId: string) => {
    if (!confirm("Are you sure you want to delete this group? This action cannot be undone.")) {
      return
    }

    try {
      await deleteGroup(groupId)
      setGroups((prev) => prev.filter((group) => group.id !== groupId))
    } catch (error) {
      console.error("Error deleting group:", error)
    }
  }

  const handleViewMembers = async (group: Group) => {
    setSelectedGroup(group)
    setIsMembersDialogOpen(true)
    setMembersLoading(true)
    setGroupMembers([])

    try {
      const members = await getStudentsByGroupId(group.id)
      setGroupMembers(members)
    } catch (error) {
      console.error("Error fetching group members:", error)
    } finally {
      setMembersLoading(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedGroup) return

    setRemovingMember(memberId)
    try {
      await removeUserFromGroup(memberId, selectedGroup.id)
      
      // Update local state
      setGroupMembers((prev) => prev.filter((member) => member.id !== memberId))
      setGroups((prev) =>
        prev.map((group) =>
          group.id === selectedGroup.id
            ? { ...group, memberCount: group.memberCount - 1, members: group.members.filter((id) => id !== memberId) }
            : group,
        ),
      )
    } catch (error) {
      console.error("Error removing member:", error)
      setError("Failed to remove member")
    } finally {
      setRemovingMember(null)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
        <MainLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </MainLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["super_admin", "admin"]}>
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">LinuxWorld Groups Management</h1>
              <p className="text-muted-foreground">Create and manage LinuxWorld student groups</p>
            </div>
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={(open) => {
                setIsCreateDialogOpen(open)
                if (!open) resetForm()
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Group
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingGroup ? "Edit Group" : "Create New Group"}</DialogTitle>
                  <DialogDescription>
                    {editingGroup ? "Update group information" : "Add a new group for students"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex justify-center">
                    <div className="relative">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={formData.groupImage || "/placeholder.svg"} />
                        <AvatarFallback>{formData.name ? formData.name.charAt(0).toUpperCase() : "G"}</AvatarFallback>
                      </Avatar>
                      <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-1 rounded-full cursor-pointer hover:bg-blue-700">
                        <Upload className="h-3 w-3" />
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Group Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                        required
                        placeholder="Enter group name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="discordLink">Discord Link</Label>
                      <Input
                        id="discordLink"
                        type="url"
                        value={formData.discordLink}
                        onChange={(e) => setFormData((prev) => ({ ...prev, discordLink: e.target.value }))}
                        placeholder="https://discord.gg/..."
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                      required
                      placeholder="Enter group description"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hash13Link">Hash13 Link</Label>
                    <Input
                      id="hash13Link"
                      type="url"
                      value={formData.hash13Link}
                      onChange={(e) => setFormData((prev) => ({ ...prev, hash13Link: e.target.value }))}
                      placeholder="https://hash13.com/..."
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button type="submit" disabled={formLoading} className="flex-1">
                      {formLoading ? "Saving..." : editingGroup ? "Update Group" : "Create Group"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {groups.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Plus className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Groups Created</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first group to start organizing students.
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Group
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {groups.map((group) => (
                <Card key={group.id}>
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={group.groupImage || "/placeholder.svg"} />
                        <AvatarFallback>{group.name ? group.name.charAt(0).toUpperCase() : "G"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="truncate">{group.name}</CardTitle>
                        <CardDescription>
                          <div className="flex items-center gap-2">
                            {/* <Users className="h-4 w-4" /> */}
                            {/* <span>{group.memberCount} members</span> */}
                          </div>
                        </CardDescription>
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

                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleViewMembers(group)}
                        className="flex-1"
                      >
                        <Users className="h-3 w-3 mr-1" />
                        View Members
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEdit(group)} className="flex-1">
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(group.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Members Dialog */}
        <Dialog open={isMembersDialogOpen} onOpenChange={setIsMembersDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedGroup?.name} - Members ({groupMembers.length})
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              {membersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : groupMembers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No members in this group yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {groupMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-4 p-4 rounded-lg border bg-card"
                    >
                      <Avatar>
                        <AvatarImage src={member.profileImage} />
                        <AvatarFallback>{member.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{member.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                      </div>
                      <Badge variant="outline">{member.role}</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveMember(member.id)}
                        disabled={removingMember === member.id}
                        className="text-red-600 hover:text-red-700"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </MainLayout>
    </ProtectedRoute>
  )
}
