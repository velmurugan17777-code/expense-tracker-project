import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import api from '../services/api';

const ICONS = ['🍔','🛒','🏠','🚗','💊','📚','✈️','🎮','👗','💡','📱','🎬','💪','🐾','🎁','💼','🍽️','☕','🎵','🏋️','🌿','🏥','💈','🎓','🔧','💰'];
const COLORS = ['#FF6B00','#E53935','#1565C0','#2E7D32','#6A1B9A','#F57C00','#00838F','#AD1457','#558B2F','#0277BD','#4E342E','#37474F'];

const CATEGORY_TYPES = [
  { value: 'EXPENSE', label: '💸 Expense' },
  { value: 'INCOME',  label: '💰 Income'  },
];

const EMPTY = { name: '', category_type: 'EXPENSE', icon: '🏷️', color: '#FF6B00' };

const Categories = () => {
  const [cats, setCats]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(EMPTY);
  const [error, setError]       = useState('');
  const [saving, setSaving]     = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [activeType, setActiveType] = useState('ALL');

  useEffect(() => { fetchCats(); }, []);

  const fetchCats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories/');
      setCats(res.data?.results || res.data || []);
    } catch (_) {}
    finally { setLoading(false); }
  };

  const openAdd = () => {
    setEditing(null); setForm(EMPTY); setError(''); setShowModal(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      name:          c.name          || '',
      category_type: c.category_type || 'EXPENSE',
      icon:          c.icon          || '🏷️',
      color:         c.color         || '#FF6B00',
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || form.name.trim().length < 2) {
      setError('Category name is required (min 2 characters).'); return;
    }
    if (!form.category_type) {
      setError('Please select a category type.'); return;
    }
    setError(''); setSaving(true);
    try {
      const payload = {
        name:          form.name.trim(),
        category_type: form.category_type,
        icon:          form.icon,
        color:         form.color,
      };
      if (editing) {
        await api.patch(`/categories/${editing.id}/`, payload);
      } else {
        await api.post('/categories/', payload);
      }
      setShowModal(false);
      fetchCats();
    } catch (err) {
      const errData = err.response?.data;
      const msg = errData?.errors
        ? Object.values(errData.errors).flat().join(' ')
        : errData?.message || 'Save failed.';
      setError(msg);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try { await api.delete(`/categories/${id}/`); setCats(p => p.filter(c => c.id !== id)); } catch (_) {}
    setDeleteId(null);
  };

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const filtered = cats.filter(c => activeType === 'ALL' || c.category_type === activeType);

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="page-header d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
        <div>
          <h1 className="page-title">Categories</h1>
          <p className="page-subtitle">{cats.length} categories configured</p>
        </div>
        <button className="btn btn-primary fw-700 d-flex align-items-center gap-2" style={{borderRadius:12}} onClick={openAdd}>
          <FiPlus /> Add Category
        </button>
      </div>

      {/* Type filter tabs */}
      <div className="d-flex gap-2 mb-4">
        {['ALL', 'EXPENSE', 'INCOME'].map(t => (
          <button key={t} onClick={() => setActiveType(t)}
            className={`btn btn-sm fw-600 ${activeType === t ? 'btn-primary' : 'btn-outline-secondary'}`}
            style={{borderRadius:20, padding:'0.3rem 1rem'}}>
            {t === 'ALL' ? '🗂 All' : t === 'EXPENSE' ? '💸 Expense' : '💰 Income'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-warning"/></div>
      ) : filtered.length === 0 ? (
        <div className="card text-center p-5">
          <div style={{fontSize:'3.5rem',marginBottom:'1rem'}}>🏷️</div>
          <h5 className="fw-800">No Categories Yet</h5>
          <p className="text-muted">Organize your transactions with custom categories.</p>
          <button className="btn btn-primary fw-700 mx-auto" style={{maxWidth:200,borderRadius:12}} onClick={openAdd}>Create Category</button>
        </div>
      ) : (
        <div className="row g-3">
          {filtered.map(c => (
            <div key={c.id} className="col-6 col-sm-4 col-md-3 col-lg-2">
              <div className="card text-center p-3 h-100" style={{borderTop:`3px solid ${c.color||'var(--primary)'}`}}>
                <div className="mb-2" style={{fontSize:'2rem'}}>{c.icon || '🏷️'}</div>
                <div className="fw-700" style={{fontSize:'0.85rem',color:'var(--text)',marginBottom:'0.25rem'}}>{c.name}</div>
                <div style={{fontSize:'0.7rem',marginBottom:'0.5rem'}}>
                  <span className={`badge ${c.category_type === 'INCOME' ? 'badge-income' : 'badge-expense'}`}>
                    {c.category_type === 'INCOME' ? '💰 Income' : '💸 Expense'}
                  </span>
                </div>
                {c.is_system && <div style={{fontSize:'0.7rem',color:'var(--text-muted)'}}>System</div>}
                <div className="d-flex gap-1 justify-content-center mt-2">
                  {!c.is_system && (
                    <>
                      <button className="btn btn-sm p-1" style={{borderRadius:7,background:`${c.color||'var(--primary)'}22`,color:c.color||'var(--primary)',border:'none'}} onClick={()=>openEdit(c)}><FiEdit2 size={12}/></button>
                      <button className="btn btn-sm p-1" style={{borderRadius:7,background:'rgba(229,57,53,0.1)',color:'#E53935',border:'none'}} onClick={()=>setDeleteId(c.id)}><FiTrash2 size={12}/></button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal show d-block" style={{background:'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-800">{editing ? 'Edit Category' : 'Add Category'}</h5>
                <button className="btn-close" onClick={()=>setShowModal(false)}/>
              </div>
              <div className="modal-body p-4">
                {error && <div className="alert alert-danger rounded-xl" style={{fontSize:'0.84rem'}}>{error}</div>}
                <div className="row g-3">
                  {/* Name */}
                  <div className="col-12">
                    <label className="form-label fw-600">Name *</label>
                    <input className="form-control" placeholder="e.g. Groceries, Salary, Rent" value={form.name} onChange={set('name')} />
                  </div>

                  {/* Type */}
                  <div className="col-12">
                    <label className="form-label fw-600">Type *</label>
                    <div className="d-flex gap-2">
                      {CATEGORY_TYPES.map(t => (
                        <button key={t.value} type="button"
                          onClick={() => setForm(f => ({...f, category_type: t.value}))}
                          className="btn fw-600 flex-fill"
                          style={{
                            borderRadius: 10,
                            border: `2px solid ${form.category_type === t.value ? 'var(--primary)' : 'var(--border)'}`,
                            background: form.category_type === t.value ? 'rgba(255,107,0,0.1)' : 'var(--surface)',
                            color: form.category_type === t.value ? 'var(--primary)' : 'var(--text-muted)',
                          }}>
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Icon picker */}
                  <div className="col-12">
                    <label className="form-label fw-600">Icon</label>
                    <div className="d-flex flex-wrap gap-2 mt-1">
                      {ICONS.map(ic => (
                        <button key={ic} type="button" onClick={() => setForm(f => ({...f, icon: ic}))}
                          className="btn btn-sm"
                          style={{width:40,height:40,padding:0,fontSize:'1.2rem',borderRadius:10,
                            border:`2px solid ${form.icon === ic ? 'var(--primary)' : 'var(--border)'}`,
                            background: form.icon === ic ? 'rgba(255,107,0,0.1)' : 'var(--surface)'}}>
                          {ic}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color picker */}
                  <div className="col-12">
                    <label className="form-label fw-600">Color</label>
                    <div className="d-flex flex-wrap gap-2 mt-1 align-items-center">
                      {COLORS.map(col => (
                        <button key={col} type="button" onClick={() => setForm(f => ({...f, color: col}))}
                          className="btn btn-sm"
                          style={{width:32,height:32,padding:0,borderRadius:'50%',background:col,
                            border: form.color === col ? '3px solid var(--text)' : '3px solid transparent',
                            outline: form.color === col ? `2px solid ${col}` : 'none', outlineOffset:2}} />
                      ))}
                      {/* Also allow custom hex color */}
                      <input type="color" value={form.color} onChange={set('color')}
                        style={{width:32,height:32,padding:2,borderRadius:'50%',border:'none',cursor:'pointer'}}
                        title="Custom color" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary fw-600" style={{borderRadius:10}} onClick={()=>setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary fw-700" style={{borderRadius:10}} onClick={handleSave} disabled={saving}>
                  {saving && <span className="spinner-border spinner-border-sm me-2"/>}
                  {saving ? 'Saving...' : editing ? 'Update' : 'Add Category'}
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
                <h6 className="fw-800">Delete Category?</h6>
                <p className="text-muted" style={{fontSize:'0.88rem'}}>This will not delete associated transactions.</p>
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

export default Categories;
