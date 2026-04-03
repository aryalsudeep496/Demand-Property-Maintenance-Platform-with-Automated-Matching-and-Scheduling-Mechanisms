const mongoose = require('mongoose');

// ─── Chat message sub-schema ───────────────────────────────────────────────────
const messageSchema = new mongoose.Schema({
  sender:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderRole: { type: String, enum: ['customer', 'provider', 'system'], required: true },
  content:    { type: String, required: true, trim: true, maxlength: 2000 },
  readAt:     { type: Date, default: null },
}, { timestamps: true });

// ─── Review sub-schema ─────────────────────────────────────────────────────────
const reviewSchema = new mongoose.Schema({
  rating:    { type: Number, required: true, min: 1, max: 5 },
  comment:   { type: String, trim: true, maxlength: 1000 },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

// ─── Main ServiceRequest schema ────────────────────────────────────────────────
const serviceRequestSchema = new mongoose.Schema({

  // ── Parties ────────────────────────────────────────────────────────────────
  customer: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true,
  },
  provider: {
    type:    mongoose.Schema.Types.ObjectId,
    ref:     'User',
    default: null,
  },

  // ── Service details ────────────────────────────────────────────────────────
  category: {
    type:     String,
    enum:     ['home_repair', 'home_upgrade', 'tech_digital'],
    required: [true, 'Service category is required'],
  },
  serviceType: {
    type:      String,
    required:  [true, 'Service type is required'],
    trim:      true,
    maxlength: 100,
  },
  title: {
    type:      String,
    required:  [true, 'Title is required'],
    trim:      true,
    minlength: [5,   'Title must be at least 5 characters'],
    maxlength: [150, 'Title cannot exceed 150 characters'],
  },
  description: {
    type:      String,
    required:  [true, 'Description is required'],
    trim:      true,
    minlength: [20,   'Description must be at least 20 characters'],
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },
  urgency: {
    type:    String,
    enum:    ['low', 'medium', 'high', 'emergency'],
    default: 'medium',
  },

  // ── Location ───────────────────────────────────────────────────────────────
  location: {
    address:  { type: String, required: true, trim: true },
    city:     { type: String, required: true, trim: true },
    postcode: { type: String, required: true, trim: true, uppercase: true },
    coordinates: {
      type:        { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    },
  },

  // ── Scheduling ─────────────────────────────────────────────────────────────
  preferredDate: { type: Date, default: null },
  scheduledDate: { type: Date, default: null },
  completedAt:   { type: Date, default: null },

  // ── Status ─────────────────────────────────────────────────────────────────
  status: {
    type:    String,
    enum:    ['pending', 'matched', 'scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'pending',
  },
  statusHistory: [{
    status:    { type: String },
    changedAt: { type: Date, default: Date.now },
    note:      { type: String, default: '' },
  }],

  // ── Matching ───────────────────────────────────────────────────────────────
  matchAttempts:     { type: Number, default: 0 },
  lastMatchAt:       { type: Date,   default: null },
  rejectedProviders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // ── Chat ───────────────────────────────────────────────────────────────────
  messages: [messageSchema],

  // ── Review ─────────────────────────────────────────────────────────────────
  customerReview: { type: reviewSchema, default: null },

  // ── Financials ─────────────────────────────────────────────────────────────
  estimatedCost: { type: Number, default: null },
  finalCost:     { type: Number, default: null },

  // ── Cancellation ───────────────────────────────────────────────────────────
  cancelledBy:   { type: String, enum: ['customer', 'provider', 'admin', 'system'], default: null },
  cancelReason:  { type: String, default: null },

}, {
  timestamps: true,
  toJSON:     { virtuals: true },
  toObject:   { virtuals: true },
});

// ─── Indexes ───────────────────────────────────────────────────────────────────
serviceRequestSchema.index({ customer: 1 });
serviceRequestSchema.index({ provider: 1 });
serviceRequestSchema.index({ status: 1 });
serviceRequestSchema.index({ category: 1 });
serviceRequestSchema.index({ createdAt: -1 });
serviceRequestSchema.index({ 'location.coordinates': '2dsphere' });

// ─── Auto push status history on every status change ──────────────────────────
serviceRequestSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status:    this.status,
      changedAt: new Date(),
    });
  }
  next();
});

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);