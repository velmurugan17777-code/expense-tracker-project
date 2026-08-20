import React, { useState, useEffect, useRef } from 'react';
import { FiUser, FiMail, FiPhone, FiEdit2, FiSave, FiLock, FiEye, FiEyeOff, FiCamera } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const getStrength = (pw) => { let s=0; if(pw.length>=8)s++; if(/[A-Z]/.test(pw))s++; if(/[0-9]/.test(pw))s++; if(/[^A-Za-z0-9]/.test(pw))s++; return s; };
const strengthColors = ['','#E53935','#FF6B00','#FFC107','#2E7D32'];
const strengthLabels = ['','Weak','Fair','Good','Strong'];

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ first_name:'', last_name:'', email:'', mobile_number:'' });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Change password
  const [pwForm, setPwForm] = useState({ old_password:'', new_password:'', confirm:'' });
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const strength = getStrength(pwForm.new_password);

  const fileRef = useRef(null);

  useEffect(() => {
    if (user) setForm({ first_name: user.first_name||'', last_name: user.last_name||'', email: user.email||'', mobile_number: user.mobile_number||'' });
  }, [user]);

  const handleSaveProfile = async () => {
    setError(''); setSaving(true);
    try {
      const res = await api.patch('/accounts/profile/', { first_name: form.first_name, last_name: form.last_name, mobile_number: form.mobile_number });
      if (updateUser) updateUser(res.data);
      setEditing(false); setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch(err) { setError(err.response?.data?.detail||'Update failed.'); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    setPwError('');
    if (pwForm.new_password !== pwForm.confirm) { setPwError('Passwords do not match.'); return; }
    if (strength < 2) { setPwError('Password is too weak.'); return; }
    setPwSaving(true);
    try {
      await api.post('/accounts/change-password/', { old_password: pwForm.old_password, new_password: pwForm.new_password });
      setPwSuccess('Password changed successfully!');
      setPwForm({ old_password:'', new_password:'', confirm:'' });
      setTimeout(()=>setPwSuccess(''),3000);
    } catch(err) { setPwError(err.response?.data?.detail||err.response?.data?.old_password||'Password change failed.'); }
    finally { setPwSaving(false); }
  };

  const setP = k => e => setForm(f=>({...f,[k]:e.target.value}));
  const setPw = k => e => setPwForm(f=>({...f,[k]:e.target.value}));

  const initials = user ? ((user.first_name?.[0]||'')+(user.last_name?.[0]||'')).toUpperCase()||user.email?.[0]?.toUpperCase() : '?';

  return (
    <div className="animate-fade-in-up" style={{maxWidth:680}}>
      <div className="page-header mb-4">
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">Manage your account information</p>
      </div>

      {success && <div className="alert alert-success rounded-xl mb-3">✅ {success}</div>}
      {error && <div className="alert alert-danger rounded-xl mb-3">{error}</div>}

      {/* Avatar & Info */}
      <div className="card mb-3">
        <div className="card-body p-4">
          <div className="d-flex align-items-center gap-4 flex-wrap">
            <div className="position-relative" style={{flexShrink:0}}>
              <div className="rounded-circle d-flex align-items-center justify-content-center fw-800"
                style={{width:80,height:80,background:'linear-gradient(135deg,var(--primary),var(--primary-light))',color:'white',fontSize:'1.8rem',boxShadow:'0 4px 16px rgba(255,107,0,0.3)'}}>
                {initials}
              </div>
              <button className="btn p-0 position-absolute bottom-0 end-0" style={{width:26,height:26,borderRadius:'50%',background:'var(--primary)',color:'white',border:'2px solid white'}}
                onClick={()=>fileRef.current?.click()}>
                <FiCamera size={12}/>
              </button>
              <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} />
            </div>
            <div>
              <h5 className="fw-800 mb-0">{user?.first_name} {user?.last_name}</h5>
              <p className="text-muted mb-1" style={{fontSize:'0.88rem'}}>{user?.email}</p>
              <div className="d-flex gap-2 flex-wrap">
                {user?.is_email_verified && <span className="badge" style={{background:'#E8F5E9',color:'#2E7D32'}}>✉️ Email Verified</span>}
                {user?.is_mobile_verified && <span className="badge" style={{background:'#E8F5E9',color:'#2E7D32'}}>📱 Mobile Verified</span>}
              </div>
            </div>
            <div className="ms-auto">
              {!editing ? (
                <button className="btn btn-outline-primary fw-700 d-flex align-items-center gap-2" style={{borderRadius:10}} onClick={()=>setEditing(true)}>
                  <FiEdit2 size={14}/> Edit Profile
                </button>
              ) : (
                <div className="d-flex gap-2">
                  <button className="btn btn-outline-secondary fw-600" style={{borderRadius:10}} onClick={()=>setEditing(false)}>Cancel</button>
                  <button className="btn btn-primary fw-700 d-flex align-items-center gap-2" style={{borderRadius:10}} onClick={handleSaveProfile} disabled={saving}>
                    {saving&&<span className="spinner-border spinner-border-sm"/>}<FiSave size={14}/> Save
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="card mb-3">
        <div className="card-header fw-700 d-flex align-items-center gap-2"><FiUser style={{color:'var(--primary)'}}/> Personal Information</div>
        <div className="card-body p-4">
          <div className="row g-3">
            <div className="col-6">
              <label className="form-label">First Name</label>
              <input className="form-control" value={form.first_name} onChange={setP('first_name')} disabled={!editing}/>
            </div>
            <div className="col-6">
              <label className="form-label">Last Name</label>
              <input className="form-control" value={form.last_name} onChange={setP('last_name')} disabled={!editing}/>
            </div>
            <div className="col-12">
              <label className="form-label d-flex align-items-center gap-2"><FiMail size={13}/> Email</label>
              <input className="form-control" type="email" value={form.email} disabled style={{background:'var(--surface-alt)'}}/>
              <small className="text-muted">Email cannot be changed.</small>
            </div>
            <div className="col-12">
              <label className="form-label d-flex align-items-center gap-2"><FiPhone size={13}/> Mobile Number</label>
              <input className="form-control" value={form.mobile_number} onChange={setP('mobile_number')} disabled={!editing}/>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="card">
        <div className="card-header fw-700 d-flex align-items-center gap-2"><FiLock style={{color:'var(--primary)'}}/> Change Password</div>
        <div className="card-body p-4">
          {pwError && <div className="alert alert-danger rounded-xl mb-3" style={{fontSize:'0.84rem'}}>{pwError}</div>}
          {pwSuccess && <div className="alert alert-success rounded-xl mb-3" style={{fontSize:'0.84rem'}}>✅ {pwSuccess}</div>}
          <div className="row g-3">
            <div className="col-12">
              <label className="form-label">Current Password</label>
              <div className="input-group">
                <input type={showOld?'text':'password'} className="form-control" style={{borderRight:'none',borderRadius:'10px 0 0 10px'}} placeholder="Current password" value={pwForm.old_password} onChange={setPw('old_password')}/>
                <button type="button" className="input-group-text" style={{background:'var(--surface-alt)',border:'1.5px solid var(--border)',borderLeft:'none',borderRadius:'0 10px 10px 0',cursor:'pointer'}} onClick={()=>setShowOld(v=>!v)}>
                  {showOld?<FiEyeOff size={14}/>:<FiEye size={14}/>}
                </button>
              </div>
            </div>
            <div className="col-12">
              <label className="form-label">New Password</label>
              <div className="input-group">
                <input type={showNew?'text':'password'} className="form-control" style={{borderRight:'none',borderRadius:'10px 0 0 10px'}} placeholder="New password" value={pwForm.new_password} onChange={setPw('new_password')}/>
                <button type="button" className="input-group-text" style={{background:'var(--surface-alt)',border:'1.5px solid var(--border)',borderLeft:'none',borderRadius:'0 10px 10px 0',cursor:'pointer'}} onClick={()=>setShowNew(v=>!v)}>
                  {showNew?<FiEyeOff size={14}/>:<FiEye size={14}/>}
                </button>
              </div>
              {pwForm.new_password && (
                <div className="mt-2">
                  <div style={{height:4,background:'var(--border)',borderRadius:2}}>
                    <div style={{height:'100%',width:`${strength*25}%`,background:strengthColors[strength],borderRadius:2,transition:'all 0.3s'}}/>
                  </div>
                  <small style={{color:strengthColors[strength],fontWeight:600}}>{strengthLabels[strength]}</small>
                </div>
              )}
            </div>
            <div className="col-12">
              <label className="form-label">Confirm New Password</label>
              <input type="password" className="form-control" placeholder="Confirm new password" value={pwForm.confirm} onChange={setPw('confirm')}/>
              {pwForm.new_password && pwForm.confirm && (
                <small style={{color:pwForm.new_password===pwForm.confirm?'#2E7D32':'#E53935',fontWeight:600}}>
                  {pwForm.new_password===pwForm.confirm?'✓ Passwords match':'✗ Passwords do not match'}
                </small>
              )}
            </div>
          </div>
          <button className="btn btn-primary fw-700 mt-3 d-flex align-items-center gap-2" style={{borderRadius:10}} onClick={handleChangePassword} disabled={pwSaving}>
            {pwSaving&&<span className="spinner-border spinner-border-sm"/>}<FiLock size={14}/> Update Password
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
