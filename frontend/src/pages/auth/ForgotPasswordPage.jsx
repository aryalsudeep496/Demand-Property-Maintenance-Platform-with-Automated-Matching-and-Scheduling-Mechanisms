import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useAuth } from '../../context/AuthContext';
import { forgotPasswordSchema } from '../../utils/validationSchemas';
import AuthLayout from '../../components/auth/AuthLayout';
import FormInput from '../../components/common/FormInput';

const ForgotPasswordPage = () => {
  const { forgotPassword } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted,    setSubmitted]    = useState(false);
  const [serverError,  setServerError]  = useState('');

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (data) => {
    setServerError('');
    setIsSubmitting(true);
    const result = await forgotPassword(data.email);
    setIsSubmitting(false);

    if (result.success) {
      setSubmitted(true);
    } else {
      setServerError(result.message || 'Request failed. Please try again.');
    }
  };

  if (submitted) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle="We've sent password reset instructions."
      >
        <div style={styles.successCard}>
          <div style={styles.successIcon}>📬</div>
          <p style={styles.successBody}>
            If an account exists for <strong>{getValues('email')}</strong>, you'll
            receive a reset link shortly. Check your spam folder if it doesn't arrive.
          </p>
          <p style={styles.successHint}>The link expires in <strong>1 hour</strong>.</p>
          <div style={styles.btnGroup}>
            <Link to="/auth/login" style={styles.primaryBtn}>
              Back to Login
            </Link>
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              style={styles.ghostBtn}
            >
              Try a different email
            </button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a reset link."
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
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

        {serverError && (
          <div role="alert" style={styles.errorBox}>
            {serverError}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          style={{ ...styles.submitBtn, ...(isSubmitting ? styles.disabledBtn : {}) }}
        >
          {isSubmitting ? 'Sending…' : 'Send Reset Link'}
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
  successCard: {
    textAlign: 'center',
  },
  successIcon: {
    fontSize:     '48px',
    marginBottom: '16px',
  },
  successBody: {
    fontSize:     '14px',
    color:        '#4a5568',
    lineHeight:   1.6,
    marginBottom: '8px',
    fontFamily:   "'DM Sans', sans-serif",
  },
  successHint: {
    fontSize:     '13px',
    color:        '#8a9bb0',
    marginBottom: '28px',
    fontFamily:   "'DM Sans', sans-serif",
  },
  btnGroup: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '10px',
  },
  primaryBtn: {
    display:        'block',
    padding:        '12px',
    background:     '#1a3c5e',
    color:          '#fff',
    borderRadius:   '8px',
    textDecoration: 'none',
    fontSize:       '14px',
    fontWeight:     '600',
    fontFamily:     "'DM Sans', sans-serif",
    textAlign:      'center',
  },
  ghostBtn: {
    background:   'none',
    border:       '2px solid #dde3eb',
    borderRadius: '8px',
    padding:      '11px',
    fontSize:     '14px',
    fontWeight:   '600',
    color:        '#6b7c93',
    cursor:       'pointer',
    fontFamily:   "'DM Sans', sans-serif",
  },
};

export default ForgotPasswordPage;
