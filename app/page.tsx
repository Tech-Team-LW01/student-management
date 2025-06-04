"use client"

import { useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push("/auth/signin")
    } else if (!user.isApproved) {
      router.push("/pending-approval")
    } else {
      router.push("/dashboard")
    }
  }, [user, router])

  return null
}
