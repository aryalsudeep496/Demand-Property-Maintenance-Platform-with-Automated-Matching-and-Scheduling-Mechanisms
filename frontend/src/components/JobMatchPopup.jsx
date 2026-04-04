import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

const AUTO_DISMISS_SECS = 30;

const playBeep = () => {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    // Two-tone alert: short high beep followed by a lower one
    osc.type = 'sine';
    osc.frequency.setValueAtTime(960, ctx.currentTime);
    osc.frequency.setValueAtTime(720, ctx.currentTime + 0.18);

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.45, ctx.currentTime + 0.02);
    gain.gain.setValueAtTime(0.45, ctx.currentTime + 0.16);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.36);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch (_) {
    // AudioContext unavailable in some environments — silently skip
  }
};

const JobMatchPopup = () => {
  const { user }        = useAuth();
  const { socket }      = useSocket();
  const navigate        = useNavigate();

  const [popup,     setPopup]     = useState(null);   // { requestId, title, customerName }
  const [countdown, setCountdown] = useState(AUTO_DISMISS_SECS);
  const timerRef    = useRef(null);
  const countRef    = useRef(null);

  const dismiss = () => {
    setPopup(null);
    clearTimeout(timerRef.current);
    clearInterval(countRef.current);
  };

  const handleAccept = () => {
    const id = popup?.requestId;
    dismiss();
    if (id) navigate(`/provider/requests/${id}`);
  };

  const handleIgnore = () => dismiss();

  useEffect(() => {
    if (!socket || user?.role !== 'provider') return;

    const onJobMatched = (data) => {
      if (data.role !== 'provider') return;
      setPopup({ requestId: data.requestId, title: data.title, customerName: data.customerName });
      setCountdown(AUTO_DISMISS_SECS);
      playBeep();

      // auto-dismiss
      clearTimeout(timerRef.current);
      clearInterval(countRef.current);

      timerRef.current = setTimeout(() => dismiss(), AUTO_DISMISS_SECS * 1000);
      countRef.current = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) { clearInterval(countRef.current); return 0; }
          return c - 1;
        });
      }, 1000);
    };

    socket.on('job_matched', onJobMatched);
    return () => {
      socket.off('job_matched', onJobMatched);
      clearTimeout(timerRef.current);
      clearInterval(countRef.current);
    };
  }, [socket, user?.role]); // eslint-disable-line

  if (!popup) return null;

  return (
    <>
      {/* Subtle backdrop */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 900,
        background: 'rgba(0,0,0,0.35)',
        animation: 'fadeInBg 0.2s ease',
      }} />

      {/* Popup card */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 901,
        width: '360px', maxWidth: 'calc(100vw - 32px)',
        background: '#fff', borderRadius: '18px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.28)',
        overflow: 'hidden',
        fontFamily: "'Outfit', sans-serif",
        animation: 'popIn 0.25s cubic-bezier(0.175,0.885,0.32,1.275)',
      }}>

        {/* Header strip */}
        <div style={{
          background: 'linear-gradient(135deg, #1a3c5e 0%, #2563a8 100%)',
          padding: '18px 22px 14px',
          display: 'flex', alignItems: 'flex-start', gap: '12px',
        }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px', flexShrink: 0,
          }}>
            🔔
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.65)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              New Job Matched
            </p>
            <h2 style={{ margin: '3px 0 0', fontSize: '17px', fontWeight: '800', color: '#fff', lineHeight: 1.25 }}>
              {popup.title}
            </h2>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 22px 20px' }}>
          <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#4a5568' }}>
            <strong style={{ color: '#1a2e44' }}>Customer:</strong> {popup.customerName}
          </p>
          <p style={{ margin: '0 0 18px', fontSize: '12px', color: '#8a9bb0' }}>
            A customer has been matched to you. Accept to get started or ignore to skip.
          </p>

          {/* Progress bar */}
          <div style={{
            height: '3px', borderRadius: '2px', background: '#e8ecf0', marginBottom: '16px', overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: '2px', background: '#C17B2A',
              width: `${(countdown / AUTO_DISMISS_SECS) * 100}%`,
              transition: 'width 1s linear',
            }} />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleAccept}
              style={{
                flex: 1, padding: '11px 0',
                background: 'linear-gradient(135deg, #1a3c5e, #2563a8)',
                color: '#fff', border: 'none', borderRadius: '10px',
                fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                fontFamily: "'Outfit', sans-serif",
                boxShadow: '0 4px 12px rgba(26,60,94,0.3)',
              }}
            >
              ✓ Accept Job
            </button>
            <button
              onClick={handleIgnore}
              style={{
                flex: 1, padding: '11px 0',
                background: '#f0f4f8', color: '#4a5568',
                border: '1.5px solid #dde3eb', borderRadius: '10px',
                fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              Ignore ({countdown}s)
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInBg { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.85); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </>
  );
};

export default JobMatchPopup;
