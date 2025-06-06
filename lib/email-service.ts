// lib/email-service.ts
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

export async function sendOTPEmail(email: string, otp: string, name: string) {
  // Skip email sending during build process
  if (process.env.NODE_ENV === 'production' && !process.env.RUNTIME) {
    console.log('Skipping email send during build process');
    return { success: true, messageId: 'build-mode' };
  }

  const subject = 'Verify your LinuxWorld Account - OTP';
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
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
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
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
          .greeting {
            font-size: 18px;
            color: #111;
            margin-bottom: 20px;
          }
          .otp-container {
            background: #f8fafc;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            padding: 30px;
            margin: 30px 0;
            text-align: center;
          }
          .otp-label {
            font-size: 14px;
            color: #64748b;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .otp-code { 
            font-size: 48px; 
            letter-spacing: 12px; 
            color: #3b82f6; 
            font-weight: 700;
            margin: 15px 0;
            font-family: 'Courier New', monospace;
          }
          .expire-text {
            font-size: 14px;
            color: #ef4444;
            margin-top: 15px;
            font-weight: 500;
          }
          .info-text {
            font-size: 16px;
            color: #475569;
            line-height: 1.6;
            margin: 20px 0;
          }
          .warning-box {
            background: #fef3c7;
            border: 1px solid #fbbf24;
            border-radius: 8px;
            padding: 15px;
            margin: 25px 0;
          }
          .warning-text {
            color: #92400e;
            font-size: 14px;
            margin: 0;
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
          .divider {
            height: 1px;
            background: #e2e8f0;
            margin: 30px 0;
          }
          @media (max-width: 600px) {
            .content {
              padding: 30px 20px;
            }
            .otp-code {
              font-size: 36px;
              letter-spacing: 8px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>LinuxWorld</h1>
            <p style="margin: 5px 0 0 0; font-size: 16px; opacity: 0.9;">Email Verification</p>
          </div>
          <div class="content">
            <p class="greeting">Hello ${name},</p>
            <p class="info-text">
              Thank you for signing up with LinuxWorld! To complete your registration and verify your email address, 
              please use the verification code below:
            </p>
            
            <div class="otp-container">
              <p class="otp-label">Your Verification Code</p>
              <div class="otp-code">${otp}</div>
              <p class="expire-text">⏱️ This code expires in 10 minutes</p>
            </div>
            
            <p class="info-text">
              Enter this code on the verification screen to complete your account setup. 
              If you're having trouble, make sure to enter the code exactly as shown above.
            </p>
            
            <div class="warning-box">
              <p class="warning-text">
                <strong>⚠️ Security Notice:</strong> Never share this code with anyone. 
                LinuxWorld staff will never ask for your verification code.
              </p>
            </div>
            
            <div class="divider"></div>
            
            <p class="info-text" style="font-size: 14px; color: #94a3b8;">
              If you didn't create an account with LinuxWorld, please ignore this email. 
              No action is required on your part.
            </p>
          </div>
          <div class="footer">
            <p><strong>LinuxWorld</strong> - Learn Linux, Master the Command Line</p>
            <p>© 2024 LinuxWorld. All rights reserved.</p>
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
    Hello ${name},

    Your LinuxWorld verification code is: ${otp}

    This code will expire in 10 minutes.

    If you didn't request this code, please ignore this email.

    Best regards,
    The LinuxWorld Team
  `;

  try {
    const transporter = createGmailTransporter();
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `LinuxWorld <${process.env.GMAIL_EMAIL}>`,
      to: email,
      subject,
      html,
      text,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

// Send welcome email for new users
export async function sendWelcomeEmail(email: string, name: string, tempPassword: string) {
  // Skip email sending during build process
  if (process.env.NODE_ENV === 'production' && !process.env.RUNTIME) {
    console.log('Skipping welcome email during build process');
    return { success: true, messageId: 'build-mode' };
  }

  const subject = 'Welcome to LinuxWorld - Account Created';
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
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
          .credentials-box {
            background: #f8fafc;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            padding: 25px;
            margin: 25px 0;
          }
          .credential-item {
            margin: 15px 0;
            font-size: 16px;
          }
          .credential-label {
            font-weight: 600;
            color: #374151;
          }
          .credential-value {
            font-family: 'Courier New', monospace;
            background: #ffffff;
            padding: 8px 12px;
            border-radius: 6px;
            border: 1px solid #d1d5db;
            display: inline-block;
            margin-left: 10px;
          }
          .warning-box {
            background: #fef3c7;
            border: 1px solid #fbbf24;
            border-radius: 8px;
            padding: 15px;
            margin: 25px 0;
          }
          .login-button {
            background: #10b981;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            display: inline-block;
            margin: 20px 0;
          }
          .footer { 
            background: #f8fafc;
            text-align: center; 
            padding: 25px 20px; 
            color: #64748b; 
            font-size: 13px;
            border-top: 1px solid #e2e8f0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to LinuxWorld!</h1>
            <p style="margin: 5px 0 0 0; font-size: 16px; opacity: 0.9;">Account Successfully Created</p>
          </div>
          <div class="content">
            <p style="font-size: 18px; color: #111; margin-bottom: 20px;">Hello ${name},</p>
            <p style="font-size: 16px; color: #475569; line-height: 1.6;">
              Welcome to LinuxWorld! Your account has been successfully created. Below are your login credentials:
            </p>
            
            <div class="credentials-box">
              <div class="credential-item">
                <span class="credential-label">Email:</span>
                <span class="credential-value">${email}</span>
              </div>
              <div class="credential-item">
                <span class="credential-label">Temporary Password:</span>
                <span class="credential-value">${tempPassword}</span>
              </div>
            </div>
            
            <div class="warning-box">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>⚠️ Important:</strong> Please change your password after your first login for security purposes.
              </p>
            </div>
            
            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/auth/signin" class="login-button">
                Login to Your Account
              </a>
            </div>
            
            <p style="font-size: 14px; color: #94a3b8; margin-top: 30px;">
              If you have any questions or need assistance, please don't hesitate to contact our support team.
            </p>
          </div>
          <div class="footer">
            <p><strong>LinuxWorld</strong> - Learn Linux, Master the Command Line</p>
            <p>© 2024 LinuxWorld. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const transporter = createGmailTransporter();
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `LinuxWorld <${process.env.GMAIL_EMAIL}>`,
      to: email,
      subject,
      html,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
}

// Verify email configuration
export async function verifyEmailConfig() {
  try {
    // Skip verification during build
    if (process.env.NODE_ENV === 'production' && !process.env.RUNTIME) {
      return true;
    }

    if (!process.env.GMAIL_EMAIL || !process.env.GMAIL_APP_PASSWORD) {
      return false;
    }

    const transporter = createGmailTransporter();
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
}