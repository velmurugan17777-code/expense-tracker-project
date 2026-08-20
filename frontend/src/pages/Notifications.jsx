import React, { useState, useEffect } from 'react';
import { FiBell, FiCheck, FiCheckCircle, FiTrash2, FiInfo, FiAlertTriangle, FiAlertCircle } from 'react-icons/fi';
import api from '../services/api';

const NOTIF_ICONS = { warning: { icon: FiAlertTriangle, bg: '#FFF8E1', color: '#F57C00' }, danger: { icon: FiAlertCircle, bg: '#FFEBEE', color: '#E53935' }, info: { icon: FiInfo, bg: '#E3F2FD', color: '#1565C0' }, success: { icon: FiCheck, bg: '#E8F5E9', color: '#2E7D32' } };

const Notifications = () => {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchNotifs(); }, []);

  const fetchNotifs = async () => {
    try {
      const res = await api.get('/notifications/');
      setNotifs(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (_) {} finally { setLoading(false); }
  };

  const markRead = async (id) => {
    try { await api.post(`/notifications/${id}/read/`); setNotifs(p => p.map(n => n.id === id ? { ...n, is_read: true } : n)); } catch (_) {}
  };
  const markAll = async () => {
    try { await api.post('/notifications/read-all/'); setNotifs(p => p.map(n => ({ ...n, is_read: true }))); } catch (_) {}
  };

  const filtered = filter === 'unread' ? notifs.filter(n => !n.is_read) : notifs;
  const unread = notifs.filter(n => !n.is_read).length;

  return (
    <div className="animate-fade-in-up">
      <div className="page-header d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
        <div>
          <h1 className="page-title d-flex align-items-center gap-2">
            Notifications
            {unread > 0 && <span className="badge rounded-pill" style={{ background: 'var(--primary)', fontSize: '0.75rem' }}>{unread}</span>}
          </h1>
          <p className="page-subtitle">{unread > 0 ? `${unread} unread notifications` : 'All caught up!'}</p>
        </div>
        <div className="d-flex gap-2">
          {unread > 0 && (
            <button className="btn btn-sm btn-outline-primary fw-600 d-flex align-items-center gap-1" style={{ borderRadius: 10 }} onClick={markAll}>
              <FiCheckCircle size={13} /> Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Filter */}
      <div className="d-flex gap-2 mb-4">
        {['all', 'unread'].map(f => (
          <button key={f} className={`btn btn-sm fw-600 ${filter === f ? 'btn-primary' : 'btn-outline-secondary'}`}
            style={{ borderRadius: 10, textTransform: 'capitalize' }} onClick={() => setFilter(f)}>{f === 'all' ? 'All' : 'Unread'}</button>
        ))}
      </div>

      <div className="card">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-warning" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-5">
              <FiBell size={40} className="text-muted mb-3" />
              <p className="text-muted">No {filter === 'unread' ? 'unread ' : ''}notifications.</p>
            </div>
          ) : (
            filtered.map((n) => {
              const style = NOTIF_ICONS[n.type] || NOTIF_ICONS.info;
              const IconComp = style.icon;
              return (
                <div key={n.id} className={`notif-item ${!n.is_read ? 'unread' : ''}`} onClick={() => markRead(n.id)} style={{ cursor: n.is_read ? 'default' : 'pointer' }}>
                  <div className="notif-icon" style={{ background: style.bg, color: style.color }}><IconComp size={18} /></div>
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center justify-content-between gap-2">
                      <span className="fw-700" style={{ fontSize: '0.88rem', color: 'var(--text)' }}>{n.title}</span>
                      {!n.is_read && <span className="badge" style={{ background: 'var(--primary)', borderRadius: 6, fontSize: '0.65rem' }}>New</span>}
                    </div>
                    <p className="mb-0 mt-1" style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{n.message}</p>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{new Date(n.created_at).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
