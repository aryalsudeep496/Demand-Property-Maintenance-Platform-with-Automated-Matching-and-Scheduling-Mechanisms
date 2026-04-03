import React, { useEffect, useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usersAPI } from '../../utils/requestsAPI';

const NAV_LINKS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/admin/users',     label: 'Users',     icon: '👥' },
  { to: '/admin/requests',  label: 'Requests',  icon: '📋' },
];

const CATEGORY_LABELS = {
  home_repair:  'Home Repair',
  home_upgrade: 'Home Upgrade',
  tech_digital: 'Tech & Digital',
};

const AdminUsersPage = () => {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const location         = useLocation();

  const [tab,         setTab]         = useState('providers');
  const [providers,   setProviders]   = useState([]);
  const [customers,   setCustomers]   = useState([]);
  const [loadingP,    setLoadingP]    = useState(false);
  const [loadingC,    setLoadingC]    = useState(false);
  const [actionId,    setActionId]    = useState(null);
  const [serverError, setServerError] = useState('');
  const [successMsg,  setSuccessMsg]  = useState('');
  const [pageP,       setPageP]       = useState(1);
  const [pageC,       setPageC]       = useState(1);
  const [paginationP, setPaginationP] = useState({});
  const [paginationC, setPaginationC] = useState({});

  const handleLogout = async () => { await logout(); navigate('/auth/login'); };

  const fetchProviders = useCallback(async () => {
    setLoadingP(true);
    try {
      const res = await usersAPI.adminGetProviders({ page: pageP, limit: 15 });
      setProviders(res.data.data || []);
      setPaginationP(res.data.pagination || {});
    } catch (err) {
      setServerError('Failed to load providers.');
    } finally {
      setLoadingP(false);
    }
  }, [pageP]);

  const fetchCustomers = useCallback(async () => {
    setLoadingC(true);
    try {
      const res = await usersAPI.adminGetCustomers({ page: pageC, limit: 15 });
      setCustomers(res.data.data || []);
      setPaginationC(res.data.pagination || {});
    } catch (err) {
      setServerError('Failed to load customers.');
    } finally {
      setLoadingC(false);
    }
  }, [pageC]);

  useEffect(() => { fetchProviders(); }, [fetchProviders]);
  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const flash = (msg, isError = false) => {
    if (isError) { setServerError(msg); setTimeout(() => setServerError(''), 4000); }
    else { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 4000); }
  };

  const handleVerify = async (id) => {
    setActionId(id);
    try {
      await usersAPI.adminVerifyProvider(id);
      setProviders(prev => prev.map(p => p._id === id ? { ...p, providerProfile: { ...p.providerProfile, isVerified: true } } : p));
      flash('Provider verified successfully.');
    } catch (err) {
      flash(err.response?.data?.message || 'Failed to verify provider.', true);
    } finally {
      setActionId(null);
    }
  };

  const handleSuspend = async (id, isSuspended, listType) => {
    setActionId(id);
    try {
      const res = await usersAPI.adminToggleSuspend(id);
      const newVal = res.data.isSuspended;
      if (listType === 'provider') {
        setProviders(prev => prev.map(p => p._id === id ? { ...p, isSuspended: newVal } : p));
      } else {
        setCustomers(prev => prev.map(c => c._id === id ? { ...c, isSuspended: newVal } : c));
      }
      flash(`User ${newVal ? 'suspended' : 'unsuspended'} successfully.`);
    } catch (err) {
      flash(err.response?.data?.message || 'Failed to update user.', true);
    } finally {
      setActionId(null);
    }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

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

      <div style={{ maxWidth: '1100px', margin: '32px auto', padding: '0 20px' }}>

        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0d2137', margin: '0 0 4px' }}>User Management</h1>
          <p style={{ fontSize: '14px', color: '#6b7c93', margin: 0 }}>Verify providers and manage user accounts.</p>
        </div>

        {/* ── Alerts ── */}
        {serverError && (
          <div style={{ background: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', fontSize: '14px', color: '#721c24', fontWeight: '600' }}>
            ⚠️ {serverError}
          </div>
        )}
        {successMsg && (
          <div style={{ background: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', fontSize: '14px', color: '#155724', fontWeight: '600' }}>
            ✅ {successMsg}
          </div>
        )}

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', gap: '0', marginBottom: '0', borderBottom: '2px solid #e8ecf0' }}>
          {[
            { key: 'providers', label: '🔧 Providers', count: paginationP.total },
            { key: 'customers', label: '👤 Customers', count: paginationC.total },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                padding: '10px 22px', border: 'none', background: 'none', cursor: 'pointer',
                fontSize: '14px', fontWeight: '700', fontFamily: "'Outfit', sans-serif",
                color: tab === key ? '#1a3c5e' : '#8a9bb0',
                borderBottom: tab === key ? '2px solid #1a3c5e' : '2px solid transparent',
                marginBottom: '-2px',
              }}
            >
              {label} {count !== undefined && <span style={{ marginLeft: '6px', padding: '1px 7px', background: tab === key ? '#e8f0f8' : '#f0f4f8', borderRadius: '12px', fontSize: '11px' }}>{count}</span>}
            </button>
          ))}
        </div>

        {/* ── Providers Table ── */}
        {tab === 'providers' && (
          <div style={{ ...cardStyle, borderTopLeftRadius: 0 }}>
            {loadingP ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[1,2,3].map(i => <div key={i} style={{ height: '48px', background: '#f8fafc', borderRadius: '8px', animation: 'pulse 1.5s ease-in-out infinite' }} />)}
              </div>
            ) : providers.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#8a9bb0', padding: '32px 0', fontSize: '14px' }}>No providers found.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      {['Name', 'Email', 'Categories', 'Rating', 'Verified', 'Suspended', 'Joined', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#8a9bb0', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {providers.map((p, i) => (
                      <tr key={p._id} style={{ borderTop: '1px solid #f0f4f8', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                        <td style={{ padding: '12px 12px', color: '#1a2e44', fontWeight: '600', whiteSpace: 'nowrap' }}>
                          {p.firstName} {p.lastName}
                        </td>
                        <td style={{ padding: '12px 12px', color: '#4a5568' }}>{p.email}</td>
                        <td style={{ padding: '12px 12px' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {(p.providerProfile?.serviceCategories || []).length === 0
                              ? <span style={{ color: '#8a9bb0', fontStyle: 'italic', fontSize: '12px' }}>None</span>
                              : (p.providerProfile.serviceCategories).map(c => (
                                <span key={c} style={{ padding: '2px 8px', background: '#e8f0f8', color: '#1a3c5e', borderRadius: '12px', fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                                  {CATEGORY_LABELS[c] || c}
                                </span>
                              ))
                            }
                          </div>
                        </td>
                        <td style={{ padding: '12px 12px', color: '#4a5568', whiteSpace: 'nowrap' }}>
                          ⭐ {p.providerProfile?.averageRating?.toFixed(1) ?? 'N/A'}
                          {p.providerProfile?.totalReviews > 0 && <span style={{ color: '#8a9bb0', fontSize: '11px' }}> ({p.providerProfile.totalReviews})</span>}
                        </td>
                        <td style={{ padding: '12px 12px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', background: p.providerProfile?.isVerified ? '#d4edda' : '#fff3cd', color: p.providerProfile?.isVerified ? '#155724' : '#856404' }}>
                            {p.providerProfile?.isVerified ? 'Verified' : 'Unverified'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 12px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', background: p.isSuspended ? '#f8d7da' : '#d4edda', color: p.isSuspended ? '#721c24' : '#155724' }}>
                            {p.isSuspended ? 'Suspended' : 'Active'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 12px', color: '#8a9bb0', whiteSpace: 'nowrap' }}>{formatDate(p.createdAt)}</td>
                        <td style={{ padding: '12px 12px' }}>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'nowrap' }}>
                            {!p.providerProfile?.isVerified && (
                              <button
                                onClick={() => handleVerify(p._id)}
                                disabled={actionId === p._id}
                                style={{ padding: '5px 12px', background: '#1a3c5e', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: actionId === p._id ? 'not-allowed' : 'pointer', fontFamily: "'Outfit', sans-serif", whiteSpace: 'nowrap', opacity: actionId === p._id ? 0.6 : 1 }}
                              >
                                {actionId === p._id ? '…' : '✓ Verify'}
                              </button>
                            )}
                            <button
                              onClick={() => handleSuspend(p._id, p.isSuspended, 'provider')}
                              disabled={actionId === p._id}
                              style={{ padding: '5px 12px', background: p.isSuspended ? '#27ae60' : '#e74c3c', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: actionId === p._id ? 'not-allowed' : 'pointer', fontFamily: "'Outfit', sans-serif", whiteSpace: 'nowrap', opacity: actionId === p._id ? 0.6 : 1 }}
                            >
                              {actionId === p._id ? '…' : p.isSuspended ? 'Unsuspend' : 'Suspend'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {paginationP.pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '20px', alignItems: 'center' }}>
                <button onClick={() => setPageP(p => Math.max(1, p - 1))} disabled={pageP === 1} style={paginationBtnStyle(pageP === 1)}>‹ Prev</button>
                {Array.from({ length: paginationP.pages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPageP(p)} style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid #dde3eb', background: pageP === p ? '#1a3c5e' : '#fff', color: pageP === p ? '#fff' : '#4a5568', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>{p}</button>
                ))}
                <button onClick={() => setPageP(p => Math.min(paginationP.pages, p + 1))} disabled={pageP === paginationP.pages} style={paginationBtnStyle(pageP === paginationP.pages)}>Next ›</button>
              </div>
            )}
          </div>
        )}

        {/* ── Customers Table ── */}
        {tab === 'customers' && (
          <div style={{ ...cardStyle, borderTopLeftRadius: 0 }}>
            {loadingC ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[1,2,3].map(i => <div key={i} style={{ height: '48px', background: '#f8fafc', borderRadius: '8px', animation: 'pulse 1.5s ease-in-out infinite' }} />)}
              </div>
            ) : customers.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#8a9bb0', padding: '32px 0', fontSize: '14px' }}>No customers found.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      {['Name', 'Email', 'Verified', 'Status', 'Joined', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#8a9bb0', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c, i) => (
                      <tr key={c._id} style={{ borderTop: '1px solid #f0f4f8', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                        <td style={{ padding: '12px 12px', color: '#1a2e44', fontWeight: '600', whiteSpace: 'nowrap' }}>
                          {c.firstName} {c.lastName}
                        </td>
                        <td style={{ padding: '12px 12px', color: '#4a5568' }}>{c.email}</td>
                        <td style={{ padding: '12px 12px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', background: c.isEmailVerified ? '#d4edda' : '#fff3cd', color: c.isEmailVerified ? '#155724' : '#856404' }}>
                            {c.isEmailVerified ? 'Verified' : 'Unverified'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 12px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', background: c.isSuspended ? '#f8d7da' : '#d4edda', color: c.isSuspended ? '#721c24' : '#155724' }}>
                            {c.isSuspended ? 'Suspended' : 'Active'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 12px', color: '#8a9bb0', whiteSpace: 'nowrap' }}>{formatDate(c.createdAt)}</td>
                        <td style={{ padding: '12px 12px' }}>
                          <button
                            onClick={() => handleSuspend(c._id, c.isSuspended, 'customer')}
                            disabled={actionId === c._id}
                            style={{ padding: '5px 12px', background: c.isSuspended ? '#27ae60' : '#e74c3c', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: actionId === c._id ? 'not-allowed' : 'pointer', fontFamily: "'Outfit', sans-serif", whiteSpace: 'nowrap', opacity: actionId === c._id ? 0.6 : 1 }}
                          >
                            {actionId === c._id ? '…' : c.isSuspended ? 'Unsuspend' : 'Suspend'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {paginationC.pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '20px', alignItems: 'center' }}>
                <button onClick={() => setPageC(p => Math.max(1, p - 1))} disabled={pageC === 1} style={paginationBtnStyle(pageC === 1)}>‹ Prev</button>
                {Array.from({ length: paginationC.pages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPageC(p)} style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid #dde3eb', background: pageC === p ? '#1a3c5e' : '#fff', color: pageC === p ? '#fff' : '#4a5568', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>{p}</button>
                ))}
                <button onClick={() => setPageC(p => Math.min(paginationC.pages, p + 1))} disabled={pageC === paginationC.pages} style={paginationBtnStyle(pageC === paginationC.pages)}>Next ›</button>
              </div>
            )}
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
const cardStyle = {
  background: '#fff', borderRadius: '12px', border: '1px solid #e8ecf0',
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)', padding: '24px',
};
const paginationBtnStyle = (disabled) => ({
  padding: '8px 14px', borderRadius: '8px', border: '1px solid #dde3eb', background: '#fff',
  fontSize: '13px', fontWeight: '600', cursor: disabled ? 'not-allowed' : 'pointer',
  color: disabled ? '#c0cdd8' : '#4a5568', fontFamily: "'Outfit', sans-serif",
});

export default AdminUsersPage;
