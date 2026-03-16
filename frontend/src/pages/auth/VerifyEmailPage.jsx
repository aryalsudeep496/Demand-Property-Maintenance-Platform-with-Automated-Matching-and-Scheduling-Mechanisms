import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { authAPI } from '../../utils/api';
import AuthLayout from '../../components/auth/AuthLayout';

const VerifyEmailPage = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token found in the URL.');
      return;
    }

    const verify = async () => {
      try {
        const { data } = await authAPI.verifyEmail(token);
        setStatus('success');
        setMessage(data.message);
      } catch (err) {
        setStatus('error');
        setMessage(
          err.response?.data?.message ||
          'Email verification failed. The link may have expired.'
        );
      }
    };

    verify();
  }, [token]);

  return (
    <AuthLayout>
      <div style={styles.card}>
        {status === 'loading' && (
          <>
            <div style={styles.spinner} aria-label="Verifying…" />
            <h2 style={styles.title}>Verifying your email…</h2>
            <p style={styles.body}>Please wait a moment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={styles.iconSuccess}>✅</div>
            <h2 style={{ ...styles.title, color: '#27ae60' }}>Email Verified!</h2>
            <p style={styles.body}>{message}</p>
            <Link to="/auth/login" style={styles.primaryBtn}>
              Sign In Now
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={styles.iconError}>❌</div>
            <h2 style={{ ...styles.title, color: '#c0392b' }}>Verification Failed</h2>
            <p style={styles.body}>{message}</p>
            <div style={styles.btnGroup}>
              <Link to="/auth/resend-verification" style={styles.primaryBtn}>
                Resend Verification Email
              </Link>
              <Link to="/auth/login" style={styles.secondaryBtn}>
                Back to Login
              </Link>
            </div>
          </>
        )}
      </div>
    </AuthLayout>
  );
};

const styles = {
  card: {
    textAlign: 'center',
    padding:   '16px 0 8px',
  },
  spinner: {
    width:        '48px',
    height:       '48px',
    border:       '4px solid #dde3eb',
    borderTop:    '4px solid #1a3c5e',
    borderRadius: '50%',
    animation:    'spin 0.8s linear infinite',
    margin:       '0 auto 20px',
  },
  iconSuccess: { fontSize: '48px', marginBottom: '16px' },
  iconError:   { fontSize: '48px', marginBottom: '16px' },
  title: {
    fontSize:     '22px',
    fontWeight:   '700',
    color:        '#0d2137',
    margin:       '0 0 10px',
    fontFamily:   "'DM Sans', sans-serif",
  },
  body: {
    fontSize:     '14px',
    color:        '#6b7c93',
    lineHeight:   1.6,
    margin:       '0 0 24px',
    fontFamily:   "'DM Sans', sans-serif",
  },
  btnGroup: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '10px',
  },
  primaryBtn: {
    display:        'inline-block',
    padding:        '12px 24px',
    background:     '#1a3c5e',
    color:          '#fff',
    borderRadius:   '8px',
    textDecoration: 'none',
    fontSize:       '14px',
    fontWeight:     '600',
    fontFamily:     "'DM Sans', sans-serif",
  },
  secondaryBtn: {
    display:        'inline-block',
    padding:        '11px 24px',
    border:         '2px solid #1a3c5e',
    color:          '#1a3c5e',
    borderRadius:   '8px',
    textDecoration: 'none',
    fontSize:       '14px',
    fontWeight:     '600',
    fontFamily:     "'DM Sans', sans-serif",
  },
};

export default VerifyEmailPage;
