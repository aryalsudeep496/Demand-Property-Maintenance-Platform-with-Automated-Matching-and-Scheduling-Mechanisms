const express = require('express');
const router  = express.Router();

const { protect, restrictTo } = require('../middleware/authMiddleware');

const {
  getProfile,
  updateProfile,
  toggleAvailability,
  adminGetProviders,
  adminVerifyProvider,
  adminGetCustomers,
  adminToggleSuspend,
  adminGetStats,
} = require('../controllers/userController');

const {
  getNotifications,
  markAsRead,
} = require('../controllers/notificationController');

// ─── Profile routes ────────────────────────────────────────────────────────────
router.get('/profile',      protect, getProfile);
router.put('/profile',      protect, updateProfile);
router.put('/availability', protect, restrictTo('provider'), toggleAvailability);

// ─── Notification routes ───────────────────────────────────────────────────────
router.get('/notifications',      protect, getNotifications);
router.put('/notifications/read', protect, markAsRead);

// ─── Admin routes ──────────────────────────────────────────────────────────────
router.get('/admin/stats',                   protect, restrictTo('admin'), adminGetStats);
router.get('/admin/providers',               protect, restrictTo('admin'), adminGetProviders);
router.put('/admin/providers/:id/verify',    protect, restrictTo('admin'), adminVerifyProvider);
router.get('/admin/customers',               protect, restrictTo('admin'), adminGetCustomers);
router.put('/admin/users/:id/suspend',       protect, restrictTo('admin'), adminToggleSuspend);

module.exports = router;
