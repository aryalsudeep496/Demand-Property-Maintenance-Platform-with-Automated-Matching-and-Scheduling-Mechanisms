import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usersAPI, requestsAPI } from '../../utils/requestsAPI';
import { StatusBadge, CategoryBadge } from '../../components/common/StatusBadge';

const NAV_LINKS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/admin/users',     label: 'Users',     icon: '👥' },
  { to: '/admin/requests',  label: 'Requests',  icon: '📋' },
];

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const location         = useLocation();

  const [stats,    setStats]    = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(1);
  const [pagination, setPagination] = useState({});

  const handleLogout = async () => { await logout(); navigate('/auth/login'); };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [statsRes, reqRes] = await Promise.all([
          usersAPI.adminGetStats(),
          requestsAPI.adminGetAll({ page, limit: 10 }),
        ]);
        setStats(statsRes.data.data);
        setRequests(reqRes.data.data || []);
        setPagination(reqRes.data.pagination || {});
      } catch (err) {
        console.error('AdminDashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [page]);

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const STAT_CARDS = stats ? [
    { icon: '👥', label: 'Total Users',       value: stats.totalUsers,           color: '#1a3c5e' },
    { icon: '🔧', label: 'Providers',          value: stats.totalProviders,       color: '#C17B2A' },
    { icon: '🟢', label: 'Available',          value: stats.availableProviders,   color: '#27ae60' },
    { icon: '🔴', label: 'Unavailable',        value: stats.unavailableProviders, color: '#e74c3c' },
    { icon: '👤', label: 'Customers',          value: stats.totalCustomers,       color: '#2a7a4a' },
    { icon: '📋', label: 'Total Requests',     value: stats.totalRequests,        color: '#1a3c5e' },
    { icon: '✅', label: 'Completed',           value: stats.completedRequests,    color: '#27ae60' },
    { icon: '⏳', label: 'Pending',             value: stats.pendingRequests,      color: '#e67e22' },
  ] : [];

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
          <span style={{ display: 'inline-block', padding: '3px 10px', background: '#C17B2A', borderRadius: '20px', fontSize: '11px', fontWeight: '800', color: '#fff' }}>ADMIN</span>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>{user?.firstName}</span>
          <button onClick={handleLogout} style={navBtnStyle}>🚪 Logout</button>
        </div>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '32px auto', padding: '0 20px' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0d2137', margin: '0 0 4px' }}>Admin Dashboard</h1>
          <p style={{ fontSize: '14px', color: '#6b7c93', margin: 0 }}>Platform overview and recent activity.</p>
        </div>

        {/* ── Stats grid ── */}
        {loading && !stats ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '28px' }}>
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} style={{ height: '90px', background: '#fff', borderRadius: '12px', border: '1px solid #e8ecf0', animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        ) : stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '28px' }}>
            {STAT_CARDS.map(({ icon, label, value, color }) => (
              <div key={label} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e8ecf0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', padding: '18px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', textAlign: 'center' }}>
                <span style={{ fontSize: '22px' }}>{icon}</span>
                <span style={{ fontSize: '22px', fontWeight: '800', color }}>{value}</span>
                <span style={{ fontSize: '11px', color: '#8a9bb0', fontWeight: '600' }}>{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Recent Requests ── */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0d2137', margin: 0 }}>Recent Requests</h2>
            <Link to="/admin/requests" style={{ fontSize: '13px', color: '#C17B2A', fontWeight: '700', textDecoration: 'none' }}>
              View all →
            </Link>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[1,2,3].map(i => <div key={i} style={{ height: '48px', background: '#f8fafc', borderRadius: '8px', animation: 'pulse 1.5s ease-in-out infinite' }} />)}
            </div>
          ) : requests.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#8a9bb0', fontSize: '14px', padding: '24px 0' }}>No requests found.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Title', 'Customer', 'Provider', 'Category', 'Status', 'Date'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#8a9bb0', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req, i) => (
                    <tr key={req._id} style={{ borderTop: '1px solid #f0f4f8', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                      <td style={{ padding: '12px 12px', color: '#1a2e44', fontWeight: '600', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <Link to={`/admin/requests/${req._id}`} style={{ color: '#1a2e44', textDecoration: 'none' }}>{req.title}</Link>
                      </td>
                      <td style={{ padding: '12px 12px', color: '#4a5568', whiteSpace: 'nowrap' }}>
                        {req.customer?.firstName} {req.customer?.lastName}
                      </td>
                      <td style={{ padding: '12px 12px', color: req.provider ? '#4a5568' : '#8a9bb0', whiteSpace: 'nowrap', fontStyle: req.provider ? 'normal' : 'italic' }}>
                        {req.provider ? `${req.provider.firstName} ${req.provider.lastName}` : 'Unassigned'}
                      </td>
                      <td style={{ padding: '12px 12px' }}>
                        <CategoryBadge category={req.category} />
                      </td>
                      <td style={{ padding: '12px 12px' }}>
                        <StatusBadge status={req.status} />
                      </td>
                      <td style={{ padding: '12px 12px', color: '#8a9bb0', whiteSpace: 'nowrap' }}>
                        {formatDate(req.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '20px', alignItems: 'center' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={paginationBtnStyle(page === 1)}>‹ Prev</button>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)} style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid #dde3eb', background: page === p ? '#1a3c5e' : '#fff', color: page === p ? '#fff' : '#4a5568', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>{p}</button>
              ))}
              <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} style={paginationBtnStyle(page === pagination.pages)}>Next ›</button>
            </div>
          )}
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
const paginationBtnStyle = (disabled) => ({
  padding: '8px 14px', borderRadius: '8px', border: '1px solid #dde3eb', background: '#fff',
  fontSize: '13px', fontWeight: '600', cursor: disabled ? 'not-allowed' : 'pointer',
  color: disabled ? '#c0cdd8' : '#4a5568', fontFamily: "'Outfit', sans-serif",
});

export default AdminDashboard;
