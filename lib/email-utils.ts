import nodemailer from "nodemailer"

// Create reusable transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export async function sendWelcomeEmail(email: string, password: string) {
  const mailOptions = {
    from: process.env.EMAIL_FROM || `LinuxWorld <${process.env.GMAIL_EMAIL}>`,
    to: email,
    subject: "Welcome to LinuxWorld - Your Account Details",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to LinuxWorld</title>
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
            .credentials {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .credentials p {
              margin: 10px 0;
            }
            .credentials strong {
              color: #1f2937;
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
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to LinuxWorld</h1>
              <p style="margin: 5px 0 0 0; font-size: 16px; opacity: 0.9;">Your Account is Ready</p>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>Welcome to LinuxWorld! Your account has been created successfully. Here are your login credentials:</p>
              
              <div class="credentials">
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Password:</strong> ${password}</p>
              </div>

              <p><strong>Important:</strong> For security reasons, you will be required to change your password when you first log in.</p>
              
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" class="button">
                Login to Your Account
              </a>
            </div>
            <div class="footer">
              <p><strong>LinuxWorld</strong> - Learn Linux, Master the Command Line</p>
              <p>© 2024 LinuxWorld. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Welcome to LinuxWorld!

      Your account has been created successfully. Here are your login credentials:

      Email: ${email}
      Password: ${password}

      Important: For security reasons, you will be required to change your password when you first log in.

      Login to your account: ${process.env.NEXT_PUBLIC_APP_URL}/login

      Best regards,
      The LinuxWorld Team
    `,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Error sending welcome email:", error)
    throw error
  }
}

export async function sendResetPasswordEmail(email: string) {
  const mailOptions = {
    from: process.env.EMAIL_FROM || `LinuxWorld <${process.env.GMAIL_EMAIL}>`,
    to: email,
    subject: "Reset Your LinuxWorld Password",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
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
            .warning {
              background: #fef3c7;
              border: 1px solid #fbbf24;
              border-radius: 8px;
              padding: 15px;
              margin: 20px 0;
              color: #92400e;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Reset Your Password</h1>
              <p style="margin: 5px 0 0 0; font-size: 16px; opacity: 0.9;">LinuxWorld Account</p>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>We received a request to reset your password for your LinuxWorld account. Click the button below to reset your password:</p>
              
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/reset-password" class="button">
                Reset Password
              </a>

              <div class="warning">
                <p><strong>Important:</strong> This link will expire in 1 hour. If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
              </div>

              <p>If the button above doesn't work, you can also copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #64748b;">
                ${process.env.NEXT_PUBLIC_APP_URL}/reset-password
              </p>
            </div>
            <div class="footer">
              <p><strong>LinuxWorld</strong> - Learn Linux, Master the Command Line</p>
              <p>© 2024 LinuxWorld. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Reset Your LinuxWorld Password

      Hello,

      We received a request to reset your password for your LinuxWorld account. Click the link below to reset your password:

      ${process.env.NEXT_PUBLIC_APP_URL}/reset-password

      Important: This link will expire in 1 hour. If you did not request a password reset, please ignore this email or contact support if you have concerns.

      Best regards,
      The LinuxWorld Team
    `,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Error sending reset password email:", error)
    throw error
  }
} 