// app/api/send-announcement-notification/route.ts
import { NextResponse } from 'next/server';
import { sendAnnouncementEmail } from '@/lib/announcement-email';
import { getStudentsByGroupId, getGroupById } from '@/lib/firebase-utils';
import type { User, Group, Announcement } from '@/types';

// Define types for email results
type EmailResult = {
  email: string;
  success: boolean;
  error?: any;
  skipped?: boolean;
  reason?: string;
};

// Batch email sending with rate limiting
async function sendEmailBatch(
  students: User[],
  announcement: Announcement & { groupName: string },
  batchSize: number = 10
): Promise<EmailResult[]> {
  const results: EmailResult[] = [];
  
  // Filter students who have email notifications enabled
  // Default to true if preferences not set
  const studentsWithEmailEnabled = students.filter(student => {
    // If no preferences set, default to sending emails
    if (!student.notificationPreferences) {
      return true;
    }
    
    // Check if both email notifications and announcement emails are enabled
    return student.notificationPreferences.emailNotifications !== false &&
           student.notificationPreferences.announcementEmails !== false;
  });
  
  for (let i = 0; i < studentsWithEmailEnabled.length; i += batchSize) {
    const batch = studentsWithEmailEnabled.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (student): Promise<EmailResult> => {
      try {
        await sendAnnouncementEmail(
          student.email,
          student.name,
          {
            title: announcement.title,
            content: announcement.content,
            groupName: announcement.groupName,
            files: announcement.files,
          }
        );
        return { email: student.email, success: true };
      } catch (error) {
        console.error(`Failed to send email to ${student.email}:`, error);
        return { email: student.email, success: false, error };
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Add delay between batches to avoid rate limiting
    if (i + batchSize < studentsWithEmailEnabled.length) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
    }
  }
  
  // Add skipped students to results
  const skippedStudents = students.filter(student => 
    student.notificationPreferences?.emailNotifications === false ||
    student.notificationPreferences?.announcementEmails === false
  );
  
  skippedStudents.forEach(student => {
    results.push({
      email: student.email,
      success: false,
      skipped: true,
      reason: 'Email notifications disabled by user',
    });
  });
  
  return results;
}

export async function POST(request: Request) {
  try {
    const { announcement, groupId } = await request.json();

    if (!announcement || !groupId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get group details
    const group = await getGroupById(groupId);
    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    // Get all students in the group
    const students = await getStudentsByGroupId(groupId);
    
    if (students.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No students in group to notify',
        notified: 0,
      });
    }

    console.log(`Sending announcement notifications to ${students.length} students in group: ${group.name}`);

    // Send emails in batches
    const results = await sendEmailBatch(
      students,
      { ...announcement, groupName: group.name },
      10 // Send 10 emails at a time
    );

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success && !r.skipped).length;
    const skippedCount = results.filter(r => r.skipped === true).length;

    console.log(`Email results - Success: ${successCount}, Failed: ${failureCount}, Skipped: ${skippedCount}`);

    return NextResponse.json({
      success: true,
      message: `Notifications sent to ${successCount} students`,
      notified: successCount,
      failed: failureCount,
      skipped: skippedCount,
      total: students.length,
      details: results,
    });
  } catch (error: any) {
    console.error('Failed to send announcement notifications:', error);
    return NextResponse.json(
      { error: 'Failed to send notifications' },
      { status: 500 }
    );
  }
}