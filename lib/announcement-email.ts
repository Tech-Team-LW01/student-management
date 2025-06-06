// lib/announcement-email.ts
import nodemailer from 'nodemailer';

// Create reusable transporter for Gmail
const createGmailTransporter = () => {
  if (!process.env.GMAIL_EMAIL || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error('Gmail credentials not configured');
  }
  
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_EMAIL,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
};

export async function sendAnnouncementEmail(
  studentEmail: string,
  studentName: string,
  announcement: {
    title: string;
    content: string;
    groupNames: string[];
    files: Array<{ name: string; url: string; isDownloadable: boolean }>;
  }
) {
  // Skip email sending during build process
  if (process.env.NODE_ENV === 'production' && !process.env.RUNTIME) {
    console.log('Skipping announcement email during build process');
    return { success: true, messageId: 'build-mode' };
  }

  const subject = `New Announcement: ${announcement.title || "New Announcement"} - LinuxWorld`;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            line-height: 1.6; 
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header { 
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white; 
            padding: 30px 20px; 
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .content { 
            padding: 40px 30px;
          }
          .announcement-badge {
            display: inline-block;
            background: #d1fae5;
            color: #065f46;
            padding: 6px 14px;
            border-radius: 16px;
            font-size: 14px;
            font-weight: 500;
            margin: 5px 5px 5px 0;
          }
          .announcement-title {
            font-size: 24px;
            font-weight: 600;
            color: #111;
            margin: 20px 0 15px 0;
          }
          .announcement-content {
            background: #f8fafc;
            border-left: 4px solid #10b981;
            padding: 20px;
            margin: 20px 0;
            color: #475569;
            white-space: pre-wrap;
            border-radius: 0 8px 8px 0;
          }
          .groups-section {
            margin: 20px 0;
          }
          .groups-title {
            font-size: 16px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 10px;
          }
          .files-section {
            margin-top: 30px;
            padding: 20px;
            background: #f1f5f9;
            border-radius: 8px;
          }
          .files-title {
            margin-top: 0;
            margin-bottom: 15px;
            font-size: 18px;
            color: #374151;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .file-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 15px;
            background: white;
            border-radius: 6px;
            margin-bottom: 10px;
            border: 1px solid #e5e7eb;
          }
          .file-info {
            display: flex;
            align-items: center;
            gap: 12px;
            flex: 1;
            min-width: 0;
          }
          .file-icon {
            width: 36px;
            height: 36px;
            background: #e0e7ff;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            flex-shrink: 0;
          }
          .file-details {
            flex: 1;
            min-width: 0;
          }
          .file-name {
            font-size: 14px;
            font-weight: 500;
            color: #1f2937;
            word-break: break-word;
          }
          .file-badge {
            font-size: 12px;
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: 500;
            white-space: nowrap;
          }
          .downloadable {
            background: #d1fae5;
            color: #065f46;
          }
          .view-only {
            background: #fed7aa;
            color: #9a3412;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background: #10b981;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin-top: 20px;
          }
          .button:hover {
            background: #059669;
          }
          .footer { 
            background: #f8fafc;
            text-align: center; 
            padding: 25px 20px; 
            color: #64748b; 
            font-size: 13px;
            border-top: 1px solid #e2e8f0;
          }
          .footer p {
            margin: 5px 0;
          }
          .footer a {
            color: #10b981;
            text-decoration: none;
          }
          .footer a:hover {
            text-decoration: underline;
          }
          .divider {
            height: 1px;
            background: #e2e8f0;
            margin: 30px 0;
          }
          @media (max-width: 600px) {
            .content {
              padding: 30px 20px;
            }
            .file-item {
              flex-direction: column;
              align-items: flex-start;
              gap: 10px;
            }
            .file-badge {
              align-self: flex-end;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>LinuxWorld</h1>
            <p style="margin: 5px 0 0 0; font-size: 16px; opacity: 0.9;">New Announcement</p>
          </div>
          <div class="content">
            <p style="font-size: 18px; margin-bottom: 20px;">Hello ${studentName},</p>
            
            <p style="color: #475569; margin-bottom: 15px;">You have received a new announcement in the following group${announcement.groupNames.length > 1 ? 's' : ''}:</p>
            
            <div class="groups-section">
              ${announcement.groupNames.map(groupName => `
                <span class="announcement-badge">📢 ${groupName}</span>
              `).join('')}
            </div>
            
            <h2 class="announcement-title">${announcement.title || 'New Announcement'}</h2>
            
            <div class="announcement-content">${announcement.content}</div>
            
            ${announcement.files.length > 0 ? `
              <div class="files-section">
                <h3 class="files-title">
                  📎 Attachments (${announcement.files.length})
                </h3>
                ${announcement.files.map(file => `
                  <div class="file-item">
                    <div class="file-info">
                      <div class="file-icon">📄</div>
                      <div class="file-details">
                        <div class="file-name">${file.name}</div>
                      </div>
                    </div>
                    <span class="file-badge ${file.isDownloadable ? 'downloadable' : 'view-only'}">
                      ${file.isDownloadable ? '⬇️ Downloadable' : '👁️ View Only'}
                    </span>
                  </div>
                `).join('')}
                <p style="font-size: 14px; color: #64748b; margin-top: 15px; margin-bottom: 0;">
                  💡 To download or view these files, please visit your dashboard.
                </p>
              </div>
            ` : ''}
            
            <div class="divider"></div>
            
            <p style="color: #64748b; font-size: 14px; margin-bottom: 20px;">
              This announcement was posted to your group${announcement.groupNames.length > 1 ? 's' : ''}: <strong>${announcement.groupNames.join(', ')}</strong>. 
              To view all announcements and access attachments, please visit your LinuxWorld dashboard.
            </p>
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/groups" class="button">
              📱 View in Dashboard
            </a>
          </div>
          <div class="footer">
            <p><strong>LinuxWorld</strong> - Learn Linux, Master the Command Line</p>
            <p>© 2024 LinuxWorld. All rights reserved.</p>
            <p>You're receiving this because you're a member of: ${announcement.groupNames.join(', ')}</p>
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings">Manage email preferences</a>
              <span style="margin: 0 10px; color: #cbd5e1;">|</span>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">Dashboard</a>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
    Hello ${studentName},

    You have received a new announcement in the following group${announcement.groupNames.length > 1 ? 's' : ''}:
    ${announcement.groupNames.map(name => `- ${name}`).join('\n')}

    ${announcement.title || 'New Announcement'}

    ${announcement.content}

    ${announcement.files.length > 0 ? `
This announcement includes ${announcement.files.length} attachment${announcement.files.length > 1 ? 's' : ''}:

${announcement.files.map(file => `
- ${file.name} ${file.isDownloadable ? '(Downloadable)' : '(View Only)'}
`).join('')}

To access these files, please visit your dashboard.
    ` : ''}

    View this announcement and manage all attachments in your LinuxWorld dashboard:
    ${process.env.NEXT_PUBLIC_APP_URL}/groups

    Best regards,
    The LinuxWorld Team
    
    ---
    Manage email preferences: ${process.env.NEXT_PUBLIC_APP_URL}/settings
    You're receiving this because you're a member of: ${announcement.groupNames.join(', ')}
  `;

  try {
    const transporter = createGmailTransporter();
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `LinuxWorld <${process.env.GMAIL_EMAIL}>`,
      to: studentEmail,
      subject,
      html,
      text,
    });
    
    console.log('Announcement email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending announcement email:', error);
    throw error;
  }
}

// Send bulk announcement emails
export async function sendBulkAnnouncementEmails(
  students: Array<{ email: string; name: string }>,
  announcement: {
    title: string;
    content: string;
    groupNames: string[];
    files: Array<{ name: string; url: string; isDownloadable: boolean }>;
  }
) {
  const results = [];
  
  for (const student of students) {
    try {
      const result = await sendAnnouncementEmail(student.email, student.name, announcement);
      results.push({ 
        email: student.email, 
        success: true, 
        messageId: result.messageId 
      });
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Failed to send email to ${student.email}:`, error);
      results.push({ 
        email: student.email, 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }
  
  return results;
}