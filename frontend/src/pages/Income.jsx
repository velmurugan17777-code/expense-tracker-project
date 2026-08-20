import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiArrowUpRight } from 'react-icons/fi';
import api from '../services/api';

const fmt = (n) => `₹${Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:2})}`;
const SOURCES = ['Salary','Freelance','Business','Investment','Rental','Gift','Other'];
const RECURRENCE_OPTIONS = [
  { value: 'NONE', label: 'One-time' },
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'YEARLY', label: 'Yearly' },
];
const EMPTY = { title: '', source: '', amount: '', date: new Date().toISOString().slice(0,10), description: '', recurrence: 'NONE' };

const Income = () => {
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => { fetchIncomes(); }, []);

  const fetchIncomes = async () => {
    setLoading(true);
    try { const res = await api.get('/income/'); setIncomes(res.data?.results || res.data || []); }
    catch(_){} finally { setLoading(false); }
  };

  const openAdd = () => { setEditing(null); setForm(EMPTY); setError(''); setShowModal(true); };
  const openEdit = (i) => { setEditing(i); setForm({ title: i.title || '', source: i.source || '', amount: i.amount, date: i.date, description: i.description || '', recurrence: i.recurrence || 'NONE' }); setError(''); setShowModal(true); };

  const handleSave = async () => {
    if (!form.title || form.title.trim().length < 2) { setError('Title is required (min 2 characters).'); return; }
    if (!form.amount || parseFloat(form.amount) <= 0) { setError('Amount must be greater than zero.'); return; }
    if (!form.date) { setError('Date is required.'); return; }
    setError(''); setSaving(true);
    try {
      const payload = { title: form.title.trim(), source: form.source, amount: parseFloat(form.amount), date: form.date, description: form.description, recurrence: form.recurrence };
      if (editing) await api.patch(`/income/${editing.id}/`, payload);
      else await api.post('/income/', payload);
      setShowModal(false); fetchIncomes();
    } catch(err) {
      const errData = err.response?.data;
      const msg = errData?.errors ? Object.values(errData.errors).flat().join(' ') : errData?.message || 'Save failed.';
      setError(msg);
    }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try { await api.delete(`/income/${id}/`); setIncomes(p => p.filter(i => i.id !== id)); } catch(_){}
    setDeleteId(null);
  };

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const filtered = incomes.filter(i => !search || i.title?.toLowerCase().includes(search.toLowerCase()) || i.source?.toLowerCase().includes(search.toLowerCase()) || i.description?.toLowerCase().includes(search.toLowerCase()));
  const total = filtered.reduce((s, i) => s + parseFloat(i.amount || 0), 0);

  return (
    <div className="animate-fade-in-up">
      <div className="page-header d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
        <div>
          <h1 className="page-title">Income Tracker</h1>
          <p className="page-subtitle">{filtered.length} records • Total: <strong style={{color:'#2E7D32'}}>{fmt(total)}</strong></p>
        </div>
        <button className="btn btn-primary fw-700 d-flex align-items-center gap-2" style={{borderRadius:12}} onClick={openAdd}>
          <FiPlus /> Add Income
        </button>
      </div>

      <div className="row g-2 mb-4">
        <div className="col-12 col-sm-6">
          <div className="input-group">
            <span className="input-group-text" style={{background:'var(--surface)',border:'1.5px solid var(--border)',borderRight:'none',borderRadius:'10px 0 0 10px'}}><FiSearch size={14} style={{color:'var(--text-muted)'}}/></span>
            <input className="form-control" style={{borderLeft:'none',borderRadius:'0 10px 10px 0'}} placeholder="Search income..." value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="card mb-4" style={{background:'linear-gradient(135deg,#2E7D32,#43A047)',color:'white',border:'none'}}>
        <div className="card-body d-flex align-items-center gap-3 p-3">
          <div style={{width:48,height:48,borderRadius:14,background:'rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.4rem'}}>
            <FiArrowUpRight />
          </div>
          <div>
            <div style={{fontSize:'0.75rem',opacity:0.85,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.5px'}}>Total Income This View</div>
            <div style={{fontSize:'1.6rem',fontWeight:800}}>{fmt(total)}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body p-0">
          {loading ? <div className="text-center py-5"><div className="spinner-border text-success"/></div>
          : filtered.length === 0 ? (
            <div className="text-center py-5">
              <div style={{fontSize:'3rem',marginBottom:'1rem'}}>💰</div>
              <p className="text-muted fw-600">No income records yet.</p>
              <button className="btn btn-primary btn-sm" onClick={openAdd}>Add Your First Income</button>
            </div>
          ) : (
            <>
              {/* Mobile */}
              <div className="d-md-none p-3">
                {filtered.map(i => (
                  <div key={i.id} className="card mb-2" style={{border:'1px solid var(--border)',borderRadius:12}}>
                    <div className="card-body p-3">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <div className="fw-700" style={{color:'var(--text)'}}>{i.title}</div>
                          <div style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>{i.source && <span>{i.source} • </span>}{i.date}{i.recurrence && i.recurrence !== 'NONE' ? ` • 🔄 ${i.recurrence}` : ''}</div>
                          {i.description && <div style={{fontSize:'0.78rem',color:'var(--text-muted)'}}>{i.description}</div>}
                        </div>
                        <div className="text-end">
                          <div className="fw-800" style={{color:'#2E7D32'}}>{fmt(i.amount)}</div>
                          <div className="d-flex gap-1 mt-1 justify-content-end">
                            <button className="btn btn-sm p-1" style={{borderRadius:8,background:'rgba(21,101,192,0.1)',color:'#1565C0',border:'none'}} onClick={()=>openEdit(i)}><FiEdit2 size={13}/></button>
                            <button className="btn btn-sm p-1" style={{borderRadius:8,background:'rgba(229,57,53,0.1)',color:'#E53935',border:'none'}} onClick={()=>setDeleteId(i.id)}><FiTrash2 size={13}/></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop */}
              <div className="d-none d-md-block table-responsive">
                <table className="table table-hover mb-0">
                  <thead><tr><th>Title</th><th>Source</th><th>Date</th><th>Recurrence</th><th>Amount</th><th>Actions</th></tr></thead>
                  <tbody>
                    {filtered.map(i => (
                      <tr key={i.id}>
                        <td><span className="fw-600">{i.title}</span></td>
                        <td style={{color:'var(--text-muted)',fontSize:'0.85rem'}}>{i.source || '—'}</td>
                        <td style={{color:'var(--text-muted)',fontSize:'0.85rem'}}>{i.date}</td>
                        <td>{i.recurrence && i.recurrence !== 'NONE' ? <span className="badge badge-income">🔄 {i.recurrence}</span> : <span className="text-muted" style={{fontSize:'0.82rem'}}>One-time</span>}</td>
                        <td><span className="fw-800" style={{color:'#2E7D32'}}>{fmt(i.amount)}</span></td>
                        <td>
                          <div className="d-flex gap-1">
                            <button className="btn btn-sm" style={{borderRadius:8,background:'rgba(21,101,192,0.1)',color:'#1565C0',border:'none',padding:'0.3rem 0.6rem'}} onClick={()=>openEdit(i)}><FiEdit2 size={13}/></button>
                            <button className="btn btn-sm" style={{borderRadius:8,background:'rgba(229,57,53,0.1)',color:'#E53935',border:'none',padding:'0.3rem 0.6rem'}} onClick={()=>setDeleteId(i.id)}><FiTrash2 size={13}/></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal show d-block" style={{background:'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header"><h5 className="modal-title fw-800">{editing ? 'Edit Income' : 'Add Income'}</h5><button className="btn-close" onClick={()=>setShowModal(false)}/></div>
              <div className="modal-body p-4">
                {error && <div className="alert alert-danger rounded-xl" style={{fontSize:'0.84rem'}}>{error}</div>}
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label fw-600">Title *</label>
                    <input className="form-control" placeholder="e.g. Monthly Salary, Freelance Project" value={form.title} onChange={set('title')} />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-600">Source</label>
                    <select className="form-select" value={form.source} onChange={set('source')}>
                      <option value="">— Select Source —</option>
                      {SOURCES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="col-6"><label className="form-label fw-600">Amount (₹) *</label><input type="number" className="form-control" min="0.01" step="0.01" placeholder="0.00" value={form.amount} onChange={set('amount')} /></div>
                  <div className="col-6"><label className="form-label fw-600">Date *</label><input type="date" className="form-control" value={form.date} onChange={set('date')} /></div>
                  <div className="col-12">
                    <label className="form-label fw-600">Recurrence</label>
                    <select className="form-select" value={form.recurrence} onChange={set('recurrence')}>
                      {RECURRENCE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>
                  <div className="col-12"><label className="form-label fw-600">Description</label><input className="form-control" placeholder="Optional description" value={form.description} onChange={set('description')} /></div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary fw-600" style={{borderRadius:10}} onClick={()=>setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary fw-700" style={{borderRadius:10}} onClick={handleSave} disabled={saving}>
                  {saving && <span className="spinner-border spinner-border-sm me-2"/>}{saving?'Saving...': editing?'Update':'Add Income'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="modal show d-block" style={{background:'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered" style={{maxWidth:380}}>
            <div className="modal-content">
              <div className="modal-body p-4 text-center">
                <div style={{fontSize:'3rem',marginBottom:'1rem'}}>🗑️</div>
                <h6 className="fw-800 mb-2">Delete Income Record?</h6>
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

export default Income;
