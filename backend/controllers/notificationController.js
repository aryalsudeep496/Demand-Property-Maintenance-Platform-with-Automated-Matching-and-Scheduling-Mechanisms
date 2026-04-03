const Notification = require('../models/Notification');

// ══════════════════════════════════════════════════════════════════════════════
// GET NOTIFICATIONS
// @route  GET /api/users/notifications
// @query  unreadOnly=true, page, limit
// @access Auth
// ══════════════════════════════════════════════════════════════════════════════
const getNotifications = async (req, res) => {
  try {
    const { unreadOnly, page = 1, limit = 20 } = req.query;

    const filter = { recipient: req.user._id };
    if (unreadOnly === 'true') filter.isRead = false;

    const total         = await Notification.countDocuments(filter);
    const unreadCount   = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return res.status(200).json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: {
        total,
        page:  parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit),
      },
    });

  } catch (error) {
    console.error('getNotifications error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications.' });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// MARK AS READ
// @route  PUT /api/users/notifications/read
// @body   { ids: ['id1','id2'] } | { ids: 'all' }
// @access Auth
// ══════════════════════════════════════════════════════════════════════════════
const markAsRead = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids) {
      return res.status(400).json({ success: false, message: 'ids field is required.' });
    }

    const now    = new Date();
    let  filter;

    if (ids === 'all') {
      filter = { recipient: req.user._id, isRead: false };
    } else if (Array.isArray(ids) && ids.length > 0) {
      filter = { _id: { $in: ids }, recipient: req.user._id };
    } else {
      return res.status(400).json({ success: false, message: 'ids must be "all" or a non-empty array.' });
    }

    await Notification.updateMany(filter, { $set: { isRead: true, readAt: now } });

    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });

    return res.status(200).json({
      success: true,
      message: 'Notifications marked as read.',
      unreadCount,
    });

  } catch (error) {
    console.error('markAsRead error:', error);
    return res.status(500).json({ success: false, message: 'Failed to mark notifications as read.' });
  }
};

module.exports = { getNotifications, markAsRead };
