import { NextResponse } from "next/server"
import nodemailer from 'nodemailer'

// Create reusable transporter for Gmail
const createGmailTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_EMAIL,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
};

export async function POST(request: Request) {
  try {
    const { to, subject, html, text } = await request.json()

    const transporter = createGmailTransporter()
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `LinuxWorld <${process.env.GMAIL_EMAIL}>`,
      to,
      subject,
      html,
      text,
    })

    return NextResponse.json({ success: true, messageId: info.messageId })
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
} 