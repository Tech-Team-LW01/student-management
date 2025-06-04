// components/settings/notification-preferences.tsx
"use client"

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { updateUserNotificationPreferences } from '@/lib/firebase-utils';
import { useAuth } from '@/contexts/auth-context';
import { Bell, Mail, Megaphone, Users, XCircle, CheckCircle } from 'lucide-react';

export function NotificationPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState({
    emailNotifications: user?.notificationPreferences?.emailNotifications ?? true,
    announcementEmails: user?.notificationPreferences?.announcementEmails ?? true,
    groupActivityEmails: user?.notificationPreferences?.groupActivityEmails ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    setSaveStatus('idle');
    
    try {
      await updateUserNotificationPreferences(user.id, preferences);
      setSaveStatus('success');
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Error saving preferences:', error);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = () => {
    if (!user?.notificationPreferences) return true;
    
    return (
      preferences.emailNotifications !== user.notificationPreferences.emailNotifications ||
      preferences.announcementEmails !== user.notificationPreferences.announcementEmails ||
      preferences.groupActivityEmails !== user.notificationPreferences.groupActivityEmails
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Email Notifications
        </CardTitle>
        <CardDescription>
          Manage how you receive email notifications from LinuxWorld
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
            <Label htmlFor="email-notifications" className="flex items-center gap-3 cursor-pointer">
              <div className="p-2 rounded-full bg-blue-100">
                <Mail className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="font-medium">Email Notifications</div>
                <div className="text-sm text-muted-foreground">
                  Master switch for all email notifications
                </div>
              </div>
            </Label>
            <Switch
              id="email-notifications"
              checked={preferences.emailNotifications}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, emailNotifications: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 ml-8">
            <Label htmlFor="announcement-emails" className="flex items-center gap-3 cursor-pointer">
              <div className="p-2 rounded-full bg-green-100">
                <Megaphone className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <div className="font-medium">Announcement Emails</div>
                <div className="text-sm text-muted-foreground">
                  Get notified when new announcements are posted to your groups
                </div>
              </div>
            </Label>
            <Switch
              id="announcement-emails"
              checked={preferences.announcementEmails}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, announcementEmails: checked })
              }
              disabled={!preferences.emailNotifications}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 ml-8">
            <Label htmlFor="group-activity-emails" className="flex items-center gap-3 cursor-pointer">
              <div className="p-2 rounded-full bg-purple-100">
                <Users className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <div className="font-medium">Group Activity</div>
                <div className="text-sm text-muted-foreground">
                  Updates about group activities and changes
                </div>
              </div>
            </Label>
            <Switch
              id="group-activity-emails"
              checked={preferences.groupActivityEmails}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, groupActivityEmails: checked })
              }
              disabled={!preferences.emailNotifications}
            />
          </div>
        </div>

        <div className="pt-4 space-y-3">
          <Button 
            onClick={handleSave} 
            disabled={saving || !hasChanges()} 
            className="w-full"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </Button>
          
          {saveStatus === 'success' && (
            <div className="text-center text-sm text-green-600 flex items-center justify-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Preferences saved successfully!
            </div>
          )}
          
          {saveStatus === 'error' && (
            <div className="text-center text-sm text-red-600 flex items-center justify-center gap-2">
              <XCircle className="h-4 w-4" />
              Failed to save preferences. Please try again.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}