import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiCheckCircle } from 'react-icons/fi';
import api from '../services/api';

const fmt = (n) => `₹${Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:2})}`;

const GOAL_EMOJIS = ['🏠','🚗','✈️','💍','🎓','💻','📱','🏖️','💰','🏋️','🎯','🎸','⛵','🐕','🌏','🎁'];

const EMPTY = {
  title:          '',
  target_amount:  '',
  current_amount: '',
  target_date:    '',
  is_completed:   false,
};

const Goals = () => {
  const [goals, setGoals]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(EMPTY);
  const [error, setError]       = useState('');
  const [saving, setSaving]     = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => { fetchGoals(); }, []);

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/goals/');
      setGoals(res.data?.results || res.data || []);
    } catch (_) {}
    finally { setLoading(false); }
  };

  const openAdd = () => {
    setEditing(null); setForm(EMPTY); setError(''); setShowModal(true);
  };

  const openEdit = (g) => {
    setEditing(g);
    setForm({
      title:          g.title          || '',
      target_amount:  g.target_amount  || '',
      current_amount: g.current_amount || '0',
      target_date:    g.target_date    || '',
      is_completed:   g.is_completed   || false,
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title || form.title.trim().length < 2) {
      setError('Goal title is required (min 2 characters).'); return;
    }
    if (!form.target_amount || parseFloat(form.target_amount) <= 0) {
      setError('Target amount must be greater than zero.'); return;
    }

    setError(''); setSaving(true);
    try {
      const payload = {
        title:          form.title.trim(),
        target_amount:  parseFloat(form.target_amount),
        current_amount: parseFloat(form.current_amount || 0),
        target_date:    form.target_date || null,
        is_completed:   form.is_completed,
      };
      if (editing) {
        await api.patch(`/goals/${editing.id}/`, payload);
      } else {
        await api.post('/goals/', payload);
      }
      setShowModal(false);
      fetchGoals();
    } catch (err) {
      const errData = err.response?.data;
      const msg = errData?.errors
        ? Object.values(errData.errors).flat().join(' ')
        : errData?.message || 'Save failed.';
      setError(msg);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try { await api.delete(`/goals/${id}/`); setGoals(p => p.filter(g => g.id !== id)); } catch (_) {}
    setDeleteId(null);
  };

  const toggleComplete = async (g) => {
    try {
      await api.patch(`/goals/${g.id}/`, { is_completed: !g.is_completed });
      fetchGoals();
    } catch (_) {}
  };

  const set = k => e => setForm(f => ({
    ...f,
    [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
  }));

  const active    = goals.filter(g => !g.is_completed);
  const completed = goals.filter(g => g.is_completed);

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="page-header d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
        <div>
          <h1 className="page-title">Financial Goals</h1>
          <p className="page-subtitle">{active.length} active · {completed.length} completed</p>
        </div>
        <button className="btn btn-primary fw-700 d-flex align-items-center gap-2" style={{borderRadius:12}} onClick={openAdd}>
          <FiPlus /> New Goal
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-warning"/></div>
      ) : goals.length === 0 ? (
        <div className="card text-center p-5">
          <div style={{fontSize:'3.5rem',marginBottom:'1rem'}}>🏆</div>
          <h5 className="fw-800">No Goals Yet</h5>
          <p className="text-muted">Set savings goals to stay motivated and on track.</p>
          <button className="btn btn-primary fw-700 mx-auto" style={{maxWidth:200,borderRadius:12}} onClick={openAdd}>Set a Goal</button>
        </div>
      ) : (
        <>
          {/* Active Goals */}
          {active.length > 0 && (
            <>
              <div className="fw-700 mb-3" style={{color:'var(--text)',fontSize:'0.85rem',textTransform:'uppercase',letterSpacing:'0.5px'}}>
                🎯 Active Goals
              </div>
              <div className="row g-3 mb-4">
                {active.map((g, idx) => {
                  const pct = Math.min(100, Math.round(((parseFloat(g.current_amount)||0) / (parseFloat(g.target_amount)||1)) * 100));
                  const color = pct >= 100 ? '#2E7D32' : pct >= 60 ? '#FF6B00' : '#1565C0';
                  const emoji = GOAL_EMOJIS[idx % GOAL_EMOJIS.length];
                  const daysLeft = g.target_date
                    ? Math.max(0, Math.ceil((new Date(g.target_date) - new Date()) / (1000 * 86400)))
                    : null;
                  const remaining = Math.max(0, parseFloat(g.target_amount) - parseFloat(g.current_amount||0));
                  return (
                    <div key={g.id} className="col-12 col-md-6 col-xl-4">
                      <div className="card h-100" style={{borderTop:`3px solid ${color}`}}>
                        <div className="card-body p-3">
                          {/* Title row */}
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div className="d-flex align-items-center gap-2">
                              <div style={{fontSize:'1.6rem'}}>{emoji}</div>
                              <div>
                                <h6 className="fw-800 mb-0" style={{color:'var(--text)'}}>{g.title}</h6>
                                {daysLeft !== null && (
                                  <div style={{fontSize:'0.72rem',color: daysLeft === 0 ? '#E53935' : 'var(--text-muted)'}}>
                                    {daysLeft === 0 ? '🔔 Due today!' : `${daysLeft} days left`}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="d-flex gap-1">
                              <button className="btn btn-sm p-1" title="Mark complete"
                                style={{borderRadius:8,background:'rgba(46,125,50,0.1)',color:'#2E7D32',border:'none'}}
                                onClick={() => toggleComplete(g)}><FiCheckCircle size={13}/></button>
                              <button className="btn btn-sm p-1"
                                style={{borderRadius:8,background:'rgba(21,101,192,0.1)',color:'#1565C0',border:'none'}}
                                onClick={() => openEdit(g)}><FiEdit2 size={13}/></button>
                              <button className="btn btn-sm p-1"
                                style={{borderRadius:8,background:'rgba(229,57,53,0.1)',color:'#E53935',border:'none'}}
                                onClick={() => setDeleteId(g.id)}><FiTrash2 size={13}/></button>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="mb-3">
                            <div className="d-flex justify-content-between mb-1">
                              <span style={{fontSize:'0.78rem',color:'var(--text-muted)'}}>Progress</span>
                              <span style={{fontSize:'0.8rem',fontWeight:700,color}}>{pct}%{pct >= 100 ? ' 🎉' : ''}</span>
                            </div>
                            <div className="budget-progress">
                              <div className="budget-bar" style={{width:`${pct}%`,background:color,transition:'width 0.8s ease'}}/>
                            </div>
                          </div>

                          {/* Amount summary */}
                          <div className="d-flex justify-content-between">
                            <div>
                              <div style={{fontSize:'0.68rem',color:'var(--text-muted)',fontWeight:600,textTransform:'uppercase'}}>Saved</div>
                              <div className="fw-800" style={{color,fontSize:'0.95rem'}}>{fmt(g.current_amount||0)}</div>
                            </div>
                            <div className="text-center">
                              <div style={{fontSize:'0.68rem',color:'var(--text-muted)',fontWeight:600,textTransform:'uppercase'}}>Remaining</div>
                              <div className="fw-800" style={{color:'#FF6B00',fontSize:'0.95rem'}}>{fmt(remaining)}</div>
                            </div>
                            <div className="text-end">
                              <div style={{fontSize:'0.68rem',color:'var(--text-muted)',fontWeight:600,textTransform:'uppercase'}}>Target</div>
                              <div className="fw-800" style={{color:'var(--text)',fontSize:'0.95rem'}}>{fmt(g.target_amount)}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Completed Goals */}
          {completed.length > 0 && (
            <>
              <div className="fw-700 mb-3" style={{color:'var(--text)',fontSize:'0.85rem',textTransform:'uppercase',letterSpacing:'0.5px'}}>
                ✅ Completed Goals
              </div>
              <div className="row g-3">
                {completed.map((g, idx) => (
                  <div key={g.id} className="col-12 col-md-6 col-xl-4">
                    <div className="card h-100" style={{borderTop:'3px solid #2E7D32',opacity:0.8}}>
                      <div className="card-body p-3">
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center gap-2">
                            <span style={{fontSize:'1.4rem'}}>🎉</span>
                            <div>
                              <div className="fw-700" style={{color:'var(--text)',textDecoration:'line-through',opacity:0.7}}>{g.title}</div>
                              <div style={{fontSize:'0.75rem',color:'#2E7D32',fontWeight:600}}>{fmt(g.target_amount)} achieved!</div>
                            </div>
                          </div>
                          <div className="d-flex gap-1">
                            <button className="btn btn-sm p-1" title="Mark incomplete"
                              style={{borderRadius:8,background:'rgba(255,107,0,0.1)',color:'var(--primary)',border:'none'}}
                              onClick={() => toggleComplete(g)}><FiCheckCircle size={13}/></button>
                            <button className="btn btn-sm p-1"
                              style={{borderRadius:8,background:'rgba(229,57,53,0.1)',color:'#E53935',border:'none'}}
                              onClick={() => setDeleteId(g.id)}><FiTrash2 size={13}/></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal show d-block" style={{background:'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-800">{editing ? 'Edit Goal' : 'New Savings Goal'}</h5>
                <button className="btn-close" onClick={()=>setShowModal(false)}/>
              </div>
              <div className="modal-body p-4">
                {error && <div className="alert alert-danger rounded-xl" style={{fontSize:'0.84rem'}}>{error}</div>}
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label fw-600">Goal Title *</label>
                    <input className="form-control" placeholder="e.g. Buy a Car, Emergency Fund" value={form.title} onChange={set('title')}/>
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-600">Target Amount (₹) *</label>
                    <input type="number" className="form-control" min="0.01" step="0.01" placeholder="0.00" value={form.target_amount} onChange={set('target_amount')}/>
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-600">Saved So Far (₹)</label>
                    <input type="number" className="form-control" min="0" step="0.01" placeholder="0.00" value={form.current_amount} onChange={set('current_amount')}/>
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-600">Target Date <span className="text-muted fw-400">(optional)</span></label>
                    <input type="date" className="form-control" value={form.target_date} onChange={set('target_date')}/>
                  </div>
                  {editing && (
                    <div className="col-12">
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" id="is_completed"
                          checked={form.is_completed} onChange={set('is_completed')}
                          style={{accentColor:'var(--primary)'}}/>
                        <label className="form-check-label fw-600" htmlFor="is_completed">
                          🎉 Mark as completed
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary fw-600" style={{borderRadius:10}} onClick={()=>setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary fw-700" style={{borderRadius:10}} onClick={handleSave} disabled={saving}>
                  {saving && <span className="spinner-border spinner-border-sm me-2"/>}
                  {saving ? 'Saving...' : editing ? 'Update Goal' : 'Create Goal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="modal show d-block" style={{background:'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered" style={{maxWidth:380}}>
            <div className="modal-content">
              <div className="modal-body p-4 text-center">
                <div style={{fontSize:'3rem',marginBottom:'1rem'}}>🗑️</div>
                <h6 className="fw-800">Delete Goal?</h6>
                <p className="text-muted" style={{fontSize:'0.88rem'}}>This action cannot be undone.</p>
                <div className="d-flex gap-2 justify-content-center mt-3">
                  <button className="btn btn-outline-secondary fw-600" style={{borderRadius:10}} onClick={()=>setDeleteId(null)}>Cancel</button>
                  <button className="btn btn-danger fw-700" style={{borderRadius:10}} onClick={()=>handleDelete(deleteId)}>Delete</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Goals;
