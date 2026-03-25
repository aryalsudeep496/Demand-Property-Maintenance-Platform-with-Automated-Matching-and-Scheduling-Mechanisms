import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';
import { authAPI } from '../../utils/api';

const ResendVerificationPage = () => {
  const location = useLocation();
  const [email, setEmail]       = useState(location.state?.email || '');
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      await authAPI.resendVerification(email);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Resend Verification Email"
      subtitle="Enter your email and we'll send a new verification link."
    >
      {success ? (
        <div style={styles.successCard}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📬</div>
          <h3 style={styles.successTitle}>Email Sent!</h3>
          <p style={styles.successBody}>
            A new verification link has been sent to <strong>{email}</strong>.
            Please check your inbox and spam folder.
          </p>
          <Link to="/auth/login" style={styles.btn}>Back to Login</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <div style={styles.field}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={styles.input}
            />
          </div>

          {error && (
            <div style={styles.errorBox}>{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.btn, width: '100%', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Sending…' : 'Resend Verification Email'}
          </button>

          <p style={styles.backRow}>
            <Link to="/auth/login" style={styles.link}>← Back to Login</Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
};

const styles = {
  field:       { marginBottom: '16px' },
  label:       { display: 'block', fontSize: '14px', fontWeight: '600', color: '#1a2e44', marginBottom: '6px', fontFamily: "'DM Sans', sans-serif" },
  input:       { width: '100%', padding: '11px 14px', border: '1.5px solid #dde3eb', borderRadius: '8px', fontSize: '14px', fontFamily: "'DM Sans', sans-serif", color: '#1a2e44', outline: 'none', boxSizing: 'border-box' },
  errorBox:    { background: '#fff0f0', border: '1px solid #fcd0d0', borderRadius: '8px', padding: '12px 14px', fontSize: '13px', color: '#c0392b', marginBottom: '16px', fontFamily: "'DM Sans', sans-serif" },
  btn:         { display: 'block', padding: '12px 24px', background: '#1a3c5e', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: '600', fontFamily: "'DM Sans', sans-serif", textAlign: 'center', marginBottom: '16px' },
  backRow:     { textAlign: 'center', margin: 0 },
  link:        { fontSize: '13px', color: '#1a3c5e', fontWeight: '600', textDecoration: 'none', fontFamily: "'DM Sans', sans-serif" },
  successCard: { textAlign: 'center', padding: '8px 0' },
  successTitle:{ fontSize: '20px', fontWeight: '700', color: '#27ae60', margin: '0 0 10px', fontFamily: "'DM Sans', sans-serif" },
  successBody: { fontSize: '14px', color: '#6b7c93', lineHeight: 1.6, marginBottom: '24px', fontFamily: "'DM Sans', sans-serif" },
};

export default ResendVerificationPage;