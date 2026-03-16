import React from 'react';
import { Link } from 'react-router-dom';

/**
 * AuthLayout
 * Wraps all auth pages in a consistent split-panel layout:
 *  - Left: branding panel (hidden on small screens)
 *  - Right: form content
 */
const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div style={styles.page}>
      {/* ── Left branding panel ── */}
      <div style={styles.brandPanel}>
        <div style={styles.brandInner}>
          <Link to="/" style={styles.logoLink}>
            <div style={styles.logoIcon}>🏠</div>
            <span style={styles.logoText}>PropMaintain</span>
          </Link>

          <div style={styles.tagline}>
            <h2 style={styles.taglineHeading}>
              On-demand property<br />maintenance, simplified.
            </h2>
            <p style={styles.taglineBody}>
              Connect with verified professionals for home repair,
              upgrades, and tech support — instantly or scheduled.
            </p>
          </div>

          {/* Decorative feature pills */}
          <div style={styles.featureList}>
            {[
              { icon: '⚡', text: 'Real-time matching' },
              { icon: '📅', text: 'Smart scheduling' },
              { icon: '🔒', text: 'Secure & verified' },
              { icon: '💬', text: 'In-app messaging' },
            ].map(({ icon, text }) => (
              <div key={text} style={styles.featurePill}>
                <span>{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative blobs */}
        <div style={{ ...styles.blob, ...styles.blob1 }} />
        <div style={{ ...styles.blob, ...styles.blob2 }} />
      </div>

      {/* ── Right form panel ── */}
      <div style={styles.formPanel}>
        <div style={styles.formInner}>
          {/* Mobile logo */}
          <div style={styles.mobileLogo}>
            <Link to="/" style={styles.mobileLogoLink}>
              <span style={styles.mobileLogoIcon}>🏠</span>
              <span style={styles.mobileLogoText}>PropMaintain</span>
            </Link>
          </div>

          {(title || subtitle) && (
            <div style={styles.formHeader}>
              {title    && <h1 style={styles.formTitle}>{title}</h1>}
              {subtitle && <p  style={styles.formSubtitle}>{subtitle}</p>}
            </div>
          )}

          {children}
        </div>
      </div>
    </div>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  page: {
    display:       'flex',
    minHeight:     '100vh',
    fontFamily:    "'DM Sans', sans-serif",
    background:    '#f0f4f8',
  },

  // ── Brand panel ────────────────────────────────────────────────────────────
  brandPanel: {
    flex:       '0 0 42%',
    background: 'linear-gradient(145deg, #0d2137 0%, #1a3c5e 50%, #1e5080 100%)',
    position:   'relative',
    overflow:   'hidden',
    display:    'flex',
    alignItems: 'center',
    padding:    '48px',

    // Hide on mobile
    '@media (max-width: 768px)': { display: 'none' },
  },
  brandInner: {
    position: 'relative',
    zIndex:   2,
    width:    '100%',
  },
  logoLink: {
    display:        'flex',
    alignItems:     'center',
    gap:            '10px',
    textDecoration: 'none',
    marginBottom:   '64px',
  },
  logoIcon: {
    fontSize:     '28px',
    background:   'rgba(255,255,255,0.15)',
    borderRadius: '10px',
    padding:      '8px',
    lineHeight:   1,
  },
  logoText: {
    fontSize:   '22px',
    fontWeight: '700',
    color:      '#ffffff',
    letterSpacing: '-0.3px',
  },
  tagline: {
    marginBottom: '48px',
  },
  taglineHeading: {
    fontSize:     '32px',
    fontWeight:   '700',
    color:        '#ffffff',
    lineHeight:   1.25,
    margin:       '0 0 16px',
    letterSpacing: '-0.5px',
  },
  taglineBody: {
    fontSize:   '15px',
    color:      'rgba(255,255,255,0.7)',
    lineHeight: 1.6,
    margin:     0,
  },
  featureList: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '12px',
  },
  featurePill: {
    display:      'flex',
    alignItems:   'center',
    gap:          '10px',
    background:   'rgba(255,255,255,0.1)',
    borderRadius: '8px',
    padding:      '10px 14px',
    fontSize:     '14px',
    color:        'rgba(255,255,255,0.9)',
    backdropFilter: 'blur(4px)',
    border:       '1px solid rgba(255,255,255,0.12)',
  },

  // Decorative blobs
  blob: {
    position:     'absolute',
    borderRadius: '50%',
    filter:       'blur(80px)',
    zIndex:       1,
    opacity:      0.25,
  },
  blob1: {
    width:      '360px',
    height:     '360px',
    background: '#e67e22',
    top:        '-80px',
    right:      '-80px',
  },
  blob2: {
    width:      '280px',
    height:     '280px',
    background: '#3498db',
    bottom:     '-60px',
    left:       '-60px',
  },

  // ── Form panel ─────────────────────────────────────────────────────────────
  formPanel: {
    flex:           1,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    padding:        '32px 24px',
    overflowY:      'auto',
  },
  formInner: {
    width:     '100%',
    maxWidth:  '460px',
  },

  // Mobile logo (only visible when brand panel hidden)
  mobileLogo: {
    display:      'none',
    marginBottom: '24px',
    // Show on mobile via media query (not supported in inline styles — handled in CSS)
  },
  mobileLogoLink: {
    display:        'flex',
    alignItems:     'center',
    gap:            '8px',
    textDecoration: 'none',
  },
  mobileLogoIcon: {
    fontSize: '24px',
  },
  mobileLogoText: {
    fontSize:   '20px',
    fontWeight: '700',
    color:      '#1a3c5e',
  },

  formHeader: {
    marginBottom: '28px',
  },
  formTitle: {
    fontSize:      '26px',
    fontWeight:    '700',
    color:         '#0d2137',
    margin:        '0 0 8px',
    letterSpacing: '-0.4px',
  },
  formSubtitle: {
    fontSize:   '14px',
    color:      '#6b7c93',
    margin:     0,
    lineHeight: 1.5,
  },
};

export default AuthLayout;
