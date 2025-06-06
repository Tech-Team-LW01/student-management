// app/api/send-announcement-notification/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { sendAnnouncementEmail } from '@/lib/announcement-email';
import { getGroups } from '@/lib/firebase-utils';
import type { User } from '@/types';

export async function POST(request: Request) {
  try {
    const { announcement, groupIds } = await request.json();

    if (!announcement || !groupIds || !Array.isArray(groupIds)) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Get all groups to get their names
    const groups = await getGroups();
    const groupNames = groupIds.map(id => groups.find(g => g.id === id)?.name || 'Unknown Group');

    // Get all users in the selected groups
    const usersQuery = query(
      collection(db, 'users'),
      where('assignedGroups', 'array-contains-any', groupIds)
    );
    const usersSnapshot = await getDocs(usersQuery);
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as User[];

    let notified = 0;
    let failed = 0;

    // Send emails to all users
    for (const user of users) {
      try {
        await sendAnnouncementEmail(
          user.email,
          user.name,
          {
            title: announcement.title,
            content: announcement.content,
            groupNames,
            files: announcement.files || []
          }
        );
        notified++;
      } catch (error) {
        console.error(`Failed to send email to ${user.email}:`, error);
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Notifications sent successfully',
      notified,
      failed,
      total: users.length
    });
  } catch (error) {
    console.error('Error sending notifications:', error);
    return NextResponse.json(
      { error: 'Failed to send notifications' },
      { status: 500 }
    );
  }
}