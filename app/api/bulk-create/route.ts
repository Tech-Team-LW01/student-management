import { NextResponse } from "next/server"
import { createUser, assignUserToGroups } from "@/lib/firebase-utils"
import { sendWelcomeEmail } from "@/lib/email-utils"
import { generatePassword } from "@/lib/utils"

export async function POST(request: Request) {
  try {
    const { users, selectedGroups } = await request.json()

    if (!Array.isArray(users)) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      )
    }

    const results = []
    const errors = []

    for (const userData of users) {
      try {
        // Generate a random password
        const password = generatePassword()

        // Create the user in Firebase
        const userId = await createUser({
          ...userData,
          password,
          mode: userData.mode || "online",
        })

        // Assign user to selected groups if any
        if (selectedGroups && selectedGroups.length > 0) {
          await assignUserToGroups(userId, selectedGroups)
        }

        // Send welcome email
        await sendWelcomeEmail(userData.email, password)

        results.push({
          email: userData.email,
          password,
          userId,
          status: "success",
          message: "User created successfully"
        })
      } catch (error: any) {
        console.error(`Error creating user ${userData.email}:`, error)
        errors.push({
          email: userData.email,
          status: "error",
          message: error.message || "Failed to create user"
        })
      }
    }

    return NextResponse.json({
      success: true,
      results,
      errors,
    })
  } catch (error: any) {
    console.error("Error in bulk user creation:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create users" },
      { status: 500 }
    )
  }
} 