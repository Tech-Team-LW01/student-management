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



