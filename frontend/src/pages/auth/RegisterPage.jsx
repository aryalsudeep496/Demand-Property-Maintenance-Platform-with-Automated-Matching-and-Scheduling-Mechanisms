import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useAuth } from '../../context/AuthContext';
import { registerSchema } from '../../utils/validationSchemas';
import AuthLayout from '../../components/auth/AuthLayout';
import FormInput from '../../components/common/FormInput';
import PasswordStrengthMeter from '../../components/common/PasswordStrengthMeter';

const RegisterPage = () => {
  const navigate  = useNavigate();
  const { register: registerUser } = useAuth();

  const [serverError,   setServerError]   = useState('');
  const [successMsg,    setSuccessMsg]     = useState('');
  const [isSubmitting,  setIsSubmitting]   = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'customer', agreeToTerms: false },
  });

  const passwordValue = watch('password', '');
  const selectedRole  = watch('role');

  const onSubmit = async (data) => {
  setServerError('');
  setSuccessMsg('');
  setIsSubmitting(true);

  const payload = {
    firstName:      data.firstName,
    lastName:       data.lastName,
    email:          data.email,
    password:       data.password,
    confirmPassword: data.confirmPassword,
    role:           data.role,
    phone:          data.phone || undefined,
    agreeToTerms:   true,
  };

  console.log('Sending payload:', payload);

  const result = await registerUser(payload);
  setIsSubmitting(false);

  if (result.success) {
    setSuccessMsg(result.message || 'Account created! Please check your email to verify.');
  } else {
    setServerError(result.message || 'Registration failed.');
    if (result.errors) {
      Object.entries(result.errors).forEach(([field, msg]) => {
        setError(field, { type: 'server', message: msg });
      });
    }
  }
};

  if (successMsg) {
    return (
      <AuthLayout>
        <div style={styles.successCard}>
          <div style={styles.successIcon}>✉️</div>
          <h2 style={styles.successTitle}>Check your inbox!</h2>
          <p style={styles.successBody}>{successMsg}</p>
          <p style={styles.successHint}>
            Didn't get the email?{' '}
            <button
              type="button"
              onClick={() => navigate('/auth/resend-verification')}
              style={styles.inlineLink}
            >
              Resend verification
            </button>
          </p>
          <Link to="/auth/login" style={styles.backBtn}>
            Back to Login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join PropMaintain to book or offer property services."
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>

        {/* ── Role selector ── */}
        <div style={styles.roleRow}>
          {[
            { value: 'customer', label: '🔍 I need services',    sub: 'Find & book professionals' },
            { value: 'provider', label: '🔧 I offer services',   sub: 'List & receive bookings' },
          ].map(({ value, label, sub }) => (
            <label
              key={value}
              style={{
                ...styles.roleCard,
                ...(selectedRole === value ? styles.roleCardActive : {}),
              }}
            >
              <input
                type="radio"
                value={value}
                style={{ display: 'none' }}
                {...register('role')}
              />
              <span style={styles.roleLabel}>{label}</span>
              <span style={styles.roleSub}>{sub}</span>
            </label>
          ))}
        </div>
        {errors.role && <p style={styles.fieldError}>⚠ {errors.role.message}</p>}

        {/* ── Name row ── */}
        <div style={styles.nameRow}>
          <FormInput
            label="First Name"
            name="firstName"
            register={register}
            error={errors.firstName?.message}
            placeholder="Jane"
            required
            autoComplete="given-name"
          />
          <FormInput
            label="Last Name"
            name="lastName"
            register={register}
            error={errors.lastName?.message}
            placeholder="Smith"
            required
            autoComplete="family-name"
          />
        </div>

        <FormInput
          label="Email Address"
          name="email"
          type="email"
          register={register}
          error={errors.email?.message}
          placeholder="jane@example.com"
          required
          autoComplete="email"
        />

        <FormInput
          label="Phone Number"
          name="phone"
          type="tel"
          register={register}
          error={errors.phone?.message}
          placeholder="+44 7700 900000"
          autoComplete="tel"
          hint="Optional – used for service notifications"
        />

        <div style={styles.passwordSection}>
          <FormInput
            label="Password"
            name="password"
            type="password"
            register={register}
            error={errors.password?.message}
            placeholder="Create a strong password"
            required
            autoComplete="new-password"
          />
          <PasswordStrengthMeter password={passwordValue} />
        </div>

        <FormInput
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          register={register}
          error={errors.confirmPassword?.message}
          placeholder="Re-enter your password"
          required
          autoComplete="new-password"
        />

        {/* ── Terms checkbox ── */}
        <div style={styles.termsRow}>
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              style={styles.checkbox}
              {...register('agreeToTerms')}
            />
            <span style={styles.checkboxText}>
              I agree to the{' '}
              <Link to="/terms" style={styles.link}>Terms of Service</Link>
              {' '}and{' '}
              <Link to="/privacy" style={styles.link}>Privacy Policy</Link>
            </span>
          </label>
          {errors.agreeToTerms && (
            <p style={styles.fieldError}>⚠ {errors.agreeToTerms.message}</p>
          )}
        </div>

        {/* ── Server error ── */}
        {serverError && (
          <div role="alert" style={styles.serverError}>
            {serverError}
          </div>
        )}

        {/* ── Submit ── */}
        <button
          type="submit"
          disabled={isSubmitting}
          style={{ ...styles.submitBtn, ...(isSubmitting ? styles.submitBtnDisabled : {}) }}
        >
          {isSubmitting ? 'Creating account…' : 'Create Account'}
        </button>

        <p style={styles.loginPrompt}>
          Already have an account?{' '}
          <Link to="/auth/login" style={styles.link}>Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  nameRow: {
    display:             'grid',
    gridTemplateColumns: '1fr 1fr',
    gap:                 '12px',
    marginBottom:        '16px',
  },
  roleRow: {
    display:             'grid',
    gridTemplateColumns: '1fr 1fr',
    gap:                 '10px',
    marginBottom:        '20px',
  },
  roleCard: {
    display:        'flex',
    flexDirection:  'column',
    gap:            '4px',
    padding:        '14px',
    border:         '2px solid #dde3eb',
    borderRadius:   '10px',
    cursor:         'pointer',
    transition:     'all 0.2s',
    background:     '#fff',
  },
  roleCardActive: {
    borderColor: '#1a3c5e',
    background:  '#f0f6ff',
  },
  roleLabel: {
    fontSize:   '13px',
    fontWeight: '600',
    color:      '#1a2e44',
    fontFamily: "'DM Sans', sans-serif",
  },
  roleSub: {
    fontSize: '11px',
    color:    '#8a9bb0',
    fontFamily: "'DM Sans', sans-serif",
  },
  passwordSection: {
    marginBottom: '16px',
  },
  termsRow: {
    marginBottom: '16px',
    marginTop:    '4px',
  },
  checkboxLabel: {
    display:    'flex',
    alignItems: 'flex-start',
    gap:        '8px',
    cursor:     'pointer',
  },
  checkbox: {
    marginTop:  '2px',
    accentColor: '#1a3c5e',
    cursor:     'pointer',
    flexShrink: 0,
  },
  checkboxText: {
    fontSize:   '13px',
    color:      '#4a5568',
    fontFamily: "'DM Sans', sans-serif",
    lineHeight: 1.5,
  },
  link: {
    color:          '#1a3c5e',
    fontWeight:     '600',
    textDecoration: 'none',
  },
  serverError: {
    background:   '#fff0f0',
    border:       '1px solid #fcd0d0',
    borderRadius: '8px',
    padding:      '12px 14px',
    fontSize:     '13px',
    color:        '#c0392b',
    marginBottom: '16px',
    fontFamily:   "'DM Sans', sans-serif",
  },
  fieldError: {
    margin:     '4px 0 0',
    fontSize:   '12px',
    color:      '#e74c3c',
    fontFamily: "'DM Sans', sans-serif",
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
    marginBottom: '16px',
  },
  submitBtnDisabled: {
    background: '#8a9bb0',
    cursor:     'not-allowed',
  },
  loginPrompt: {
    textAlign:  'center',
    fontSize:   '13px',
    color:      '#6b7c93',
    fontFamily: "'DM Sans', sans-serif",
    margin:     0,
  },
  successCard: {
    textAlign: 'center',
    padding:   '24px 0',
  },
  successIcon: {
    fontSize:     '48px',
    marginBottom: '16px',
  },
  successTitle: {
    fontSize:     '22px',
    fontWeight:   '700',
    color:        '#0d2137',
    margin:       '0 0 12px',
    fontFamily:   "'DM Sans', sans-serif",
  },
  successBody: {
    fontSize:     '14px',
    color:        '#6b7c93',
    lineHeight:   1.6,
    marginBottom: '16px',
    fontFamily:   "'DM Sans', sans-serif",
  },
  successHint: {
    fontSize:     '13px',
    color:        '#6b7c93',
    fontFamily:   "'DM Sans', sans-serif",
    marginBottom: '24px',
  },
  inlineLink: {
    background:     'none',
    border:         'none',
    color:          '#1a3c5e',
    fontWeight:     '600',
    cursor:         'pointer',
    fontSize:       '13px',
    fontFamily:     "'DM Sans', sans-serif",
    textDecoration: 'underline',
    padding:        0,
  },
  backBtn: {
    display:        'inline-block',
    padding:        '10px 24px',
    background:     '#1a3c5e',
    color:          '#fff',
    borderRadius:   '8px',
    textDecoration: 'none',
    fontSize:       '14px',
    fontWeight:     '600',
    fontFamily:     "'DM Sans', sans-serif",
  },
};

export default RegisterPage;
