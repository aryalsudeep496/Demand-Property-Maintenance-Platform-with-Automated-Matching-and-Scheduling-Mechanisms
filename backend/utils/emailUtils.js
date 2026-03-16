const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host:   process.env.EMAIL_HOST,
    port:   parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const emailTemplates = {
  verifyEmail: (name, verifyUrl) => ({
    subject: 'Verify Your Email – PropMaintain',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
        <div style="background: #1a3c5e; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">PropMaintain</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
          <h2 style="color: #1a3c5e;">Hello, ${name}!</h2>
          <p style="color: #555; line-height: 1.6;">
            Thank you for registering on PropMaintain. Please verify your email address to activate your account.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}"
               style="background: #e67e22; color: white; padding: 14px 32px; text-decoration: none;
                      border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p style="color: #888; font-size: 13px;">
            This link expires in <strong>24 hours</strong>. If you did not create this account, you can safely ignore this email.
          </p>
          <p style="color: #888; font-size: 12px; word-break: break-all;">
            Or copy this URL: <a href="${verifyUrl}" style="color: #1a3c5e;">${verifyUrl}</a>
          </p>
        </div>
      </div>
    `,
  }),

  resetPassword: (name, resetUrl) => ({
    subject: 'Reset Your Password – PropMaintain',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
        <div style="background: #1a3c5e; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">PropMaintain</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
          <h2 style="color: #c0392b;">Password Reset Request</h2>
          <p style="color: #555; line-height: 1.6;">
            Hi <strong>${name}</strong>, we received a request to reset your password.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}"
               style="background: #c0392b; color: white; padding: 14px 32px; text-decoration: none;
                      border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #888; font-size: 13px;">
            This link expires in <strong>1 hour</strong>. If you did not request a password reset, please ignore this email.
          </p>
          <p style="color: #888; font-size: 12px; word-break: break-all;">
            Or copy this URL: <a href="${resetUrl}" style="color: #c0392b;">${resetUrl}</a>
          </p>
        </div>
      </div>
    `,
  }),

  welcomeEmail: (name, role) => ({
    subject: 'Welcome to PropMaintain! 🏠',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
        <div style="background: #1a3c5e; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Welcome to PropMaintain!</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
          <h2 style="color: #1a3c5e;">Hi ${name} 👋</h2>
          <p style="color: #555; line-height: 1.6;">
            Your account has been verified and you're all set as a <strong>${role}</strong>.
          </p>
          <p style="color: #555; line-height: 1.6;">
            ${role === 'provider'
              ? 'Complete your provider profile to start receiving service requests.'
              : 'Start exploring and booking maintenance services near you.'}
          </p>
        </div>
      </div>
    `,
  }),
};

/**
 * Send an email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - HTML body
 */
const sendEmail = async (to, subject, html) => {
  const transporter = createTransporter();
  const mailOptions = {
    from: `"PropMaintain" <${process.env.EMAIL_FROM}>`,
    to,
    subject,
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`📧 Email sent: ${info.messageId} → ${to}`);
  return info;
};

module.exports = { sendEmail, emailTemplates };
