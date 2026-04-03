import React, { useEffect, useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { requestsAPI } from '../../utils/requestsAPI';
import { UrgencyBadge, CategoryBadge } from '../../components/common/StatusBadge';

const NAV_LINKS = [
  { to: '/provider/dashboard', label: 'Home',      icon: '🏠' },
  { to: '/provider/requests',  label: 'My Jobs',   icon: '📋' },
  { to: '/provider/available', label: 'Available',  icon: '🔍' },
  { to: '/provider/profile',   label: 'Profile',   icon: '👤' },
];

const AvailableJobsPage = () => {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const location         = useLocation();

  const [jobs,      setJobs]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');

  const handleLogout = async () => { await logout(); navigate('/auth/login'); };

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await requestsAPI.getAvailable();
      setJobs(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load available jobs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const catIcon = (c) => ({ home_repair: '🔧', home_upgrade: '🏡', tech_digital: '💻' })[c] || '🛠️';

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', fontFamily: "'Outfit', sans-serif" }}>

      {/* ── Navbar ── */}
      <nav style={navStyle}>
        <Link to="/home" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <span style={{ fontSize: '20px' }}>🏠</span>
          <span style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>PropMaintain</span>
        </Link>
        <div style={{ display: 'flex', gap: '4px' }}>
          {NAV_LINKS.map(({ to, label, icon }) => (
            <Link key={to} to={to} style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '6px 12px', borderRadius: '6px', textDecoration: 'none',
              fontSize: '13px', fontWeight: '500',
              color: location.pathname === to ? '#fff' : 'rgba(255,255,255,0.7)',
              background: location.pathname === to ? 'rgba(255,255,255,0.15)' : 'transparent',
            }}>
              {icon} {label}
            </Link>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>👋 {user?.firstName}</span>
          <button onClick={handleLogout} style={navBtnStyle}>🚪 Logout</button>
        </div>
      </nav>

      <div style={{ maxWidth: '900px', margin: '32px auto', padding: '0 20px' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0d2137', margin: '0 0 4px' }}>Available Jobs</h1>
            <p style={{ fontSize: '14px', color: '#6b7c93', margin: 0 }}>
              Open jobs matching your service categories.
            </p>
          </div>
          <button
            onClick={fetchJobs}
            disabled={loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px', background: '#1a3c5e', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '14px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'Outfit', sans-serif", opacity: loading ? 0.7 : 1 }}
          >
            🔄 {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {/* ── Error ── */}
        {error && (
          <div style={{ background: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '10px', padding: '14px 18px', marginBottom: '18px', fontSize: '14px', color: '#721c24', fontWeight: '600' }}>
            ⚠️ {error}
          </div>
        )}

        {/* ── Job cards ── */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: '130px', background: '#fff', borderRadius: '12px', border: '1px solid #e8ecf0', animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', background: '#fff', borderRadius: '14px', border: '1px solid #e8ecf0' }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>🔍</div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1a2e44', margin: '0 0 8px' }}>No jobs available right now</h3>
            <p style={{ fontSize: '14px', color: '#8a9bb0', marginBottom: '20px' }}>
              There are no open jobs matching your service categories at this time. Check back later or update your profile categories.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={fetchJobs} style={{ padding: '11px 24px', background: '#C17B2A', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>
                🔄 Refresh
              </button>
              <Link to="/provider/profile" style={{ display: 'inline-block', padding: '11px 24px', background: '#1a3c5e', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: '700' }}>
                ✏️ Update Profile
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {jobs.map(job => (
              <div
                key={job._id}
                style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e8ecf0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' }}
              >
                <div style={{ padding: '20px 22px' }}>
                  {/* Top row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '12px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f0f4f8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>
                      {catIcon(job.category)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1a2e44', margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {job.title}
                      </h3>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <CategoryBadge category={job.category} />
                        <UrgencyBadge  urgency={job.urgency} />
                      </div>
                    </div>
                  </div>

                  {/* Description preview */}
                  <p style={{ fontSize: '13px', color: '#4a5568', margin: '0 0 12px', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {job.description}
                  </p>

                  {/* Meta */}
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#8a9bb0', flexWrap: 'wrap', marginBottom: '16px' }}>
                    <span>📍 {job.location?.city}{job.location?.postcode ? `, ${job.location.postcode}` : ''}</span>
                    <span>🗓 {formatDate(job.createdAt)}</span>
                    <span>👤 {job.customer?.firstName} {job.customer?.lastName}</span>
                  </div>

                  {/* CTA */}
                  <Link
                    to={`/provider/requests/${job._id}`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 22px', background: '#C17B2A', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: '700', boxShadow: '0 3px 10px rgba(193,123,42,0.25)' }}
                  >
                    View &amp; Accept →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
};

const navStyle = {
  height: '60px', background: '#1a3c5e', display: 'flex', alignItems: 'center',
  padding: '0 28px', justifyContent: 'space-between',
  boxShadow: '0 2px 8px rgba(0,0,0,0.15)', position: 'sticky', top: 0, zIndex: 100,
};
const navBtnStyle = {
  padding: '7px 14px', background: 'rgba(255,255,255,0.15)',
  border: '1px solid rgba(255,255,255,0.3)', borderRadius: '6px',
  color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
};

export default AvailableJobsPage;
