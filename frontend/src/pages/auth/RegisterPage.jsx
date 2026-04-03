import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useAuth } from '../../context/AuthContext';
import { registerSchema } from '../../utils/validationSchemas';
import AuthLayout from '../../components/auth/AuthLayout';
import FormInput from '../../components/common/FormInput';
import PasswordStrengthMeter from '../../components/common/PasswordStrengthMeter';

// ─── Role options ──────────────────────────────────────────────────────────────
const ROLE_OPTIONS = [
  {
    value:    'customer',
    emoji:    '🔍',
    label:    'I need services',
    sub:      'Find & book verified pros',
    accent:   '#1a3c5e',
    accentBg: '#e8f0f8',
  },
  {
    value:    'provider',
    emoji:    '🔧',
    label:    'I offer services',
    sub:      'Receive & manage bookings',
    accent:   '#C17B2A',
    accentBg: '#fdf3e3',
  },
];

// ─── Success screen ────────────────────────────────────────────────────────────
const SuccessScreen = ({ userEmail, onResend }) => (
  <AuthLayout>
    <div style={{ textAlign: 'center' }}>

      <div style={{ width: '76px', height: '76px', borderRadius: '50%', background: 'linear-gradient(135deg, #d4edda, #a8d5ba)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '34px', margin: '0 auto 18px' }}>
        🎉
      </div>

      <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0d2137', margin: '0 0 8px', letterSpacing: '-0.3px', fontFamily: "'Outfit', sans-serif" }}>
        Account Created!
      </h2>
      <p style={{ fontSize: '14px', color: '#6b7c93', margin: '0 0 24px', lineHeight: 1.6 }}>
        Your PropMaintain account is ready. One more step!
      </p>

      {/* Email instruction box */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', background: '#f0f6ff', border: '1px solid #bee3f8', borderRadius: '12px', padding: '18px', marginBottom: '22px', textAlign: 'left' }}>
        <div style={{ fontSize: '26px', flexShrink: 0 }}>📧</div>
        <div>
          <p style={{ fontSize: '14px', fontWeight: '700', color: '#1a3c5e', margin: '0 0 5px', fontFamily: "'Outfit', sans-serif" }}>
            Verify your email to continue
          </p>
          <p style={{ fontSize: '13px', color: '#4a5568', lineHeight: 1.6, margin: 0, fontFamily: "'Outfit', sans-serif" }}>
            A link was sent to <strong>{userEmail}</strong>. Click it to activate your account. Check your spam folder if needed.
          </p>
        </div>
      </div>

      {/* Steps */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '20px' }}>
        {[
          { num: '1', text: 'Check inbox' },
          { num: '2', text: 'Click the link' },
          { num: '3', text: 'Sign in' },
        ].map(({ num, text }) => (
          <div key={num} style={{ padding: '12px 6px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e8ecf0', textAlign: 'center' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#1a3c5e', color: '#fff', fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px', fontFamily: "'Outfit', sans-serif" }}>{num}</div>
            <p style={{ fontSize: '11px', color: '#4a5568', margin: 0, fontWeight: '600', fontFamily: "'Outfit', sans-serif" }}>{text}</p>
          </div>
        ))}
      </div>

      <p style={{ fontSize: '13px', color: '#6b7c93', marginBottom: '18px', fontFamily: "'Outfit', sans-serif" }}>
        Didn't get the email?{' '}
        <button type="button" onClick={onResend} style={{ background: 'none', border: 'none', color: '#C17B2A', fontWeight: '700', cursor: 'pointer', fontSize: '13px', textDecoration: 'underline', fontFamily: "'Outfit', sans-serif", padding: 0 }}>
          Resend it
        </button>
      </p>

      <Link to="/auth/login" className="auth-submit-btn" style={{ display: 'block', textDecoration: 'none', textAlign: 'center' }}>
        Go to Sign In →
      </Link>
    </div>
  </AuthLayout>
);

// ─── Register page ─────────────────────────────────────────────────────────────
const RegisterPage = () => {
  const navigate                   = useNavigate();
  const { register: registerUser } = useAuth();

  const [serverError,  setServerError]  = useState('');
  const [successMsg,   setSuccessMsg]   = useState('');
  const [userEmail,    setUserEmail]    = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      firstName:       data.firstName,
      lastName:        data.lastName,
      email:           data.email,
      password:        data.password,
      confirmPassword: data.confirmPassword,
      role:            data.role,
      phone:           data.phone || undefined,
      agreeToTerms:    true,
    };

    const result = await registerUser(payload);
    setIsSubmitting(false);

    if (result.success) {
      setUserEmail(data.email);
      setSuccessMsg(result.message || 'Account created successfully.');
    } else {
      setServerError(result.message || 'Registration failed.');
      if (result.errors && Object.keys(result.errors).length > 0) {
        Object.entries(result.errors).forEach(([field, msg]) => {
          setError(field, { type: 'server', message: msg });
        });
      }
    }
  };

  if (successMsg) {
    return (
      <SuccessScreen
        userEmail={userEmail}
        onResend={() => navigate('/auth/resend-verification', { state: { email: userEmail } })}
      />
    );
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join PropMaintain — book or offer property services."
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>

        {/* ── Role selector ── */}
        <div style={{ marginBottom: '22px' }}>
          <p style={sectionLabelStyle}>I want to…</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {ROLE_OPTIONS.map(({ value, emoji, label, sub, accent, accentBg }) => {
              const active = selectedRole === value;
              return (
                <label
                  key={value}
                  className={`role-card${active ? ' role-card-active' : ''}`}
                  style={{ position: 'relative', ...(active ? { borderColor: accent, background: accentBg } : {}) }}
                >
                  <input type="radio" value={value} style={{ display: 'none' }} {...register('role')} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                    <span style={{ fontSize: '18px' }}>{emoji}</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: active ? accent : '#1a2e44', fontFamily: "'Outfit', sans-serif" }}>
                      {label}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#8a9bb0', fontFamily: "'Outfit', sans-serif", paddingLeft: '26px' }}>
                    {sub}
                  </span>
                  {active && (
                    <div style={{ position: 'absolute', top: '8px', right: '10px', width: '18px', height: '18px', borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: '#fff', fontSize: '10px', fontWeight: '800' }}>✓</span>
                    </div>
                  )}
                </label>
              );
            })}
          </div>
          {errors.role && <p className="auth-form-error">⚠ {errors.role.message}</p>}
        </div>

        {/* ── Name row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '4px' }}>
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

        {/* ── Email ── */}
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

        {/* ── Phone ── */}
        <FormInput
          label="Phone Number"
          name="phone"
          type="tel"
          register={register}
          error={errors.phone?.message}
          placeholder="+44 7700 900000"
          autoComplete="tel"
          hint="Optional — used for job notifications"
        />

        {/* ── Password + strength meter ── */}
        <div style={{ marginBottom: '4px' }}>
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
          <div style={{ marginTop: '-2px', marginBottom: '10px' }}>
            <PasswordStrengthMeter password={passwordValue} />
          </div>
        </div>

        {/* ── Confirm password ── */}
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

        {/* ── Terms ── */}
        <div style={{ margin: '8px 0 18px' }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              className="auth-checkbox"
              style={{ marginTop: '2px', flexShrink: 0 }}
              {...register('agreeToTerms')}
            />
            <span style={{ fontSize: '13px', color: '#4a5568', lineHeight: 1.55, fontFamily: "'Outfit', sans-serif" }}>
              I agree to the{' '}
              <Link to="/terms" className="auth-link">Terms of Service</Link>
              {' '}and{' '}
              <Link to="/privacy" className="auth-link">Privacy Policy</Link>
            </span>
          </label>
          {errors.agreeToTerms && (
            <p className="auth-form-error" style={{ marginTop: '5px' }}>⚠ {errors.agreeToTerms.message}</p>
          )}
        </div>

        {/* ── Server error ── */}
        {serverError && (
          <div role="alert" className="auth-error-box">⚠ {serverError}</div>
        )}

        {/* ── Submit ── */}
        <button type="submit" disabled={isSubmitting} className="auth-submit-btn">
          {isSubmitting
            ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                Creating account…
              </span>
            : 'Create Account →'
          }
        </button>

        <p style={{ textAlign: 'center', fontSize: '13px', color: '#6b7c93', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
          Already have an account?{' '}
          <Link to="/auth/login" className="auth-link">Sign in</Link>
        </p>

      </form>
    </AuthLayout>
  );
};

const sectionLabelStyle = {
  fontSize: '12px', fontWeight: '700', color: '#4a5568',
  textTransform: 'uppercase', letterSpacing: '0.5px',
  margin: '0 0 8px', fontFamily: "'Outfit', sans-serif",
};

export default RegisterPage;
