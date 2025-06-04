// hooks/use-announcement-notification.ts
import { useState } from 'react';

export function useAnnouncementNotification() {
  const [isSending, setIsSending] = useState(false);
  const [notificationResult, setNotificationResult] = useState<{
    success: boolean;
    message: string;
    notified?: number;
    failed?: number;
  } | null>(null);

  const sendNotifications = async (announcement: any, groupId: string) => {
    setIsSending(true);
    setNotificationResult(null);

    try {
      const response = await fetch('/api/send-announcement-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          announcement,
          groupId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send notifications');
      }

      setNotificationResult({
        success: true,
        message: data.message,
        notified: data.notified,
        failed: data.failed,
      });

      return data;
    } catch (error: any) {
      console.error('Error sending notifications:', error);
      setNotificationResult({
        success: false,
        message: error.message || 'Failed to send notifications',
      });
      throw error;
    } finally {
      setIsSending(false);
    }
  };

  return {
    sendNotifications,
    isSending,
    notificationResult,
  };
}