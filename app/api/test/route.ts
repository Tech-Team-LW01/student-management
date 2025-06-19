import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({ 
    message: "API routes are working!",
    timestamp: new Date().toISOString(),
    port: process.env.PORT || "unknown"
  })
}

export async function POST(request: Request) {
  const body = await request.json()
  return NextResponse.json({ 
    message: "POST request received",
    data: body,
    timestamp: new Date().toISOString()
  })
} 