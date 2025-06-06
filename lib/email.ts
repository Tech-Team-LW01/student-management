interface EmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to,
        subject,
        html,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to send email")
    }

    return await response.json()
  } catch (error) {
    console.error("Error sending email:", error)
    throw error
  }
} 