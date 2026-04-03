import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// ─── Back-button guard hook ────────────────────────────────────────────────────
// Intercepts browser back/forward navigation and shows a logout confirmation.
const useBackButtonGuard = () => {
  const [showModal, setShowModal] = useState(false);
  const { logout }  = useAuth();
  const navigate    = useNavigate();

  useEffect(() => {
    // Push an extra history entry so the first "back" press hits us, not the
    // previous page.
    window.history.pushState(null, '', window.location.href);

    const handlePopState = () => {
      // Re-push so the user stays on this page while the modal is open.
      window.history.pushState(null, '', window.location.href);
      setShowModal(true);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const confirmLogout = async () => {
    setShowModal(false);
    await logout();
    navigate('/auth/login', { replace: true });
  };

  const cancelLogout = () => {
    setShowModal(false);
  };

  return { showModal, confirmLogout, cancelLogout };
};

// ─── Logout confirmation modal ─────────────────────────────────────────────────
const LogoutConfirmModal = ({ onConfirm, onCancel }) => (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 9999,
    background: 'rgba(13,33,55,0.55)',
    backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Outfit', sans-serif",
    animation: 'fadeIn 0.18s ease',
  }}>
    <style>{`
      @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
      @keyframes slideUp { from { transform: translateY(24px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    `}</style>

    <div style={{
      background: '#fff', borderRadius: '16px', padding: '36px 32px',
      maxWidth: '400px', width: '90%', textAlign: 'center',
      boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
      animation: 'slideUp 0.22s ease',
    }}>
      {/* Icon */}
      <div style={{
        width: '60px', height: '60px', borderRadius: '50%',
        background: '#fff3cd', display: 'flex', alignItems: 'center',
        justifyContent: 'center', margin: '0 auto 20px', fontSize: '28px',
      }}>
        ⚠️
      </div>

      <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0d2137', margin: '0 0 10px' }}>
        Leave this page?
      </h2>
      <p style={{ fontSize: '14px', color: '#6b7c93', margin: '0 0 28px', lineHeight: '1.6' }}>
        Going back will <strong style={{ color: '#e74c3c' }}>log you out</strong> of your account.
        Any unsaved changes will be lost.
      </p>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={onCancel}
          style={{
            flex: 1, padding: '12px', borderRadius: '10px',
            border: '2px solid #e8ecf0', background: '#f8fafc',
            fontSize: '14px', fontWeight: '700', color: '#4a5568',
            cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
            transition: 'all 0.15s',
          }}
          onMouseOver={e => e.currentTarget.style.borderColor = '#1a3c5e'}
          onMouseOut={e => e.currentTarget.style.borderColor = '#e8ecf0'}
        >
          Stay on page
        </button>
        <button
          onClick={onConfirm}
          style={{
            flex: 1, padding: '12px', borderRadius: '10px',
            border: 'none', background: '#e74c3c',
            fontSize: '14px', fontWeight: '700', color: '#fff',
            cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
            boxShadow: '0 4px 14px rgba(231,76,60,0.3)',
            transition: 'background 0.15s',
          }}
          onMouseOver={e => e.currentTarget.style.background = '#c0392b'}
          onMouseOut={e => e.currentTarget.style.background = '#e74c3c'}
        >
          Yes, Log Out
        </button>
      </div>
    </div>
  </div>
);

// ─── Inner guard — only rendered when user IS authenticated ───────────────────
// Keeps the hook inside a component that always renders (no conditional hook
// calls), so React rules of hooks are satisfied.
const AuthenticatedGuard = ({ children }) => {
  const { showModal, confirmLogout, cancelLogout } = useBackButtonGuard();

  return (
    <>
      {children}
      {showModal && (
        <LogoutConfirmModal onConfirm={confirmLogout} onCancel={cancelLogout} />
      )}
    </>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// ProtectedRoute — redirects unauthenticated users to login
// ══════════════════════════════════════════════════════════════════════════════
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullPageSpinner />;

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/auth/login"
        state={{ from: location, message: 'Please sign in to continue.' }}
        replace
      />
    );
  }

  return <AuthenticatedGuard>{children}</AuthenticatedGuard>;
};

// ══════════════════════════════════════════════════════════════════════════════
// RoleRoute — restricts access to specific roles
// ══════════════════════════════════════════════════════════════════════════════
export const RoleRoute = ({ roles, children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullPageSpinner />;

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/auth/login"
        state={{ from: location, message: 'Please sign in to continue.' }}
        replace
      />
    );
  }

  if (!roles.includes(user?.role)) {
    const roleDashboards = {
      customer: '/dashboard',
      provider: '/provider/dashboard',
      admin:    '/admin/dashboard',
    };
    return <Navigate to={roleDashboards[user?.role] || '/dashboard'} replace />;
  }

  return children;
};

// ══════════════════════════════════════════════════════════════════════════════
// PublicOnlyRoute — redirects already-authenticated users to their dashboard
// ══════════════════════════════════════════════════════════════════════════════
export const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <FullPageSpinner />;

  if (isAuthenticated) {
    const roleDashboards = {
      customer: '/dashboard',
      provider: '/provider/dashboard',
      admin:    '/admin/dashboard',
    };
    return <Navigate to={roleDashboards[user?.role] || '/dashboard'} replace />;
  }

  return children;
};

// ─── Full-page loading spinner ─────────────────────────────────────────────────
const FullPageSpinner = () => (
  <div style={styles.spinnerPage} role="status" aria-label="Loading">
    <div style={styles.spinner} />
    <p style={styles.spinnerText}>Loading…</p>
  </div>
);

const styles = {
  spinnerPage: {
    minHeight:      '100vh',
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'center',
    background:     '#f0f4f8',
    gap:            '16px',
  },
  spinner: {
    width:        '44px',
    height:       '44px',
    border:       '4px solid #dde3eb',
    borderTop:    '4px solid #1a3c5e',
    borderRadius: '50%',
    animation:    'spin 0.8s linear infinite',
  },
  spinnerText: {
    fontSize:   '14px',
    color:      '#8a9bb0',
    fontFamily: "'DM Sans', sans-serif",
    margin:     0,
  },
};

export { FullPageSpinner };
