/**
 * Send password reset email with OTP
 * @param {string} email - Recipient email address
 * @param {string} otp - OTP code
 * @param {string} userName - User's name
 * @returns {Promise<boolean>} True if email sent successfully
 */
export async function sendPasswordResetEmail(email, otp, userName = 'User') {
  try {
    // In development, just log the OTP to console
    if (process.env.NODE_ENV === 'development') {
      console.log('===========================================')
      console.log('PASSWORD RESET OTP FOR:', email)
      console.log('OTP:', otp)
      console.log('Name:', userName)
      console.log('Valid for: 10 minutes')
      console.log('===========================================')
      return true
    }

    // TODO: Implement actual email sending in production
    // You can use services like:
    // - SendGrid
    // - AWS SES
    // - Nodemailer with SMTP
    // - Resend
    // - Mailgun
    
    // Example with Nodemailer (commented out):
    /*
    const nodemailer = require('nodemailer')
    
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Password Reset - GhostTalk',
      html: `
        <h2>Password Reset Request</h2>
        <p>Hi ${userName},</p>
        <p>You requested to reset your password. Use the following OTP to reset your password:</p>
        <h1 style="font-size: 32px; font-weight: bold; color: #4F46E5;">${otp}</h1>
        <p>This OTP is valid for 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <br>
        <p>Best regards,<br>GhostTalk Team</p>
      `,
    })
    */

    return true
  } catch (error) {
    console.error('Error sending password reset email:', error)
    return false
  }
}

/**
 * Send email verification OTP
 * @param {string} email - Recipient email address
 * @param {string} otp - OTP code
 * @param {string} userName - User's name
 * @returns {Promise<boolean>} True if email sent successfully
 */
export async function sendVerificationEmail(email, otp, userName = 'User') {
  try {
    // In development, just log the OTP to console
    if (process.env.NODE_ENV === 'development') {
      console.log('===========================================')
      console.log('EMAIL VERIFICATION OTP FOR:', email)
      console.log('OTP:', otp)
      console.log('Name:', userName)
      console.log('Valid for: 10 minutes')
      console.log('===========================================')
      return true
    }

    // TODO: Implement actual email sending in production
    // Similar to sendPasswordResetEmail above

    return true
  } catch (error) {
    console.error('Error sending verification email:', error)
    return false
  }
}
