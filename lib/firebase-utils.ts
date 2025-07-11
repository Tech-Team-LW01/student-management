import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  setDoc,
  arrayUnion,
  arrayRemove,
  increment,
  limit,
  onSnapshot,
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { db, storage, auth } from "./firebase"
import type { User, Group, Announcement, ChatMessage, Notification, NDADocument } from "@/types"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { sendEmailNotification } from "./email-service"

// Default platform settings - used as fallback
const DEFAULT_PLATFORM_SETTINGS = {
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
}

// Helper function to convert Firestore timestamp to Date
const convertTimestamp = (timestamp: any): Date => {
  if (!timestamp) return new Date()
  if (timestamp.toDate) return timestamp.toDate()
  if (timestamp instanceof Date) return timestamp
  return new Date(timestamp)
}

// Helper function to check if we can access a collection
const canAccessCollection = async (collectionName: string): Promise<boolean> => {
  try {
    const testQuery = query(collection(db, collectionName), limit(1))
    await getDocs(testQuery)
    return true
  } catch (error) {
    console.warn(`Cannot access collection '${collectionName}':`, error)
    return false
  }
}

// Helper function to get current user's authentication state
const getCurrentAuthUser = () => {
  const currentUser = auth.currentUser
  if (!currentUser) {
    throw new Error("No authenticated user found. Please sign in again.")
  }
  return currentUser
}

// Helper function to verify user permissions with role-based access
const verifyUserPermissions = async (
  userId: string,
  requiredRoles?: string[],
): Promise<{ hasPermissions: boolean; userRole?: string; userDoc?: any }> => {
  try {
    console.log("Verifying permissions for user:", userId)

    // Check if user is authenticated
    const authUser = getCurrentAuthUser()
    console.log("Auth user:", { uid: authUser.uid, email: authUser.email })

    if (authUser.uid !== userId) {
      console.warn("Auth user ID doesn't match provided user ID:", { authUid: authUser.uid, providedUserId: userId })
    }

    const userDoc = await getDoc(doc(db, "users", userId))
    if (!userDoc.exists()) {
      console.error("User document not found:", userId)
      return { hasPermissions: false }
    }

    const userData = userDoc.data()
    const userRole = userData.role as string

    // If no specific roles required, check for admin-level access
    if (!requiredRoles) {
      const hasAdminAccess = ["super_admin", "admin"].includes(userRole)
      return { hasPermissions: hasAdminAccess, userRole, userDoc: userData }
    }

    // Check if user has one of the required roles
    const hasPermissions = requiredRoles.includes(userRole)

    console.log("User permissions check:", {
      userId,
      role: userRole,
      requiredRoles,
      hasPermissions,
      isApproved: userData.isApproved,
      email: userData.email,
    })

    return { hasPermissions, userRole, userDoc: userData }
  } catch (error) {
    console.error("Error verifying user permissions:", error)
    return { hasPermissions: false }
  }
}

// Role-based permission checks
export const canManageUsers = (userRole: string): boolean => {
  return ["super_admin", "admin"].includes(userRole)
}

export const canCreateAdmins = (userRole: string): boolean => {
  return userRole === "super_admin"
}

export const canManageGroups = (userRole: string): boolean => {
  return ["super_admin", "admin"].includes(userRole)
}

export const canCreateAnnouncements = (userRole: string): boolean => {
  return ["super_admin", "admin", "group_admin"].includes(userRole)
}

export const canViewAllUsers = (userRole: string): boolean => {
  return ["super_admin", "admin"].includes(userRole)
}

export const canApproveUsers = (userRole: string): boolean => {
  return ["super_admin", "admin"].includes(userRole)
}

export const canAssignRoles = (userRole: string, targetRole: string): boolean => {
  if (userRole === "super_admin") {
    return true // Super admin can assign any role
  }
  if (userRole === "admin") {
    return ["student", "group_admin"].includes(targetRole) // Admin can only assign student and group_admin roles
  }
  return false
}

// User operations
export const getUsers = async (): Promise<User[]> => {
  try {
    const usersSnapshot = await getDocs(collection(db, "users"))
    return usersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      registrationDate: convertTimestamp(doc.data().registrationDate),
      createdAt: convertTimestamp(doc.data().createdAt),
      updatedAt: convertTimestamp(doc.data().updatedAt),
    })) as User[]
  } catch (error) {
    console.error("Error getting users:", error)
    throw error
  }
}

export const getPendingUsers = async (): Promise<User[]> => {
  try {
    const q = query(collection(db, "users"), where("isApproved", "==", false))
    const usersSnapshot = await getDocs(q)
    return usersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      registrationDate: convertTimestamp(doc.data().registrationDate),
      createdAt: convertTimestamp(doc.data().createdAt),
      updatedAt: convertTimestamp(doc.data().updatedAt),
    })) as User[]
  } catch (error) {
    console.error("Error getting pending users:", error)
    throw error
  }
}

export const approveUser = async (userId: string, adminId: string) => {
  try {
    await updateDoc(doc(db, "users", userId), {
      isApproved: true,
      approvedBy: adminId,
      approvedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error approving user:", error)
    throw error
  }
}

export const updateUserRole = async (userId: string, role: string, adminId: string) => {
  try {
    await updateDoc(doc(db, "users", userId), {
      role,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error updating user role:", error)
    throw error
  }
}

export const updateUserMode = async (userId: string, mode: "online" | "offline", adminId: string) => {
  try {
    await updateDoc(doc(db, "users", userId), {
      mode,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error updating user mode:", error)
    throw error
  }
}

export const deleteUser = async (userId: string) => {
  try {
    await deleteDoc(doc(db, "users", userId))
  } catch (error) {
    console.error("Error deleting user:", error)
    throw error
  }
}

export const assignUserToGroups = async (userId: string, groupIds: string[]) => {
  try {
    await updateDoc(doc(db, "users", userId), {
      assignedGroups: groupIds,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error assigning user to groups:", error)
    throw error
  }
}

// Group operations
export const getGroups = async (): Promise<Group[]> => {
  try {
    const groupsSnapshot = await getDocs(collection(db, "groups"))
    return groupsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: convertTimestamp(doc.data().createdAt),
      updatedAt: convertTimestamp(doc.data().updatedAt),
    })) as Group[]
  } catch (error) {
    console.error("Error getting groups:", error)
    throw error
  }
}

export const getUserGroups = async (groupIds: string[]): Promise<Group[]> => {
  try {
    if (!groupIds || groupIds.length === 0) {
      return []
    }

    const groups: Group[] = []

    // Fetch groups in batches to handle Firestore's "in" query limit of 10
    const batchSize = 10
    for (let i = 0; i < groupIds.length; i += batchSize) {
      const batch = groupIds.slice(i, i + batchSize)

      if (batch.length === 1) {
        // Single group query
        const groupDoc = await getDoc(doc(db, "groups", batch[0]))
        if (groupDoc.exists()) {
          groups.push({
            id: groupDoc.id,
            ...groupDoc.data(),
            createdAt: convertTimestamp(groupDoc.data().createdAt),
            updatedAt: convertTimestamp(groupDoc.data().updatedAt),
          } as Group)
        }
      } else {
        // Batch query
        const q = query(collection(db, "groups"), where("__name__", "in", batch))
        const snapshot = await getDocs(q)

        snapshot.docs.forEach((doc) => {
          groups.push({
            id: doc.id,
            ...doc.data(),
            createdAt: convertTimestamp(doc.data().createdAt),
            updatedAt: convertTimestamp(doc.data().updatedAt),
          } as Group)
        })
      }
    }

    return groups
  } catch (error) {
    console.error("Error getting user groups:", error)
    return []
  }
}

export const createGroup = async (groupData: Omit<Group, "id" | "createdAt" | "updatedAt">) => {
  try {
    const docRef = await addDoc(collection(db, "groups"), {
      ...groupData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return docRef.id
  } catch (error) {
    console.error("Error creating group:", error)
    throw error
  }
}

export const updateGroup = async (groupId: string, groupData: Partial<Group>) => {
  try {
    await updateDoc(doc(db, "groups", groupId), {
      ...groupData,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error updating group:", error)
    throw error
  }
}

export const deleteGroup = async (groupId: string) => {
  try {
    await deleteDoc(doc(db, "groups", groupId))
  } catch (error) {
    console.error("Error deleting group:", error)
    throw error
  }
}

export const assignUserToGroup = async (userId: string, groupId: string) => {
  try {
    await updateDoc(doc(db, "users", userId), {
      assignedGroups: arrayUnion(groupId),
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error assigning user to group:", error)
    throw error
  }
}

export const removeUserFromGroup = async (userId: string, groupId: string) => {
  try {
    await updateDoc(doc(db, "users", userId), {
      assignedGroups: arrayRemove(groupId),
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error removing user from group:", error)
    throw error
  }
}

// New function to get students by group ID
export const getStudentsByGroupId = async (groupId: string): Promise<User[]> => {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const students: User[] = [];
    
    usersSnapshot.forEach((doc) => {
      const userData = doc.data() as User;
      // Check if user is a student and is assigned to this group
      if (
        userData.role === 'student' && 
        userData.isApproved &&
        userData.assignedGroups?.includes(groupId)
      ) {
        students.push({
          ...userData,
          id: doc.id,
          registrationDate: convertTimestamp(userData.registrationDate),
          createdAt: convertTimestamp(userData.createdAt),
          updatedAt: convertTimestamp(userData.updatedAt),
        });
      }
    });
    
    return students;
  } catch (error) {
    console.error('Error fetching students by group:', error);
    return [];
  }
}

// New function to get a single group by ID
export const getGroupById = async (groupId: string): Promise<Group | null> => {
  try {
    const groupDoc = await getDoc(doc(db, 'groups', groupId));
    if (groupDoc.exists()) {
      return {
        ...groupDoc.data() as Group,
        id: groupDoc.id,
        createdAt: convertTimestamp(groupDoc.data().createdAt),
        updatedAt: convertTimestamp(groupDoc.data().updatedAt),
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching group:', error);
        return null;
  }
}

// Announcement operations
export const getAnnouncements = async (userGroups?: string[]): Promise<Announcement[]> => {
  try {
    let announcements: Announcement[] = []

    if (userGroups && userGroups.length > 0) {
      // Get announcements for specific groups
      const batchSize = 10
      for (let i = 0; i < userGroups.length; i += batchSize) {
        const batch = userGroups.slice(i, i + batchSize)

        try {
          const q = query(
            collection(db, "announcements"),
            where("groupIds", "array-contains-any", batch),
            orderBy("createdAt", "desc")
          )
          const snapshot = await getDocs(q)

          const batchAnnouncements = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: convertTimestamp(doc.data().createdAt),
            updatedAt: convertTimestamp(doc.data().updatedAt),
          })) as Announcement[]

          announcements.push(...batchAnnouncements)
        } catch (batchError) {
          console.warn(`Error fetching announcements for batch ${i}:`, batchError)
        }
      }
    } else {
      // Get all announcements when no groups are specified
      const q = query(
        collection(db, "announcements"),
        orderBy("createdAt", "desc")
      )
      const snapshot = await getDocs(q)
      
      announcements = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: convertTimestamp(doc.data().createdAt),
        updatedAt: convertTimestamp(doc.data().updatedAt),
      })) as Announcement[]
    }
    return announcements
  } catch (error) {
    console.error("Error getting announcements:", error)
    throw error
  }
}

// Updated createAnnouncement with email notification
export const createAnnouncement = async (announcementData: Omit<Announcement, "id" | "createdAt" | "updatedAt">) => {
  try {
    const docRef = await addDoc(collection(db, "announcements"), {
      ...announcementData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      viewedBy: [],
      viewCount: 0,
    })
    
    // Trigger email notifications after successful creation
    // Run this asynchronously to not block the UI
    setTimeout(async () => {
      try {
        const response = await fetch('/api/send-announcement-notification', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            announcement: {
              ...announcementData,
              id: docRef.id,
            },
            groupIds: announcementData.groupIds,
          }),
        });
        
        if (!response.ok) {
          console.error('Failed to trigger email notifications');
        } else {
          const result = await response.json();
          console.log('Email notification result:', result);
        }
      } catch (emailError) {
        console.error('Failed to send email notifications:', emailError);
        // Don't throw - announcement is created, just emails failed
      }
    }, 0);
    
    return docRef.id
  } catch (error) {
    console.error("Error creating announcement:", error)
    throw error
  }
}

export const updateAnnouncement = async (announcementId: string, announcementData: Partial<Announcement>) => {
  try {
    await updateDoc(doc(db, "announcements", announcementId), {
      ...announcementData,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error updating announcement:", error)
    throw error
  }
}

export const deleteAnnouncement = async (announcementId: string, currentUserId: string) => {
  try {
    // Get announcement data to delete associated files
    const announcementDoc = await getDoc(doc(db, "announcements", announcementId))
    if (announcementDoc.exists()) {
      const announcementData = announcementDoc.data() as Announcement

      // Delete associated files from storage
      if (announcementData.files && announcementData.files.length > 0) {
        for (const file of announcementData.files) {
          try {
            const fileRef = ref(storage, file.url)
            await deleteObject(fileRef)
          } catch (fileError) {
            console.warn("Error deleting file:", fileError)
          }
        }
      }
    }

    // Delete the announcement document
    await deleteDoc(doc(db, "announcements", announcementId))
  } catch (error) {
    console.error("Error deleting announcement:", error)
    throw error
  }
}

export const markAnnouncementAsViewed = async (announcementId: string, userId: string) => {
  try {
    const announcementRef = doc(db, "announcements", announcementId)
    const announcementDoc = await getDoc(announcementRef)

    if (!announcementDoc.exists()) {
      console.warn("Announcement not found:", announcementId)
      return
    }

    const data = announcementDoc.data()
    const viewedBy = data.viewedBy || []

    // Only add if user hasn't viewed it yet
    if (!viewedBy.includes(userId)) {
      await updateDoc(announcementRef, {
        viewedBy: arrayUnion(userId),
        viewCount: (data.viewCount || 0) + 1,
        updatedAt: serverTimestamp(),
      })

      // Update user's total announcements viewed count
      const userRef = doc(db, "users", userId)
      await updateDoc(userRef, {
        totalAnnouncementsViewed: increment(1),
        updatedAt: serverTimestamp(),
      })
    }
  } catch (error) {
    console.error("Error marking announcement as viewed:", error)
    // Don't throw error to avoid disrupting user experience
  }
}

export const getAnnouncementViewers = async (announcementId: string): Promise<User[]> => {
  try {
    const announcementDoc = await getDoc(doc(db, "announcements", announcementId))
    if (!announcementDoc.exists()) {
      return []
    }

    const data = announcementDoc.data() as Announcement
    const viewedBy = data.viewedBy || []

    if (viewedBy.length === 0) {
      return []
    }

    // Get user details for all viewers
    const viewers: User[] = []
    for (const userId of viewedBy) {
      try {
        const userDoc = await getDoc(doc(db, "users", userId))
        if (userDoc.exists()) {
          viewers.push({
            id: userDoc.id,
            ...userDoc.data(),
            registrationDate: convertTimestamp(userDoc.data().registrationDate),
            createdAt: convertTimestamp(userDoc.data().createdAt),
            updatedAt: convertTimestamp(userDoc.data().updatedAt),
          } as User)
        }
      } catch (userError) {
        console.warn(`Error fetching user ${userId}:`, userError)
      }
    }

    return viewers
  } catch (error) {
    console.error("Error getting announcement viewers:", error)
    return []
  }
}

// File upload operations
export const uploadFile = async (file: File, path: string): Promise<string> => {
  try {
    const fileRef = ref(storage, path)
    const snapshot = await uploadBytes(fileRef, file)
    const downloadURL = await getDownloadURL(snapshot.ref)
    return downloadURL
  } catch (error) {
    console.error("Error uploading file:", error)
    throw error
  }
}

// Notification preferences operations
export const updateUserNotificationPreferences = async (
  userId: string, 
  preferences: {
    emailNotifications: boolean;
    announcementEmails: boolean;
    groupActivityEmails: boolean;
  }
) => {
  try {
    await updateDoc(doc(db, "users", userId), {
      notificationPreferences: preferences,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    throw error;
  }
};

// Set default notification preferences for new users
export const setDefaultNotificationPreferences = async (userId: string) => {
  try {
    await updateDoc(doc(db, "users", userId), {
      notificationPreferences: {
        emailNotifications: true,
        announcementEmails: true,
        groupActivityEmails: true,
      },
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error setting default notification preferences:", error);
    // Don't throw - this is not critical
  }
};

// Analytics
export const getAnalytics = async () => {
  try {
    const [usersSnapshot, groupsSnapshot, announcementsSnapshot] = await Promise.all([
      getDocs(collection(db, "users")),
      getDocs(collection(db, "groups")),
      getDocs(collection(db, "announcements")),
    ])

    const users = usersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      registrationDate: convertTimestamp(doc.data().registrationDate),
      createdAt: convertTimestamp(doc.data().createdAt),
      updatedAt: convertTimestamp(doc.data().updatedAt),
    })) as User[]

    const groups = groupsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: convertTimestamp(doc.data().createdAt),
      updatedAt: convertTimestamp(doc.data().updatedAt),
    })) as Group[]

    const announcements = announcementsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: convertTimestamp(doc.data().createdAt),
      updatedAt: convertTimestamp(doc.data().updatedAt),
    })) as Announcement[]

    // Calculate analytics
    const totalUsers = users.length
    const approvedUsers = users.filter((user) => user.isApproved).length
    const pendingUsers = users.filter((user) => !user.isApproved).length
    const totalGroups = groups.length
    const totalAnnouncements = announcements.length

    // Mode-based statistics
    const onlineStudents = users.filter((user) => user.role === "student" && user.mode === "online").length
    const offlineStudents = users.filter((user) => user.role === "student" && user.mode === "offline").length
    const studentsWithoutMode = users.filter((user) => user.role === "student" && !user.mode).length

    // User distribution by role
    const usersByRole = users.reduce(
      (acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentUsers = users.filter((user) => user.registrationDate && user.registrationDate > sevenDaysAgo).length

    const recentAnnouncements = announcements.filter(
      (announcement) => announcement.createdAt && announcement.createdAt > sevenDaysAgo,
    ).length

    return {
      totalUsers,
      approvedUsers,
      pendingUsers,
      totalGroups,
      totalAnnouncements,
      usersByRole,
      recentUsers,
      recentAnnouncements,
      onlineStudents,
      offlineStudents,
      studentsWithoutMode,
    }
  } catch (error) {
    console.error("Error getting analytics:", error)
    throw error
  }
}

// Platform Settings - with robust fallback mechanism
export const getPlatformSettings = async () => {
  console.log("🔧 Attempting to fetch platform settings...")

  try {
    // First, try to fetch from Firestore
    const settingsDoc = await getDoc(doc(db, "settings", "platform"))

    if (settingsDoc.exists()) {
      console.log("✅ Platform settings found in Firestore:", settingsDoc.data())
      return { ...DEFAULT_PLATFORM_SETTINGS, ...settingsDoc.data() }
    } else {
      console.log("📝 No platform settings found, creating defaults...")

      // Try to create default settings
      try {
        await setDoc(doc(db, "settings", "platform"), {
          ...DEFAULT_PLATFORM_SETTINGS,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
        console.log("✅ Created default platform settings")
        return DEFAULT_PLATFORM_SETTINGS
      } catch (createError) {
        console.warn("⚠️ Could not create default settings, using local defaults:", createError)
        return DEFAULT_PLATFORM_SETTINGS
      }
    }
  } catch (error: any) {
    console.error("❌ Error accessing platform settings:", error)

    // Always return default settings as fallback
    console.log("🔄 Using default platform settings as fallback")
    return DEFAULT_PLATFORM_SETTINGS
  }
}

export const savePlatformSettings = async (settings: any, userId: string) => {
  try {
    console.log("💾 Attempting to save platform settings:", settings)

    // Get current user to verify permissions
    const currentUser = auth.currentUser
    if (!currentUser) {
      throw new Error("No authenticated user found. Please sign in again.")
    }

    // Get user document to check role
    const userDoc = await getDoc(doc(db, "users", userId))
    if (!userDoc.exists()) {
      throw new Error("User document not found. Please refresh and try again.")
    }

    const userData = userDoc.data()
    const userRole = userData.role

    // Check if user is super admin
    if (userRole !== "super_admin") {
      throw new Error(`Access denied. Only Super Admins can modify platform settings. Your role: ${userRole}`)
    }

    // Save settings to Firestore
    await setDoc(doc(db, "settings", "platform"), {
      ...settings,
      updatedBy: userId,
      updatedAt: serverTimestamp(),
    })

    console.log("✅ Platform settings saved successfully")
  } catch (error: any) {
    console.error("❌ Error saving platform settings:", error)

    // Provide specific error messages
    if (error.code === "permission-denied") {
      throw new Error("Permission denied. Please ensure you have Super Admin privileges and refresh your browser.")
    }

    if (error.message.includes("Access denied")) {
      throw error // Re-throw our custom access denied message
    }

    throw new Error(`Failed to save settings: ${error.message}`)
  }
}

// Additional utility functions for email notifications

// Get all students (for bulk operations)
export const getAllStudents = async (): Promise<User[]> => {
  try {
    const q = query(collection(db, "users"), where("role", "==", "student"), where("isApproved", "==", true))
    const usersSnapshot = await getDocs(q)
    return usersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      registrationDate: convertTimestamp(doc.data().registrationDate),
      createdAt: convertTimestamp(doc.data().createdAt),
      updatedAt: convertTimestamp(doc.data().updatedAt),
    })) as User[]
  } catch (error) {
    console.error("Error getting all students:", error)
    return []
  }
}

// Get user by ID
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId))
    if (userDoc.exists()) {
      return {
        id: userDoc.id,
        ...userDoc.data(),
        registrationDate: convertTimestamp(userDoc.data().registrationDate),
        createdAt: convertTimestamp(userDoc.data().createdAt),
        updatedAt: convertTimestamp(userDoc.data().updatedAt),
      } as User
    }
    return null
  } catch (error) {
    console.error("Error getting user by ID:", error)
    return null
  }
}

// Batch get users by IDs
export const getUsersByIds = async (userIds: string[]): Promise<User[]> => {
  try {
    if (!userIds || userIds.length === 0) {
      return []
    }

    const users: User[] = []
    const batchSize = 10

    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize)
      const promises = batch.map(userId => getUserById(userId))
      const batchUsers = await Promise.all(promises)
      
      batchUsers.forEach(user => {
        if (user) users.push(user)
      })
    }

    return users
  } catch (error) {
    console.error("Error getting users by IDs:", error)
    return []
  }
}

// Get announcement statistics
export const getAnnouncementStats = async (announcementId: string) => {
  try {
    const announcementDoc = await getDoc(doc(db, "announcements", announcementId))
    if (!announcementDoc.exists()) {
      return null
    }

    const data = announcementDoc.data() as Announcement
    const groupId = data.groupId || data.groupIds?.[0]
    
    if (!groupId) {
      return {
        viewCount: data.viewCount || 0,
        totalStudents: 0,
        viewPercentage: 0,
        viewedBy: data.viewedBy || [],
      }
    }

    const groupData = await getGroupById(groupId)
    const totalStudents = groupData ? await getStudentsByGroupId(groupId) : []

    return {
      viewCount: data.viewCount || 0,
      totalStudents: totalStudents.length,
      viewPercentage: totalStudents.length > 0 
        ? Math.round(((data.viewCount || 0) / totalStudents.length) * 100) 
        : 0,
      viewedBy: data.viewedBy || [],
    }
  } catch (error) {
    console.error("Error getting announcement stats:", error)
    return null
  }
}

// Check if user has viewed announcement
export const hasUserViewedAnnouncement = async (announcementId: string, userId: string): Promise<boolean> => {
  try {
    const announcementDoc = await getDoc(doc(db, "announcements", announcementId))
    if (!announcementDoc.exists()) {
      return false
    }

    const data = announcementDoc.data() as Announcement
    return (data.viewedBy || []).includes(userId)
  } catch (error) {
    console.error("Error checking if user viewed announcement:", error)
    return false
  }
}

// Update user profile
export const updateUserProfile = async (userId: string, profileData: Partial<User>) => {
  try {
    const { id, ...dataToUpdate } = profileData // Remove id from update data
    await updateDoc(doc(db, "users", userId), {
      ...dataToUpdate,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error updating user profile:", error)
    throw error
  }
}

// Get recent announcements for a user
export const getRecentAnnouncementsForUser = async (userId: string, limit: number = 5): Promise<Announcement[]> => {
  try {
    const user = await getUserById(userId)
    if (!user || !user.assignedGroups || user.assignedGroups.length === 0) {
      return []
    }

    const announcements = await getAnnouncements(user.assignedGroups)
    return announcements.slice(0, limit)
  } catch (error) {
    console.error("Error getting recent announcements for user:", error)
    return []
  }
}

// Chat Functions
export const sendGroupMessage = async (groupId: string, messageData: {
  content: string
  messageType: "text" | "file" | "image"
  fileUrl?: string
  fileName?: string
  fileSize?: number
}) => {
  try {
    const currentUser = auth.currentUser
    if (!currentUser) {
      throw new Error("User not authenticated")
    }

    const userDoc = await getDoc(doc(db, "users", currentUser.uid))
    if (!userDoc.exists()) {
      throw new Error("User not found")
    }

    const userData = userDoc.data()
    const now = new Date()
    
    // Create message object with proper typing
    const message: any = {
      groupId,
      senderId: currentUser.uid,
      senderName: userData.name,
      senderImage: userData.profileImage || "",
      content: messageData.content,
      timestamp: now,
      messageType: messageData.messageType,
    }

    // Only add file-related fields if they are provided
    if (messageData.fileUrl) {
      message.fileUrl = messageData.fileUrl
    }
    if (messageData.fileName) {
      message.fileName = messageData.fileName
    }
    if (messageData.fileSize) {
      message.fileSize = messageData.fileSize
    }

    // Use addDoc instead of setDoc to let Firestore generate the ID
    const docRef = await addDoc(collection(db, "groupMessages"), message)
    
    // Return the message with the generated ID
    return {
      id: docRef.id,
      ...message
    }
  } catch (error) {
    console.error("Error sending group message:", error)
    throw error
  }
}

// Function to clear all messages for a group (admin only)
export const clearGroupMessages = async (groupId: string, adminId: string) => {
  try {
    // Verify admin permissions
    const adminDoc = await getDoc(doc(db, "users", adminId))
    if (!adminDoc.exists()) {
      throw new Error("Admin user not found")
    }
    
    const adminData = adminDoc.data()
    if (!["super_admin", "admin"].includes(adminData.role)) {
      throw new Error("Insufficient permissions to clear group messages")
    }

    // Get all messages for the group
    const q = query(
      collection(db, "groupMessages"),
      where("groupId", "==", groupId)
    )
    
    const messagesSnapshot = await getDocs(q)
    
    // Delete all messages
    const deletePromises = messagesSnapshot.docs.map(doc => deleteDoc(doc.ref))
    await Promise.all(deletePromises)
    
    console.log(`Cleared ${messagesSnapshot.docs.length} messages for group ${groupId}`)
    return messagesSnapshot.docs.length
  } catch (error) {
    console.error("Error clearing group messages:", error)
    throw error
  }
}

export const getGroupMessages = async (groupId: string, limit: number = 50): Promise<ChatMessage[]> => {
  try {
    const q = query(
      collection(db, "groupMessages"),
      where("groupId", "==", groupId)
    )
    
    const messagesSnapshot = await getDocs(q)
    const messages = messagesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: convertTimestamp(doc.data().timestamp),
    })) as ChatMessage[]

    // Sort messages by timestamp in JavaScript
    messages.sort((a, b) => {
      const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : 
                   a.timestamp && typeof a.timestamp === 'object' && 'toDate' in a.timestamp ? 
                   a.timestamp.toDate().getTime() : new Date(a.timestamp).getTime()
      const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : 
                   b.timestamp && typeof b.timestamp === 'object' && 'toDate' in b.timestamp ? 
                   b.timestamp.toDate().getTime() : new Date(b.timestamp).getTime()
      return timeA - timeB
    })

    console.log("Fetched messages:", messages)
    return messages
  } catch (error) {
    console.error("Error getting group messages:", error)
    return []
  }
}

export const subscribeToGroupMessages = (groupId: string, callback: (messages: ChatMessage[]) => void) => {
  try {
    const q = query(
      collection(db, "groupMessages"),
      where("groupId", "==", groupId)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const messages = snapshot.docs.map(doc => {
          const data = doc.data()
          const convertedMessage = {
            id: doc.id,
            ...data,
            timestamp: convertTimestamp(data.timestamp),
          } as ChatMessage
          
          return convertedMessage
        })

        // Sort messages by timestamp in JavaScript
        messages.sort((a, b) => {
          const timeA = a.timestamp instanceof Date ? a.timestamp.getTime() : 
                       a.timestamp && typeof a.timestamp === 'object' && 'toDate' in a.timestamp ? 
                       a.timestamp.toDate().getTime() : new Date(a.timestamp).getTime()
          const timeB = b.timestamp instanceof Date ? b.timestamp.getTime() : 
                       b.timestamp && typeof b.timestamp === 'object' && 'toDate' in b.timestamp ? 
                       b.timestamp.toDate().getTime() : new Date(b.timestamp).getTime()
          return timeA - timeB
        })

        callback(messages)
      } catch (error) {
        console.error("Error processing messages in subscription:", error)
        callback([])
      }
    }, (error) => {
      console.error("Error in subscription:", error)
    })

    return unsubscribe
  } catch (error) {
    console.error("Error setting up subscription:", error)
    return () => {}
  }
}

export const markGroupMessagesAsRead = async (groupId: string, userId: string) => {
  try {
    // This could be implemented by storing read status in a separate collection
    // For now, we'll just return success
    return true
  } catch (error) {
    console.error("Error marking messages as read:", error)
    throw error
  }
}

// Notification operations
export const sendNotification = async (notificationData: Omit<Notification, "id" | "createdAt" | "status" | "readBy">) => {
  try {
    // Add notification to Firestore
    const docRef = await addDoc(collection(db, "notifications"), {
      ...notificationData,
      createdAt: serverTimestamp(),
      status: "sent",
      readBy: []
    });

    // Get user preferences and send email notifications if enabled
    let recipientIds: string[] = [];
    const recipients = notificationData.recipients;

    if (recipients.type === "individual" && recipients.userIds) {
      recipientIds = recipients.userIds;
    } else if (recipients.type === "group" && recipients.groupIds) {
      // Get all users in the specified groups
      const groupUsers = await Promise.all(
        recipients.groupIds.map(groupId => getStudentsByGroupId(groupId))
      );
      recipientIds = [...new Set(groupUsers.flat().map(user => user.id))];
    } else if (recipients.type === "mode" && recipients.mode) {
      // Get all users with the specified mode
      const usersSnapshot = await getDocs(
        query(collection(db, "users"), where("mode", "==", recipients.mode))
      );
      recipientIds = usersSnapshot.docs.map(doc => doc.id);
    }

    // Send email notifications to users who have them enabled
    if (recipientIds.length > 0) {
      const users = await getUsersByIds(recipientIds);
      for (const user of users) {
        if (user.notificationPreferences?.emailNotifications) {
          // Send email notification
          try {
            await sendEmailNotification(
              user.email,
              notificationData.title,
              notificationData.content
            );
          } catch (emailError) {
            console.error(`Failed to send email notification to ${user.email}:`, emailError);
          }
        }
      }
    }

    return docRef.id;
  } catch (error) {
    console.error("Error sending notification:", error);
    throw error;
  }
}

export const getNotificationsForUser = async (userId: string): Promise<Notification[]> => {
  try {
    // Get user data to check mode and groups
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) return [];
    const userData = userDoc.data();

    // Get all notifications
    const q = query(
      collection(db, "notifications"),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    
    // Filter notifications based on recipient type
    return snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Notification))
      .map(notification => ({
        ...notification,
        createdAt: convertTimestamp(notification.createdAt)
      }))
      .filter(notification => {
        const recipients = notification.recipients;
        
        // Check individual recipients
        if (recipients.type === "individual" && recipients.userIds?.includes(userId)) {
          return true;
        }
        
        // Check group recipients
        if (recipients.type === "group" && recipients.groupIds?.some(groupId => 
          userData.assignedGroups?.includes(groupId)
        )) {
          return true;
        }
        
        // Check mode recipients
        if (recipients.type === "mode" && recipients.mode === userData.mode) {
          return true;
        }
        
        // Check bulk email recipients
        if (recipients.type === "bulk" && recipients.emails?.includes(userData.email)) {
          return true;
        }
        
        return false;
      });
  } catch (error) {
    console.error("Error getting notifications:", error);
    return [];
  }
}

export const getAllNotifications = async (): Promise<Notification[]> => {
  try {
    const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: convertTimestamp(doc.data().createdAt)
    })) as Notification[]
  } catch (error) {
    console.error("Error getting all notifications:", error)
    return []
  }
}

export const markNotificationAsRead = async (notificationId: string, userId: string) => {
  try {
    await updateDoc(doc(db, "notifications", notificationId), {
      status: "read",
      readBy: arrayUnion(userId)
    })
  } catch (error) {
    console.error("Error marking notification as read:", error)
    throw error
  }
}

// NDA Document operations
export const uploadNDADocument = async (
  file: File,
  documentData: Omit<NDADocument, "id" | "uploadedAt" | "fileUrl" | "fileName" | "fileSize">
) => {
  try {
    const filePath = `nda-documents/${documentData.type}/${Date.now()}-${file.name}`
    const fileUrl = await uploadFile(file, filePath)

    const docRef = await addDoc(collection(db, "nda-documents"), {
      ...documentData,
      fileUrl,
      fileName: file.name,
      fileSize: file.size,
      uploadedAt: serverTimestamp(),
      status: documentData.type === "admin" ? "approved" : "pending"
    })

    return docRef.id
  } catch (error) {
    console.error("Error uploading NDA document:", error)
    throw error
  }
}

export const getNDADocumentsForStudent = async (studentId: string): Promise<NDADocument[]> => {
  try {
    // Get documents sent to the student (admin documents)
    const adminDocsQuery = query(
      collection(db, "nda-documents"),
      where("studentId", "==", studentId),
      orderBy("uploadedAt", "desc")
    )

    // Get documents uploaded by the student
    const studentDocsQuery = query(
      collection(db, "nda-documents"),
      where("uploadedBy", "==", studentId),
      orderBy("uploadedAt", "desc")
    )

    // Execute both queries in parallel
    const [adminDocsSnapshot, studentDocsSnapshot] = await Promise.all([
      getDocs(adminDocsQuery),
      getDocs(studentDocsQuery)
    ])

    // Convert and combine the results
    const adminDocs = adminDocsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      uploadedAt: convertTimestamp(doc.data().uploadedAt),
      approvedAt: doc.data().approvedAt ? convertTimestamp(doc.data().approvedAt) : undefined
    })) as NDADocument[]

    const studentDocs = studentDocsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      uploadedAt: convertTimestamp(doc.data().uploadedAt),
      approvedAt: doc.data().approvedAt ? convertTimestamp(doc.data().approvedAt) : undefined
    })) as NDADocument[]

    // Filter admin docs to only include type "admin" and student docs to only include type "student"
    const filteredAdminDocs = adminDocs.filter(doc => doc.type === "admin")
    const filteredStudentDocs = studentDocs.filter(doc => doc.type === "student")

    // Return combined results
    return [...filteredAdminDocs, ...filteredStudentDocs]
  } catch (error) {
    console.error("Error getting NDA documents:", error)
    return []
  }
}

export const getAllNDADocuments = async (): Promise<NDADocument[]> => {
  try {
    const q = query(collection(db, "nda-documents"), orderBy("uploadedAt", "desc"))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      uploadedAt: convertTimestamp(doc.data().uploadedAt),
      approvedAt: doc.data().approvedAt ? convertTimestamp(doc.data().approvedAt) : undefined
    })) as NDADocument[]
  } catch (error) {
    console.error("Error getting all NDA documents:", error)
    return []
  }
}

export const updateNDADocumentStatus = async (
  documentId: string,
  status: "approved" | "rejected",
  adminId: string,
  rejectionReason?: string
) => {
  try {
    await updateDoc(doc(db, "nda-documents", documentId), {
      status,
      ...(status === "approved" ? {
        approvedAt: serverTimestamp(),
        approvedBy: adminId
      } : {
        rejectionReason
      })
    })
  } catch (error) {
    console.error("Error updating NDA document status:", error)
    throw error
  }
}

// Export all functions for easy access
export default {
  // Permission checks
  canManageUsers,
  canCreateAdmins,
  canManageGroups,
  canCreateAnnouncements,
  canViewAllUsers,
  canApproveUsers,
  canAssignRoles,
  
  // User operations
  getUsers,
  getUserById,
  getUsersByIds,
  getAllStudents,
  getPendingUsers,
  approveUser,
  updateUserRole,
  deleteUser,
  assignUserToGroups,
  updateUserProfile,
  updateUserNotificationPreferences,
  setDefaultNotificationPreferences,
  
  // Group operations
  getGroups,
  getGroupById,
  getUserGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  assignUserToGroup,
  removeUserFromGroup,
  getStudentsByGroupId,
  
  // Announcement operations
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  markAnnouncementAsViewed,
  getAnnouncementViewers,
  getAnnouncementStats,
  hasUserViewedAnnouncement,
  getRecentAnnouncementsForUser,
  
  // File operations
  uploadFile,
  
  // Analytics and settings
  getAnalytics,
  getPlatformSettings,
  savePlatformSettings,
}

export async function createUser(userData: {
  email: string;
  password: string;
  role?: string;
  status?: string;
  mode?: "online" | "offline";
  createdAt?: string;
}) {
  try {
    // Create auth user
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password)

    // Create user document
    const userDoc = {
      id: userCredential.user.uid,
      email: userData.email,
      name: `Student ${Math.floor(Math.random() * 1000)}`, // Temporary name
      role: userData.role || "student",
      mode: userData.mode || "online",
      isApproved: true,
      assignedGroups: [],
      totalAnnouncementsViewed: 0,
      registrationDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      notificationPreferences: {
        emailNotifications: true,
        announcementEmails: true,
        groupActivityEmails: true
      },
      forcePasswordChange: true // Flag to force password change on first login
    }

    await setDoc(doc(db, "users", userCredential.user.uid), userDoc)

    return userCredential.user.uid
  } catch (error) {
    console.error("Error creating user:", error)
    throw error
  }
}

export async function isEmailVerificationRequired() {
  const docSnap = await getDoc(doc(db, "settings", "app"));
  return !!docSnap.data()?.requireEmailVerification;
}