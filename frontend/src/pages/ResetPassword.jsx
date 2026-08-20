import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FiLock, FiEye, FiEyeOff, FiCheckCircle } from 'react-icons/fi';
import api from '../services/api';

const getStrength = (pw) => {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
};
const strengthColors = ['', '#E53935', '#FF6B00', '#FFC107', '#2E7D32'];
const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

const ResetPassword = () => {
  const [params] = useSearchParams();
  const token = params.get('token');
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const strength = getStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (strength < 2) { setError('Password is too weak.'); return; }
    setError(''); setLoading(true);
    try {
      await api.post('/accounts/password-reset/confirm/', { token, password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="w-100" style={{ maxWidth: 440 }}>
        <div className="card auth-card animate-fade-in-up">
          <div className="card-body p-4">
            {success ? (
              <div className="text-center py-3">
                <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3" style={{ width: 72, height: 72, background: '#E8F5E9', fontSize: '2rem', color: '#2E7D32' }}>
                  <FiCheckCircle />
                </div>
                <h5 className="fw-800">Password Reset!</h5>
                <p className="text-muted">Your password has been updated. Redirecting to login...</p>
              </div>
            ) : (
              <>
                <div className="text-center mb-4">
                  <div className="auth-logo"><FiLock /></div>
                  <h4 className="fw-800 mb-1">Reset Password</h4>
                  <p className="text-muted" style={{ fontSize: '0.88rem' }}>Create a new strong password for your account.</p>
                </div>
                {error && <div className="alert alert-danger rounded-xl" style={{ fontSize: '0.84rem' }}>{error}</div>}
                {!token && <div className="alert alert-warning rounded-xl">Invalid or missing reset token.</div>}
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label">New Password</label>
                    <div className="input-group">
                      <span className="input-group-text" style={{ background:'var(--surface-alt)',border:'1.5px solid var(--border)',borderRight:'none',borderRadius:'10px 0 0 10px' }}><FiLock size={14} /></span>
                      <input type={showPw ? 'text' : 'password'} className="form-control" style={{ borderLeft:'none',borderRight:'none',borderRadius:0 }} placeholder="New password" value={password} onChange={e => setPassword(e.target.value)} required disabled={!token} />
                      <button type="button" className="input-group-text" style={{ background:'var(--surface-alt)',border:'1.5px solid var(--border)',borderLeft:'none',borderRadius:'0 10px 10px 0',cursor:'pointer' }} onClick={() => setShowPw(v=>!v)}>
                        {showPw ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                      </button>
                    </div>
                    {password && (
                      <div className="mt-2">
                        <div style={{ height: 4, background: 'var(--border)', borderRadius: 2 }}>
                          <div style={{ height: '100%', width: `${strength * 25}%`, background: strengthColors[strength], borderRadius: 2, transition: 'all 0.3s' }} />
                        </div>
                        <small style={{ color: strengthColors[strength], fontWeight: 600 }}>{strengthLabels[strength]}</small>
                      </div>
                    )}
                  </div>
                  <div className="mb-4">
                    <label className="form-label">Confirm Password</label>
                    <input type="password" className="form-control" placeholder="Confirm password" value={confirm} onChange={e => setConfirm(e.target.value)} required disabled={!token} />
                    {confirm && password !== confirm && <small style={{ color: '#E53935', fontWeight: 600 }}>✗ Passwords do not match</small>}
                  </div>
                  <button type="submit" className="btn btn-primary w-100 fw-700" style={{ padding: '0.75rem' }} disabled={loading || !token}>
                    {loading && <span className="spinner-border spinner-border-sm me-2" />}
                    {loading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
