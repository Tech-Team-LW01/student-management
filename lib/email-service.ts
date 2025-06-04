// lib/email-service.ts
import nodemailer from 'nodemailer';

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_EMAIL,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
};

export async function sendOTPEmail(email: string, otp: string, name: string) {
  const transporter = createTransporter();

  const mailOptions = {
    from: `LinuxWorld <${process.env.GMAIL_EMAIL}>`,
    to: email,
    subject: 'Verify your LinuxWorld Account - OTP',
    html: `
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
    `,
    text: `
      Hello ${name},

      Your LinuxWorld verification code is: ${otp}

      This code will expire in 10 minutes.

      If you didn't request this code, please ignore this email.

      Best regards,
      The LinuxWorld Team
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

// Verify email configuration
export async function verifyEmailConfig() {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
}