import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useAuth } from '../../context/AuthContext';
import { loginSchema } from '../../utils/validationSchemas';
import AuthLayout from '../../components/auth/AuthLayout';

// ─── Inline SVG icons ─────────────────────────────────────────────────────────
const MailIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

const LockIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const EyeOn = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOff = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const LoginPage = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login } = useAuth();

  const [serverError,     setServerError]     = useState('');
  const [infoMsg,         setInfoMsg]         = useState(location.state?.message || '');
  const [isSubmitting,    setIsSubmitting]    = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [showPassword,    setShowPassword]    = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data) => {
    setServerError('');
    setInfoMsg('');
    setUnverifiedEmail('');
    setIsSubmitting(true);

    const result = await login(data);
    setIsSubmitting(false);

    if (result.success) {
      const from = location.state?.from?.pathname;
      const roleDashboards = {
        customer: '/dashboard',
        provider: '/provider/dashboard',
        admin:    '/admin/dashboard',
      };
      navigate(from || roleDashboards[result.user.role] || '/dashboard', { replace: true });
    } else {
      if (result.code === 'EMAIL_NOT_VERIFIED') {
        setUnverifiedEmail(result.data?.email || '');
      }
      setServerError(result.message || 'Login failed.');
    }
  };

  return (
    <AuthLayout
      title="Welcome back 👋"
      subtitle="Sign in to manage your property services."
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>

        {/* Info message */}
        {infoMsg && !serverError && (
          <div className="auth-info-box">ℹ️ {infoMsg}</div>
        )}

        {/* ── Email ── */}
        <div style={{ marginBottom: '18px' }}>
          <label className="auth-form-label">
            Email Address <span style={{ color: '#e74c3c' }}>*</span>
          </label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: '14px', color: '#8a9bb0', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
              <MailIcon />
            </span>
            <input
              type="email"
              className="auth-form-input"
              placeholder="you@example.com"
              autoComplete="email"
              aria-invalid={!!errors.email}
              style={{ paddingLeft: '42px', ...(errors.email ? { borderColor: '#e74c3c' } : {}) }}
              {...register('email')}
            />
          </div>
          {errors.email && <p className="auth-form-error">⚠ {errors.email.message}</p>}
        </div>

        {/* ── Password ── */}
        <div style={{ marginBottom: '8px' }}>
          <label className="auth-form-label">
            Password <span style={{ color: '#e74c3c' }}>*</span>
          </label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: '14px', color: '#8a9bb0', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
              <LockIcon />
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              className="auth-form-input"
              placeholder="Your password"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              style={{ paddingLeft: '42px', paddingRight: '44px', ...(errors.password ? { borderColor: '#e74c3c' } : {}) }}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#8a9bb0', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '6px' }}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff /> : <EyeOn />}
            </button>
          </div>
          {errors.password && <p className="auth-form-error">⚠ {errors.password.message}</p>}
        </div>

        {/* ── Forgot password ── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '22px' }}>
          <Link to="/auth/forgot-password" className="auth-link" style={{ fontSize: '13px' }}>
            Forgot password?
          </Link>
        </div>

        {/* ── Server error ── */}
        {serverError && (
          <div role="alert" className="auth-error-box">
            {serverError}
            {unverifiedEmail && (
              <div style={{ marginTop: '8px', fontSize: '12px' }}>
                Haven't verified yet?{' '}
                <Link
                  to="/auth/resend-verification"
                  state={{ email: unverifiedEmail }}
                  className="auth-link"
                  style={{ fontSize: '12px' }}
                >
                  Resend verification email →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ── Submit ── */}
        <button type="submit" disabled={isSubmitting} className="auth-submit-btn">
          {isSubmitting
            ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                Signing in…
              </span>
            : 'Sign In →'
          }
        </button>

        {/* ── Divider + register CTA ── */}
        <div className="auth-divider">
          <span className="auth-divider-line" />
          <span className="auth-divider-text">New to PropMaintain?</span>
          <span className="auth-divider-line" />
        </div>

        <Link to="/auth/register" className="auth-secondary-btn">
          Create a Free Account
        </Link>

      </form>
    </AuthLayout>
  );
};

export default LoginPage;
