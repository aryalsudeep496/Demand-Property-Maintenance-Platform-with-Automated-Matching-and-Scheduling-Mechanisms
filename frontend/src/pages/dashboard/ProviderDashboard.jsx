import React, { useEffect, useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { requestsAPI, usersAPI, STATUS_CONFIG } from '../../utils/requestsAPI';

const NAV_LINKS = [
  { to: '/provider/dashboard',     label: 'Home',          icon: '🏠' },
  { to: '/provider/requests',      label: 'My Jobs',       icon: '📋' },
  { to: '/provider/available',     label: 'Available',      icon: '🔍' },
  { to: '/provider/profile',       label: 'Profile',       icon: '👤' },
  { to: '/provider/notifications', label: 'Notifications', icon: '🔔', notif: true },
];

const ProviderDashboard = () => {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const location         = useLocation();

  const [stats,       setStats]       = useState(null);
  const [recentJobs,  setRecentJobs]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toggling,    setToggling]    = useState(false);
  const [isAvailable, setIsAvailable] = useState(user?.providerProfile?.isAvailable ?? true);

  const handleLogout = async () => { await logout(); navigate('/auth/login'); };

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [jobRes, notifRes] = await Promise.all([
        requestsAPI.getMy({ limit: 5 }),
        usersAPI.getNotifications({ unreadOnly: 'true', limit: 1 }),
      ]);

      const jobs  = jobRes.data.data || [];
      const total = jobRes.data.pagination?.total || 0;
      setRecentJobs(jobs);
      setUnreadCount(notifRes.data.unreadCount || 0);

      const completed  = jobs.filter(j => j.status === 'completed').length;
      const inProgress = jobs.filter(j => j.status === 'in_progress').length;
      setStats({ total, completed, inProgress });

    } catch (err) {
      console.error('ProviderDashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  useEffect(() => {
    if (user?.providerProfile) {
      setIsAvailable(user.providerProfile.isAvailable ?? true);
    }
  }, [user]);

  const handleToggleAvailability = async () => {
    setToggling(true);
    try {
      const res = await usersAPI.toggleAvailability();
      setIsAvailable(res.data.isAvailable);
    } catch (err) {
      console.error('toggleAvailability error:', err);
    } finally {
      setToggling(false);
    }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const catIcon = (c) => ({ home_repair: '🔧', home_upgrade: '🏡', tech_digital: '💻' })[c] || '🛠️';

  const isVerified = user?.providerProfile?.isVerified;

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', fontFamily: "'Outfit', sans-serif" }}>

      {/* ── Navbar ── */}
      <nav style={navStyle}>
        <Link to="/home" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <span style={{ fontSize: '20px' }}>🏠</span>
          <span style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>PropMaintain</span>
        </Link>
        <div style={{ display: 'flex', gap: '4px' }}>
          {NAV_LINKS.map(({ to, label, icon, notif }) => (
            <Link key={to} to={to} style={{
              display: 'flex', alignItems: 'center', gap: '5px', position: 'relative',
              padding: '6px 12px', borderRadius: '6px', textDecoration: 'none',
              fontSize: '13px', fontWeight: '500',
              color: location.pathname === to ? '#fff' : 'rgba(255,255,255,0.7)',
              background: location.pathname === to ? 'rgba(255,255,255,0.15)' : 'transparent',
            }}>
              {icon} {label}
              {notif && unreadCount > 0 && (
                <span style={{ position: 'absolute', top: '2px', right: '4px', width: '16px', height: '16px', borderRadius: '50%', background: '#C17B2A', color: '#fff', fontSize: '9px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>👋 {user?.firstName}</span>
          <button onClick={handleLogout} style={navBtnStyle}>🚪 Logout</button>
        </div>
      </nav>

      <div style={{ maxWidth: '960px', margin: '32px auto', padding: '0 20px' }}>

        {/* ── Welcome row ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0d2137', margin: '0 0 4px' }}>
              Welcome back, {user?.firstName}! 👋
            </h1>
            <p style={{ fontSize: '14px', color: '#6b7c93', margin: 0 }}>
              {isVerified
                ? '✅ Verified Provider'
                : '⏳ Verification pending — complete your profile to get started.'}
            </p>
          </div>

          {/* Availability toggle */}
          <button
            onClick={handleToggleAvailability}
            disabled={toggling}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 22px', borderRadius: '30px', border: 'none',
              cursor: toggling ? 'not-allowed' : 'pointer',
              fontFamily: "'Outfit', sans-serif", fontSize: '14px', fontWeight: '700',
              background: isAvailable ? '#27ae60' : '#e74c3c',
              color: '#fff', boxShadow: `0 4px 12px ${isAvailable ? '#27ae6044' : '#e74c3c44'}`,
              opacity: toggling ? 0.7 : 1, transition: 'background 0.25s',
            }}
          >
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'rgba(255,255,255,0.8)', display: 'inline-block' }} />
            {toggling ? 'Updating…' : isAvailable ? 'Available for Jobs' : 'Unavailable'}
          </button>
        </div>

        {/* ── Stats row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
          {loading ? (
            [1,2,3,4].map(i => <div key={i} style={{ height: '90px', background: '#fff', borderRadius: '12px', border: '1px solid #e8ecf0', animation: 'pulse 1.5s ease-in-out infinite' }} />)
          ) : [
            { icon: '📋', label: 'Total Jobs',    value: stats?.total      ?? 0, color: '#1a3c5e' },
            { icon: '🔧', label: 'In Progress',   value: stats?.inProgress ?? 0, color: '#e67e22' },
            { icon: '✅', label: 'Completed',      value: stats?.completed  ?? 0, color: '#27ae60' },
            { icon: '⭐', label: 'Rating',         value: user?.providerProfile?.averageRating ? user.providerProfile.averageRating.toFixed(1) : 'N/A', color: '#C17B2A' },
          ].map(({ icon, label, value, color }) => (
            <div key={label} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e8ecf0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', textAlign: 'center' }}>
              <span style={{ fontSize: '26px' }}>{icon}</span>
              <span style={{ fontSize: '26px', fontWeight: '800', color }}>{value}</span>
              <span style={{ fontSize: '12px', color: '#8a9bb0', fontWeight: '600' }}>{label}</span>
            </div>
          ))}
        </div>

        {/* ── Quick links ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '28px' }}>
          {[
            { to: '/provider/requests',      icon: '📋', label: 'My Jobs',        desc: 'View assigned jobs',         bg: '#1a3c5e' },
            { to: '/provider/available',     icon: '🔍', label: 'Browse Jobs',    desc: 'Find open requests',         bg: '#C17B2A' },
            { to: '/provider/profile',       icon: '👤', label: 'My Profile',     desc: 'Update your details',        bg: '#2a7a4a' },
            { to: '/provider/notifications', icon: '🔔', label: 'Notifications',  desc: 'Stay up to date',            bg: '#6c3483' },
          ].map(({ to, icon, label, desc, bg }) => (
            <Link key={to} to={to} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '18px', background: bg, borderRadius: '12px', textDecoration: 'none', boxShadow: `0 4px 14px ${bg}44`, transition: 'transform 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <span style={{ fontSize: '24px' }}>{icon}</span>
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>{label}</span>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)' }}>{desc}</span>
            </Link>
          ))}
        </div>

        {/* ── Recent jobs ── */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0d2137', margin: 0 }}>Recent Jobs</h2>
            <Link to="/provider/requests" style={{ fontSize: '13px', color: '#C17B2A', fontWeight: '700', textDecoration: 'none' }}>View all →</Link>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[1,2,3].map(i => <div key={i} style={{ height: '72px', background: '#f8fafc', borderRadius: '10px', animation: 'pulse 1.5s ease-in-out infinite' }} />)}
            </div>
          ) : recentJobs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 24px' }}>
              <div style={{ fontSize: '44px', marginBottom: '12px' }}>🗂️</div>
              <p style={{ fontSize: '14px', color: '#8a9bb0', margin: '0 0 16px' }}>No jobs assigned yet.</p>
              <Link to="/provider/available" style={{ display: 'inline-block', padding: '10px 24px', background: '#C17B2A', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: '700' }}>
                Browse Available Jobs
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentJobs.map(job => {
                const cfg = STATUS_CONFIG[job.status] || {};
                return (
                  <Link key={job._id} to={`/provider/requests/${job._id}`} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e8ecf0', textDecoration: 'none', transition: 'background 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#eef3f9'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; }}
                  >
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fff', border: '1px solid #e8ecf0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                      {catIcon(job.category)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '14px', fontWeight: '700', color: '#1a2e44', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.title}</p>
                      <p style={{ fontSize: '12px', color: '#8a9bb0', margin: 0 }}>
                        👤 {job.customer?.firstName} {job.customer?.lastName} · 📍 {job.location?.city} · 🗓 {formatDate(job.createdAt)}
                      </p>
                    </div>
                    <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap' }}>
                      {cfg.icon} {cfg.label}
                    </span>
                    <span style={{ fontSize: '16px', color: '#dde3eb' }}>›</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Profile & services ── */}
        <div style={{ ...cardStyle, marginTop: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#0d2137', margin: '0 0 14px' }}>My Profile</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            {[
              { label: 'Name',         value: `${user?.firstName} ${user?.lastName}` },
              { label: 'Email',        value: user?.email },
              { label: 'Business',     value: user?.providerProfile?.businessName || 'Not set' },
              { label: 'Verification', value: isVerified ? '✅ Verified' : '⏳ Pending', highlight: true, hColor: isVerified ? '#27ae60' : '#e67e22' },
            ].map(({ label, value, highlight, hColor }) => (
              <div key={label} style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e8ecf0' }}>
                <p style={{ fontSize: '10px', fontWeight: '700', color: '#8a9bb0', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 3px' }}>{label}</p>
                <p style={{ fontSize: '14px', fontWeight: '600', color: highlight ? hColor : '#1a2e44', margin: 0 }}>{value}</p>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/provider/profile" style={{ padding: '9px 18px', background: '#C17B2A', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: '700' }}>
              ✏️ Edit Profile
            </Link>
            <Link to="/account/change-password" style={{ padding: '9px 18px', background: '#1a3c5e', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: '700' }}>
              🔐 Change Password
            </Link>
          </div>
        </div>
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
const cardStyle = {
  background: '#fff', borderRadius: '12px', border: '1px solid #e8ecf0',
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)', padding: '24px',
};

export default ProviderDashboard;
