import { Timestamp } from "firebase/firestore"

export interface User {
  id: string
  name: string
  email: string
  role: "super_admin" | "admin" | "student"
  profileImage?: string
  createdAt: Date | Timestamp
  updatedAt: Date | Timestamp
  isApproved: boolean
  assignedGroups: string[]
}

export interface Group {
  id: string
  name: string
  description?: string
  discordLink?: string
  hash13Link?: string
  groupImage?: string
  createdBy: string
  memberCount: number
  members: string[]
  createdAt: Date | Timestamp
  updatedAt: Date | Timestamp
}

export interface Announcement {
  id: string
  title: string
  content: string
  createdBy: User
  targetGroups: string[]
  createdAt: Date | Timestamp
  updatedAt: Date | Timestamp
  attachments?: {
    name: string
    url: string
    type: string
  }[]
} 