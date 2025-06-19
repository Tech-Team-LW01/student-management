import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

// Create reusable transporter for Gmail
const createGmailTransporter = () => {
  if (!process.env.GMAIL_EMAIL || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error("Gmail credentials not configured")
  }
  
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_EMAIL,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })
}

export async function POST(request: Request) {
  try {
    console.log("send-email route called");
    
    const { to, subject, html, text } = await request.json()
    console.log("Received email request:", { to, subject });

    if (!to || !subject || (!html && !text)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check environment variables
    if (!process.env.GMAIL_EMAIL || !process.env.GMAIL_APP_PASSWORD) {
      console.error("Missing Gmail credentials:", {
        hasEmail: !!process.env.GMAIL_EMAIL,
        hasPassword: !!process.env.GMAIL_APP_PASSWORD
      });
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 }
      )
    }

    console.log("Creating email transporter...");
    const transporter = createGmailTransporter()
    
    console.log("Sending email...");
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `LinuxWorld <${process.env.GMAIL_EMAIL}>`,
      to,
      subject,
      html,
      text,
    })

    console.log("Email sent successfully:", info.messageId);
    return NextResponse.json({ success: true, messageId: info.messageId })
    
  } catch (error: any) {
    console.error("Error in send-email route:", error)
    return NextResponse.json(
      { error: "Failed to send email", details: error.message },
      { status: 500 }
    )
  }
} 