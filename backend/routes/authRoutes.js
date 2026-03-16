const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const {
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
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');
const {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateChangePassword,
} = require('../middleware/validationMiddleware');
const { handleValidationErrors } = require('../middleware/errorMiddleware');

// ─── Rate Limiters ─────────────────────────────────────────────────────────────

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    message: 'Too many login attempts from this IP. Try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: {
    success: false,
    message: 'Too many accounts created from this IP. Try again after an hour.',
  },
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    success: false,
    message: 'Too many password reset requests. Try again after an hour.',
  },
});

// ─── Public Routes ─────────────────────────────────────────────────────────────

// Registration
router.post(
  '/register',
  registerLimiter,
  validateRegister,
  handleValidationErrors,
  register
);

// Login
router.post(
  '/login',
  loginLimiter,
  validateLogin,
  handleValidationErrors,
  login
);

// Email verification
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', resendVerification);

// Password reset flow
router.post(
  '/forgot-password',
  forgotPasswordLimiter,
  validateForgotPassword,
  handleValidationErrors,
  forgotPassword
);

router.put(
  '/reset-password/:token',
  validateResetPassword,
  handleValidationErrors,
  resetPassword
);

// Token refresh (uses HttpOnly cookie)
router.post('/refresh-token', refreshToken);

// ─── Protected Routes ──────────────────────────────────────────────────────────

// Get current user
router.get('/me', protect, getMe);

// Change password (requires old password)
router.put(
  '/change-password',
  protect,
  validateChangePassword,
  handleValidationErrors,
  changePassword
);

// Logout
router.post('/logout', protect, logout);

module.exports = router;
