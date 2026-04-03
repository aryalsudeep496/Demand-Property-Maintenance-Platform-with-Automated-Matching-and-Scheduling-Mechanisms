import React from 'react';
import { STATUS_CONFIG, URGENCY_CONFIG, CATEGORIES } from '../../utils/requestsAPI';

// ─── Status Badge ──────────────────────────────────────────────────────────────
// Shows the current status of a request with colour coding
// Usage: <StatusBadge status="in_progress" />
export const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || {
    label: status,
    bg:    '#e9ecef',
    color: '#495057',
    icon:  '•',
  };

  return (
    <span style={{
      display:      'inline-flex',
      alignItems:   'center',
      gap:          '4px',
      padding:      '3px 10px',
      borderRadius: '20px',
      background:   cfg.bg,
      color:        cfg.color,
      fontSize:     '12px',
      fontWeight:   '600',
      fontFamily:   "'Outfit', sans-serif",
      whiteSpace:   'nowrap',
    }}>
      {cfg.icon} {cfg.label}
    </span>
  );
};

// ─── Urgency Badge ─────────────────────────────────────────────────────────────
// Shows urgency level of a request
// Usage: <UrgencyBadge urgency="high" />
export const UrgencyBadge = ({ urgency }) => {
  const cfg = URGENCY_CONFIG[urgency] || {
    label: urgency,
    bg:    '#e9ecef',
    color: '#495057',
  };

  return (
    <span style={{
      display:      'inline-block',
      padding:      '3px 10px',
      borderRadius: '20px',
      background:   cfg.bg,
      color:        cfg.color,
      fontSize:     '12px',
      fontWeight:   '600',
      fontFamily:   "'Outfit', sans-serif",
      whiteSpace:   'nowrap',
    }}>
      {cfg.label}
    </span>
  );
};

// ─── Category Badge ────────────────────────────────────────────────────────────
// Shows service category with icon
// Usage: <CategoryBadge category="home_repair" />
export const CategoryBadge = ({ category }) => {
  const cfg = CATEGORIES[category] || {
    label: category,
    icon:  '🔨',
    color: '#1a3c5e',
  };

  return (
    <span style={{
      display:      'inline-flex',
      alignItems:   'center',
      gap:          '4px',
      padding:      '3px 10px',
      borderRadius: '20px',
      background:   '#f0f4f8',
      color:        cfg.color,
      fontSize:     '12px',
      fontWeight:   '600',
      fontFamily:   "'Outfit', sans-serif",
      whiteSpace:   'nowrap',
    }}>
      {cfg.icon} {cfg.label}
    </span>
  );
};

// ─── Star Rating display ───────────────────────────────────────────────────────
// Shows filled/empty stars
// Usage: <StarRating rating={4} />
export const StarRating = ({ rating, max = 5, size = 16 }) => {
  return (
    <span style={{ display: 'inline-flex', gap: '2px' }}>
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          style={{
            fontSize: `${size}px`,
            color:    i < rating ? '#f39c12' : '#dde3eb',
            lineHeight: 1,
          }}
        >
          ★
        </span>
      ))}
    </span>
  );
};

export default StatusBadge;
