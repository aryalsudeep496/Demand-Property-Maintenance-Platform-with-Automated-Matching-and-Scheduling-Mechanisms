import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// ── Generates a two-tone notification chime using Web Audio API ───────────────
export const playNotificationSound = () => {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const now  = ctx.currentTime;

    const playTone = (freq, start, duration) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);
      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(0.25, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration);
      osc.start(now + start);
      osc.stop(now + start + duration);
    };

    playTone(880, 0,    0.18);   // high note
    playTone(1100, 0.2, 0.22);   // higher note
  } catch {
    // Silently ignore if AudioContext not available
  }
};

// ── Single toast ──────────────────────────────────────────────────────────────
const NotificationToast = ({ id, icon, title, message, requestId, role, onDismiss }) => {
  const navigate   = useNavigate();
  const timerRef   = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => onDismiss(id), 8000);
    return () => clearTimeout(timerRef.current);
  }, [id, onDismiss]);

  const handleClick = () => {
    onDismiss(id);
    if (requestId) {
      const base = role === 'admin'
        ? '/admin/requests'
        : role === 'provider'
        ? '/provider/requests'
        : '/customer/requests';
      navigate(`${base}/${requestId}`);
    }
  };

  const accentColor = role === 'provider' ? '#27ae60' : '#C17B2A';

  return (
    <div
      onClick={handleClick}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '12px',
        padding: '14px 16px',
        background: '#fff',
        borderRadius: '12px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
        borderLeft: `4px solid ${accentColor}`,
        cursor: requestId ? 'pointer' : 'default',
        fontFamily: "'Outfit', sans-serif",
        minWidth: '300px', maxWidth: '360px',
        animation: 'slideInRight 0.3s ease',
        position: 'relative',
      }}
    >
      <span style={{ fontSize: '24px', flexShrink: 0, marginTop: '1px' }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: '800', color: '#0d2137', marginBottom: '3px' }}>
          {title}
        </div>
        <div style={{ fontSize: '12px', color: '#6b7c93', lineHeight: 1.4, wordBreak: 'break-word' }}>
          {message}
        </div>
        {requestId && (
          <div style={{ fontSize: '11px', color: accentColor, fontWeight: '700', marginTop: '6px' }}>
            Click to view →
          </div>
        )}
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDismiss(id); }}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#8a9bb0', fontSize: '16px', lineHeight: 1,
          padding: '0 0 0 4px', flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  );
};

// ── Toast container — renders all active toasts ───────────────────────────────
export const ToastContainer = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;
  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(120%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
      <div style={{
        position: 'fixed', top: '76px', right: '20px',
        zIndex: 10000,
        display: 'flex', flexDirection: 'column', gap: '10px',
        pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{ pointerEvents: 'all' }}>
            <NotificationToast {...t} onDismiss={onDismiss} />
          </div>
        ))}
      </div>
    </>
  );
};

export default NotificationToast;
