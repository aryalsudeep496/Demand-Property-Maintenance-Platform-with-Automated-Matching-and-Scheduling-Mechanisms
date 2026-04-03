const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({

  recipient: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
  },

  type: {
    type: String,
    enum: [
      'request_created',
      'request_matched',
      'request_scheduled',
      'request_in_progress',
      'request_completed',
      'request_cancelled',
      'new_message',
      'review_received',
    ],
    required: true,
  },

  title:   { type: String, required: true, trim: true, maxlength: 200 },
  message: { type: String, required: true, trim: true, maxlength: 1000 },

  // Arbitrary payload — e.g. { requestId: '...' }
  data: { type: mongoose.Schema.Types.Mixed, default: {} },

  isRead: { type: Boolean, default: false },
  readAt: { type: Date,    default: null  },

}, {
  timestamps: true,
});

notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
