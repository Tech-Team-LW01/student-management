import { db } from "@/lib/firebase"
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch,
  arrayUnion,
  increment,
  arrayRemove,
} from "firebase/firestore"
import type { User, Group, Announcement } from "@/types"

export const getStudentsByGroupId = async (groupId: string): Promise<User[]> => {
  try {
    const groupRef = doc(db, "groups", groupId)
    const groupDoc = await getDoc(groupRef)

    if (!groupDoc.exists()) {
      throw new Error("Group not found")
    }

    const group = groupDoc.data() as Group
    const memberIds = group.members || []

    if (memberIds.length === 0) {
      return []
    }

    const usersRef = collection(db, "users")
    const q = query(usersRef, where("id", "in", memberIds))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as User[]
  } catch (error) {
    console.error("Error getting students by group ID:", error)
    throw error
  }
}

export const assignUserToGroups = async (userId: string, groupIds: string[], adminId: string) => {
  try {
    // Update user's assigned groups
    await updateDoc(doc(db, "users", userId), {
      assignedGroups: groupIds,
      updatedAt: serverTimestamp(),
    })

    // Update each group's member count and members array
    const batch = writeBatch(db)
    
    for (const groupId of groupIds) {
      const groupRef = doc(db, "groups", groupId)
      const groupDoc = await getDoc(groupRef)
      
      if (groupDoc.exists()) {
        const group = groupDoc.data() as Group
        const members = group.members || []
        
        if (!members.includes(userId)) {
          batch.update(groupRef, {
            members: arrayUnion(userId),
            memberCount: increment(1),
            updatedAt: serverTimestamp(),
          })
        }
      }
    }

    await batch.commit()
  } catch (error) {
    console.error("Error assigning user to groups:", error)
    throw error
  }
}

export const removeUserFromGroup = async (userId: string, groupId: string) => {
  try {
    // Update user's assigned groups
    await updateDoc(doc(db, "users", userId), {
      assignedGroups: arrayRemove(groupId),
      updatedAt: serverTimestamp(),
    })

    // Update group's member count and members array
    const groupRef = doc(db, "groups", groupId)
    await updateDoc(groupRef, {
      members: arrayRemove(userId),
      memberCount: increment(-1),
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error removing user from group:", error)
    throw error
  }
} 