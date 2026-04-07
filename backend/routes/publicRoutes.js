const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const ServiceRequest = require('../models/ServiceRequest');

// ─── GET /api/public/stats ─────────────────────────────────────────────────────
// No auth required — powers the landing page with live platform data.
router.get('/stats', async (req, res) => {
  try {
    const [
      completedRequests,
      totalProviders,
      verifiedProviders,
      totalCustomers,
      inProgressRequests,
    ] = await Promise.all([
      ServiceRequest.countDocuments({ status: 'completed' }),
      User.countDocuments({ role: 'provider' }),
      User.countDocuments({ role: 'provider', 'providerProfile.isVerified': true }),
      User.countDocuments({ role: 'customer' }),
      ServiceRequest.countDocuments({ status: 'in_progress' }),
    ]);

    // Average rating + total reviews from all completed requests that have a review
    const ratingAgg = await ServiceRequest.aggregate([
      { $match: { 'customerReview.rating': { $exists: true, $ne: null } } },
      { $group: {
          _id: null,
          avgRating:    { $avg: '$customerReview.rating' },
          totalReviews: { $sum: 1 },
      }},
    ]);
    const avgRating    = ratingAgg[0] ? Math.round(ratingAgg[0].avgRating * 10) / 10 : 0;
    const totalReviews = ratingAgg[0] ? ratingAgg[0].totalReviews : 0;

    // Featured active request — most recent in_progress with a provider, else matched, else completed
    const featuredRaw = await ServiceRequest
      .findOne({
        status:   { $in: ['in_progress', 'matched', 'completed'] },
        provider: { $exists: true, $ne: null },
      })
      .sort({ updatedAt: -1 })
      .populate('provider', 'firstName lastName providerProfile')
      .select('title category urgency status provider updatedAt');

    const featuredRequest = featuredRaw ? {
      title:        featuredRaw.title,
      category:     featuredRaw.category,
      urgency:      featuredRaw.urgency,
      status:       featuredRaw.status,
      providerName: `${featuredRaw.provider.firstName} ${featuredRaw.provider.lastName}`,
      providerInitials: `${featuredRaw.provider.firstName.charAt(0)}${featuredRaw.provider.lastName.charAt(0)}`,
      providerRating:   featuredRaw.provider.providerProfile?.averageRating || 0,
      providerJobs:     featuredRaw.provider.providerProfile?.totalReviews   || 0,
      providerVerified: featuredRaw.provider.providerProfile?.isVerified     || false,
    } : null;

    // Top 3 reviews — highest rated with a non-empty comment
    const recentRequests = await ServiceRequest
      .find({
        'customerReview.rating':  { $exists: true, $ne: null },
        'customerReview.comment': { $exists: true, $ne: '' },
      })
      .sort({ 'customerReview.rating': -1, 'customerReview.createdAt': -1 })
      .limit(3)
      .populate('customer', 'firstName lastName')
      .populate('provider', 'firstName lastName providerProfile')
      .select('title category customerReview customer provider');

    const recentReviews = recentRequests.map(r => ({
      rating:       r.customerReview.rating,
      comment:      r.customerReview.comment,
      jobTitle:     r.title,
      category:     r.category,
      customerName: r.customer
        ? `${r.customer.firstName} ${r.customer.lastName?.charAt(0)}.`
        : 'Anonymous',
      providerName: r.provider
        ? `${r.provider.firstName} ${r.provider.lastName}`
        : 'Provider',
      providerRole: r.provider?.providerProfile?.businessName || 'Service Provider',
      createdAt:    r.customerReview.createdAt,
    }));

    return res.status(200).json({
      success: true,
      data: {
        completedRequests,
        totalProviders,
        verifiedProviders,
        totalCustomers,
        inProgressRequests,
        avgRating,
        totalReviews,
        recentReviews,
        featuredRequest,
      },
    });

  } catch (error) {
    console.error('publicStats error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch stats.' });
  }
});

module.exports = router;
