import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useAuth } from '../../context/AuthContext';
import { loginSchema } from '../../utils/validationSchemas';
import AuthLayout from '../../components/auth/AuthLayout';
import FormInput from '../../components/common/FormInput';

const LoginPage = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login } = useAuth();

  const [serverError,  setServerError]  = useState('');
  const [infoMsg,      setInfoMsg]      = useState(location.state?.message || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');

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
      // Redirect to originally requested page or role dashboard
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
      title="Welcome back"
      subtitle="Sign in to manage your property services."
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>

        {/* Info message (e.g. redirected from protected route) */}
        {infoMsg && !serverError && (
          <div style={styles.infoBox} role="status">
            ℹ️ {infoMsg}
          </div>
        )}

        <FormInput
          label="Email Address"
          name="email"
          type="email"
          register={register}
          error={errors.email?.message}
          placeholder="you@example.com"
          required
          autoComplete="email"
        />

        <div style={styles.passwordField}>
          <FormInput
            label="Password"
            name="password"
            type="password"
            register={register}
            error={errors.password?.message}
            placeholder="Your password"
            required
            autoComplete="current-password"
          />
          <div style={styles.forgotRow}>
            <Link to="/auth/forgot-password" style={styles.forgotLink}>
              Forgot password?
            </Link>
          </div>
        </div>

        {/* Server error */}
        {serverError && (
          <div role="alert" style={styles.errorBox}>
            <span>{serverError}</span>
            {unverifiedEmail && (
              <div style={styles.resendRow}>
                <span>Haven't received the email? </span>
                <Link
                  to="/auth/resend-verification"
                  state={{ email: unverifiedEmail }}
                  style={styles.resendLink}
                >
                  Resend verification
                </Link>
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          style={{ ...styles.submitBtn, ...(isSubmitting ? styles.submitBtnDisabled : {}) }}
        >
          {isSubmitting ? 'Signing in…' : 'Sign In'}
        </button>

        <div style={styles.divider}>
          <span style={styles.dividerLine} />
          <span style={styles.dividerText}>New to PropMaintain?</span>
          <span style={styles.dividerLine} />
        </div>

        <Link to="/auth/register" style={styles.registerBtn}>
          Create an Account
        </Link>
      </form>
    </AuthLayout>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  infoBox: {
    background:   '#f0f6ff',
    border:       '1px solid #bee3f8',
    borderRadius: '8px',
    padding:      '12px 14px',
    fontSize:     '13px',
    color:        '#2b6cb0',
    marginBottom: '20px',
    fontFamily:   "'DM Sans', sans-serif",
  },
  passwordField: {
    marginBottom: '4px',
  },
  forgotRow: {
    display:   'flex',
    justifyContent: 'flex-end',
    marginTop:  '6px',
  },
  forgotLink: {
    fontSize:       '13px',
    color:          '#1a3c5e',
    fontWeight:     '600',
    textDecoration: 'none',
    fontFamily:     "'DM Sans', sans-serif",
  },
  errorBox: {
    background:   '#fff0f0',
    border:       '1px solid #fcd0d0',
    borderRadius: '8px',
    padding:      '12px 14px',
    fontSize:     '13px',
    color:        '#c0392b',
    marginBottom: '16px',
    fontFamily:   "'DM Sans', sans-serif",
  },
  resendRow: {
    marginTop: '8px',
    fontSize:  '12px',
    color:     '#c0392b',
  },
  resendLink: {
    color:          '#c0392b',
    fontWeight:     '600',
    textDecoration: 'underline',
  },
  submitBtn: {
    width:        '100%',
    padding:      '13px',
    background:   '#1a3c5e',
    color:        '#ffffff',
    border:       'none',
    borderRadius: '8px',
    fontSize:     '15px',
    fontWeight:   '600',
    fontFamily:   "'DM Sans', sans-serif",
    cursor:       'pointer',
    transition:   'background 0.2s',
    marginBottom: '20px',
    marginTop:    '16px',
  },
  submitBtnDisabled: {
    background: '#8a9bb0',
    cursor:     'not-allowed',
  },
  divider: {
    display:    'flex',
    alignItems: 'center',
    gap:        '12px',
    marginBottom: '16px',
  },
  dividerLine: {
    flex:       1,
    height:     '1px',
    background: '#dde3eb',
    display:    'block',
  },
  dividerText: {
    fontSize:   '12px',
    color:      '#8a9bb0',
    fontFamily: "'DM Sans', sans-serif",
    whiteSpace: 'nowrap',
  },
  registerBtn: {
    display:        'block',
    width:          '100%',
    padding:        '13px',
    border:         '2px solid #1a3c5e',
    borderRadius:   '8px',
    textAlign:      'center',
    fontSize:       '15px',
    fontWeight:     '600',
    fontFamily:     "'DM Sans', sans-serif",
    color:          '#1a3c5e',
    textDecoration: 'none',
    transition:     'background 0.2s',
    boxSizing:      'border-box',
  },
};

export default LoginPage;
