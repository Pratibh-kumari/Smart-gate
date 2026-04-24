const nodemailer = require('nodemailer');

// SMTP configuration
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_REQUIRE_TLS = process.env.SMTP_REQUIRE_TLS !== 'false';
const EMAIL_FROM = process.env.EMAIL_FROM || 'Smart Gate System <noreply@smartgate.com>';

const hasSmtpConfig = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);

const transporter = hasSmtpConfig
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      },
      requireTLS: SMTP_REQUIRE_TLS
    })
  : null;

if (!hasSmtpConfig) {
  console.warn('SMTP is not fully configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE in backend/.env.');
} else {
  // Verify SMTP connection at startup to fail fast on invalid credentials.
  transporter.verify((error) => {
    if (error) {
      console.error('SMTP connection failed:', error.message);
    } else {
      console.log('SMTP service is ready.');
    }
  });
}

async function sendMail(mailOptions, logLabel) {
  if (!transporter) {
    const error = 'SMTP is not configured';
    console.error(`${logLabel} failed: ${error}`);
    return { success: false, error };
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`${logLabel} failed:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send verification email
 */
async function sendVerificationEmail(email, name, verificationToken) {
  const verificationLink = `http://localhost:5500/verify-email.html?token=${verificationToken}`;
  
  const mailOptions = {
    from: EMAIL_FROM,
    to: email,
    subject: '🔐 Verify Your Smart Gate Account',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #001F3F; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
          .button { display: inline-block; padding: 12px 30px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏢 Smart Gate System</h1>
          </div>
          <div class="content">
            <h2>Welcome, ${name}!</h2>
            <p>Thank you for registering with Smart Gate. Please verify your email address to activate your account.</p>
            <p>Click the button below to verify your email:</p>
            <p style="text-align: center;">
              <a href="${verificationLink}" class="button">✓ Verify Email Address</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #fff; padding: 10px; border: 1px solid #ddd;">${verificationLink}</p>
            <p><strong>This link will expire in 24 hours.</strong></p>
            <p>If you didn't create this account, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2026 Rashtriya Raksha University - Smart Gate System</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  const result = await sendMail(mailOptions, 'Verification email');
  if (result.success) {
    console.log('Verification email sent to:', email);
  }
  return result;
}

/**
 * Send QR code to visitor
 */
async function sendQRCodeEmail(visitorEmail, visitorName, qrCodeDataURL, visitDetails) {
  const mailOptions = {
    from: EMAIL_FROM,
    to: visitorEmail,
    subject: '✅ Your Smart Gate Entry Pass',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
          .qr-box { background: white; padding: 20px; text-align: center; margin: 20px 0; border: 2px solid #28a745; border-radius: 5px; }
          .details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #28a745; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Visit Approved!</h1>
          </div>
          <div class="content">
            <h2>Hello ${visitorName},</h2>
            <p>Great news! Your visit has been <strong>approved</strong>.</p>
            
            <div class="qr-box">
              <h3>🔐 Your Entry QR Code</h3>
              <img src="${qrCodeDataURL}" alt="QR Code" style="max-width: 250px; height: auto;">
              <p style="color: #666; font-size: 14px;">Show this QR code at the gate</p>
            </div>
            
            <div class="details">
              <h3>📋 Visit Details</h3>
              <p><strong>Host:</strong> ${visitDetails.host}</p>
              <p><strong>Purpose:</strong> ${visitDetails.purpose}</p>
              <p><strong>Phone:</strong> ${visitDetails.phone}</p>
              <p><strong>Status:</strong> <span style="color: #28a745;">Approved ✓</span></p>
            </div>
            
            <p><strong>⚠️ Important:</strong></p>
            <ul>
              <li>Save this QR code on your phone</li>
              <li>Show it at the security gate for entry</li>
              <li>Valid for your scheduled visit</li>
            </ul>
          </div>
          <div class="footer">
            <p>© 2026 Rashtriya Raksha University - Smart Gate System</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  const result = await sendMail(mailOptions, 'QR code email');
  if (result.success) {
    console.log('QR code email sent to:', visitorEmail);
  }
  return result;
}

/**
 * Send password reset email
 */
async function sendPasswordResetEmail(email, name, resetToken) {
  const resetLink = `http://localhost:5500/reset-password.html?token=${resetToken}`;
  
  const mailOptions = {
    from: EMAIL_FROM,
    to: email,
    subject: '🔑 Reset Your Smart Gate Password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
          .button { display: inline-block; padding: 12px 30px; background: #dc3545; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔑 Password Reset</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>We received a request to reset your Smart Gate password.</p>
            <p>Click the button below to create a new password:</p>
            <p style="text-align: center;">
              <a href="${resetLink}" class="button">Reset Password</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #fff; padding: 10px; border: 1px solid #ddd;">${resetLink}</p>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
          </div>
          <div class="footer">
            <p>© 2026 Rashtriya Raksha University - Smart Gate System</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  const result = await sendMail(mailOptions, 'Password reset email');
  if (result.success) {
    console.log('Password reset email sent to:', email);
  }
  return result;
}

module.exports = {
  sendVerificationEmail,
  sendQRCodeEmail,
  sendPasswordResetEmail
};
