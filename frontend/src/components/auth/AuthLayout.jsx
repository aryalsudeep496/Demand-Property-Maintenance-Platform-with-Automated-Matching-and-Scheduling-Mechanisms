import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

// ─── Theme tokens — match LandingPage exactly ─────────────────────────────────
const themes = {
  light: {
    bg:           '#F5F0E8',
    bgCard:       '#FFFFFF',
    text:         '#1C1A16',
    textSub:      '#5C5647',
    textMuted:    '#9C9080',
    accent:       '#C17B2A',
    accentHover:  '#a86520',
    accentGlow:   'rgba(193,123,42,0.18)',
    accentLight:  '#F0D9B5',
    navy:         '#1E3A5F',
    border:       'rgba(28,26,22,0.1)',
    borderStrong: 'rgba(28,26,22,0.2)',
    navBg:        'rgba(245,240,232,0.88)',
    inputBg:      '#FFFFFF',
    inputBorder:  '#dde3eb',
    shadow:       '0 4px 24px rgba(28,26,22,0.08)',
    shadowCard:   '0 8px 48px rgba(28,26,22,0.10)',
    errorBg:      'rgba(231,76,60,0.07)',
    errorBorder:  'rgba(231,76,60,0.25)',
    infoBg:       '#fdf3e3',
    infoBorder:   'rgba(193,123,42,0.3)',
  },
  dark: {
    bg:           '#0F0E0B',
    bgCard:       '#1C1A14',
    text:         '#F0EBE0',
    textSub:      '#B8AD9E',
    textMuted:    '#6B6357',
    accent:       '#E09640',
    accentHover:  '#c17b2a',
    accentGlow:   'rgba(224,150,64,0.22)',
    accentLight:  'rgba(224,150,64,0.15)',
    navy:         '#4A90D9',
    border:       'rgba(240,235,224,0.08)',
    borderStrong: 'rgba(240,235,224,0.15)',
    navBg:        'rgba(15,14,11,0.88)',
    inputBg:      '#222018',
    inputBorder:  'rgba(240,235,224,0.12)',
    shadow:       '0 4px 24px rgba(0,0,0,0.4)',
    shadowCard:   '0 8px 48px rgba(0,0,0,0.5)',
    errorBg:      'rgba(231,76,60,0.1)',
    errorBorder:  'rgba(231,76,60,0.3)',
    infoBg:       'rgba(224,150,64,0.08)',
    infoBorder:   'rgba(224,150,64,0.25)',
  },
};

const getInitialDark = () => {
  try {
    const s = localStorage.getItem('propmaintain_theme');
    if (s) return s === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch { return false; }
};

const AuthLayout = ({ children, title, subtitle }) => {
  const [dark,     setDark]     = useState(getInitialDark);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const t = dark ? themes.dark : themes.light;

  useEffect(() => {
    localStorage.setItem('propmaintain_theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isLogin    = location.pathname === '/auth/login';
  const isRegister = location.pathname === '/auth/register';

  return (
    <div style={{ minHeight: '100vh', background: t.bg, fontFamily: "'Outfit', sans-serif", transition: 'background 0.35s, color 0.35s' }}>

      {/* ── Global styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,700;0,800;1,700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(22px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin    { to { transform:rotate(360deg); } }

        /* ── Inputs ── */
        .auth-form-input {
          width: 100%; padding: 12px 16px;
          border: 1.5px solid ${t.inputBorder};
          border-radius: 10px;
          font-size: 14px; font-family: 'Outfit', sans-serif;
          color: ${t.text}; background: ${t.inputBg};
          outline: none; box-sizing: border-box;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .auth-form-input:focus {
          border-color: ${t.accent} !important;
          box-shadow: 0 0 0 3.5px ${t.accentGlow};
        }
        .auth-form-input::placeholder { color: ${t.textMuted}; }

        /* ── Labels ── */
        .auth-form-label {
          font-size: 12px; font-weight: 700; color: ${t.textSub};
          display: block; margin-bottom: 6px;
          letter-spacing: 0.4px; text-transform: uppercase;
          font-family: 'Outfit', sans-serif;
        }
        .auth-form-error { margin:5px 0 0; font-size:12px; color:#e74c3c; font-family:'Outfit',sans-serif; }
        .auth-form-hint  { margin:5px 0 0; font-size:12px; color:${t.textMuted}; font-family:'Outfit',sans-serif; }

        /* ── Primary button ── */
        .auth-submit-btn {
          width: 100%; padding: 14px; border-radius: 10px;
          background: ${t.accent}; color: #fff; border: none;
          font-size: 15px; font-weight: 700; letter-spacing: 0.3px;
          font-family: 'Outfit', sans-serif; cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
          margin-bottom: 16px;
          box-shadow: 0 4px 18px ${t.accentGlow};
        }
        .auth-submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px ${t.accentGlow};
          background: ${t.accentHover};
        }
        .auth-submit-btn:active:not(:disabled) { transform: translateY(0); }
        .auth-submit-btn:disabled { background: ${t.textMuted}; cursor: not-allowed; transform: none; box-shadow: none; }

        /* ── Secondary button ── */
        .auth-secondary-btn {
          display: block; width: 100%; padding: 13px;
          border: 2px solid ${t.borderStrong}; border-radius: 10px;
          text-align: center; font-size: 14px; font-weight: 600;
          font-family: 'Outfit', sans-serif; color: ${t.text};
          text-decoration: none; background: transparent; box-sizing: border-box;
          transition: all 0.2s;
        }
        .auth-secondary-btn:hover {
          border-color: ${t.accent}; color: ${t.accent};
          background: ${t.accentLight};
        }

        /* ── Alert boxes ── */
        .auth-error-box {
          background: ${t.errorBg}; border: 1px solid ${t.errorBorder};
          border-radius: 10px; padding: 12px 15px; font-size: 13px;
          color: #e74c3c; margin-bottom: 16px; font-family: 'Outfit', sans-serif;
        }
        .auth-info-box {
          background: ${t.infoBg}; border: 1px solid ${t.infoBorder};
          border-radius: 10px; padding: 12px 15px; font-size: 13px;
          color: ${t.accent}; margin-bottom: 16px; font-family: 'Outfit', sans-serif;
        }

        /* ── Link ── */
        .auth-link { color:${t.accent}; font-weight:600; text-decoration:none; transition:color 0.2s; }
        .auth-link:hover { color:${t.accentHover}; text-decoration:underline; }

        /* ── Divider ── */
        .auth-divider { display:flex; align-items:center; gap:12px; margin:10px 0 16px; }
        .auth-divider-line { flex:1; height:1px; background:${t.border}; }
        .auth-divider-text { font-size:12px; color:${t.textMuted}; white-space:nowrap; font-family:'Outfit',sans-serif; }

        /* ── Checkbox ── */
        .auth-checkbox { accent-color:${t.accent}; cursor:pointer; width:15px; height:15px; }

        /* ── Role cards ── */
        .role-card {
          display:flex; flex-direction:column; gap:5px; padding:16px 14px;
          border:2px solid ${t.border}; border-radius:12px; cursor:pointer;
          transition:all 0.2s; background:${t.bgCard};
        }
        .role-card:hover { border-color:${t.accent}; box-shadow:0 0 0 3px ${t.accentGlow}; }
        .role-card-active { border-color:${t.accent} !important; background:${t.accentLight} !important; box-shadow:0 0 0 3px ${t.accentGlow} !important; }
        .role-label { font-size:13.5px; font-weight:700; color:${t.text}; font-family:'Outfit',sans-serif; }
        .role-sub   { font-size:11px; color:${t.textMuted}; font-family:'Outfit',sans-serif; }

        /* ── Navbar links ── */
        .auth-nav-link { transition: color 0.2s; text-decoration: none; }
        .auth-nav-link:hover { color: ${t.accent} !important; }
        .theme-btn { transition: all 0.3s; }
        .theme-btn:hover { transform: rotate(20deg) scale(1.1); }
      `}</style>

      {/* ══════════════════════════════════════════
          NAVBAR — same visual language as LandingPage
      ══════════════════════════════════════════ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: '68px', padding: '0 48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? t.navBg : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? `1px solid ${t.border}` : 'none',
        transition: 'all 0.4s',
      }}>

        {/* Logo */}
        <Link to="/home" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{ width: '36px', height: '36px', background: `linear-gradient(135deg, ${t.accent}, ${t.navy})`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            🏠
          </div>
          <span style={{ fontSize: '20px', fontWeight: '800', color: t.text, letterSpacing: '-0.5px' }}>
            Prop<span style={{ color: t.accent }}>Maintain</span>
          </span>
        </Link>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

          {/* Theme toggle */}
          <button
            className="theme-btn"
            onClick={() => setDark(d => !d)}
            title="Toggle dark/light mode"
            style={{
              width: '40px', height: '40px', borderRadius: '50%',
              border: `1px solid ${t.border}`, background: t.bgCard,
              cursor: 'pointer', fontSize: '18px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: t.shadow,
            }}
          >
            {dark ? '☀️' : '🌙'}
          </button>

          {/* Sign In — shown on register page */}
          {!isLogin && (
            <Link
              to="/auth/login"
              className="auth-nav-link"
              style={{
                padding: '9px 20px', borderRadius: '8px',
                border: `1px solid ${t.borderStrong}`,
                color: t.text, fontSize: '14px', fontWeight: '500',
              }}
            >
              Sign In
            </Link>
          )}

          {/* Get Started — shown on login page */}
          {!isRegister && (
            <Link
              to="/auth/register"
              style={{
                padding: '9px 20px', borderRadius: '8px',
                background: t.accent, color: '#fff',
                textDecoration: 'none', fontSize: '14px', fontWeight: '600',
                boxShadow: `0 4px 16px ${t.accentGlow}`,
                transition: 'all 0.25s',
              }}
            >
              Get Started
            </Link>
          )}
        </div>
      </nav>

      {/* ══════════════════════════════════════════
          PAGE BODY — centered card
      ══════════════════════════════════════════ */}
      <div style={{
        minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '100px 24px 48px',
      }}>
        <div style={{ width: '100%', maxWidth: '480px', animation: 'fadeUp 0.5s ease both' }}>

          {/* Card */}
          <div style={{
            background: t.bgCard, borderRadius: '20px',
            padding: '40px 44px',
            boxShadow: t.shadowCard,
            border: `1px solid ${t.border}`,
          }}>

            {/* Header */}
            {(title || subtitle) && (
              <div style={{ marginBottom: '28px' }}>
                {title && (
                  <h1 style={{ fontSize: '26px', fontWeight: '800', color: t.text, margin: '0 0 8px', letterSpacing: '-0.4px', lineHeight: 1.2, fontFamily: "'Outfit', sans-serif" }}>
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p style={{ fontSize: '14px', color: t.textSub, margin: 0, lineHeight: 1.6 }}>
                    {subtitle}
                  </p>
                )}
              </div>
            )}

            {children}
          </div>

          {/* Footer */}
          <p style={{ textAlign: 'center', fontSize: '12px', color: t.textMuted, marginTop: '20px' }}>
            © {new Date().getFullYear()} PropMaintain ·{' '}
            <Link to="/home" className="auth-link" style={{ fontSize: '12px' }}>Back to home</Link>
          </p>

        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
