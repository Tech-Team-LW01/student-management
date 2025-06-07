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
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    // Simple query for per-email rate limiting
    const otpAttemptsQuery = query(
      collection(db, 'otpAttempts'),
      where('email', '==', email)
    );
    
    const attemptsSnapshot = await getDocs(otpAttemptsQuery);
    const recentAttempts = attemptsSnapshot.docs
      .map(doc => doc.data())
      .filter(data => {
        const timestamp = data.timestamp?.toDate();
        return timestamp && timestamp > fiveMinutesAgo;
      });

    if (recentAttempts.length >= 3) {
      const oldestAttempt = recentAttempts[recentAttempts.length - 1];
      const timeToWait = Math.ceil((fiveMinutesAgo.getTime() - oldestAttempt.timestamp.toDate().getTime()) / 1000 / 60);
      
      return NextResponse.json(
        { error: `Too many attempts. Please wait ${timeToWait} minutes before trying again.` },
        { status: 429 }
      );
    }

    // Simple query for global rate limiting
    const globalQuery = query(
      collection(db, 'otpAttempts')
    );
    
    const globalSnapshot = await getDocs(globalQuery);
    const globalRecentAttempts = globalSnapshot.docs
      .map(doc => doc.data())
      .filter(data => {
        const timestamp = data.timestamp?.toDate();
        return timestamp && timestamp > fiveMinutesAgo;
      });

    if (globalRecentAttempts.length >= 10) {
      return NextResponse.json(
        { error: 'System is busy. Please try again in a few minutes.' },
        { status: 429 }
      );
    }

    // Record this attempt
    await addDoc(collection(db, 'otpAttempts'), {
      email,
      timestamp: serverTimestamp(),
      otp,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
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