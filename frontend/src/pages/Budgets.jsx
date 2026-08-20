import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiAlertTriangle, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import api from '../services/api';

const fmt = (n) => `₹${Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:2})}`;

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const now = new Date();
const EMPTY = {
  month: now.getMonth() + 1,   // 1–12
  year:  now.getFullYear(),
  amount: '',
};

const Budgets = () => {
  const [budgets, setBudgets]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(EMPTY);
  const [error, setError]       = useState('');
  const [saving, setSaving]     = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [viewYear, setViewYear] = useState(now.getFullYear());

  // Category budget sub-form state
  const [showCatModal, setShowCatModal]   = useState(false);
  const [catBudgetId, setCatBudgetId]     = useState(null);
  const [catForm, setCatForm]             = useState({ category: '', amount: '' });
  const [catError, setCatError]           = useState('');
  const [catSaving, setCatSaving]         = useState(false);

  useEffect(() => { fetchAll(); }, [viewYear]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [bRes, cRes] = await Promise.all([
        api.get(`/budgets/?year=${viewYear}`),
        api.get('/categories/'),
      ]);
      setBudgets(bRes.data?.results || bRes.data || []);
      setCategories((cRes.data?.results || cRes.data || []).filter(c => c.category_type === 'EXPENSE' || !c.category_type));
    } catch (_) {}
    finally { setLoading(false); }
  };

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY);
    setError('');
    setShowModal(true);
  };

  const openEdit = (b) => {
    setEditing(b);
    setForm({ month: b.month, year: b.year, amount: b.amount });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    const month = parseInt(form.month);
    const year  = parseInt(form.year);
    if (!month || month < 1 || month > 12) { setError('Please select a valid month.'); return; }
    if (!year  || year  < 2000)            { setError('Please enter a valid year.'); return; }
    if (!form.amount || parseFloat(form.amount) <= 0) { setError('Amount must be greater than zero.'); return; }

    setError(''); setSaving(true);
    try {
      const payload = { month, year, amount: parseFloat(form.amount) };
      if (editing) {
        await api.patch(`/budgets/${editing.id}/`, payload);
      } else {
        await api.post('/budgets/', payload);
      }
      setShowModal(false);
      fetchAll();
    } catch (err) {
      const errData = err.response?.data;
      const msg = errData?.errors
        ? Object.values(errData.errors).flat().join(' ')
        : errData?.message || 'Save failed.';
      setError(msg);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try { await api.delete(`/budgets/${id}/`); setBudgets(p => p.filter(b => b.id !== id)); } catch (_) {}
    setDeleteId(null);
  };

  // Category budget management
  const openCatBudget = (budgetId) => {
    setCatBudgetId(budgetId);
    setCatForm({ category: '', amount: '' });
    setCatError('');
    setShowCatModal(true);
  };

  const handleCatSave = async () => {
    if (!catForm.category) { setCatError('Please select a category.'); return; }
    if (!catForm.amount || parseFloat(catForm.amount) <= 0) { setCatError('Amount must be greater than zero.'); return; }
    setCatError(''); setCatSaving(true);
    try {
      await api.post(`/budgets/${catBudgetId}/categories/`, {
        category: catForm.category,
        amount: parseFloat(catForm.amount),
      });
      setShowCatModal(false);
      fetchAll();
    } catch (err) {
      const errData = err.response?.data;
      const msg = errData?.errors
        ? Object.values(errData.errors).flat().join(' ')
        : errData?.message || 'Failed to add category limit.';
      setCatError(msg);
    } finally { setCatSaving(false); }
  };

  const handleDeleteCatBudget = async (budgetId, cbId) => {
    try { await api.delete(`/budgets/${budgetId}/categories/${cbId}/`); fetchAll(); } catch (_) {}
  };

  const getStatus = (spent, limit) => {
    const pct = Math.min(100, Math.round((spent / (limit || 1)) * 100));
    if (pct >= 100) return { pct: 100, color: '#E53935', label: 'Exceeded!',        icon: '🚨' };
    if (pct >= 80)  return { pct,      color: '#FF6B00', label: 'Near limit',        icon: '⚠️' };
    return               { pct,      color: '#2E7D32', label: 'On track',           icon: '✅' };
  };

  // For display, compute "spent" from category_budgets actual amounts (backend may include spent later)
  // For now just show amount vs category sub-totals
  const getCatUsed = (b) => (b.category_budgets || []).reduce((s, cb) => s + parseFloat(cb.amount || 0), 0);

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="page-header d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
        <div>
          <h1 className="page-title">Budget Manager</h1>
          <p className="page-subtitle">Monthly spending limits for {viewYear}</p>
        </div>
        <button className="btn btn-primary fw-700 d-flex align-items-center gap-2" style={{borderRadius:12}} onClick={openAdd}>
          <FiPlus /> New Budget
        </button>
      </div>

      {/* Year navigation */}
      <div className="d-flex align-items-center gap-2 mb-4">
        <button className="btn btn-outline-secondary btn-sm" style={{borderRadius:8}} onClick={() => setViewYear(y => y - 1)}><FiChevronLeft /></button>
        <span className="fw-700" style={{fontSize:'1.1rem', color:'var(--text)'}}>{viewYear}</span>
        <button className="btn btn-outline-secondary btn-sm" style={{borderRadius:8}} onClick={() => setViewYear(y => y + 1)}><FiChevronRight /></button>
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-warning"/></div>
      ) : budgets.length === 0 ? (
        <div className="card text-center p-5">
          <div style={{fontSize:'3.5rem',marginBottom:'1rem'}}>🎯</div>
          <h5 className="fw-800">No Budgets for {viewYear}</h5>
          <p className="text-muted">Create a monthly budget to control your spending.</p>
          <button className="btn btn-primary fw-700 mx-auto" style={{maxWidth:200,borderRadius:12}} onClick={openAdd}>Create Budget</button>
        </div>
      ) : (
        <div className="row g-3">
          {budgets.map(b => {
            const catAllocated = getCatUsed(b);
            const { pct, color, icon } = getStatus(catAllocated, parseFloat(b.amount));
            return (
              <div key={b.id} className="col-12 col-md-6 col-xl-4">
                <div className="card h-100" style={{borderLeft:`4px solid ${color}`}}>
                  <div className="card-body p-3">
                    {/* Title row */}
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h6 className="fw-800 mb-0" style={{color:'var(--text)'}}>
                          {MONTHS[b.month - 1]} {b.year}
                        </h6>
                        <div style={{fontSize:'0.72rem',color:'var(--text-muted)',marginTop:'2px'}}>
                          Total Budget: <strong style={{color:'var(--text)'}}>{fmt(b.amount)}</strong>
                        </div>
                      </div>
                      <div className="d-flex gap-1">
                        <button className="btn btn-sm p-1" title="Add category limit"
                          style={{borderRadius:8,background:'rgba(46,125,50,0.1)',color:'#2E7D32',border:'none'}}
                          onClick={() => openCatBudget(b.id)}><FiPlus size={13}/></button>
                        <button className="btn btn-sm p-1"
                          style={{borderRadius:8,background:'rgba(21,101,192,0.1)',color:'#1565C0',border:'none'}}
                          onClick={() => openEdit(b)}><FiEdit2 size={13}/></button>
                        <button className="btn btn-sm p-1"
                          style={{borderRadius:8,background:'rgba(229,57,53,0.1)',color:'#E53935',border:'none'}}
                          onClick={() => setDeleteId(b.id)}><FiTrash2 size={13}/></button>
                      </div>
                    </div>

                    {/* Progress bar */}
                    {pct >= 80 && (
                      <div className="d-flex align-items-center gap-2 mb-2 p-2 rounded-xl"
                        style={{background: pct>=100?'rgba(229,57,53,0.08)':'rgba(255,107,0,0.08)',fontSize:'0.78rem',fontWeight:600,color}}>
                        <FiAlertTriangle size={13}/>
                        {pct >= 100 ? 'Category limits exceeded total!' : 'Approaching limit!'}
                      </div>
                    )}

                    <div className="mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <span style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>Category allocations</span>
                        <span style={{fontSize:'0.75rem',fontWeight:700,color}}>{pct}% {icon}</span>
                      </div>
                      <div className="budget-progress">
                        <div className="budget-bar" style={{width:`${pct}%`,background:color}}/>
                      </div>
                    </div>

                    {/* Amounts row */}
                    <div className="d-flex justify-content-between mb-2">
                      <div>
                        <div style={{fontSize:'0.68rem',color:'var(--text-muted)',fontWeight:600,textTransform:'uppercase'}}>Allocated</div>
                        <div className="fw-800" style={{color,fontSize:'0.95rem'}}>{fmt(catAllocated)}</div>
                      </div>
                      <div className="text-end">
                        <div style={{fontSize:'0.68rem',color:'var(--text-muted)',fontWeight:600,textTransform:'uppercase'}}>Total</div>
                        <div className="fw-800" style={{color:'var(--text)',fontSize:'0.95rem'}}>{fmt(b.amount)}</div>
                      </div>
                      <div className="text-end">
                        <div style={{fontSize:'0.68rem',color:'var(--text-muted)',fontWeight:600,textTransform:'uppercase'}}>Remaining</div>
                        <div className="fw-800" style={{color:'#2E7D32',fontSize:'0.95rem'}}>{fmt(Math.max(0, parseFloat(b.amount) - catAllocated))}</div>
                      </div>
                    </div>

                    {/* Category budgets list */}
                    {b.category_budgets && b.category_budgets.length > 0 && (
                      <div className="mt-2" style={{borderTop:'1px solid var(--border)',paddingTop:'0.5rem'}}>
                        {b.category_budgets.map(cb => (
                          <div key={cb.id} className="d-flex justify-content-between align-items-center py-1">
                            <div className="d-flex align-items-center gap-1">
                              <span style={{fontSize:'0.85rem'}}>{cb.category_icon || '🏷️'}</span>
                              <span style={{fontSize:'0.78rem',color:'var(--text)',fontWeight:600}}>{cb.category_name}</span>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                              <span style={{fontSize:'0.78rem',fontWeight:700,color:'var(--primary)'}}>{fmt(cb.amount)}</span>
                              <button className="btn btn-sm p-0" style={{border:'none',background:'transparent',color:'#E53935',lineHeight:1}}
                                onClick={() => handleDeleteCatBudget(b.id, cb.id)}>×</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Budget Modal */}
      {showModal && (
        <div className="modal show d-block" style={{background:'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered" style={{maxWidth:420}}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-800">{editing ? 'Edit Budget' : 'New Monthly Budget'}</h5>
                <button className="btn-close" onClick={()=>setShowModal(false)}/>
              </div>
              <div className="modal-body p-4">
                {error && <div className="alert alert-danger rounded-xl" style={{fontSize:'0.84rem'}}>{error}</div>}
                <div className="row g-3">
                  <div className="col-6">
                    <label className="form-label fw-600">Month *</label>
                    <select className="form-select" value={form.month} onChange={e => setForm(f => ({...f, month: parseInt(e.target.value)}))}>
                      {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-600">Year *</label>
                    <input type="number" className="form-control" min="2000" max="2099" placeholder="2026"
                      value={form.year} onChange={e => setForm(f => ({...f, year: parseInt(e.target.value)}))} />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-600">Total Budget Amount (₹) *</label>
                    <input type="number" className="form-control" min="0.01" step="0.01" placeholder="e.g. 50000"
                      value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))} />
                    <div className="form-text">Set the total spending limit for this month. You can then assign amounts to specific categories.</div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary fw-600" style={{borderRadius:10}} onClick={()=>setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary fw-700" style={{borderRadius:10}} onClick={handleSave} disabled={saving}>
                  {saving && <span className="spinner-border spinner-border-sm me-2"/>}
                  {saving ? 'Saving...' : editing ? 'Update' : 'Create Budget'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Budget Modal */}
      {showCatModal && (
        <div className="modal show d-block" style={{background:'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered" style={{maxWidth:400}}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-800">Add Category Limit</h5>
                <button className="btn-close" onClick={()=>setShowCatModal(false)}/>
              </div>
              <div className="modal-body p-4">
                {catError && <div className="alert alert-danger rounded-xl" style={{fontSize:'0.84rem'}}>{catError}</div>}
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label fw-600">Category *</label>
                    <select className="form-select" value={catForm.category} onChange={e => setCatForm(f => ({...f, category: e.target.value}))}>
                      <option value="">— Select Category —</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-600">Limit Amount (₹) *</label>
                    <input type="number" className="form-control" min="0.01" step="0.01" placeholder="0.00"
                      value={catForm.amount} onChange={e => setCatForm(f => ({...f, amount: e.target.value}))} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary fw-600" style={{borderRadius:10}} onClick={()=>setShowCatModal(false)}>Cancel</button>
                <button className="btn btn-primary fw-700" style={{borderRadius:10}} onClick={handleCatSave} disabled={catSaving}>
                  {catSaving && <span className="spinner-border spinner-border-sm me-2"/>}
                  {catSaving ? 'Saving...' : 'Add Limit'}
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
                <h6 className="fw-800">Delete Budget?</h6>
                <p className="text-muted" style={{fontSize:'0.88rem'}}>This will also delete all category limits under this budget.</p>
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

export default Budgets;
