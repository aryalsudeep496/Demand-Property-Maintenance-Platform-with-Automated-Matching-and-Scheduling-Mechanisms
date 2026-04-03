const User           = require('../models/User');
const ServiceRequest = require('../models/ServiceRequest');

// ══════════════════════════════════════════════════════════════════════════════
// GET OWN PROFILE
// @route  GET /api/users/profile
// @access Auth
// ══════════════════════════════════════════════════════════════════════════════
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('getProfile error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch profile.' });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// UPDATE OWN PROFILE
// @route  PUT /api/users/profile
// @access Auth
// ══════════════════════════════════════════════════════════════════════════════
const updateProfile = async (req, res) => {
  try {
    const {
      firstName, lastName, phone,
      businessName, serviceCategories,
      skills, bio, availabilityRadius,
    } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    // ── Base fields ──
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName  !== undefined) user.lastName  = lastName;
    if (phone     !== undefined) user.phone     = phone || undefined;

    // ── Provider-only fields ──
    if (user.role === 'provider') {
      if (!user.providerProfile) user.providerProfile = {};

      if (businessName        !== undefined) user.providerProfile.businessName        = businessName;
      if (serviceCategories   !== undefined) user.providerProfile.serviceCategories   = serviceCategories;
      if (skills              !== undefined) user.providerProfile.skills              = skills;
      if (bio                 !== undefined) user.providerProfile.bio                 = bio;
      if (availabilityRadius  !== undefined) user.providerProfile.availabilityRadius  = availabilityRadius;
    }

    await user.save({ validateBeforeSave: true });
    console.log(`✏️  Profile updated: ${user.email}`);

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data:    user,
    });

  } catch (error) {
    console.error('updateProfile error:', error);
    if (error.name === 'ValidationError') {
      const msg = Object.values(error.errors).map(e => e.message).join(', ');
      return res.status(400).json({ success: false, message: msg });
    }
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Phone number already in use.' });
    }
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// TOGGLE AVAILABILITY
// @route  PUT /api/users/availability
// @access Provider
// ══════════════════════════════════════════════════════════════════════════════
const toggleAvailability = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user?.providerProfile) {
      return res.status(400).json({ success: false, message: 'Provider profile not found.' });
    }

    user.providerProfile.isAvailable = !user.providerProfile.isAvailable;
    await user.save({ validateBeforeSave: false });

    const status = user.providerProfile.isAvailable ? 'available' : 'unavailable';
    console.log(`🔄 Provider ${user.email} is now ${status}`);

    return res.status(200).json({
      success:     true,
      message:     `You are now ${status}.`,
      isAvailable: user.providerProfile.isAvailable,
    });

  } catch (error) {
    console.error('toggleAvailability error:', error);
    return res.status(500).json({ success: false, message: 'Failed to toggle availability.' });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN: GET ALL PROVIDERS
// @route  GET /api/users/admin/providers
// @access Admin
// ══════════════════════════════════════════════════════════════════════════════
const adminGetProviders = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const filter = { role: 'provider' };

    const total     = await User.countDocuments(filter);
    const providers = await User.find(filter)
      .select('-password -refreshToken -emailVerifyToken -resetPasswordToken')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return res.status(200).json({
      success: true,
      data:    providers,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) },
    });

  } catch (error) {
    console.error('adminGetProviders error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch providers.' });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN: VERIFY PROVIDER
// @route  PUT /api/users/admin/providers/:id/verify
// @access Admin
// ══════════════════════════════════════════════════════════════════════════════
const adminVerifyProvider = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'provider') {
      return res.status(404).json({ success: false, message: 'Provider not found.' });
    }

    if (!user.providerProfile) user.providerProfile = {};
    user.providerProfile.isVerified = true;
    await user.save({ validateBeforeSave: false });
    console.log(`✅ Provider verified by admin: ${user.email}`);

    return res.status(200).json({
      success: true,
      message: `Provider ${user.firstName} ${user.lastName} has been verified.`,
      data:    user,
    });

  } catch (error) {
    console.error('adminVerifyProvider error:', error);
    return res.status(500).json({ success: false, message: 'Failed to verify provider.' });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN: GET ALL CUSTOMERS
// @route  GET /api/users/admin/customers
// @access Admin
// ══════════════════════════════════════════════════════════════════════════════
const adminGetCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const filter = { role: 'customer' };

    const total     = await User.countDocuments(filter);
    const customers = await User.find(filter)
      .select('-password -refreshToken -emailVerifyToken -resetPasswordToken')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return res.status(200).json({
      success: true,
      data:    customers,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) },
    });

  } catch (error) {
    console.error('adminGetCustomers error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch customers.' });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN: TOGGLE SUSPEND
// @route  PUT /api/users/admin/users/:id/suspend
// @access Admin
// ══════════════════════════════════════════════════════════════════════════════
const adminToggleSuspend = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot suspend another admin.' });
    }

    user.isSuspended     = !user.isSuspended;
    user.suspendedReason = user.isSuspended ? (req.body.reason || 'Suspended by admin') : null;
    await user.save({ validateBeforeSave: false });

    const action = user.isSuspended ? 'suspended' : 'unsuspended';
    console.log(`🔐 User ${user.email} ${action} by admin`);

    return res.status(200).json({
      success:     true,
      message:     `User has been ${action}.`,
      isSuspended: user.isSuspended,
    });

  } catch (error) {
    console.error('adminToggleSuspend error:', error);
    return res.status(500).json({ success: false, message: 'Failed to toggle suspension.' });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN: GET STATS
// @route  GET /api/users/admin/stats
// @access Admin
// ══════════════════════════════════════════════════════════════════════════════
const adminGetStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalProviders,
      totalCustomers,
      totalRequests,
      completedRequests,
      pendingRequests,
      inProgressRequests,
      cancelledRequests,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: 'provider' }),
      User.countDocuments({ role: 'customer' }),
      ServiceRequest.countDocuments({}),
      ServiceRequest.countDocuments({ status: 'completed' }),
      ServiceRequest.countDocuments({ status: 'pending' }),
      ServiceRequest.countDocuments({ status: 'in_progress' }),
      ServiceRequest.countDocuments({ status: 'cancelled' }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalProviders,
        totalCustomers,
        totalRequests,
        completedRequests,
        pendingRequests,
        inProgressRequests,
        cancelledRequests,
      },
    });

  } catch (error) {
    console.error('adminGetStats error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch stats.' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  toggleAvailability,
  adminGetProviders,
  adminVerifyProvider,
  adminGetCustomers,
  adminToggleSuspend,
  adminGetStats,
};
