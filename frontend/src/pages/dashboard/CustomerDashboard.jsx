import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { requestsAPI, usersAPI, STATUS_CONFIG } from '../../utils/requestsAPI';
import { ToastContainer, playNotificationSound } from '../../components/NotificationToast';
import MiniChatPanel from '../../components/MiniChatPanel';

const NAV_LINKS = [
  { to: '/dashboard',              label: 'Home',           icon: '🏠' },
  { to: '/customer/request/new',   label: 'New Request',    icon: '➕' },
  { to: '/customer/requests',      label: 'My Requests',    icon: '📋' },
  { to: '/customer/notifications', label: 'Notifications',  icon: '🔔', notif: true },
];

const CustomerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const location         = useLocation();

  const { socket }    = useSocket();
  const toastIdRef    = useRef(0);

  const [stats,        setStats]        = useState(null);
  const [recentReqs,   setRecentReqs]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [unreadCount,  setUnreadCount]  = useState(0);
  const [toasts,       setToasts]       = useState([]);
  const [chatOpen,     setChatOpen]     = useState(false);
  const [chatUnread,   setChatUnread]   = useState(0);

  const handleLogout = async () => { await logout(); navigate('/auth/login'); };

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((toast) => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { ...toast, id }]);
    playNotificationSound();
  }, []);

  // ── Socket: listen for job match + schedule events ───────────────────────
  useEffect(() => {
    if (!socket) return;
    const handleJobMatched = (data) => {
      addToast({
        icon:      '🎉',
        title:     'Provider Matched!',
        message:   data.message || `A provider has been matched to "${data.title}"`,
        requestId: data.requestId,
        role:      'customer',
      });
      setUnreadCount(c => c + 1);
    };
    const handleScheduled = (data) => {
      addToast({
        icon:      '📅',
        title:     'Request Scheduled',
        message:   data.message || `Your request has been scheduled.`,
        requestId: data.requestId,
        role:      'customer',
      });
    };
    socket.on('job_matched',        handleJobMatched);
    socket.on('request_scheduled',  handleScheduled);
    return () => {
      socket.off('job_matched',       handleJobMatched);
      socket.off('request_scheduled', handleScheduled);
    };
  }, [socket, addToast]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [reqRes, notifRes] = await Promise.all([
        requestsAPI.getMy({ limit: 5 }),
        usersAPI.getNotifications({ unreadOnly: 'true', limit: 1 }),
      ]);

      const requests = reqRes.data.data || [];
      const total    = reqRes.data.pagination?.total || 0;
      setRecentReqs(requests);
      setUnreadCount(notifRes.data.unreadCount || 0);

      // Compute stats from the first page of results + pagination total
      const completed  = requests.filter(r => r.status === 'completed').length;
      const inProgress = requests.filter(r => r.status === 'in_progress').length;
      setStats({ total, completed, inProgress });

    } catch (err) {
      console.error('CustomerDashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const catIcon = (c) => ({ home_repair: '🔧', home_upgrade: '🏡', tech_digital: '💻' })[c] || '🛠️';

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', fontFamily: "'Outfit', sans-serif" }}>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Chat icon */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => { setChatOpen(o => !o); setChatUnread(0); }}
              style={{ position: 'relative', background: chatOpen ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '8px', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}
              title="Messages"
            >
              💬
              {chatUnread > 0 && (
                <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#e74c3c', color: '#fff', borderRadius: '10px', padding: '1px 5px', fontSize: '10px', fontWeight: '800', lineHeight: 1.4 }}>
                  {chatUnread}
                </span>
              )}
            </button>
            {chatOpen && (
              <>
                <div onClick={() => setChatOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 199 }} />
                <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: '620px', zIndex: 200, boxShadow: '0 12px 40px rgba(0,0,0,0.18)', borderRadius: '14px' }}>
                  <MiniChatPanel requests={recentReqs} onUnread={n => setChatUnread(n)} />
                </div>
              </>
            )}
          </div>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>👋 {user?.firstName}</span>
          <button onClick={handleLogout} style={navBtnStyle}>🚪 Logout</button>
        </div>
      </nav>

      <div style={{ maxWidth: '960px', margin: '32px auto', padding: '0 20px' }}>

        {/* ── Welcome ── */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0d2137', margin: '0 0 4px' }}>
            Welcome back, {user?.firstName}! 👋
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7c93', margin: 0 }}>
            Manage your property maintenance requests from here.
          </p>
        </div>

        {/* ── Stats row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
          {loading ? (
            [1,2,3].map(i => <div key={i} style={{ height: '90px', background: '#fff', borderRadius: '12px', border: '1px solid #e8ecf0', animation: 'pulse 1.5s ease-in-out infinite' }} />)
          ) : [
            { icon: '📋', label: 'Total Requests', value: stats?.total       ?? 0, color: '#1a3c5e' },
            { icon: '🔧', label: 'In Progress',    value: stats?.inProgress  ?? 0, color: '#e67e22' },
            { icon: '✅', label: 'Completed',       value: stats?.completed   ?? 0, color: '#27ae60' },
          ].map(({ icon, label, value, color }) => (
            <div key={label} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e8ecf0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', textAlign: 'center' }}>
              <span style={{ fontSize: '26px' }}>{icon}</span>
              <span style={{ fontSize: '28px', fontWeight: '800', color }}>{value}</span>
              <span style={{ fontSize: '12px', color: '#8a9bb0', fontWeight: '600' }}>{label}</span>
            </div>
          ))}
        </div>

        {/* ── Quick actions ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '28px' }}>
          {[
            { to: '/customer/request/new', icon: '➕', label: 'New Request',       desc: 'Book a maintenance service',        bg: '#C17B2A' },
            { to: '/customer/requests',    icon: '📋', label: 'My Requests',       desc: 'View and track your requests',      bg: '#1a3c5e' },
            { to: '/customer/notifications', icon: '🔔', label: 'Notifications',  desc: 'View your notifications',           bg: '#2a7a4a' },
          ].map(({ to, icon, label, desc, bg }) => (
            <Link key={to} to={to} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '20px', background: bg, borderRadius: '12px', textDecoration: 'none', boxShadow: `0 4px 14px ${bg}44`, transition: 'transform 0.2s, box-shadow 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <span style={{ fontSize: '28px' }}>{icon}</span>
              <span style={{ fontSize: '15px', fontWeight: '800', color: '#fff' }}>{label}</span>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)' }}>{desc}</span>
            </Link>
          ))}
        </div>

        {/* ── Recent requests ── */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0d2137', margin: 0 }}>Recent Requests</h2>
            <Link to="/customer/requests" style={{ fontSize: '13px', color: '#C17B2A', fontWeight: '700', textDecoration: 'none' }}>View all →</Link>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[1,2,3].map(i => <div key={i} style={{ height: '72px', background: '#f8fafc', borderRadius: '10px', animation: 'pulse 1.5s ease-in-out infinite' }} />)}
            </div>
          ) : recentReqs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 24px' }}>
              <div style={{ fontSize: '44px', marginBottom: '12px' }}>📭</div>
              <p style={{ fontSize: '14px', color: '#8a9bb0', margin: '0 0 16px' }}>You have no requests yet.</p>
              <Link to="/customer/request/new" style={{ display: 'inline-block', padding: '10px 24px', background: '#C17B2A', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: '700' }}>
                Book your first service
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentReqs.map(req => {
                const cfg = STATUS_CONFIG[req.status] || {};
                return (
                  <Link key={req._id} to={`/customer/requests/${req._id}`} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e8ecf0', textDecoration: 'none', transition: 'background 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#eef3f9'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; }}
                  >
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fff', border: '1px solid #e8ecf0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                      {catIcon(req.category)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '14px', fontWeight: '700', color: '#1a2e44', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.title}</p>
                      <p style={{ fontSize: '12px', color: '#8a9bb0', margin: 0 }}>📍 {req.location?.city} · 🗓 {formatDate(req.createdAt)}</p>
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

        {/* ── Account info ── */}
        <div style={{ ...cardStyle, marginTop: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#0d2137', margin: '0 0 14px' }}>Account</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            {[
              { label: 'Name',   value: `${user?.firstName} ${user?.lastName}` },
              { label: 'Email',  value: user?.email },
              { label: 'Role',   value: 'Customer' },
              { label: 'Status', value: '✅ Active', highlight: true },
            ].map(({ label, value, highlight }) => (
              <div key={label} style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e8ecf0' }}>
                <p style={{ fontSize: '10px', fontWeight: '700', color: '#8a9bb0', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 3px' }}>{label}</p>
                <p style={{ fontSize: '14px', fontWeight: '600', color: highlight ? '#27ae60' : '#1a2e44', margin: 0 }}>{value}</p>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/account/change-password" style={{ padding: '9px 18px', background: '#1a3c5e', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: '700' }}>
              🔐 Change Password
            </Link>
            <button onClick={handleLogout} style={{ padding: '9px 18px', background: '#e74c3c', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>
              🚪 Logout
            </button>
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

export default CustomerDashboard;
