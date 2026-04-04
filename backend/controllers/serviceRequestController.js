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

// ─── Helper: find ALL providers whose profile matches the job ─────────────────
// Returns array of User docs
const findAllMatchingProviders = async (category, coordinates) => {
  const baseQuery = {
    role:                               'provider',
    isActive:                           true,
    isEmailVerified:                    true,
    'providerProfile.isAvailable':      true,
    'providerProfile.serviceCategories': category,
  };

  const hasCoords = Array.isArray(coordinates) && coordinates.length === 2 &&
                    !(coordinates[0] === 0 && coordinates[1] === 0);

  if (hasCoords) {
    const [lng, lat] = coordinates;

    // 1) Providers who have a set location within their service radius
    let geoProviders = [];
    try {
      geoProviders = await User.aggregate([
        {
          $geoNear: {
            near:          { type: 'Point', coordinates: [lng, lat] },
            distanceField: 'distanceMeters',
            maxDistance:   200000, // 200 km hard cap
            spherical:     true,
            query:         {
              ...baseQuery,
              'providerProfile.location.coordinates': { $ne: [0, 0] },
            },
          },
        },
        {
          $match: {
            $expr: {
              $lte: [
                '$distanceMeters',
                { $multiply: ['$providerProfile.availabilityRadius', 1000] },
              ],
            },
          },
        },
      ]);
    } catch (_) {
      // geo index may not be ready; fall through
    }

    // 2) Providers with NO location set (they accept all areas)
    const noLocProviders = await User.find({
      ...baseQuery,
      $or: [
        { 'providerProfile.location': { $exists: false } },
        { 'providerProfile.location.coordinates': [0, 0] },
      ],
    });

    // Merge & deduplicate
    const seen = new Set();
    const all  = [...geoProviders, ...noLocProviders];
    return all.filter(p => {
      const id = p._id.toString();
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }

  // No coordinates on job — match by category only
  return User.find(baseQuery);
};

// ─── Helper: broadcast new job to ALL matching providers ──────────────────────
const broadcastToMatchingProviders = async (request, io) => {
  const coords    = request.location?.coordinates?.coordinates || null;
  const providers = await findAllMatchingProviders(request.category, coords);

  console.log(`📡 Broadcasting new job "${request.title}" to ${providers.length} matching provider(s)`);

  if (io && providers.length > 0) {
    const customer     = await User.findById(request.customer).select('firstName lastName');
    const customerName = customer ? `${customer.firstName} ${customer.lastName}` : 'Customer';

    for (const prov of providers) {
      io.to(`user:${prov._id}`).emit('new_job_available', {
        requestId:    request._id.toString(),
        title:        request.title,
        customerName,
        category:     request.category,
        urgency:      request.urgency,
        city:         request.location?.city || '',
        role:         'provider',
      });
    }
  }

  // Auto-schedule if nobody accepts within 2 minutes
  const requestId = request._id.toString();
  setTimeout(async () => {
    try {
      const fresh = await ServiceRequest.findById(requestId);
      if (!fresh || fresh.status !== 'pending') return; // already handled

      const scheduledDate   = getNextAvailableSlot(fresh.preferredDate);
      fresh.scheduledDate   = scheduledDate;
      fresh.status          = 'scheduled';
      await fresh.save();

      console.log(`📅 No provider accepted in time — request ${requestId} auto-scheduled for ${scheduledDate}`);
      notifyRequestScheduled(fresh.customer, fresh._id, fresh.title, scheduledDate);

      if (io) {
        io.to(`user:${fresh.customer}`).emit('request_scheduled', {
          requestId:     fresh._id.toString(),
          title:         fresh.title,
          message:       'No provider accepted your request. It has been scheduled for the next available slot.',
          scheduledDate: scheduledDate.toISOString(),
        });
      }
    } catch (err) {
      console.error('Auto-schedule timeout error:', err);
    }
  }, 2 * 60 * 1000); // 2 minutes
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

    notifyRequestCreated(req.user._id, request._id, title);

    // Broadcast to ALL matching providers so they all see the popup
    const io = req.app.get('io');
    await broadcastToMatchingProviders(request, io);

    const populated = await ServiceRequest.findById(request._id)
      .populate('customer', 'firstName lastName email phone')
      .populate('provider', 'firstName lastName email phone providerProfile');

    return res.status(201).json({
      success: true,
      message: 'Request submitted! Matching providers are being notified.',
      data:    populated,
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
// @access Auth
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

    const isCustomer = request.customer._id.equals(req.user._id);
    const isProvider = request.provider && request.provider._id.equals(req.user._id);
    const isAdmin    = req.user.role === 'admin';
    // Any provider can view unstarted jobs (for browsing)
    const isBrowsableJob = req.user.role === 'provider' &&
      ['pending', 'scheduled', 'matched'].includes(request.status);

    if (!isCustomer && !isProvider && !isAdmin && !isBrowsableJob) {
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

    const allowedTransitions = {
      customer: {
        pending:     ['cancelled'],
        matched:     ['cancelled'],
        scheduled:   ['cancelled'],
        in_progress: ['completed'],   // only customer can mark job as complete
      },
      provider: {
        matched:   ['in_progress'],
        scheduled: ['in_progress'],
        // provider cannot mark completed — customer must confirm
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
// SEND MESSAGE
// @route  POST /api/requests/:id/messages
// @access Auth
// ══════════════════════════════════════════════════════════════════════════════
const sendMessage = async (req, res) => {
  try {
    const { content } = req.body;

    const request = await ServiceRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    const isCustomer = request.customer.equals(req.user._id);
    const isProvider = request.provider && request.provider.equals(req.user._id);

    if (!isCustomer && !isProvider) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

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

    const recipientId = isCustomer ? request.provider : request.customer;
    if (recipientId) {
      const senderName = `${req.user.firstName} ${req.user.lastName}`;
      notifyNewMessage(recipientId, request._id, request.title, senderName);
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`request:${req.params.id}`).emit('new_message', {
        _id:        newMsg._id,
        content:    newMsg.content,
        createdAt:  newMsg.createdAt,
        requestId:  req.params.id,
        sender: {
          _id:       req.user._id.toString(),
          firstName: req.user.firstName,
          lastName:  req.user.lastName,
          role:      req.user.role,
        },
      });
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
      return res.status(400).json({ success: false, message: 'You can only review a completed request.' });
    }

    if (request.customerReview) {
      return res.status(400).json({ success: false, message: 'You have already submitted a review for this request.' });
    }

    request.customerReview = { rating, comment };
    await request.save();

    if (request.provider) {
      const provider = await User.findById(request.provider);
      if (provider?.providerProfile) {
        const total = provider.providerProfile.totalReviews;
        const avg   = provider.providerProfile.averageRating;
        provider.providerProfile.totalReviews  = total + 1;
        provider.providerProfile.averageRating = ((avg * total) + rating) / (total + 1);
        await provider.save({ validateBeforeSave: false });
      }
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
// ACCEPT JOB  (provider self-assigns — first-come-first-served)
// @route  POST /api/requests/:id/accept
// @access Provider
// ══════════════════════════════════════════════════════════════════════════════
const acceptJob = async (req, res) => {
  try {
    // Use findOneAndUpdate with atomic check so two providers can't both win
    const request = await ServiceRequest.findOneAndUpdate(
      {
        _id:      req.params.id,
        provider: null,                               // still unassigned
        status:   { $in: ['pending', 'scheduled'] },  // not yet matched
      },
      {
        $set: {
          provider:    req.user._id,
          status:      'matched',
          lastMatchAt: new Date(),
        },
        $inc: { matchAttempts: 1 },
      },
      { new: true }
    );

    if (!request) {
      // Either not found or already taken
      const existing = await ServiceRequest.findById(req.params.id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Request not found.' });
      }
      return res.status(400).json({
        success: false,
        message: existing.provider
          ? 'This job has already been accepted by another provider.'
          : 'This job is no longer available.',
      });
    }

    console.log(`✅ Provider ${req.user.email} accepted job: ${request._id}`);

    notifyRequestMatched(request.customer, req.user._id, request._id, request.title);

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${request.customer}`).emit('job_matched', {
        requestId:    request._id.toString(),
        title:        request.title,
        message:      `A provider accepted your request "${request.title}"`,
        providerName: `${req.user.firstName} ${req.user.lastName}`,
        role:         'customer',
      });
    }

    const populated = await ServiceRequest.findById(request._id)
      .populate('customer', 'firstName lastName email phone')
      .populate('provider', 'firstName lastName email phone providerProfile');

    return res.status(200).json({
      success: true,
      message: 'Job accepted successfully.',
      data:    populated,
    });

  } catch (error) {
    console.error('acceptJob error:', error);
    return res.status(500).json({ success: false, message: 'Failed to accept job.' });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// ACCEPT OFFER  (kept for backward-compat — delegates to acceptJob logic)
// @route  POST /api/requests/:id/accept-offer
// @access Provider
// ══════════════════════════════════════════════════════════════════════════════
const acceptOffer = acceptJob;

// ══════════════════════════════════════════════════════════════════════════════
// DECLINE OFFER  (provider dismisses the popup — no chain needed)
// @route  POST /api/requests/:id/decline-offer
// @access Provider
// ══════════════════════════════════════════════════════════════════════════════
const declineOffer = async (req, res) => {
  try {
    // Just record the rejection so the popup won't re-trigger for this provider
    await ServiceRequest.findByIdAndUpdate(req.params.id, {
      $addToSet: { rejectedProviders: req.user._id },
    });
    return res.status(200).json({ success: true, message: 'Offer declined.' });
  } catch (error) {
    console.error('declineOffer error:', error);
    return res.status(500).json({ success: false, message: 'Failed to decline offer.' });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// GET AVAILABLE REQUESTS  (for providers to browse)
// @route  GET /api/requests/available
// @access Provider
// ══════════════════════════════════════════════════════════════════════════════
const getAvailableRequests = async (req, res) => {
  try {
    const provider   = await User.findById(req.user._id);
    const categories = provider?.providerProfile?.serviceCategories || [];
    const areaCity   = provider?.providerProfile?.serviceAreaCity || '';

    // Show all unstarted jobs this provider hasn't already accepted
    const filter = {
      status:   { $in: ['pending', 'scheduled', 'matched'] },
      provider: { $ne: req.user._id },
    };

    // Filter by category only if provider has categories set
    if (categories.length > 0) {
      filter.category = { $in: categories };
    }

    // Soft city filter — if provider has a serviceAreaCity, prefer matching city
    // We do this as a post-sort (show same-city first) rather than hard exclusion
    const requests = await ServiceRequest.find(filter)
      .populate('customer', 'firstName lastName')
      .populate('provider', 'firstName lastName')
      .sort({ urgency: -1, createdAt: 1 })
      .limit(50);

    // If provider has a city set, sort matching city jobs first
    const sorted = areaCity
      ? [
          ...requests.filter(r => r.location?.city?.toLowerCase().includes(areaCity.toLowerCase())),
          ...requests.filter(r => !r.location?.city?.toLowerCase().includes(areaCity.toLowerCase())),
        ]
      : requests;

    return res.status(200).json({ success: true, data: sorted });

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
  acceptOffer,
  declineOffer,
  acceptJob,
  getAvailableRequests,
  adminGetAllRequests,
};
