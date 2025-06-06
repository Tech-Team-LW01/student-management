"use client"

import type React from "react"
import { createContext, useState, useEffect, useContext } from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth"
import { auth, db } from "@/lib/firebase"
import { doc, setDoc, getDoc } from "firebase/firestore"
import type { User } from "@/types"
import { getPlatformSettings } from "@/lib/firebase-utils"

// Default super admin credentials
const DEFAULT_SUPER_ADMIN = {
  email: "linuxworld@gmail.com",
  password: "123456789",
  userData: {
    id: "default-super-admin",
    email: "test1bhupesh@gmail.com",
    name: "Linux World Admin",
    role: "super_admin" as const,
    profileImage: "",
    mobileNumber: "",
    registrationDate: new Date(),
    isApproved: true,
    assignedGroups: [],
    totalAnnouncementsViewed: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

interface AuthContextProps {
  user: User | null
  signUp: (userData: Partial<User>, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOutUser: () => Promise<void>
  updateUser: (userData: Partial<User>) => Promise<void>
  authLoading: boolean
  error: string | null
  isInitialized: boolean
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))
          if (userDoc.exists()) {
            const userData = userDoc.data()
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email!,
              name: userData.name,
              role: userData.role,
              isApproved: userData.isApproved,
              assignedGroups: userData.assignedGroups || [],
              totalAnnouncementsViewed: userData.totalAnnouncementsViewed || 0,
              registrationDate: userData.registrationDate,
              createdAt: userData.createdAt,
              updatedAt: userData.updatedAt,
              notificationPreferences: userData.notificationPreferences,
              forcePasswordChange: userData.forcePasswordChange || false
            })

            // Check if user needs to change password
            if (userData.forcePasswordChange && !pathname.includes("/force-password-change")) {
              router.push("/force-password-change")
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
      setIsInitialized(true)
    })

    return () => unsubscribe()
  }, [router, pathname])

  const signUp = async (userData: Partial<User>, password: string) => {
    try {
      setLoading(true)
      setError(null)

      // Prevent signup with default admin email
      if (userData.email?.toLowerCase() === DEFAULT_SUPER_ADMIN.email.toLowerCase()) {
        throw new Error("This email is reserved for system use")
      }

      // Get platform settings to check auto-approval
      const platformSettings = await getPlatformSettings()

      const userCredential = await createUserWithEmailAndPassword(auth, userData.email!, password)
      const firebaseUser = userCredential.user

      // Determine if user should be auto-approved
      const shouldAutoApprove = userData.role === "student" && platformSettings.autoApproveStudents

      const newUser: Omit<User, "id"> = {
        email: userData.email!,
        name: userData.name!,
        role: userData.role || "student",
        profileImage: userData.profileImage || "",
        mobileNumber: userData.mobileNumber || "",
        registrationDate: new Date(),
        isApproved: shouldAutoApprove,
        assignedGroups: [],
        totalAnnouncementsViewed: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await setDoc(doc(db, "users", firebaseUser.uid), newUser)

      const userWithId: User = {
        id: firebaseUser.uid,
        ...newUser,
      }

      setUser(userWithId)
      console.log("User signed up successfully:", userWithId)
    } catch (error: any) {
      console.error("Sign up error:", error)
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)
      
      // Check if it's the default super admin login
      if (
        email.toLowerCase() === DEFAULT_SUPER_ADMIN.email.toLowerCase() && 
        password === DEFAULT_SUPER_ADMIN.password
      ) {
        console.log("Default super admin login detected")
        
        // Set the default super admin user
        setUser(DEFAULT_SUPER_ADMIN.userData)
        
        // Store in localStorage to persist the session
        localStorage.setItem('defaultSuperAdmin', 'true')
        
        console.log("Default super admin login successful")
        return
      }
      
      // Proceed with normal Firebase authentication
      console.log("Attempting Firebase sign in...")
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user

      console.log("Firebase sign in successful, fetching user data...")
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))

      if (userDoc.exists()) {
        const userData = { id: firebaseUser.uid, ...userDoc.data() } as User
        setUser(userData)
        console.log("Sign in successful:", userData)
      } else {
        console.warn("User data not found in Firestore. Signing out.")
        await signOut(auth)
        setUser(null)
        throw new Error("User data not found. Please contact support.")
      }
    } catch (error: any) {
      console.error("Sign in error:", error)
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOutUser = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("Signing out...")
      
      // Clear default admin session if exists
      localStorage.removeItem('defaultSuperAdmin')
      
      // Sign out from Firebase if there's an active session
      if (auth.currentUser) {
        await signOut(auth)
      }
      
      setUser(null)
      console.log("Sign out successful")
      
      // Redirect to signin page
      router.push('/auth/signin')
    } catch (error: any) {
      console.error("Sign out error:", error)
      setError(error.message)
      // Even if there's an error, try to redirect
      router.push('/auth/signin')
    } finally {
      setLoading(false)
    }
  }

  const updateUser = async (userData: Partial<User>) => {
    try {
      setLoading(true)
      setError(null)

      // Handle default super admin update
      if (user?.id === DEFAULT_SUPER_ADMIN.userData.id) {
        // For default admin, just update the local state
        setUser((prevUser) => {
          if (prevUser) {
            const updatedUser = { ...prevUser, ...userData, updatedAt: new Date() }
            // Optionally store some settings in localStorage
            if (userData.name || userData.profileImage) {
              localStorage.setItem('defaultAdminProfile', JSON.stringify({
                name: updatedUser.name,
                profileImage: updatedUser.profileImage
              }))
            }
            return updatedUser
          }
          return prevUser
        })
        return
      }

      // Normal Firebase user update
      if (auth.currentUser) {
        if (userData.name) {
          await updateProfile(auth.currentUser, {
            displayName: userData.name,
          })
        }

        const updatedUser: Partial<User> = {
          ...userData,
          updatedAt: new Date(),
        }

        await setDoc(doc(db, "users", auth.currentUser.uid), updatedUser, { merge: true })

        // Optimistically update the local state
        setUser((prevUser) => {
          if (prevUser) {
            return { ...prevUser, ...userData }
          }
          return prevUser
        })
      }
    } catch (error: any) {
      console.error("Update user error:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const value: AuthContextProps = {
    user,
    signUp,
    signIn,
    signOutUser,
    updateUser,
    authLoading: loading,
    error,
    isInitialized,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}