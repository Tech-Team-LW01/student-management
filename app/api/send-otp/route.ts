// app/api/send-otp/route.ts
import { NextResponse } from 'next/server';
import { sendOTPEmail } from '@/lib/email-service';

// Rate limiting store (in production, use Redis or similar)
const otpAttempts = new Map<string, { count: number; timestamp: number }>();

// Clean up old entries every hour
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of otpAttempts.entries()) {
    if (now - data.timestamp > 3600000) { // 1 hour
      otpAttempts.delete(email);
    }
  }
}, 3600000);

export async function POST(request: Request) {
  try {
    const { email, otp, name } = await request.json();

    // Validate inputs
    if (!email || !otp || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Rate limiting - max 5 OTP requests per hour per email
    const now = Date.now();
    const userAttempts = otpAttempts.get(email);
    
    if (userAttempts) {
      const hourAgo = now - 3600000; // 1 hour in milliseconds
      
      if (userAttempts.timestamp > hourAgo && userAttempts.count >= 5) {
        return NextResponse.json(
          { error: 'Too many attempts. Please try again later.' },
          { status: 429 }
        );
      }
      
      if (userAttempts.timestamp > hourAgo) {
        userAttempts.count += 1;
      } else {
        // Reset if last attempt was more than an hour ago
        otpAttempts.set(email, { count: 1, timestamp: now });
      }
    } else {
      otpAttempts.set(email, { count: 1, timestamp: now });
    }

    // Send the email
    const result = await sendOTPEmail(email, otp, name);

    return NextResponse.json({ 
      success: true, 
      message: 'Verification code sent successfully',
      messageId: result.messageId 
    });
  } catch (error: any) {
    console.error('Failed to send OTP:', error);
    
    // Check for specific email errors
    if (error.code === 'EAUTH') {
      return NextResponse.json(
        { error: 'Email authentication failed. Please check server configuration.' },
        { status: 500 }
      );
    }
    
    if (error.code === 'ECONNECTION') {
      return NextResponse.json(
        { error: 'Failed to connect to email server. Please try again.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to send verification code. Please try again.' },
      { status: 500 }
    );
  }
}