import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useAuth } from '../../context/AuthContext';
import { resetPasswordSchema } from '../../utils/validationSchemas';
import AuthLayout from '../../components/auth/AuthLayout';
import FormInput from '../../components/common/FormInput';
import PasswordStrengthMeter from '../../components/common/PasswordStrengthMeter';

const ResetPasswordPage = () => {
  const { token }        = useParams();
  const navigate         = useNavigate();
  const { resetPassword } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError,  setServerError]  = useState('');
  const [success,      setSuccess]      = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm({ resolver: zodResolver(resetPasswordSchema) });

  const passwordValue = watch('password', '');

  const onSubmit = async (data) => {
    setServerError('');
    setIsSubmitting(true);
    const result = await resetPassword(token, data);
    setIsSubmitting(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => navigate('/auth/login', {
        state: { message: 'Password reset successful. Please sign in.' },
      }), 3000);
    } else {
      setServerError(result.message || 'Reset failed.');
      if (result.errors) {
        Object.entries(result.errors).forEach(([field, msg]) =>
          setError(field, { type: 'server', message: msg })
        );
      }
    }
  };

  if (!token) {
    return (
      <AuthLayout title="Invalid Link">
        <div style={styles.centred}>
          <div style={styles.icon}>🔗</div>
          <p style={styles.body}>This reset link is invalid or malformed.</p>
          <Link to="/auth/forgot-password" style={styles.primaryBtn}>
            Request a New Link
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (success) {
    return (
      <AuthLayout title="Password Reset!">
        <div style={styles.centred}>
          <div style={styles.icon}>✅</div>
          <p style={styles.body}>
            Your password has been reset successfully. Redirecting you to login…
          </p>
          <Link to="/auth/login" style={styles.primaryBtn}>
            Go to Login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Choose a new strong password for your account."
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div style={styles.passwordSection}>
          <FormInput
            label="New Password"
            name="password"
            type="password"
            register={register}
            error={errors.password?.message}
            placeholder="Create a new password"
            required
            autoComplete="new-password"
          />
          <PasswordStrengthMeter password={passwordValue} />
        </div>

        <FormInput
          label="Confirm New Password"
          name="confirmPassword"
          type="password"
          register={register}
          error={errors.confirmPassword?.message}
          placeholder="Re-enter new password"
          required
          autoComplete="new-password"
        />

        {serverError && (
          <div role="alert" style={styles.errorBox}>
            {serverError}
            {serverError.toLowerCase().includes('expired') && (
              <div style={{ marginTop: '8px' }}>
                <Link to="/auth/forgot-password" style={styles.inlineLink}>
                  Request a new reset link →
                </Link>
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          style={{ ...styles.submitBtn, ...(isSubmitting ? styles.disabledBtn : {}) }}
        >
          {isSubmitting ? 'Resetting…' : 'Reset Password'}
        </button>

        <p style={styles.backRow}>
          <Link to="/auth/login" style={styles.backLink}>
            ← Back to Login
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

const styles = {
  passwordSection: {
    marginBottom: '16px',
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
  inlineLink: {
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
    marginTop:    '8px',
    marginBottom: '16px',
  },
  disabledBtn: {
    background: '#8a9bb0',
    cursor:     'not-allowed',
  },
  backRow: {
    textAlign: 'center',
    margin:    0,
  },
  backLink: {
    fontSize:       '13px',
    color:          '#1a3c5e',
    fontWeight:     '600',
    textDecoration: 'none',
    fontFamily:     "'DM Sans', sans-serif",
  },
  centred: {
    textAlign: 'center',
    padding:   '8px 0',
  },
  icon: {
    fontSize:     '48px',
    marginBottom: '16px',
  },
  body: {
    fontSize:     '14px',
    color:        '#6b7c93',
    lineHeight:   1.6,
    marginBottom: '24px',
    fontFamily:   "'DM Sans', sans-serif",
  },
  primaryBtn: {
    display:        'inline-block',
    padding:        '12px 28px',
    background:     '#1a3c5e',
    color:          '#fff',
    borderRadius:   '8px',
    textDecoration: 'none',
    fontSize:       '14px',
    fontWeight:     '600',
    fontFamily:     "'DM Sans', sans-serif",
  },
};

export default ResetPasswordPage;
