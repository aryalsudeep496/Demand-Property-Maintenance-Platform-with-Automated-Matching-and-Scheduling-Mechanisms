import api from './api';

// ─── Service Request API methods ───────────────────────────────────────────────

export const requestsAPI = {

  // Create a new service request (customer)
  create: (data) =>
    api.post('/requests', data),

  // Get own requests — customer sees theirs, provider sees assigned
  // params: { status, category, page, limit }
  getMy: (params = {}) =>
    api.get('/requests/my', { params }),

  // Get available open jobs (provider only)
  getAvailable: () =>
    api.get('/requests/available'),

  // Get a single request by ID (full detail + chat)
  getById: (id) =>
    api.get(`/requests/${id}`),

  // Update status of a request
  // data: { status, note }
  updateStatus: (id, data) =>
    api.put(`/requests/${id}/status`, data),

  // Send a chat message on a request
  sendMessage: (id, content) =>
    api.post(`/requests/${id}/messages`, { content }),

  // Submit a star review after job completed
  // data: { rating, comment }
  submitReview: (id, data) =>
    api.post(`/requests/${id}/review`, data),

  // Admin: get all requests with filters
  // params: { status, category, page, limit }
  adminGetAll: (params = {}) =>
    api.get('/requests', { params }),
};

// ─── Users & Profile API methods ───────────────────────────────────────────────

export const usersAPI = {

  // Get own full profile
  getProfile: () =>
    api.get('/users/profile'),

  // Update profile fields
  updateProfile: (data) =>
    api.put('/users/profile', data),

  // Toggle availability (provider only)
  toggleAvailability: () =>
    api.put('/users/availability'),

  // ── Notifications ──────────────────────────────────────────────────────────

  // Get notifications — params: { unreadOnly, page, limit }
  getNotifications: (params = {}) =>
    api.get('/users/notifications', { params }),

  // Mark as read — body: { ids: [...] } | { ids: 'all' }
  markAsRead: (ids) =>
    api.put('/users/notifications/read', { ids }),

  // ── Admin ──────────────────────────────────────────────────────────────────

  adminGetStats: () =>
    api.get('/users/admin/stats'),

  adminGetProviders: (params = {}) =>
    api.get('/users/admin/providers', { params }),

  adminVerifyProvider: (id) =>
    api.put(`/users/admin/providers/${id}/verify`),

  adminGetCustomers: (params = {}) =>
    api.get('/users/admin/customers', { params }),

  adminToggleSuspend: (id, reason) =>
    api.put(`/users/admin/users/${id}/suspend`, { reason }),
};

// ─── Category config (used across multiple pages) ──────────────────────────────
export const CATEGORIES = {
  home_repair: {
    label: 'Home Repair',
    icon:  '🔧',
    color: '#C17B2A',
    types: [
      'Plumbing',
      'Electrical',
      'Carpentry',
      'Roofing',
      'Painting',
      'General Repair',
      'Other',
    ],
  },
  home_upgrade: {
    label: 'Home Upgrade',
    icon:  '🏡',
    color: '#1E3A5F',
    types: [
      'Renovation',
      'Interior Design',
      'Landscaping',
      'Tiling',
      'Plastering',
      'Kitchen Fitting',
      'Other',
    ],
  },
  tech_digital: {
    label: 'Tech & Digital',
    icon:  '💻',
    color: '#2A7A4A',
    types: [
      'Device Repair',
      'Network Setup',
      'Smart Home',
      'CCTV Installation',
      'IT Support',
      'Appliance Repair',
      'Other',
    ],
  },
};

// ─── Status config (label + colour for badges) ────────────────────────────────
export const STATUS_CONFIG = {
  pending:     { label: 'Pending',     bg: '#fff3cd', color: '#856404', icon: '⏳' },
  matched:     { label: 'Matched',     bg: '#cce5ff', color: '#004085', icon: '🔗' },
  scheduled:   { label: 'Scheduled',   bg: '#d4edda', color: '#155724', icon: '📅' },
  in_progress: { label: 'In Progress', bg: '#d1ecf1', color: '#0c5460', icon: '🔧' },
  completed:   { label: 'Completed',   bg: '#d4edda', color: '#155724', icon: '✅' },
  cancelled:   { label: 'Cancelled',   bg: '#f8d7da', color: '#721c24', icon: '❌' },
};

// ─── Urgency config ────────────────────────────────────────────────────────────
export const URGENCY_CONFIG = {
  low:       { label: 'Low',       color: '#2e7d32', bg: '#e8f5e9' },
  medium:    { label: 'Medium',    color: '#f57f17', bg: '#fff8e1' },
  high:      { label: 'High',      color: '#e65100', bg: '#fff3e0' },
  emergency: { label: 'Emergency', color: '#880e4f', bg: '#fce4ec' },
};
