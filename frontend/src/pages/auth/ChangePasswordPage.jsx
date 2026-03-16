import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { authAPI } from '../../utils/api';
import { changePasswordSchema } from '../../utils/validationSchemas';
import FormInput from '../../components/common/FormInput';
import PasswordStrengthMeter from '../../components/common/PasswordStrengthMeter';

/**
 * ChangePasswordPage
 * Rendered inside the authenticated dashboard layout (not AuthLayout).
 * The user must supply their current password to set a new one.
 */
const ChangePasswordPage = () => {
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError,  setServerError]  = useState('');
  const [success,      setSuccess]      = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(changePasswordSchema) });

  const newPasswordValue = watch('newPassword', '');

  const onSubmit = async (data) => {
    setServerError('');
    setIsSubmitting(true);

    try {
      await authAPI.changePassword({
        currentPassword:    data.currentPassword,
        newPassword:        data.newPassword,
        confirmNewPassword: data.confirmNewPassword,
      });
      setSuccess(true);
      reset();
      // Redirect to login after 3s (tokens are invalidated server-side)
      setTimeout(() => navigate('/auth/login', {
        state: { message: 'Password changed. Please sign in again.' },
      }), 3000);
    } catch (err) {
      const msg    = err.response?.data?.message || 'Failed to change password.';
      const errors = err.response?.data?.errors || {};
      setServerError(msg);
      Object.entries(errors).forEach(([field, errMsg]) =>
        setError(field, { type: 'server', message: errMsg })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div style={styles.successCard}>
        <div style={styles.successIcon}>✅</div>
        <h3 style={styles.successTitle}>Password Changed</h3>
        <p style={styles.successBody}>
          Your password has been updated. You'll be redirected to login in a moment.
        </p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Change Password</h2>
      <p style={styles.subheading}>
        You'll be signed out after changing your password.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate style={styles.form}>
        <FormInput
          label="Current Password"
          name="currentPassword"
          type="password"
          register={register}
          error={errors.currentPassword?.message}
          placeholder="Your current password"
          required
          autoComplete="current-password"
        />

        <div style={styles.newPasswordSection}>
          <FormInput
            label="New Password"
            name="newPassword"
            type="password"
            register={register}
            error={errors.newPassword?.message}
            placeholder="Create a new password"
            required
            autoComplete="new-password"
          />
          <PasswordStrengthMeter password={newPasswordValue} />
        </div>

        <FormInput
          label="Confirm New Password"
          name="confirmNewPassword"
          type="password"
          register={register}
          error={errors.confirmNewPassword?.message}
          placeholder="Re-enter new password"
          required
          autoComplete="new-password"
        />

        {serverError && (
          <div role="alert" style={styles.errorBox}>
            {serverError}
          </div>
        )}

        <div style={styles.actionRow}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={styles.cancelBtn}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{ ...styles.submitBtn, ...(isSubmitting ? styles.disabledBtn : {}) }}
          >
            {isSubmitting ? 'Saving…' : 'Update Password'}
          </button>
        </div>
      </form>
    </div>
  );
};

const styles = {
  container: {
    maxWidth:  '480px',
    margin:    '0 auto',
    padding:   '24px',
  },
  heading: {
    fontSize:   '22px',
    fontWeight: '700',
    color:      '#0d2137',
    margin:     '0 0 6px',
    fontFamily: "'DM Sans', sans-serif",
  },
  subheading: {
    fontSize:     '13px',
    color:        '#8a9bb0',
    marginBottom: '28px',
    fontFamily:   "'DM Sans', sans-serif",
  },
  form: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '16px',
  },
  newPasswordSection: {},
  errorBox: {
    background:   '#fff0f0',
    border:       '1px solid #fcd0d0',
    borderRadius: '8px',
    padding:      '12px 14px',
    fontSize:     '13px',
    color:        '#c0392b',
    fontFamily:   "'DM Sans', sans-serif",
  },
  actionRow: {
    display:        'flex',
    justifyContent: 'flex-end',
    gap:            '12px',
    marginTop:      '8px',
  },
  cancelBtn: {
    padding:      '10px 20px',
    background:   '#f0f4f8',
    border:       '1px solid #dde3eb',
    borderRadius: '8px',
    fontSize:     '14px',
    fontWeight:   '600',
    color:        '#4a5568',
    cursor:       'pointer',
    fontFamily:   "'DM Sans', sans-serif",
  },
  submitBtn: {
    padding:      '10px 24px',
    background:   '#1a3c5e',
    border:       'none',
    borderRadius: '8px',
    fontSize:     '14px',
    fontWeight:   '600',
    color:        '#ffffff',
    cursor:       'pointer',
    fontFamily:   "'DM Sans', sans-serif",
  },
  disabledBtn: {
    background: '#8a9bb0',
    cursor:     'not-allowed',
  },
  successCard: {
    textAlign:  'center',
    padding:    '40px 24px',
    maxWidth:   '400px',
    margin:     '0 auto',
  },
  successIcon:  { fontSize: '48px', marginBottom: '16px' },
  successTitle: {
    fontSize:     '20px',
    fontWeight:   '700',
    color:        '#27ae60',
    margin:       '0 0 10px',
    fontFamily:   "'DM Sans', sans-serif",
  },
  successBody: {
    fontSize:   '14px',
    color:      '#6b7c93',
    lineHeight: 1.6,
    fontFamily: "'DM Sans', sans-serif",
  },
};

export default ChangePasswordPage;
