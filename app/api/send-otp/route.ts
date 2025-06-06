// app/api/send-otp/route.ts
import { NextResponse } from 'next/server';
import { sendOTPEmail } from '@/lib/email-service';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

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

    // Check rate limiting using Firestore
    const oneHourAgo = new Date(Date.now() - 3600000); // 1 hour ago
    const otpAttemptsQuery = query(
      collection(db, 'otpAttempts'),
      where('email', '==', email)
    );
    
    const attemptsSnapshot = await getDocs(otpAttemptsQuery);
    const recentAttempts = attemptsSnapshot.docs
      .map(doc => doc.data())
      .filter(data => data.timestamp?.toDate() > oneHourAgo);

    if (recentAttempts.length >= 5) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Record this attempt
    await addDoc(collection(db, 'otpAttempts'), {
      email,
      timestamp: serverTimestamp(),
      otp,
    });

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