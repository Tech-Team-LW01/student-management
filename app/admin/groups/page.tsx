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
import { getGroups, createGroup, updateGroup, deleteGroup, uploadFile, getStudentsByGroupId, removeUserFromGroup, clearGroupMessages } from "@/lib/firebase-utils"
import { useAuth } from "@/contexts/auth-context"
import type { Group, User } from "@/types"
import { Plus, Edit, Trash2, Upload, ExternalLink, Users, UserMinus, MessageSquare, Search, Filter, MoreHorizontal, Calendar, Hash, MessageCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { formatDistanceToNow } from "date-fns"

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
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState("all")

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

  const handleClearChat = async (groupId: string) => {
    if (!user || !confirm("Are you sure you want to clear all messages in this group? This action cannot be undone.")) {
      return
    }

    try {
      const deletedCount = await clearGroupMessages(groupId, user.id)
      console.log(`Cleared ${deletedCount} messages from group ${groupId}`)
      // You could show a success message here
    } catch (error) {
      console.error("Error clearing chat:", error)
      setError("Failed to clear chat")
    }
  }

  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const formatDate = (date: Date | any) => {
    if (!date) return "Unknown"
    const dateObj = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date)
    return formatDistanceToNow(dateObj, { addSuffix: true })
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
        <div className="space-y-4 sm:space-y-6 px-4 sm:px-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Group Management</h1>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base">Create and manage LinuxWorld student groups</p>
            </div>
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={(open) => {
                setIsCreateDialogOpen(open)
                if (!open) resetForm()
              }}
            >
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Group
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl mx-4">
                <DialogHeader>
                  <DialogTitle className="text-lg sm:text-xl">{editingGroup ? "Edit Group" : "Create New Group"}</DialogTitle>
                  <DialogDescription className="text-sm">
                    {editingGroup ? "Update group information and settings" : "Add a new group for students to collaborate"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Group Image */}
                  <div className="flex justify-center">
                    <div className="relative">
                      <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-gray-200">
                        <AvatarImage src={formData.groupImage || "/placeholder.svg"} />
                        <AvatarFallback className="text-base sm:text-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                          {formData.name ? formData.name.charAt(0).toUpperCase() : "G"}
                        </AvatarFallback>
                      </Avatar>
                      <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 sm:p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                        <Upload className="h-3 w-3 sm:h-4 sm:w-4" />
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">Group Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                        required
                        placeholder="Enter group name"
                        className="border-gray-300 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="discordLink" className="text-sm font-medium">Discord Link</Label>
                      <Input
                        id="discordLink"
                        type="url"
                        value={formData.discordLink}
                        onChange={(e) => setFormData((prev) => ({ ...prev, discordLink: e.target.value }))}
                        placeholder="https://discord.gg/..."
                        className="border-gray-300 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                      required
                      placeholder="Enter group description"
                      rows={3}
                      className="border-gray-300 focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hash13Link" className="text-sm font-medium">Hash13 Link</Label>
                    <Input
                      id="hash13Link"
                      type="url"
                      value={formData.hash13Link}
                      onChange={(e) => setFormData((prev) => ({ ...prev, hash13Link: e.target.value }))}
                      placeholder="https://hash13.com/..."
                      className="border-gray-300 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button type="submit" disabled={formLoading} className="flex-1 bg-blue-600 hover:bg-blue-700">
                      {formLoading ? "Saving..." : editingGroup ? "Update Group" : "Create Group"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="flex-1 sm:flex-none">
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search groups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-300 focus:border-blue-500"
              />
            </div>
            <Button variant="outline" className="border-gray-300 w-full sm:w-auto">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          {/* Groups Grid */}
          {filteredGroups.length === 0 ? (
            <Card className="border-dashed border-2 border-gray-300">
              <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
                <div className="bg-gray-100 p-3 sm:p-4 rounded-full mb-4">
                  <Plus className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                </div>
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2 text-center">No Groups Found</h3>
                <p className="text-muted-foreground text-center mb-4 sm:mb-6 max-w-md text-sm sm:text-base">
                  {searchTerm ? "No groups match your search criteria." : "Create your first group to start organizing students."}
                </p>
                {!searchTerm && (
                  <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Group
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {filteredGroups.map((group) => (
                <Card key={group.id} className="group hover:shadow-lg transition-all duration-200 border-gray-200">
                  <CardHeader className="pb-3 px-4 sm:px-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-gray-100 flex-shrink-0">
                          <AvatarImage src={group.groupImage || "/placeholder.svg"} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-sm sm:text-base">
                            {group.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 truncate">{group.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                            <span className="text-xs sm:text-sm text-gray-500">{group.memberCount || 0} members</span>
                          </div>
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
                    <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{group.description}</p>

                    {/* External Links */}
                    {(group.discordLink || group.hash13Link) && (
                      <div className="flex flex-col sm:flex-row gap-2">
                        {group.discordLink && (
                          <Button size="sm" variant="outline" asChild className="border-gray-300 text-xs">
                            <a href={group.discordLink} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Discord
                            </a>
                          </Button>
                        )}
                        {group.hash13Link && (
                          <Button size="sm" variant="outline" asChild className="border-gray-300 text-xs">
                            <a href={group.hash13Link} target="_blank" rel="noopener noreferrer">
                              <Hash className="h-3 w-3 mr-1" />
                              Hash13
                            </a>
                          </Button>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleViewMembers(group)}
                        className="border-gray-300 hover:bg-gray-50 text-xs"
                      >
                        <Users className="h-3 w-3 mr-1" />
                        Members
                      </Button>
                      <Button size="sm" variant="outline" asChild className="border-gray-300 hover:bg-gray-50 text-xs">
                        <a href={`/admin/groups/${group.id}/chat`}>
                          <MessageCircle className="h-3 w-3 mr-1" />
                          Chat
                        </a>
                      </Button>
                    </div>

                    {/* Admin Actions */}
                    <div className="flex gap-1 sm:gap-2 pt-2 border-t border-gray-100">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleEdit(group)} 
                        className="flex-1 border-gray-300 hover:bg-gray-50 text-xs"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleClearChat(group.id)}
                        className="border-orange-300 text-orange-600 hover:bg-orange-50 text-xs"
                        title="Clear all messages in this group"
                      >
                        <Trash2 className="h-3 w-3" /> Clear Chat
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(group.id)}
                        className="border-red-300 text-red-600 hover:bg-red-50 text-xs"
                      >
                        <Trash2 className="h-3 w-3" /> Delete Group
                      </Button>
                    </div>

                    {/* Group Info */}
                    <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Created {formatDate(group.createdAt)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Members Dialog */}
        <Dialog open={isMembersDialogOpen} onOpenChange={setIsMembersDialogOpen}>
          <DialogContent className="max-w-3xl mx-4">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                {selectedGroup?.name} - Members ({groupMembers.length})
              </DialogTitle>
              <DialogDescription className="text-sm">
                Manage group members and their roles
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              {membersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : groupMembers.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <Users className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm sm:text-base">No members in this group yet.</p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3 px-2">
                  {groupMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                        <AvatarImage src={member.profileImage} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
                          {member.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate text-sm sm:text-base">{member.name}</p>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">{member.email}</p>
                      </div>
                      <Badge variant="outline" className="border-gray-300 text-xs flex-shrink-0">
                        {member.role}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveMember(member.id)}
                        disabled={removingMember === member.id}
                        className="border-red-300 text-red-600 hover:bg-red-50 flex-shrink-0"
                      >
                        <UserMinus className="h-3 w-3 sm:h-4 sm:w-4" />
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
