// // lib/announcement-email.ts
// import nodemailer from 'nodemailer';

// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.GMAIL_EMAIL,
//     pass: process.env.GMAIL_APP_PASSWORD,
//   },
// });

// export async function sendAnnouncementEmail(
//   studentEmail: string,
//   studentName: string,
//   announcement: {
//     title: string;
//     content: string;
//     groupName: string;
//     files: Array<{ name: string; url: string; isDownloadable: boolean }>;
//   }
// ) {
//   const mailOptions = {
//     from: `LinuxWorld <${process.env.GMAIL_EMAIL}>`,
//     to: studentEmail,
//     subject: `New Announcement: ${announcement.title} - LinuxWorld`,
//     html: `
//       <!DOCTYPE html>
//       <html>
//         <head>
//           <meta charset="UTF-8">
//           <meta name="viewport" content="width=device-width, initial-scale=1.0">
//           <style>
//             body { 
//               font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
//               line-height: 1.6; 
//               color: #333;
//               margin: 0;
//               padding: 0;
//               background-color: #f5f5f5;
//             }
//             .container { 
//               max-width: 600px; 
//               margin: 0 auto; 
//               background-color: #ffffff;
//               box-shadow: 0 2px 4px rgba(0,0,0,0.1);
//             }
//             .header { 
//               background: linear-gradient(135deg, #10b981 0%, #059669 100%);
//               color: white; 
//               padding: 30px 20px; 
//               text-align: center;
//             }
//             .header h1 {
//               margin: 0;
//               font-size: 28px;
//               font-weight: 600;
//             }
//             .content { 
//               padding: 40px 30px;
//             }
//             .announcement-badge {
//               display: inline-block;
//               background: #d1fae5;
//               color: #065f46;
//               padding: 4px 12px;
//               border-radius: 16px;
//               font-size: 14px;
//               font-weight: 500;
//               margin-bottom: 15px;
//             }
//             .announcement-title {
//               font-size: 24px;
//               font-weight: 600;
//               color: #111;
//               margin: 15px 0;
//             }
//             .announcement-content {
//               background: #f8fafc;
//               border-left: 4px solid #10b981;
//               padding: 20px;
//               margin: 20px 0;
//               color: #475569;
//               white-space: pre-wrap;
//             }
//             .files-section {
//               margin-top: 30px;
//               padding: 20px;
//               background: #f1f5f9;
//               border-radius: 8px;
//             }
//             .file-item {
//               display: flex;
//               align-items: center;
//               justify-content: space-between;
//               padding: 12px;
//               background: white;
//               border-radius: 6px;
//               margin-bottom: 10px;
//             }
//             .file-info {
//               display: flex;
//               align-items: center;
//               gap: 10px;
//             }
//             .file-icon {
//               width: 32px;
//               height: 32px;
//               background: #e0e7ff;
//               border-radius: 6px;
//               display: flex;
//               align-items: center;
//               justify-content: center;
//               font-size: 18px;
//             }
//             .file-name {
//               font-size: 14px;
//               font-weight: 500;
//               color: #1f2937;
//             }
//             .file-badge {
//               font-size: 12px;
//               padding: 4px 8px;
//               border-radius: 4px;
//               font-weight: 500;
//             }
//             .downloadable {
//               background: #d1fae5;
//               color: #065f46;
//             }
//             .view-only {
//               background: #fed7aa;
//               color: #9a3412;
//             }
//             .button {
//               display: inline-block;
//               padding: 12px 24px;
//               background: #10b981;
//               color: white;
//               text-decoration: none;
//               border-radius: 6px;
//               font-weight: 500;
//               margin-top: 20px;
//             }
//             .footer { 
//               background: #f8fafc;
//               text-align: center; 
//               padding: 25px 20px; 
//               color: #64748b; 
//               font-size: 13px;
//               border-top: 1px solid #e2e8f0;
//             }
//             .divider {
//               height: 1px;
//               background: #e2e8f0;
//               margin: 30px 0;
//             }
//           </style>
//         </head>
//         <body>
//           <div class="container">
//             <div class="header">
//               <h1>LinuxWorld</h1>
//               <p style="margin: 5px 0 0 0; font-size: 16px; opacity: 0.9;">New Announcement</p>
//             </div>
//             <div class="content">
//               <p style="font-size: 18px; margin-bottom: 20px;">Hello ${studentName},</p>
              
//               <div class="announcement-badge">📢 ${announcement.groupName}</div>
              
//               <h2 class="announcement-title">${announcement.title || 'New Announcement'}</h2>
              
//               <div class="announcement-content">${announcement.content}</div>
              
//               ${announcement.files.length > 0 ? `
//                 <div class="files-section">
//                   <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 18px;">📎 Attachments (${announcement.files.length})</h3>
//                   ${announcement.files.map(file => `
//                     <div class="file-item">
//                       <div class="file-info">
//                         <div class="file-icon">📄</div>
//                         <span class="file-name">${file.name}</span>
//                       </div>
//                       <span class="file-badge ${file.isDownloadable ? 'downloadable' : 'view-only'}">
//                         ${file.isDownloadable ? '⬇ Downloadable' : '👁 View Only'}
//                       </span>
//                     </div>
//                   `).join('')}
//                 </div>
//               ` : ''}
              
//               <div class="divider"></div>
              
//               <p style="color: #64748b; font-size: 14px;">
//                 This announcement was posted to your group "${announcement.groupName}". 
//                 To view all announcements and download attachments, please visit your LinuxWorld dashboard.
//               </p>
              
//               <a href="${process.env.NEXT_PUBLIC_APP_URL}/groups" class="button">
//                 View in Dashboard
//               </a>
//             </div>
//             <div class="footer">
//               <p><strong>LinuxWorld</strong> - Learn Linux, Master the Command Line</p>
//               <p>© 2024 LinuxWorld. All rights reserved.</p>
//               <p>You're receiving this because you're a member of ${announcement.groupName}</p>
//             </div>
//           </div>
//         </body>
//       </html>
//     `,
//     text: `
//       Hello ${studentName},

//       New announcement in ${announcement.groupName}:

//       ${announcement.title || 'New Announcement'}

//       ${announcement.content}

//       ${announcement.files.length > 0 ? `This announcement includes ${announcement.files.length} attachment(s).` : ''}

//       To view this announcement and any attachments, please visit your LinuxWorld dashboard.

//       Best regards,
//       The LinuxWorld Team
//     `,
//   };

//   try {
//         const info = await transporter.sendMail(mailOptions);
//     console.log('Announcement email sent:', info.messageId);
//     return { success: true, messageId: info.messageId };
//   } catch (error) {
//     console.error('Error sending announcement email:', error);
//     throw error;
//   }
// }











// lib/announcement-email.ts
import { Resend } from 'resend';
import nodemailer from 'nodemailer';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

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

// Choose email provider based on configuration
const getEmailProvider = () => {
  return process.env.EMAIL_PROVIDER === 'resend' ? 'resend' : 'gmail';
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
  const subject = `New Announcement: ${announcement.title || "New Announcement"}`
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Announcement</title>
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
            padding: 4px 12px;
            border-radius: 16px;
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 15px;
          }
          .announcement-title {
            font-size: 24px;
            font-weight: 600;
            color: #111;
            margin: 15px 0;
          }
          .announcement-content {
            background: #f8fafc;
            border-left: 4px solid #10b981;
            padding: 20px;
            margin: 20px 0;
            color: #475569;
            white-space: pre-wrap;
          }
          .files-section {
            margin-top: 30px;
            padding: 20px;
            background: #f1f5f9;
            border-radius: 8px;
          }
          .file-item {
            display: block;
            padding: 15px;
            background: white;
            border-radius: 6px;
            margin-bottom: 10px;
            border: 1px solid #e5e7eb;
            text-decoration: none;
            color: inherit;
          }
          .file-item:hover {
            background: #f9fafb;
            border-color: #10b981;
          }
          .file-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;
          }
          .file-info {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .file-icon {
            width: 36px;
            height: 36px;
            background: #e0e7ff;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
          }
          .file-name {
            font-size: 14px;
            font-weight: 500;
            color: #1f2937;
          }
          .file-badge {
            font-size: 12px;
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: 500;
          }
          .downloadable {
            background: #d1fae5;
            color: #065f46;
          }
          .view-only {
            background: #fed7aa;
            color: #9a3412;
          }
          .file-link {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 500;
            text-decoration: none;
            color: white;
          }
          .download-link {
            background: #10b981;
          }
          .download-link:hover {
            background: #059669;
          }
          .view-link {
            background: #f59e0b;
          }
          .view-link:hover {
            background: #d97706;
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
          .footer { 
            background: #f8fafc;
            text-align: center; 
            padding: 25px 20px; 
            color: #64748b; 
            font-size: 13px;
            border-top: 1px solid #e2e8f0;
          }
          .divider {
            height: 1px;
            background: #e2e8f0;
            margin: 30px 0;
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
            <p>Hello ${studentName},</p>
            <p>You have a new announcement in the following groups:</p>
            <ul>
              ${announcement.groupNames.map(groupName => `<li>${groupName}</li>`).join('')}
            </ul>
            <div class="announcement">
              <h2>${announcement.title || "New Announcement"}</h2>
              <div class="message">
                ${announcement.content.split('\n').map(line => `<p>${line}</p>`).join('')}
              </div>
              ${announcement.files.length > 0 ? `
                <div class="attachments">
                  <h3>Attachments</h3>
                  <ul>
                    ${announcement.files.map(file => `
                      <li>
                        <a href="${file.url}" target="_blank" class="attachment-link">
                          ${file.name}
                          ${file.isDownloadable ? '(Downloadable)' : '(View Only)'}
                        </a>
                      </li>
                    `).join('')}
                  </ul>
                </div>
              ` : ''}
            </div>
            <div class="action">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/groups" class="button">
                View in Dashboard
              </a>
            </div>
          </div>
          <div class="footer">
            <p><strong>LinuxWorld</strong> - Learn Linux, Master the Command Line</p>
            <p>© 2024 LinuxWorld. All rights reserved.</p>
            <p>You're receiving this because you're a member of ${announcement.groupNames.join(', ')}</p>
            <p style="margin-top: 10px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings">
                Manage email preferences
              </a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `

  const text = `
    Hello ${studentName},

    New announcement in the following groups:
    ${announcement.groupNames.map(name => `- ${name}`).join('\n')}

    ${announcement.title || 'New Announcement'}

    ${announcement.content}

    ${announcement.files.length > 0 ? `
This announcement includes ${announcement.files.length} attachment(s):

${announcement.files.map(file => `
- ${file.name}
  ${file.isDownloadable ? 'Download' : 'View'}: ${file.url}
`).join('\n')}
    ` : ''}

    To view this announcement and manage all attachments, please visit your LinuxWorld dashboard:
    ${process.env.NEXT_PUBLIC_APP_URL}/groups

    Best regards,
    The LinuxWorld Team
    
    Manage email preferences: ${process.env.NEXT_PUBLIC_APP_URL}/settings
  `

  try {
    const { data, error } = await resend.emails.send({
      from: 'LinuxWorld <notifications@linuxworld.com>',
      to: studentEmail,
      subject,
      html,
      text,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error('Error sending announcement email:', error);
    throw error;
  }
}