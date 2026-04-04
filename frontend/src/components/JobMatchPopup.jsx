import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { requestsAPI } from '../utils/requestsAPI';

const OFFER_SECS = 120; // 2 minutes to match the server auto-schedule timer

const playBeep = () => {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(960, ctx.currentTime);
    osc.frequency.setValueAtTime(720, ctx.currentTime + 0.18);

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.45, ctx.currentTime + 0.02);
    gain.gain.setValueAtTime(0.45, ctx.currentTime + 0.16);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.36);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch (_) {}
};

const catIcon = (c) =>
  ({ home_repair: '🔧', home_upgrade: '🏡', tech_digital: '💻' })[c] || '🛠️';

const JobMatchPopup = () => {
  const { user }   = useAuth();
  const { socket } = useSocket();
  const navigate   = useNavigate();

  const [popup,     setPopup]     = useState(null);    // { requestId, title, customerName, category, city }
  const [countdown, setCountdown] = useState(OFFER_SECS);
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);

  const autoTimer  = useRef(null);
  const countTimer = useRef(null);

  const clearTimers = () => {
    clearTimeout(autoTimer.current);
    clearInterval(countTimer.current);
  };

  const dismissSilent = () => {
    setPopup(null);
    setAccepting(false);
    setDeclining(false);
    clearTimers();
  };

  const handleAccept = async () => {
    if (!popup || accepting) return;
    setAccepting(true);
    clearTimers();
    try {
      await requestsAPI.acceptJob(popup.requestId);
      const id = popup.requestId;
      dismissSilent();
      navigate(`/provider/requests/${id}`, {
        state: { successMsg: 'Job accepted! You can now start work.' },
      });
    } catch (err) {
      // Job may have been taken by another provider
      const msg = err.response?.data?.message || '';
      dismissSilent();
      if (msg) {
        // Brief toast — just dismiss, no UI for now; provider can browse the list
        console.warn('Could not accept job:', msg);
      }
    }
  };

  const handleIgnore = async () => {
    if (!popup || declining) return;
    setDeclining(true);
    clearTimers();
    const id = popup.requestId;
    dismissSilent();
    try {
      await requestsAPI.declineOffer(id); // best-effort — records rejection
    } catch (_) {}
  };

  useEffect(() => {
    if (!socket || user?.role !== 'provider') return;

    const onNewJob = (data) => {
      if (data.role !== 'provider') return;
      clearTimers();

      setPopup({
        requestId:    data.requestId,
        title:        data.title,
        customerName: data.customerName,
        category:     data.category,
        city:         data.city,
      });
      setCountdown(OFFER_SECS);
      setAccepting(false);
      setDeclining(false);
      playBeep();

      autoTimer.current  = setTimeout(() => dismissSilent(), OFFER_SECS * 1000);
      countTimer.current = setInterval(() =>
        setCountdown(c => {
          if (c <= 1) { clearInterval(countTimer.current); return 0; }
          return c - 1;
        })
      , 1000);
    };

    socket.on('new_job_available', onNewJob);
    return () => {
      socket.off('new_job_available', onNewJob);
      clearTimers();
    };
  }, [socket, user?.role]); // eslint-disable-line

  if (!popup) return null;

  const pct = (countdown / OFFER_SECS) * 100;

  return (
    <>
      {/* Backdrop */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 900,
        background: 'rgba(0,0,0,0.35)',
        animation: 'fadeInBg 0.2s ease',
      }} />

      {/* Card */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 901,
        width: '380px', maxWidth: 'calc(100vw - 32px)',
        background: '#fff', borderRadius: '18px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.28)',
        overflow: 'hidden',
        fontFamily: "'Outfit', sans-serif",
        animation: 'popIn 0.25s cubic-bezier(0.175,0.885,0.32,1.275)',
      }}>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1a3c5e 0%, #2563a8 100%)',
          padding: '18px 22px 14px',
          display: 'flex', alignItems: 'flex-start', gap: '12px',
        }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px', flexShrink: 0,
          }}>
            {catIcon(popup.category)}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.65)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              New Job Available
            </p>
            <h2 style={{ margin: '3px 0 0', fontSize: '17px', fontWeight: '800', color: '#fff', lineHeight: 1.25 }}>
              {popup.title}
            </h2>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 22px 20px' }}>
          <p style={{ margin: '0 0 2px', fontSize: '13px', color: '#4a5568' }}>
            <strong style={{ color: '#1a2e44' }}>Customer:</strong> {popup.customerName}
          </p>
          {popup.city && (
            <p style={{ margin: '0 0 2px', fontSize: '13px', color: '#4a5568' }}>
              <strong style={{ color: '#1a2e44' }}>Location:</strong> {popup.city}
            </p>
          )}
          <p style={{ margin: '6px 0 14px', fontSize: '12px', color: '#8a9bb0' }}>
            Accept to take this job, or ignore to pass on it.
          </p>

          {/* Countdown bar */}
          <div style={{ height: '4px', borderRadius: '2px', background: '#e8ecf0', marginBottom: '4px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: '2px',
              background: pct > 33 ? '#C17B2A' : '#e74c3c',
              width: `${pct}%`,
              transition: 'width 1s linear',
            }} />
          </div>
          <p style={{ fontSize: '11px', color: '#8a9bb0', margin: '0 0 16px', textAlign: 'right' }}>
            Expires in {countdown}s
          </p>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleAccept}
              disabled={accepting || declining}
              style={{
                flex: 1, padding: '11px 0',
                background: (accepting || declining) ? '#8a9bb0' : 'linear-gradient(135deg, #27ae60, #1e8449)',
                color: '#fff', border: 'none', borderRadius: '10px',
                fontSize: '14px', fontWeight: '700',
                cursor: (accepting || declining) ? 'not-allowed' : 'pointer',
                fontFamily: "'Outfit', sans-serif",
                boxShadow: (accepting || declining) ? 'none' : '0 4px 12px rgba(39,174,96,0.3)',
              }}
            >
              {accepting ? 'Accepting…' : '✓ Accept Job'}
            </button>
            <button
              onClick={handleIgnore}
              disabled={accepting || declining}
              style={{
                flex: 1, padding: '11px 0',
                background: '#f0f4f8', color: '#4a5568',
                border: '1.5px solid #dde3eb', borderRadius: '10px',
                fontSize: '14px', fontWeight: '700',
                cursor: (accepting || declining) ? 'not-allowed' : 'pointer',
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              {declining ? 'Passing…' : 'Ignore'}
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
