import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiFilter, FiAlertCircle } from 'react-icons/fi';
import api from '../services/api';

const fmt = (n) => `₹${Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:2})}`;

const RECURRENCE_OPTIONS = [
  { value: 'NONE',    label: 'One-time'  },
  { value: 'DAILY',   label: 'Daily'     },
  { value: 'WEEKLY',  label: 'Weekly'    },
  { value: 'MONTHLY', label: 'Monthly'   },
  { value: 'YEARLY',  label: 'Yearly'    },
];

const EMPTY = {
  title: '',
  amount: '',
  date: new Date().toISOString().slice(0, 10),
  category: '',
  payee: '',
  recurrence: 'NONE',
  description: '',
};

const Expenses = () => {
  const [expenses, setExpenses]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(EMPTY);
  const [search, setSearch]       = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [error, setError]         = useState('');
  const [saving, setSaving]       = useState(false);
  const [deleteId, setDeleteId]   = useState(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [eRes, cRes] = await Promise.all([
        api.get('/expenses/'),
        api.get('/categories/'),
      ]);
      setExpenses(eRes.data?.results || eRes.data || []);
      setCategories((cRes.data?.results || cRes.data || []).filter(c => c.category_type === 'EXPENSE' || !c.category_type));
    } catch (_) {}
    finally { setLoading(false); }
  };

  const openAdd = () => {
    setEditing(null); setForm(EMPTY); setError(''); setShowModal(true);
  };

  const openEdit = (exp) => {
    setEditing(exp);
    setForm({
      title:       exp.title       || '',
      amount:      exp.amount      || '',
      date:        exp.date        || '',
      category:    exp.category || '',
      payee:       exp.payee       || '',
      recurrence:  exp.recurrence  || 'NONE',
      description: exp.description || '',
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title || form.title.trim().length < 2) {
      setError('Title is required (min 2 characters).'); return;
    }
    if (!form.amount || parseFloat(form.amount) <= 0) {
      setError('Amount must be greater than zero.'); return;
    }
    if (!form.date) {
      setError('Date is required.'); return;
    }

    setError(''); setSaving(true);
    try {
      const payload = {
        title:       form.title.trim(),
        amount:      parseFloat(form.amount),
        date:        form.date,
        category:    form.category || null,
        payee:       form.payee,
        recurrence:  form.recurrence,
        description: form.description,
      };
      if (editing) {
        await api.patch(`/expenses/${editing.id}/`, payload);
      } else {
        await api.post('/expenses/', payload);
      }
      setShowModal(false);
      fetchAll();
    } catch (err) {
      const errData = err.response?.data;
      const msg = errData?.errors
        ? Object.values(errData.errors).flat().join(' ')
        : errData?.message || 'Failed to save.';
      setError(msg);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try { await api.delete(`/expenses/${id}/`); setExpenses(p => p.filter(e => e.id !== id)); } catch (_) {}
    setDeleteId(null);
  };

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const filtered = expenses.filter(e => {
    const matchSearch = !search ||
      e.title?.toLowerCase().includes(search.toLowerCase()) ||
      e.payee?.toLowerCase().includes(search.toLowerCase()) ||
      e.description?.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCat || String(e.category) === filterCat;
    return matchSearch && matchCat;
  });

  const total = filtered.reduce((s, e) => s + parseFloat(e.amount || 0), 0);

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="page-header d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
        <div>
          <h1 className="page-title">Expense Tracker</h1>
          <p className="page-subtitle">{filtered.length} transactions • Total: <strong style={{color:'#E53935'}}>{fmt(total)}</strong></p>
        </div>
        <button className="btn btn-primary fw-700 d-flex align-items-center gap-2" style={{borderRadius:12}} onClick={openAdd}>
          <FiPlus /> Add Expense
        </button>
      </div>

      {/* Search & Filter */}
      <div className="row g-2 mb-4">
        <div className="col-12 col-sm-7">
          <div className="input-group">
            <span className="input-group-text" style={{background:'var(--surface)',border:'1.5px solid var(--border)',borderRight:'none',borderRadius:'10px 0 0 10px'}}><FiSearch size={14} style={{color:'var(--text-muted)'}} /></span>
            <input className="form-control" style={{borderLeft:'none',borderRadius:'0 10px 10px 0'}} placeholder="Search expenses..." value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
        </div>
        <div className="col-12 col-sm-5">
          <div className="input-group">
            <span className="input-group-text" style={{background:'var(--surface)',border:'1.5px solid var(--border)',borderRight:'none',borderRadius:'10px 0 0 10px'}}><FiFilter size={14} /></span>
            <select className="form-select" style={{borderLeft:'none',borderRadius:'0 10px 10px 0'}} value={filterCat} onChange={e=>setFilterCat(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-warning" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-5">
              <div style={{fontSize:'3rem',marginBottom:'1rem'}}>💸</div>
              <p className="text-muted fw-600">No expenses found.</p>
              <button className="btn btn-primary btn-sm" onClick={openAdd}>Add Your First Expense</button>
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="d-md-none p-3">
                {filtered.map(e => (
                  <div key={e.id} className="card mb-2" style={{border:'1px solid var(--border)',borderRadius:12}}>
                    <div className="card-body p-3">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <div className="fw-700" style={{color:'var(--text)',fontSize:'0.9rem'}}>{e.title}</div>
                          <div style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>
                            {e.date}
                            {e.payee && <> • {e.payee}</>}
                            {e.category_name && <> • {e.category_name}</>}
                            {e.recurrence && e.recurrence !== 'NONE' && <> • 🔄 {e.recurrence}</>}
                          </div>
                          {e.description && <div style={{fontSize:'0.78rem',color:'var(--text-muted)'}}>{e.description}</div>}
                        </div>
                        <div className="text-end">
                          <div className="fw-800" style={{color:'#E53935',fontSize:'1rem'}}>{fmt(e.amount)}</div>
                          <div className="d-flex gap-1 mt-1 justify-content-end">
                            <button className="btn btn-sm p-1" style={{borderRadius:8,background:'rgba(21,101,192,0.1)',color:'#1565C0',border:'none'}} onClick={()=>openEdit(e)}><FiEdit2 size={13}/></button>
                            <button className="btn btn-sm p-1" style={{borderRadius:8,background:'rgba(229,57,53,0.1)',color:'#E53935',border:'none'}} onClick={()=>setDeleteId(e.id)}><FiTrash2 size={13}/></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop table */}
              <div className="d-none d-md-block table-responsive">
                <table className="table table-hover mb-0">
                  <thead><tr><th>Title</th><th>Category</th><th>Payee</th><th>Date</th><th>Recurrence</th><th>Amount</th><th>Actions</th></tr></thead>
                  <tbody>
                    {filtered.map(e => (
                      <tr key={e.id}>
                        <td>
                          <span className="fw-600">{e.title}</span>
                          {e.description && <div style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>{e.description}</div>}
                        </td>
                        <td>{e.category_name ? <span className="badge badge-expense">{e.category_name}</span> : '—'}</td>
                        <td style={{color:'var(--text-muted)',fontSize:'0.85rem'}}>{e.payee || '—'}</td>
                        <td style={{color:'var(--text-muted)',fontSize:'0.85rem'}}>{e.date}</td>
                        <td>{e.recurrence && e.recurrence !== 'NONE' ? <span className="badge badge-income">🔄 {e.recurrence}</span> : <span className="text-muted" style={{fontSize:'0.82rem'}}>One-time</span>}</td>
                        <td><span className="fw-800" style={{color:'#E53935'}}>{fmt(e.amount)}</span></td>
                        <td>
                          <div className="d-flex gap-1">
                            <button className="btn btn-sm" style={{borderRadius:8,background:'rgba(21,101,192,0.1)',color:'#1565C0',border:'none',padding:'0.3rem 0.6rem'}} onClick={()=>openEdit(e)}><FiEdit2 size={13}/></button>
                            <button className="btn btn-sm" style={{borderRadius:8,background:'rgba(229,57,53,0.1)',color:'#E53935',border:'none',padding:'0.3rem 0.6rem'}} onClick={()=>setDeleteId(e.id)}><FiTrash2 size={13}/></button>
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal show d-block" style={{background:'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-800">{editing ? 'Edit Expense' : 'Add Expense'}</h5>
                <button className="btn-close" onClick={()=>setShowModal(false)} />
              </div>
              <div className="modal-body p-4">
                {error && (
                  <div className="alert alert-danger rounded-xl d-flex gap-2 align-items-start" style={{fontSize:'0.84rem'}}>
                    <FiAlertCircle className="mt-1 flex-shrink-0"/>
                    {error}
                  </div>
                )}
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label fw-600">Title *</label>
                    <input className="form-control" placeholder="e.g. Grocery Shopping, Electricity Bill" value={form.title} onChange={set('title')} />
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-600">Amount (₹) *</label>
                    <input type="number" className="form-control" placeholder="0.00" min="0.01" step="0.01" value={form.amount} onChange={set('amount')} />
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-600">Date *</label>
                    <input type="date" className="form-control" value={form.date} onChange={set('date')} />
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-600">Category</label>
                    <select className="form-select" value={form.category} onChange={set('category')}>
                      <option value="">— Select —</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label fw-600">Recurrence</label>
                    <select className="form-select" value={form.recurrence} onChange={set('recurrence')}>
                      {RECURRENCE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-600">Payee</label>
                    <input className="form-control" placeholder="Who did you pay? (optional)" value={form.payee} onChange={set('payee')} />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-600">Description</label>
                    <textarea className="form-control" rows={2} placeholder="Optional notes..." value={form.description} onChange={set('description')} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary fw-600" style={{borderRadius:10}} onClick={()=>setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary fw-700" style={{borderRadius:10}} onClick={handleSave} disabled={saving}>
                  {saving && <span className="spinner-border spinner-border-sm me-2"/>}
                  {saving ? 'Saving...' : editing ? 'Update' : 'Add Expense'}
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
                <h6 className="fw-800 mb-2">Delete Expense?</h6>
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

export default Expenses;
