import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider }    from './context/AuthContext';
import { SocketProvider }  from './context/SocketContext';
import {
  ProtectedRoute,
  RoleRoute,
  PublicOnlyRoute,
} from './components/auth/ProtectedRoute';

// Auth pages
import ResendVerificationPage from './pages/auth/ResendVerificationPage';
import RegisterPage           from './pages/auth/RegisterPage';
import LoginPage              from './pages/auth/LoginPage';
import VerifyEmailPage        from './pages/auth/VerifyEmailPage';
import ForgotPasswordPage     from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage      from './pages/auth/ResetPasswordPage';
import ChangePasswordPage     from './pages/auth/ChangePasswordPage';
import LandingPage            from './pages/LandingPage';

// Dashboard pages
import CustomerDashboard from './pages/dashboard/CustomerDashboard';
import ProviderDashboard from './pages/dashboard/ProviderDashboard';

// Customer — Service Request pages
import NewRequestPage       from './pages/customer/NewRequestPage';
import CustomerRequestsPage from './pages/customer/CustomerRequestsPage';
import RequestDetailPage    from './pages/customer/RequestDetailPage';

// Provider pages
import ProviderJobsPage    from './pages/provider/ProviderJobsPage';
import AvailableJobsPage   from './pages/provider/AvailableJobsPage';
import ProviderProfilePage from './pages/provider/ProviderProfilePage';

// Admin pages
import AdminDashboard    from './pages/admin/AdminDashboard';
import AdminUsersPage    from './pages/admin/AdminUsersPage';
import AdminRequestsPage from './pages/admin/AdminRequestsPage';

// Shared pages
import NotificationsPage from './pages/shared/NotificationsPage';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
      <SocketProvider>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Outfit', sans-serif; background: #f0f4f8; }
          @keyframes spin { to { transform: rotate(360deg); } }
          input:focus { outline: none; border-color: #1a3c5e !important; box-shadow: 0 0 0 3px rgba(26,60,94,0.12); }
          a:focus-visible, button:focus-visible { outline: 2px solid #1a3c5e; outline-offset: 2px; }
        `}</style>

        <Routes>

          {/* ══════════════════════════════════════════════
              PUBLIC AUTH ROUTES
          ══════════════════════════════════════════════ */}
          <Route path="/auth/register" element={
            <PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>
          } />
          <Route path="/auth/login" element={
            <PublicOnlyRoute><LoginPage /></PublicOnlyRoute>
          } />
          <Route path="/auth/forgot-password" element={
            <PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>
          } />
          <Route path="/auth/reset-password/:token" element={
            <PublicOnlyRoute><ResetPasswordPage /></PublicOnlyRoute>
          } />

          {/* ── Email verification ── */}
          <Route path="/auth/verify-email/:token"  element={<VerifyEmailPage />} />
          <Route path="/auth/resend-verification"  element={<ResendVerificationPage />} />

          {/* ══════════════════════════════════════════════
              CUSTOMER ROUTES
          ══════════════════════════════════════════════ */}

          {/* Customer dashboard */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <RoleRoute roles={['customer']}>
                <CustomerDashboard />
              </RoleRoute>
            </ProtectedRoute>
          } />

          {/* New service request form */}
          <Route path="/customer/request/new" element={
            <ProtectedRoute>
              <RoleRoute roles={['customer']}>
                <NewRequestPage />
              </RoleRoute>
            </ProtectedRoute>
          } />

          {/* All my requests list */}
          <Route path="/customer/requests" element={
            <ProtectedRoute>
              <RoleRoute roles={['customer']}>
                <CustomerRequestsPage />
              </RoleRoute>
            </ProtectedRoute>
          } />

          {/* Single request detail (customer view) */}
          <Route path="/customer/requests/:id" element={
            <ProtectedRoute>
              <RequestDetailPage />
            </ProtectedRoute>
          } />

          {/* Customer notifications */}
          <Route path="/customer/notifications" element={
            <ProtectedRoute>
              <RoleRoute roles={['customer']}>
                <NotificationsPage />
              </RoleRoute>
            </ProtectedRoute>
          } />

          {/* ══════════════════════════════════════════════
              PROVIDER ROUTES
          ══════════════════════════════════════════════ */}

          {/* Provider dashboard */}
          <Route path="/provider/dashboard" element={
            <ProtectedRoute>
              <RoleRoute roles={['provider']}>
                <ProviderDashboard />
              </RoleRoute>
            </ProtectedRoute>
          } />

          {/* Provider job detail */}
          <Route path="/provider/requests/:id" element={
            <ProtectedRoute>
              <RoleRoute roles={['provider']}>
                <RequestDetailPage />
              </RoleRoute>
            </ProtectedRoute>
          } />

          {/* All assigned jobs */}
          <Route path="/provider/requests" element={
            <ProtectedRoute>
              <RoleRoute roles={['provider']}>
                <ProviderJobsPage />
              </RoleRoute>
            </ProtectedRoute>
          } />

          {/* Browse open jobs */}
          <Route path="/provider/available" element={
            <ProtectedRoute>
              <RoleRoute roles={['provider']}>
                <AvailableJobsPage />
              </RoleRoute>
            </ProtectedRoute>
          } />

          {/* Provider profile */}
          <Route path="/provider/profile" element={
            <ProtectedRoute>
              <RoleRoute roles={['provider']}>
                <ProviderProfilePage />
              </RoleRoute>
            </ProtectedRoute>
          } />

          {/* Provider notifications */}
          <Route path="/provider/notifications" element={
            <ProtectedRoute>
              <RoleRoute roles={['provider']}>
                <NotificationsPage />
              </RoleRoute>
            </ProtectedRoute>
          } />

          {/* ══════════════════════════════════════════════
              ADMIN ROUTES
          ══════════════════════════════════════════════ */}

          <Route path="/admin/requests/:id" element={
            <ProtectedRoute>
              <RoleRoute roles={['admin']}>
                <RequestDetailPage />
              </RoleRoute>
            </ProtectedRoute>
          } />

          <Route path="/admin/dashboard" element={
            <ProtectedRoute>
              <RoleRoute roles={['admin']}>
                <AdminDashboard />
              </RoleRoute>
            </ProtectedRoute>
          } />

          <Route path="/admin/users" element={
            <ProtectedRoute>
              <RoleRoute roles={['admin']}>
                <AdminUsersPage />
              </RoleRoute>
            </ProtectedRoute>
          } />

          <Route path="/admin/requests" element={
            <ProtectedRoute>
              <RoleRoute roles={['admin']}>
                <AdminRequestsPage />
              </RoleRoute>
            </ProtectedRoute>
          } />

          {/* ══════════════════════════════════════════════
              SHARED PROTECTED ROUTES
          ══════════════════════════════════════════════ */}
          <Route path="/account/change-password" element={
            <ProtectedRoute>
              <ChangePasswordPage />
            </ProtectedRoute>
          } />

          {/* ── Landing page ── */}
          <Route path="/home" element={<LandingPage />} />

          {/* ── Default redirects ── */}
          <Route path="/"  element={<Navigate to="/home"       replace />} />
          <Route path="*"  element={<Navigate to="/auth/login" replace />} />

        </Routes>
      </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
