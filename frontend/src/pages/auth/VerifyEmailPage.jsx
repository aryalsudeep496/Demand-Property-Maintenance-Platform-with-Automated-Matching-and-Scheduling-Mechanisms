import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../utils/api';
import AuthLayout from '../../components/auth/AuthLayout';

const VerifyEmailPage = () => {
  const { token }  = useParams();
  const navigate   = useNavigate();
  const [status,   setStatus]  = useState('loading');
  const [message,  setMessage] = useState('');
  const [countdown, setCountdown] = useState(5);

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

  // Auto-redirect to login after success
  useEffect(() => {
    if (status !== 'success') return;
    if (countdown <= 0) {
      navigate('/auth/login', {
        state: { message: '✅ Email verified! You can now sign in.' }
      });
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [status, countdown, navigate]);

  return (
    <AuthLayout>
      <div style={styles.card}>

        {/* Loading */}
        {status === 'loading' && (
          <>
            <div style={styles.spinner} />
            <h2 style={styles.title}>Verifying your email…</h2>
            <p style={styles.body}>Please wait a moment.</p>
          </>
        )}

        {/* Success */}
        {status === 'success' && (
          <>
            <div style={styles.iconSuccess}>✅</div>
            <h2 style={{ ...styles.title, color: '#27ae60' }}>Email Verified!</h2>
            <p style={styles.body}>{message}</p>
            <div style={styles.countdownBox}>
              <p style={styles.countdownText}>
                Redirecting to login in <strong>{countdown}</strong> second{countdown !== 1 ? 's' : ''}…
              </p>
              <div style={styles.progressBar}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${((5 - countdown) / 5) * 100}%`,
                  }}
                />
              </div>
            </div>
            <Link to="/auth/login" style={styles.primaryBtn}>
              Go to Login Now →
            </Link>
          </>
        )}

        {/* Error */}
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
  card: { textAlign: 'center', padding: '16px 0 8px' },
  spinner: {
    width: '48px', height: '48px', border: '4px solid #dde3eb',
    borderTop: '4px solid #1a3c5e', borderRadius: '50%',
    animation: 'spin 0.8s linear infinite', margin: '0 auto 20px',
  },
  iconSuccess: { fontSize: '56px', marginBottom: '16px' },
  iconError:   { fontSize: '56px', marginBottom: '16px' },
  title: {
    fontSize: '22px', fontWeight: '700', color: '#0d2137',
    margin: '0 0 10px', fontFamily: "'DM Sans', sans-serif",
  },
  body: {
    fontSize: '14px', color: '#6b7c93', lineHeight: 1.6,
    margin: '0 0 20px', fontFamily: "'DM Sans', sans-serif",
  },
  countdownBox: {
    background: '#f0faf4', border: '1px solid #a5d6a7',
    borderRadius: '10px', padding: '14px 20px', marginBottom: '20px',
  },
  countdownText: {
    fontSize: '14px', color: '#2e7d32', margin: '0 0 10px',
    fontFamily: "'DM Sans', sans-serif",
  },
  progressBar: {
    height: '6px', background: '#c8e6c9', borderRadius: '3px', overflow: 'hidden',
  },
  progressFill: {
    height: '100%', background: '#27ae60', borderRadius: '3px',
    transition: 'width 1s linear',
  },
  btnGroup: { display: 'flex', flexDirection: 'column', gap: '10px' },
  primaryBtn: {
    display: 'block', padding: '12px 24px', background: '#1a3c5e',
    color: '#fff', borderRadius: '8px', textDecoration: 'none',
    fontSize: '14px', fontWeight: '600', fontFamily: "'DM Sans', sans-serif",
    textAlign: 'center',
  },
  secondaryBtn: {
    display: 'block', padding: '11px 24px', border: '2px solid #1a3c5e',
    color: '#1a3c5e', borderRadius: '8px', textDecoration: 'none',
    fontSize: '14px', fontWeight: '600', fontFamily: "'DM Sans', sans-serif",
    textAlign: 'center',
  },
};

export default VerifyEmailPage;