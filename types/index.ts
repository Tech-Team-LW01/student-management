// types/index.ts
import type { Timestamp } from "firebase/firestore"

export type UserRole = "super_admin" | "admin" | "group_admin" | "student"

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  profileImage?: string
  mobileNumber?: string
  mode?: "online" | "offline"
  registrationDate: Timestamp | Date
  isApproved: boolean
  assignedGroups: string[]
  totalAnnouncementsViewed: number
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
  // Add notification preferences
  notificationPreferences?: {
    emailNotifications: boolean
    announcementEmails: boolean
    groupActivityEmails: boolean
  }
  forcePasswordChange?: boolean
}

// Rest of your interfaces remain the same...
export interface Group {
  id: string
  name: string
  description: string
  groupImage?: string
  discordLink?: string
  hash13Link?: string
  createdBy: string
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
  memberCount: number
  members: string[]
}

export interface Announcement {
  id: string
  title: string
  content: string
  groupIds: string[]
  groupId?: string  // For backward compatibility
  createdBy: string
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
  files: AnnouncementFile[]
  viewCount: number
  viewedBy: string[]
  priority?: boolean
}

export interface AnnouncementFile {
  id: string
  name: string
  url: string
  type: string
  size: number
  isDownloadable: boolean
}

export interface AuthContextType {
  user: User | null
  loading: boolean
  authLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (userData: Partial<User>, password: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
}

export interface ChatMessage {
  id: string
  groupId: string
  senderId: string
  senderName: string
  senderImage?: string
  content: string
  timestamp: Timestamp | Date
  messageType: "text" | "file" | "image"
  fileUrl?: string
  fileName?: string
  fileSize?: number
}

export interface GroupChat {
  id: string
  groupId: string
  groupName: string
  lastMessage?: ChatMessage
  lastMessageTime?: Timestamp | Date
  unreadCount: number
  participants: string[]
}

export interface Notification {
  id: string
  title: string
  content: string
  createdAt: Timestamp | Date
  createdBy: string
  recipients: {
    type: "individual" | "group" | "mode" | "bulk"
    userIds?: string[]
    groupIds?: string[]
    mode?: "online" | "offline"
    emails?: string[]
  }
  status: "sent" | "delivered" | "read"
  readBy: string[]
}

export interface NDADocument {
  id: string
  title: string
  description?: string
  type: "admin" | "student"
  uploadedBy: string
  studentId?: string
  uploadedAt: Date
  fileUrl: string
  fileName: string
  fileSize: number
  status: "pending" | "approved" | "rejected"
  rejectionReason?: string
  approvedBy?: string
  approvedAt?: Date
  originalDocumentId?: string // ID of the original admin document if this is a student's signed version
}



