import React, { useEffect, useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { requestsAPI } from '../../utils/requestsAPI';
import { StatusBadge, UrgencyBadge, CategoryBadge } from '../../components/common/StatusBadge';

const NAV_LINKS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/admin/users',     label: 'Users',     icon: '👥' },
  { to: '/admin/requests',  label: 'Requests',  icon: '📋' },
];

const STATUS_OPTIONS = [
  { value: '',            label: 'All Statuses' },
  { value: 'pending',     label: 'Pending' },
  { value: 'matched',     label: 'Matched' },
  { value: 'scheduled',   label: 'Scheduled' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed',   label: 'Completed' },
  { value: 'cancelled',   label: 'Cancelled' },
];

const CATEGORY_OPTIONS = [
  { value: '',             label: 'All Categories' },
  { value: 'home_repair',  label: 'Home Repair' },
  { value: 'home_upgrade', label: 'Home Upgrade' },
  { value: 'tech_digital', label: 'Tech & Digital' },
];

const AdminRequestsPage = () => {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const location         = useLocation();

  const [requests,    setRequests]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [statusFilter,  setStatusFilter]  = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page,        setPage]        = useState(1);
  const [pagination,  setPagination]  = useState({});

  const handleLogout = async () => { await logout(); navigate('/auth/login'); };

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (statusFilter)   params.status   = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      const res = await requestsAPI.adminGetAll(params);
      setRequests(res.data.data || []);
      setPagination(res.data.pagination || {});
    } catch (err) {
      console.error('adminGetRequests error:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, page]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleFilterChange = (key, val) => {
    if (key === 'status')   { setStatusFilter(val);   }
    if (key === 'category') { setCategoryFilter(val); }
    setPage(1);
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const selectStyle = {
    padding: '8px 12px', border: '1px solid #dde3eb', borderRadius: '8px',
    fontSize: '13px', color: '#1a2e44', background: '#fff',
    fontFamily: "'Outfit', sans-serif", cursor: 'pointer', outline: 'none',
  };

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
          <button onClick={handleLogout} style={navBtnStyle}>🚪 Logout</button>
        </div>
      </nav>

      <div style={{ maxWidth: '1200px', margin: '32px auto', padding: '0 20px' }}>

        {/* ── Header + filters ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0d2137', margin: '0 0 4px' }}>All Requests</h1>
            <p style={{ fontSize: '14px', color: '#6b7c93', margin: 0 }}>
              {pagination.total ?? '…'} total request{pagination.total !== 1 ? 's' : ''}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <select value={statusFilter} onChange={e => handleFilterChange('status', e.target.value)} style={selectStyle}>
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select value={categoryFilter} onChange={e => handleFilterChange('category', e.target.value)} style={selectStyle}>
              {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* ── Table ── */}
        <div style={cardStyle}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[1,2,3,4].map(i => <div key={i} style={{ height: '52px', background: '#f8fafc', borderRadius: '8px', animation: 'pulse 1.5s ease-in-out infinite' }} />)}
            </div>
          ) : requests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1a2e44', margin: '0 0 6px' }}>No requests found</h3>
              <p style={{ fontSize: '13px', color: '#8a9bb0' }}>Try adjusting the filters.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Title', 'Customer', 'Provider', 'Category', 'Status', 'Urgency', 'Date', ''].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#8a9bb0', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req, i) => (
                    <tr key={req._id} style={{ borderTop: '1px solid #f0f4f8', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                      <td style={{ padding: '12px 12px', color: '#1a2e44', fontWeight: '600', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {req.title}
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
                      <td style={{ padding: '12px 12px' }}>
                        <UrgencyBadge urgency={req.urgency} />
                      </td>
                      <td style={{ padding: '12px 12px', color: '#8a9bb0', whiteSpace: 'nowrap' }}>
                        {formatDate(req.createdAt)}
                      </td>
                      <td style={{ padding: '12px 12px' }}>
                        <Link
                          to={`/admin/requests/${req._id}`}
                          style={{ padding: '5px 12px', background: '#f0f4f8', color: '#1a3c5e', border: '1px solid #dde3eb', borderRadius: '6px', textDecoration: 'none', fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap' }}
                        >
                          View →
                        </Link>
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
              {Array.from({ length: Math.min(pagination.pages, 10) }, (_, i) => i + 1).map(p => (
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

export default AdminRequestsPage;
