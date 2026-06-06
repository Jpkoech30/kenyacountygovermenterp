const nodemailer = require('nodemailer');

/**
 * Email service using Nodemailer.
 * In development/test mode, uses Ethereal (fake SMTP) to capture emails.
 * In production, uses SMTP credentials from environment variables.
 */
let transporter = null;

/**
 * Initializes the email transporter.
 * If SMTP env vars are set, uses them; otherwise creates an Ethereal test account.
 */
const initializeTransporter = async () => {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    // Production SMTP configuration
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: parseInt(process.env.SMTP_PORT, 10) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Development: use Ethereal test account
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('📧 Ethereal email test account created:', testAccount.user);
  }

  return transporter;
};

/**
 * Sends a welcome email with a password reset link to a new user.
 *
 * @param {Object} user - The newly created user object
 * @param {string} resetToken - JWT token for password reset
 * @returns {Promise<Object>} Nodemailer send result with preview URL for Ethereal
 */
const sendWelcomeEmail = async (user, resetToken) => {
  try {
    const transport = await initializeTransporter();

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    const info = await transport.sendMail({
      from: `"West Pokot County ERP" <${process.env.EMAIL_FROM || 'noreply@westpokot.go.ke'}>`,
      to: user.email,
      subject: 'Welcome to West Pokot County ERP System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1a365d; color: white; padding: 20px; text-align: center;">
            <h1>Welcome to West Pokot County ERP</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #e2e8f0;">
            <p>Hello ${user.first_name} ${user.last_name},</p>
            <p>Your account has been created in the West Pokot County Government ERP system.</p>
            <p>Please click the button below to set your password and activate your account:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}"
                 style="background-color: #2563eb; color: white; padding: 12px 24px;
                        text-decoration: none; border-radius: 5px; display: inline-block;">
                Set Your Password
              </a>
            </div>
            <p>This link will expire in 24 hours.</p>
            <p>If you did not expect this email, please ignore it.</p>
            <hr style="border: 1px solid #e2e8f0;" />
            <p style="color: #718096; font-size: 12px;">
              West Pokot County Government - ERP System<br/>
              This is an automated message. Please do not reply.
            </p>
          </div>
        </div>
      `,
    });

    // Log Ethereal preview URL in development
    if (!process.env.SMTP_HOST) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log('📧 Welcome email preview URL:', previewUrl);
      return { ...info, previewUrl };
    }

    return info;
  } catch (error) {
    console.error('Failed to send welcome email:', error.message);
    // Don't throw - email failure shouldn't block user creation
    return null;
  }
};

module.exports = {
  sendWelcomeEmail,
  initializeTransporter,
};
