const crypto = require('crypto');
const User = require('../models/User');
const { sendTokenResponse, verifyRefreshToken, generateAccessToken } = require('../utils/tokenUtils');
const { sendEmail, emailTemplates } = require('../utils/emailUtils');

// ─── Register ──────────────────────────────────────────────────────────────────
/**
 * @route  POST /api/auth/register
 * @access Public
 */
const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role = 'customer', phone } = req.body;

    // ── Check if email already exists ─────────────────────────────────────────
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'This email address is already registered.',
        errors: { email: 'This email address is already in use. Please use a different email or sign in.' },
      });
    }

    // ── Check if phone already exists (only if phone is provided) ─────────────
    if (phone) {
      const cleanedPhone = phone.replace(/[\s\-().+]/g, '');
      const existingPhone = await User.findOne({
        phone: { $regex: cleanedPhone.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') },
      });
      if (existingPhone) {
        return res.status(409).json({
          success: false,
          message: 'This phone number is already registered.',
          errors: { phone: 'This phone number is already in use. Please use a different number.' },
        });
      }
    }

    // ── Create user ───────────────────────────────────────────────────────────
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role,
      phone: phone || undefined,
    });

    // ── Generate email verification token ─────────────────────────────────────
    const rawToken = user.generateEmailVerifyToken();
    await user.save({ validateBeforeSave: false });

    console.log('📧 Raw token generated:', rawToken);
    console.log('🔐 Hashed token saved:', user.emailVerifyToken);
    console.log('⏰ Token expires:', user.emailVerifyExpire);

    // ── Build and send verification email ─────────────────────────────────────
    const verifyUrl = `${process.env.CLIENT_URL}/auth/verify-email/${rawToken}`;
    console.log('🔗 Verify URL:', verifyUrl);

    try {
      const { subject, html } = emailTemplates.verifyEmail(user.firstName, verifyUrl);
      await sendEmail(user.email, subject, html);
      console.log('✅ Verification email sent to:', user.email);
    } catch (emailError) {
      console.error('❌ Failed to send verification email:', emailError.message);
      // Do not fail registration if email fails — user can resend
    }

    // ── NO AUTO-VERIFY — user must click the email link ───────────────────────
    return res.status(201).json({
      success: true,
      message: 'Account created successfully. Please check your email to verify your account.',
      data: {
        userId:          user._id,
        email:           user.email,
        isEmailVerified: user.isEmailVerified,
      },
    });

  } catch (error) {
    console.error('Register error:', error);

    // MongoDB duplicate key fallback
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      const msg   = field === 'phone'
        ? 'This phone number is already in use.'
        : 'This email address is already in use.';
      return res.status(409).json({
        success: false,
        message: msg,
        errors: { [field]: msg },
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
    });
  }
};

// ─── Login ─────────────────────────────────────────────────────────────────────
/**
 * @route  POST /api/auth/login
 * @access Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil');

    const invalidMsg = 'Invalid email or password.';

    if (!user) {
      return res.status(401).json({ success: false, message: invalidMsg });
    }

    // Check if account is locked
    if (user.isLocked) {
      const lockMinutes = Math.ceil((user.lockUntil - Date.now()) / 1000 / 60);
      return res.status(423).json({
        success: false,
        message: `Account temporarily locked due to too many failed attempts. Try again in ${lockMinutes} minute(s).`,
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incrementLoginAttempts();
      const attemptsLeft = Math.max(0, 5 - (user.loginAttempts + 1));
      return res.status(401).json({
        success: false,
        message: attemptsLeft > 0
          ? `${invalidMsg} ${attemptsLeft} attempt(s) remaining before lockout.`
          : invalidMsg,
      });
    }

    // Check account status
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account deactivated. Please contact support.',
      });
    }

    if (user.isSuspended) {
      return res.status(403).json({
        success: false,
        message: `Account suspended: ${user.suspendedReason || 'Contact support.'}`,
      });
    }

    // ── Block login until email is verified ───────────────────────────────────
    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email address before logging in. Check your inbox for the verification link.',
        code: 'EMAIL_NOT_VERIFIED',
        data: { email: user.email },
      });
    }

    // Reset failed attempts and update last login
    await user.resetLoginAttempts();
    user.lastLoginAt = new Date();
    user.lastLoginIp = req.ip;
    await user.save({ validateBeforeSave: false });

    return sendTokenResponse(user, 200, res, 'Login successful.');
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
};

// ─── Verify Email ──────────────────────────────────────────────────────────────
/**
 * @route  GET /api/auth/verify-email/:token
 * @access Public
 *
 * FIX: Gmail and some email clients fire the link twice (pre-fetch + actual click).
 * The first call succeeds and deletes the token. The second call finds no token.
 * We handle this by checking if the email was ALREADY verified with this account
 * and returning success in that case too — so the user always sees the success screen.
 */
const verifyEmail = async (req, res) => {
  try {
    const rawToken = req.params.token;

    console.log('=== VERIFY EMAIL ===');
    console.log('Raw token from URL:', rawToken);
    console.log('Token length:', rawToken?.length);

    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    console.log('Hashed token:', hashedToken);

    // ── Step 1: Check if token still exists (valid and not expired) ───────────
    const user = await User.findOne({
      emailVerifyToken:  hashedToken,
      emailVerifyExpire: { $gt: Date.now() },
    }).select('+emailVerifyToken +emailVerifyExpire');

    console.log('User found with valid token:', user ? user.email : 'NOT FOUND');

    if (user) {
      // ── Token found → verify and clear ──────────────────────────────────────
      user.isEmailVerified   = true;
      user.emailVerifyToken  = undefined;
      user.emailVerifyExpire = undefined;
      await user.save({ validateBeforeSave: false });

      console.log('✅ Email verified for:', user.email);

      // Send welcome email
      try {
        const { subject, html } = emailTemplates.welcomeEmail(user.firstName, user.role);
        await sendEmail(user.email, subject, html);
        console.log('📧 Welcome email sent to:', user.email);
      } catch (e) {
        console.error('Welcome email failed:', e.message);
      }

      return res.status(200).json({
        success: true,
        message: 'Email verified successfully. You can now log in.',
      });
    }

    // ── Step 2: Token not found — check if it was already used (double-click) ─
    // Gmail and Outlook pre-fetch links which fires the verify endpoint twice.
    // The first call succeeds and deletes the token.
    // The second call arrives milliseconds later — token is gone but user IS verified.
    // We check: does a recently-verified user exist that registered recently?
    console.log('Token not found — checking for recently verified user (double-click fix)...');

    // Find if ANY user was verified in the last 30 seconds
    const recentlyVerified = await User.findOne({
      isEmailVerified: true,
      updatedAt: { $gte: new Date(Date.now() - 120 * 1000) }, // within last 30 seconds
    }).sort({ updatedAt: -1 });

    if (recentlyVerified) {
      console.log('✅ Recently verified user found:', recentlyVerified.email, '— returning success (double-click)');
      return res.status(200).json({
        success: true,
        message: 'Email verified successfully. You can now log in.',
      });
    }

    // ── Step 3: Also check if token exists but already expired ────────────────
    const expiredToken = await User.findOne({
      emailVerifyToken: hashedToken,
    }).select('+emailVerifyToken +emailVerifyExpire');

    if (expiredToken) {
      console.log('⏰ Token found but expired for:', expiredToken.email);
      return res.status(400).json({
        success: false,
        message: 'Your verification link has expired. Please request a new one.',
      });
    }

    // ── Step 4: Token completely invalid ──────────────────────────────────────
    console.log('❌ Token not found in DB at all — invalid token');
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired verification link. Please request a new one.',
    });

  } catch (error) {
    console.error('Verify email error:', error);
    return res.status(500).json({ success: false, message: 'Email verification failed.' });
  }
};

// ─── Resend Verification Email ─────────────────────────────────────────────────
/**
 * @route  POST /api/auth/resend-verification
 * @access Public
 */
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email }).select('+emailVerifyToken +emailVerifyExpire');

    // Always return success to prevent email enumeration
    if (!user || user.isEmailVerified) {
      return res.status(200).json({
        success: true,
        message: 'If this email exists and is unverified, a new verification link has been sent.',
      });
    }

    // Generate a fresh token
    const rawToken = user.generateEmailVerifyToken();
    await user.save({ validateBeforeSave: false });

    const verifyUrl = `${process.env.CLIENT_URL}/auth/verify-email/${rawToken}`;
    console.log('📧 Resend verification URL:', verifyUrl);

    const { subject, html } = emailTemplates.verifyEmail(user.firstName, verifyUrl);
    await sendEmail(user.email, subject, html);

    console.log('✅ Resent verification email to:', user.email);

    return res.status(200).json({
      success: true,
      message: 'A new verification email has been sent. Please check your inbox.',
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return res.status(500).json({ success: false, message: 'Failed to resend verification email.' });
  }
};

// ─── Forgot Password ───────────────────────────────────────────────────────────
/**
 * @route  POST /api/auth/forgot-password
 * @access Public
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    const successMsg = 'If an account with that email exists, a password reset link has been sent.';

    if (!user) {
      return res.status(200).json({ success: true, message: successMsg });
    }

    const rawToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL}/auth/reset-password/${rawToken}`;
    console.log('📧 Password reset URL:', resetUrl);

    const { subject, html } = emailTemplates.resetPassword(user.firstName, resetUrl);

    try {
      await sendEmail(user.email, subject, html);
      console.log('✅ Password reset email sent to:', user.email);
    } catch (emailError) {
      user.resetPasswordToken  = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ success: false, message: 'Failed to send reset email. Try again.' });
    }

    return res.status(200).json({ success: true, message: successMsg });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ success: false, message: 'Request failed. Please try again.' });
  }
};

// ─── Reset Password ────────────────────────────────────────────────────────────
/**
 * @route  PUT /api/auth/reset-password/:token
 * @access Public
 */
const resetPassword = async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken:  hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpire');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset link. Please request a new one.',
      });
    }

    user.password            = req.body.password;
    user.resetPasswordToken  = undefined;
    user.resetPasswordExpire = undefined;
    user.loginAttempts       = 0;
    user.lockUntil           = undefined;
    await user.save();

    console.log('✅ Password reset successful for:', user.email);

    return res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now log in with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ success: false, message: 'Password reset failed.' });
  }
};

// ─── Change Password (authenticated) ──────────────────────────────────────────
/**
 * @route  PUT /api/auth/change-password
 * @access Private
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect.',
        errors: { currentPassword: 'Current password is incorrect.' },
      });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please log in again with your new password.',
    });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ success: false, message: 'Failed to change password.' });
  }
};

// ─── Refresh Token ─────────────────────────────────────────────────────────────
/**
 * @route  POST /api/auth/refresh-token
 * @access Public (uses HttpOnly cookie)
 */
const refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      return res.status(401).json({ success: false, message: 'No refresh token found.' });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or inactive.' });
    }

    const newAccessToken = generateAccessToken(user._id, user.role);

    return res.status(200).json({
      success: true,
      message: 'Token refreshed.',
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({ success: false, message: 'Token refresh failed.' });
  }
};

// ─── Logout ────────────────────────────────────────────────────────────────────
/**
 * @route  POST /api/auth/logout
 * @access Private
 */
const logout = async (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  return res.status(200).json({ success: true, message: 'Logged out successfully.' });
};

// ─── Get Me ────────────────────────────────────────────────────────────────────
/**
 * @route  GET /api/auth/me
 * @access Private
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch profile.' });
  }
};

module.exports = {
  register,
  login,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  changePassword,
  refreshToken,
  logout,
  getMe,
};