import { NextResponse } from "next/server"
import { auth } from "@/lib/firebase"
import { sendPasswordResetEmail } from "firebase/auth"
import { sendResetPasswordEmail } from "@/lib/email-utils"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    // Generate password reset link
    const actionCodeSettings = {
      url: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
      handleCodeInApp: true,
    }

    // Send password reset email using Firebase
    await sendPasswordResetEmail(auth, email, actionCodeSettings)

    // Send custom email using Nodemailer
    await sendResetPasswordEmail(email)

    return NextResponse.json({
      success: true,
      message: "Password reset email sent"
    })
  } catch (error: any) {
    console.error("Error sending password reset email:", error)
    return NextResponse.json(
      { error: error.message || "Failed to send password reset email" },
      { status: 500 }
    )
  }
} 