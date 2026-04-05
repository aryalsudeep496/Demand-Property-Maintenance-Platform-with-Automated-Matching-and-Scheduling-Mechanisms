const express = require('express');
const router  = express.Router();
const { body } = require('express-validator');

const { protect, restrictTo }      = require('../middleware/authMiddleware');
const { handleValidationErrors }   = require('../middleware/errorMiddleware');
const {
  createRequest,
  getMyRequests,
  getRequest,
  updateStatus,
  sendMessage,
  submitReview,
  acceptOffer,
  declineOffer,
  acceptJob,
  getAvailableRequests,
  addProgressUpdate,
  adminGetAllRequests,
} = require('../controllers/serviceRequestController');

// ─── Validation chains ─────────────────────────────────────────────────────────

const validateCreateRequest = [
  body('category')
    .isIn(['home_repair', 'home_upgrade', 'tech_digital'])
    .withMessage('Category must be home_repair, home_upgrade, or tech_digital'),

  body('serviceType')
    .trim()
    .notEmpty().withMessage('Service type is required')
    .isLength({ max: 100 }).withMessage('Service type cannot exceed 100 characters'),

  body('title')
    .trim()
    .isLength({ min: 5, max: 150 })
    .withMessage('Title must be between 5 and 150 characters'),

  body('description')
    .trim()
    .isLength({ min: 20, max: 2000 })
    .withMessage('Description must be between 20 and 2000 characters'),

  body('urgency')
    .optional()
    .isIn(['low', 'medium', 'high', 'emergency'])
    .withMessage('Urgency must be low, medium, high, or emergency'),

  body('location.address')
    .trim()
    .notEmpty().withMessage('Address is required'),

  body('location.city')
    .trim()
    .notEmpty().withMessage('City is required'),

  body('location.postcode')
    .trim()
    .notEmpty().withMessage('Postcode is required'),

  body('preferredDate')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601().withMessage('Preferred date must be a valid date'),
];

const validateMessage = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message must be between 1 and 2000 characters'),
];

const validateReview = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be a number between 1 and 5'),

  body('comment')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Comment cannot exceed 1000 characters'),
];

const validateStatusUpdate = [
  body('status')
    .isIn(['pending', 'matched', 'scheduled', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Invalid status value'),

  body('note')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Note cannot exceed 500 characters'),
];

// ─── Routes ────────────────────────────────────────────────────────────────────

// ── Customer routes ────────────────────────────────────────────────────────────

// Create a new service request
router.post(
  '/',
  protect,
  restrictTo('customer'),
  validateCreateRequest,
  handleValidationErrors,
  createRequest
);

// Get own requests (customer or provider)
router.get(
  '/my',
  protect,
  getMyRequests
);

// Get available jobs (provider only)
router.get(
  '/available',
  protect,
  restrictTo('provider'),
  getAvailableRequests
);

// Admin: get all requests
router.get(
  '/',
  protect,
  restrictTo('admin'),
  adminGetAllRequests
);

// Get single request by ID
router.get(
  '/:id',
  protect,
  getRequest
);

// Update status
router.put(
  '/:id/status',
  protect,
  validateStatusUpdate,
  handleValidationErrors,
  updateStatus
);

// Send a chat message
router.post(
  '/:id/messages',
  protect,
  validateMessage,
  handleValidationErrors,
  sendMessage
);

// Accept a system-generated offer
router.post('/:id/accept-offer',  protect, restrictTo('provider'), acceptOffer);

// Decline a system-generated offer (find next provider)
router.post('/:id/decline-offer', protect, restrictTo('provider'), declineOffer);

// Accept a job from the browse list (provider self-assigns)
router.post(
  '/:id/accept',
  protect,
  restrictTo('provider'),
  acceptJob
);

// Add a progress update (provider only, job must be in_progress)
router.post(
  '/:id/progress',
  protect,
  restrictTo('provider'),
  body('message').trim().isLength({ min: 1, max: 1000 }).withMessage('Message must be 1–1000 characters'),
  handleValidationErrors,
  addProgressUpdate
);

// Submit a review
router.post(
  '/:id/review',
  protect,
  restrictTo('customer'),
  validateReview,
  handleValidationErrors,
  submitReview
);

module.exports = router;