// This is a one-time setup script to create the first super admin
// Run this in your browser console or as a Node.js script

import { createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"

export async function createInitialSuperAdmin() {
  const adminData = {
    email: "superadmin@example.com", // Change this
    password: "SuperAdmin123!", // Change this
    name: "Super Administrator",
    mobileNumber: "+1234567890",
  }

  try {
    console.log("Creating initial super admin...")

    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, adminData.email, adminData.password)
    const user = userCredential.user

    // Create user document in Firestore
    await setDoc(doc(db, "users", user.uid), {
      email: adminData.email,
      name: adminData.name,
      role: "super_admin",
      mobileNumber: adminData.mobileNumber,
      profileImage: "",
      registrationDate: serverTimestamp(),
      isApproved: true,
      assignedGroups: [],
      totalAnnouncementsViewed: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    console.log("✅ Super admin created successfully!")
    console.log("Email:", adminData.email)
    console.log("Password:", adminData.password)
    console.log("UID:", user.uid)

    return user.uid
  } catch (error) {
    console.error("❌ Error creating super admin:", error)
    throw error
  }
}

// Uncomment to run:
// createInitialSuperAdmin()
