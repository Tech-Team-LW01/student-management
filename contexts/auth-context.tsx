"use client"

import type React from "react"
import { createContext, useState, useEffect, useContext } from "react"
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

export interface AuthContextProps {
  user: User | null
  signUp: (userData: Partial<User>, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => void
  updateUser: (userData: Partial<User>) => Promise<void>
  authLoading: boolean
  error: string | null
  isInitialized: boolean // Add this to track if auth has been initialized
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  signUp: async () => {},
  signIn: async () => {},
  signOut: () => {},
  updateUser: async () => {},
  authLoading: false,
  error: null,
  isInitialized: false,
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false) // Track initialization
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true // Prevent state updates if component unmounted

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!mounted) return

      try {
        if (firebaseUser) {
          console.log("Firebase user detected:", firebaseUser.uid)
          
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))

          if (userDoc.exists()) {
            const userData = { id: firebaseUser.uid, ...userDoc.data() } as User
            if (mounted) {
              setUser(userData)
              console.log("User data loaded from Firestore:", userData)
            }
          } else {
            // Handle the case where the user exists in Firebase Auth but not in Firestore
            console.warn("User data not found in Firestore. Signing out.")
            await signOut(auth)
            if (mounted) {
              setUser(null)
            }
          }
        } else {
          console.log("No Firebase user detected")
          if (mounted) {
            setUser(null)
          }
        }
      } catch (error) {
        console.error("Error in auth state change:", error)
        if (mounted) {
          setUser(null)
          setError("Failed to load user data")
        }
      } finally {
        if (mounted) {
          setIsInitialized(true)
          setAuthLoading(false)
        }
      }
    })

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [])

  const signUp = async (userData: Partial<User>, password: string) => {
    try {
      setAuthLoading(true)
      setError(null)

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
      setAuthLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setAuthLoading(true)
      setError(null)
      
      console.log("Attempting to sign in...")
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
      setAuthLoading(false)
    }
  }

  const signOutUser = async () => {
    try {
      setAuthLoading(true)
      setError(null)
      console.log("Signing out...")
      await signOut(auth)
      setUser(null)
      console.log("Sign out successful")
    } catch (error: any) {
      console.error("Sign out error:", error)
      setError(error.message)
    } finally {
      setAuthLoading(false)
    }
  }

  const updateUser = async (userData: Partial<User>) => {
    try {
      setAuthLoading(true)
      setError(null)

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
      setAuthLoading(false)
    }
  }

  const value: AuthContextProps = {
    user,
    signUp,
    signIn,
    signOut: signOutUser,
    updateUser,
    authLoading,
    error,
    isInitialized,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}