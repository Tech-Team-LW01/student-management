"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { getGroupById, subscribeToGroupMessages, sendGroupMessage, clearGroupMessages, uploadFile } from "@/lib/firebase-utils"
import { useAuth } from "@/contexts/auth-context"
import type { Group, ChatMessage } from "@/types"
import { Send, ArrowLeft, Users, Calendar, Hash, ExternalLink, Trash2, Shield, MessageSquare, Paperclip, Download, Image as ImageIcon, FileText } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

export default function AdminGroupChatPage({ params }: { params: { groupId: string } }) {
  const { user } = useAuth()
  const { groupId } = params
  const [group, setGroup] = useState<Group | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchGroup()
    const unsubscribe = subscribeToGroupMessages(groupId, (newMessages) => {
      setMessages(newMessages)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [groupId])

  const fetchGroup = async () => {
    try {
      const groupData = await getGroupById(groupId)
      setGroup(groupData)
    } catch (error) {
      console.error("Error fetching group:", error)
      setError("Failed to load group information")
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return

    setSending(true)
    try {
      await sendGroupMessage(groupId, {
        content: newMessage.trim(),
        messageType: "text"
      })
      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
      setError("Failed to send message")
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleClearChat = async () => {
    if (!user) return

    setClearing(true)
    try {
      const deletedCount = await clearGroupMessages(groupId, user.id)
      setMessages([])
      setShowClearConfirm(false)
      console.log(`Cleared ${deletedCount} messages from group ${groupId}`)
    } catch (error) {
      console.error("Error clearing chat:", error)
      setError("Failed to clear chat")
    } finally {
      setClearing(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const filePath = `group-files/${groupId}/${Date.now()}-${file.name}`
      const fileUrl = await uploadFile(file, filePath)
      
      const messageType = file.type.startsWith("image/") ? "image" : "file"
      const fileName = file.name
      const fileSize = file.size

      await sendGroupMessage(groupId, {
        content: `Sent ${fileName}`,
        messageType,
        fileUrl,
        fileName,
        fileSize
      })
    } catch (error) {
      console.error("Error uploading file:", error)
      setError("Failed to upload file")
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
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

  if (!group) {
    return (
      <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
        <MainLayout>
          <div className="flex items-center justify-center h-64">
            <Alert>
              <AlertDescription>Group not found or you don't have access to it.</AlertDescription>
            </Alert>
          </div>
        </MainLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
      <MainLayout>
        <div className="flex flex-col h-[calc(100vh-4rem)]">
          {/* Header */}
          <div className="bg-white border-b px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                <Link href="/admin/groups" className="text-gray-500 hover:text-gray-700 flex-shrink-0">
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
                <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                  <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                    <AvatarImage src={group.groupImage} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-sm sm:text-base">
                      {group.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">{group.name}</h1>
                      <Badge variant="outline" className="border-blue-300 text-blue-600 text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        <span className="hidden sm:inline">Admin View</span>
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>{group.memberCount || 0} members</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>Created {formatDate(group.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Admin Actions */}
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                {group.discordLink && (
                  <Button size="sm" variant="outline" asChild className="border-gray-300 text-xs">
                    <a href={group.discordLink} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      <span className="hidden sm:inline">Discord</span>
                    </a>
                  </Button>
                )}
                {group.hash13Link && (
                  <Button size="sm" variant="outline" asChild className="border-gray-300 text-xs">
                    <a href={group.hash13Link} target="_blank" rel="noopener noreferrer">
                      <Hash className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      <span className="hidden sm:inline">Hash13</span>
                    </a>
                  </Button>
                )}
                <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 text-xs">
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      <span className="hidden sm:inline">Clear Chat</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md mx-4">
                    <DialogHeader>
                      <DialogTitle className="text-lg">Clear Group Chat</DialogTitle>
                      <DialogDescription className="text-sm">
                        Are you sure you want to clear all messages in this group? This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                      <Button
                        onClick={handleClearChat}
                        disabled={clearing}
                        variant="destructive"
                        className="flex-1"
                      >
                        {clearing ? "Clearing..." : "Clear All Messages"}
                      </Button>
                      <Button
                        onClick={() => setShowClearConfirm(false)}
                        variant="outline"
                        className="flex-1 sm:flex-none"
                      >
                        Cancel
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            
            {group.description && (
              <p className="text-xs sm:text-sm text-gray-600 mt-2 line-clamp-2">{group.description}</p>
            )}
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 px-3 sm:px-6 py-3 sm:py-4" ref={scrollAreaRef}>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                <div className="bg-gray-100 p-3 sm:p-4 rounded-full mb-4">
                  <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                </div>
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
                <p className="text-gray-500 text-sm sm:text-base">This group chat is empty.</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {messages.map((message) => {
                  const isOwnMessage = message.senderId === user?.id
                  const isAdminMessage = message.senderName?.toLowerCase().includes("admin")
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`flex items-start gap-2 sm:gap-3 max-w-[85%] sm:max-w-[70%] ${isOwnMessage ? "flex-row-reverse" : "flex-row"}`}>
                        <Avatar className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0">
                          <AvatarImage src={message.senderImage} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                            {message.senderName?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className={`flex flex-col ${isOwnMessage ? "items-end" : "items-start"} flex-1 min-w-0`}>
                          <div className="flex items-center gap-1 sm:gap-2 mb-1">
                            <span className="text-xs sm:text-sm font-medium text-gray-900 truncate">{message.senderName}</span>
                            <span className="text-xs text-gray-400 flex-shrink-0">{formatDate(message.timestamp)}</span>
                            {isAdminMessage && (
                              <Badge variant="outline" className="border-yellow-300 bg-yellow-50 text-yellow-700 text-[10px]">
                                Admin
                              </Badge>
                            )}
                          </div>
                          
                          <div className={`rounded-lg px-3 sm:px-4 py-2 max-w-full ${
                            isOwnMessage
                              ? "bg-blue-500 text-white"
                              : isAdminMessage
                              ? "bg-yellow-50 border border-yellow-200"
                              : "bg-gray-100 text-gray-900"
                          }`}>
                            {message.messageType === "text" ? (
                              <p className="text-sm sm:text-base whitespace-pre-wrap break-words">{message.content}</p>
                            ) : message.messageType === "image" ? (
                              <div className="space-y-2">
                                <a
                                  href={message.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block"
                                >
                                  <img
                                    src={message.fileUrl}
                                    alt={message.fileName || "Image"}
                                    className="max-w-full rounded-lg"
                                  />
                                </a>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="flex items-center gap-1">
                                    <ImageIcon className="h-3 w-3" />
                                    {message.fileName}
                                  </span>
                                  <span>{message.fileSize && formatFileSize(message.fileSize)}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4" />
                                  <span className="text-sm truncate">{message.fileName}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                  <span>{message.fileSize && formatFileSize(message.fileSize)}</span>
                                  <a
                                    href={message.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 hover:underline"
                                  >
                                    <Download className="h-3 w-3" />
                                    Download
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </ScrollArea>

          {/* Message Input */}
          <div className="border-t bg-white px-4 py-3 sm:px-6">
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
              />
              <Button
                size="icon"
                variant="outline"
                className="flex-shrink-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1"
                disabled={sending || uploading}
              />
              <Button
                size="icon"
                className="flex-shrink-0"
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sending || uploading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
} 