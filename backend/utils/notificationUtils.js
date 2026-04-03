const Notification = require('../models/Notification');

// ─── Core creator ──────────────────────────────────────────────────────────────
const createNotification = async (recipientId, type, title, message, data = {}) => {
  try {
    await Notification.create({ recipient: recipientId, type, title, message, data });
  } catch (err) {
    // Notifications are non-critical — log but do not throw
    console.error('createNotification error:', err.message);
  }
};

// ─── Domain helpers ────────────────────────────────────────────────────────────

/**
 * Called after a customer creates a new service request.
 * Notifies the customer that their request is submitted.
 */
const notifyRequestCreated = (customerId, requestId, title) =>
  createNotification(
    customerId,
    'request_created',
    'Request Submitted',
    `Your request "${title}" has been submitted and is being processed.`,
    { requestId }
  );

/**
 * Called when a provider is auto-matched to a request.
 * Notifies both the customer and the provider.
 */
const notifyRequestMatched = async (customerId, providerId, requestId, title) => {
  await createNotification(
    customerId,
    'request_matched',
    'Provider Matched!',
    `A provider has been matched to your request "${title}".`,
    { requestId }
  );
  await createNotification(
    providerId,
    'request_matched',
    'New Job Assigned',
    `You have been matched to a new job: "${title}".`,
    { requestId }
  );
};

/**
 * Called when a request is scheduled (no immediate provider found).
 * Notifies the customer of the scheduled slot.
 */
const notifyRequestScheduled = (customerId, requestId, title, scheduledDate) =>
  createNotification(
    customerId,
    'request_scheduled',
    'Request Scheduled',
    `Your request "${title}" has been scheduled for ${new Date(scheduledDate).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`,
    { requestId }
  );

/**
 * Called when a provider marks a job as in-progress.
 * Notifies the customer.
 */
const notifyJobInProgress = (customerId, requestId, title) =>
  createNotification(
    customerId,
    'request_in_progress',
    'Job Started',
    `Your provider has started work on "${title}".`,
    { requestId }
  );

/**
 * Called when a job is completed.
 * Notifies the customer and the provider.
 */
const notifyJobCompleted = async (customerId, providerId, requestId, title) => {
  await createNotification(
    customerId,
    'request_completed',
    'Job Completed',
    `Your request "${title}" has been marked as completed. Please leave a review!`,
    { requestId }
  );
  if (providerId) {
    await createNotification(
      providerId,
      'request_completed',
      'Job Completed',
      `You have completed the job: "${title}".`,
      { requestId }
    );
  }
};

/**
 * Called when a request is cancelled.
 * Notifies both parties.
 */
const notifyRequestCancelled = async (customerId, providerId, requestId, title, cancelledBy) => {
  const who = cancelledBy === 'customer' ? 'You' : 'The provider';
  await createNotification(
    customerId,
    'request_cancelled',
    'Request Cancelled',
    `${who} cancelled the request "${title}".`,
    { requestId }
  );
  if (providerId) {
    const whoProvider = cancelledBy === 'provider' ? 'You' : 'The customer';
    await createNotification(
      providerId,
      'request_cancelled',
      'Job Cancelled',
      `${whoProvider} cancelled the job "${title}".`,
      { requestId }
    );
  }
};

/**
 * Called when a chat message is sent.
 * Notifies the other party.
 */
const notifyNewMessage = (recipientId, requestId, title, senderName) =>
  createNotification(
    recipientId,
    'new_message',
    'New Message',
    `${senderName} sent you a message on "${title}".`,
    { requestId }
  );

/**
 * Called after a customer submits a review.
 * Notifies the provider.
 */
const notifyReviewReceived = (providerId, requestId, title, rating) =>
  createNotification(
    providerId,
    'review_received',
    'Review Received',
    `You received a ${rating}-star review for "${title}".`,
    { requestId }
  );

module.exports = {
  createNotification,
  notifyRequestCreated,
  notifyRequestMatched,
  notifyRequestScheduled,
  notifyJobInProgress,
  notifyJobCompleted,
  notifyRequestCancelled,
  notifyNewMessage,
  notifyReviewReceived,
};
