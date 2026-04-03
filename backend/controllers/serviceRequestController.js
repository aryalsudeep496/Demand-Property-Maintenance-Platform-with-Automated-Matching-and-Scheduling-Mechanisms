const ServiceRequest = require('../models/ServiceRequest');
const User           = require('../models/User');
const {
  notifyRequestCreated,
  notifyRequestMatched,
  notifyRequestScheduled,
  notifyJobInProgress,
  notifyJobCompleted,
  notifyRequestCancelled,
  notifyNewMessage,
  notifyReviewReceived,
} = require('../utils/notificationUtils');

// ─── Helper: get next available slot (next weekday at 9am) ────────────────────
const getNextAvailableSlot = (fromDate = new Date()) => {
  const date = new Date(fromDate);
  date.setDate(date.getDate() + 1);
  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() + 1);
  }
  date.setHours(9, 0, 0, 0);
  return date;
};

// ─── Helper: find best matching provider ──────────────────────────────────────
const findMatchingProvider = async (category, rejectedProviders = []) => {
  return await User.findOne({
    role:                              'provider',
    isActive:                          true,
    isEmailVerified:                   true,
    'providerProfile.isAvailable':     true,
    'providerProfile.serviceCategories': category,
    _id: { $nin: rejectedProviders },
  }).sort({ 'providerProfile.averageRating': -1 });
};

// ══════════════════════════════════════════════════════════════════════════════
// CREATE REQUEST
// @route  POST /api/requests
// @access Customer
// ══════════════════════════════════════════════════════════════════════════════
const createRequest = async (req, res) => {
  try {
    const {
      category, serviceType, title,
      description, urgency, location, preferredDate,
    } = req.body;

    // Create the request
    const request = await ServiceRequest.create({
      customer:      req.user._id,
      category,
      serviceType,
      title,
      description,
      urgency:       urgency || 'medium',
      location,
      preferredDate: preferredDate || null,
      statusHistory: [{ status: 'pending', note: 'Request submitted by customer' }],
    });

    console.log(`📋 New service request created: ${request._id} by ${req.user.email}`);

    // ── Auto-match a provider ─────────────────────────────────────────────────
    const provider = await findMatchingProvider(category);

    if (provider) {
      request.provider      = provider._id;
      request.status        = 'matched';
      request.lastMatchAt   = new Date();
      request.matchAttempts = 1;
      await request.save();
      console.log(`✅ Auto-matched provider: ${provider.email}`);
      notifyRequestMatched(req.user._id, provider._id, request._id, title);
    } else {
      // No provider available — schedule for next slot
      const scheduledDate    = getNextAvailableSlot(preferredDate);
      request.scheduledDate  = scheduledDate;
      request.status         = 'scheduled';
      await request.save();
      console.log(`📅 No provider available — scheduled for: ${scheduledDate}`);
      notifyRequestCreated(req.user._id, request._id, title);
      notifyRequestScheduled(req.user._id, request._id, title, scheduledDate);
    }

    const populated = await ServiceRequest.findById(request._id)
      .populate('customer', 'firstName lastName email phone')
      .populate('provider', 'firstName lastName email phone providerProfile');

    return res.status(201).json({
      success: true,
      message: provider
        ? 'Request created and a provider has been matched!'
        : 'Request created. No provider available right now — scheduled for next available slot.',
      data: populated,
    });

  } catch (error) {
    console.error('createRequest error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create request.' });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// GET MY REQUESTS (customer sees own, provider sees assigned)
// @route  GET /api/requests/my
// @access Auth
// ══════════════════════════════════════════════════════════════════════════════
const getMyRequests = async (req, res) => {
  try {
    const { status, category, page = 1, limit = 10 } = req.query;

    const filter = req.user.role === 'customer'
      ? { customer: req.user._id }
      : { provider: req.user._id };

    if (status)   filter.status   = status;
    if (category) filter.category = category;

    const total    = await ServiceRequest.countDocuments(filter);
    const requests = await ServiceRequest.find(filter)
      .populate('customer', 'firstName lastName email phone')
      .populate('provider', 'firstName lastName email phone providerProfile')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return res.status(200).json({
      success: true,
      data:    requests,
      pagination: {
        total,
        page:  parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit),
      },
    });

  } catch (error) {
    console.error('getMyRequests error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch requests.' });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// GET SINGLE REQUEST
// @route  GET /api/requests/:id
// @access Auth (customer/provider involved, or admin)
// ══════════════════════════════════════════════════════════════════════════════
const getRequest = async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.id)
      .populate('customer', 'firstName lastName email phone avatar')
      .populate('provider', 'firstName lastName email phone avatar providerProfile')
      .populate('messages.sender', 'firstName lastName role avatar');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    // Only involved parties or admin can view
    const isCustomer = request.customer._id.equals(req.user._id);
    const isProvider = request.provider && request.provider._id.equals(req.user._id);
    const isAdmin    = req.user.role === 'admin';
    // Allow any provider to view unassigned (available) jobs
    const isAvailableJob = req.user.role === 'provider' && !request.provider;

    if (!isCustomer && !isProvider && !isAdmin && !isAvailableJob) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    return res.status(200).json({ success: true, data: request });

  } catch (error) {
    console.error('getRequest error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch request.' });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// UPDATE STATUS
// @route  PUT /api/requests/:id/status
// @access Auth
// ══════════════════════════════════════════════════════════════════════════════
const updateStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const request = await ServiceRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    // Define allowed transitions per role
    const allowedTransitions = {
      customer: {
        pending:   ['cancelled'],
        matched:   ['cancelled'],
        scheduled: ['cancelled'],
      },
      provider: {
        matched:     ['in_progress'],
        scheduled:   ['in_progress'],
        in_progress: ['completed'],
      },
      admin: {
        pending:     ['cancelled'],
        matched:     ['cancelled', 'in_progress'],
        scheduled:   ['cancelled', 'in_progress'],
        in_progress: ['completed', 'cancelled'],
      },
    };

    const allowed = allowedTransitions[req.user.role]?.[request.status] || [];

    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot move from "${request.status}" to "${status}" as ${req.user.role}.`,
      });
    }

    const prevProvider = request.provider;
    const reqTitle     = request.title;
    const reqId        = request._id;

    request.status = status;

    if (status === 'completed') {
      request.completedAt = new Date();
    }

    if (status === 'cancelled') {
      request.cancelledBy  = req.user.role;
      request.cancelReason = note || 'No reason provided';
    }

    await request.save();
    console.log(`🔄 Request ${request._id} status → ${status} by ${req.user.role}`);

    // Fire notifications (non-blocking)
    if (status === 'in_progress') {
      notifyJobInProgress(request.customer, reqId, reqTitle);
    } else if (status === 'completed') {
      notifyJobCompleted(request.customer, prevProvider, reqId, reqTitle);
    } else if (status === 'cancelled') {
      notifyRequestCancelled(request.customer, prevProvider, reqId, reqTitle, req.user.role);
    }

    return res.status(200).json({
      success: true,
      message: `Request status updated to "${status}".`,
      data:    request,
    });

  } catch (error) {
    console.error('updateStatus error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update status.' });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// SEND MESSAGE (in-request chat)
// @route  POST /api/requests/:id/messages
// @access Auth (customer or provider involved)
// ══════════════════════════════════════════════════════════════════════════════
const sendMessage = async (req, res) => {
  try {
    const { content } = req.body;

    const request = await ServiceRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    // Only involved parties can message
    const isCustomer = request.customer.equals(req.user._id);
    const isProvider = request.provider && request.provider.equals(req.user._id);

    if (!isCustomer && !isProvider) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Cannot message on cancelled or pending (no provider yet)
    if (['cancelled', 'pending'].includes(request.status)) {
      return res.status(400).json({
        success: false,
        message: 'Messaging is only available once a provider is assigned.',
      });
    }

    request.messages.push({
      sender:     req.user._id,
      senderRole: req.user.role,
      content:    content.trim(),
    });

    await request.save();

    const updated = await ServiceRequest.findById(request._id)
      .populate('messages.sender', 'firstName lastName role avatar');

    const newMsg = updated.messages[updated.messages.length - 1];

    // Notify the other party
    const recipientId = isCustomer ? request.provider : request.customer;
    if (recipientId) {
      const senderName = `${req.user.firstName} ${req.user.lastName}`;
      notifyNewMessage(recipientId, request._id, request.title, senderName);
    }

    return res.status(201).json({ success: true, data: newMsg });

  } catch (error) {
    console.error('sendMessage error:', error);
    return res.status(500).json({ success: false, message: 'Failed to send message.' });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// SUBMIT REVIEW
// @route  POST /api/requests/:id/review
// @access Customer
// ══════════════════════════════════════════════════════════════════════════════
const submitReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const request = await ServiceRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    if (!request.customer.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    if (request.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'You can only review a completed request.',
      });
    }

    if (request.customerReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a review for this request.',
      });
    }

    request.customerReview = { rating, comment };
    await request.save();

    // Update provider's average rating
    if (request.provider) {
      const provider = await User.findById(request.provider);
      if (provider?.providerProfile) {
        const total = provider.providerProfile.totalReviews;
        const avg   = provider.providerProfile.averageRating;
        provider.providerProfile.totalReviews  = total + 1;
        provider.providerProfile.averageRating = ((avg * total) + rating) / (total + 1);
        await provider.save({ validateBeforeSave: false });
        console.log(`⭐ Provider ${provider.email} rating updated to ${provider.providerProfile.averageRating.toFixed(2)}`);
      }
    }

    // Notify provider
    if (request.provider) {
      notifyReviewReceived(request.provider, request._id, request.title, rating);
    }

    return res.status(200).json({
      success: true,
      message: 'Review submitted successfully.',
      data:    request.customerReview,
    });

  } catch (error) {
    console.error('submitReview error:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit review.' });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// GET AVAILABLE REQUESTS (for providers to browse)
// @route  GET /api/requests/available
// @access Provider
// ══════════════════════════════════════════════════════════════════════════════
const getAvailableRequests = async (req, res) => {
  try {
    const provider   = await User.findById(req.user._id);
    const categories = provider?.providerProfile?.serviceCategories || [];

    const requests = await ServiceRequest.find({
      status:   { $in: ['pending', 'scheduled'] },
      category: { $in: categories },
      provider: null,
    })
      .populate('customer', 'firstName lastName')
      .sort({ urgency: -1, createdAt: 1 })
      .limit(20);

    return res.status(200).json({ success: true, data: requests });

  } catch (error) {
    console.error('getAvailableRequests error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch available requests.' });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN: GET ALL REQUESTS
// @route  GET /api/requests
// @access Admin
// ══════════════════════════════════════════════════════════════════════════════
const adminGetAllRequests = async (req, res) => {
  try {
    const { status, category, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status)   filter.status   = status;
    if (category) filter.category = category;

    const total    = await ServiceRequest.countDocuments(filter);
    const requests = await ServiceRequest.find(filter)
      .populate('customer', 'firstName lastName email')
      .populate('provider', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return res.status(200).json({
      success: true,
      data:    requests,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) },
    });

  } catch (error) {
    console.error('adminGetAllRequests error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch requests.' });
  }
};

module.exports = {
  createRequest,
  getMyRequests,
  getRequest,
  updateStatus,
  sendMessage,
  submitReview,
  getAvailableRequests,
  adminGetAllRequests,
};