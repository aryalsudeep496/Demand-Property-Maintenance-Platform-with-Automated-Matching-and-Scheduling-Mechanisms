import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * ProtectedRoute
 * Redirects unauthenticated users to login, preserving the intended destination.
 *
 * Usage:
 *   <Route element={<ProtectedRoute />}>
 *     <Route path="/dashboard" element={<Dashboard />} />
 *   </Route>
 */
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

  return children;
};

/**
 * RoleRoute
 * Restricts access to specific roles; redirects to appropriate dashboard or 403.
 *
 * Usage:
 *   <Route element={<RoleRoute roles={['admin']} />}>
 *     <Route path="/admin/dashboard" element={<AdminDashboard />} />
 *   </Route>
 *
 * Props:
 *   - roles : string[]  Allowed roles e.g. ['admin', 'provider']
 *   - children : ReactNode
 */
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
    // Redirect to the user's own dashboard instead of a generic 403
    const roleDashboards = {
      customer: '/dashboard',
      provider: '/provider/dashboard',
      admin:    '/admin/dashboard',
    };
    return <Navigate to={roleDashboards[user?.role] || '/dashboard'} replace />;
  }

  return children;
};

/**
 * PublicOnlyRoute
 * Redirects already-authenticated users away from login/register pages.
 *
 * Usage:
 *   <Route element={<PublicOnlyRoute />}>
 *     <Route path="/auth/login" element={<LoginPage />} />
 *   </Route>
 */
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
