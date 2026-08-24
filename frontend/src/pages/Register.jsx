import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff, FiUser, FiMail, FiPhone, FiLock, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import api from '../services/api';

const getStrength = (pw) => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
};
const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const strengthColors = ['', '#E53935', '#FF6B00', '#FFC107', '#2E7D32'];

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ first_name: '', last_name: '', username: '', email: '', mobile_number: '', password: '', password_confirm: '', terms_accepted: false });
  const [showPw, setShowPw] = useState(false);
  const [showPwC, setShowPwC] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const strength = getStrength(form.password);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setFieldErrors({});
    if (form.password !== form.password_confirm) { setFieldErrors({ password_confirm: 'Passwords do not match.' }); return; }
    if (strength < 2) { setFieldErrors({ password: 'Password is too weak.' }); return; }
    if (!form.terms_accepted) { setError('You must accept the terms and conditions.'); return; }
    setLoading(true);
    try {
      await api.post('/accounts/register/', form);
      navigate('/login?registered=true');
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        const msgs = Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`);
        setError(msgs.join(' | '));
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper" style={{ padding: '1.5rem 1rem' }}>
      <div className="w-100" style={{ maxWidth: 480 }}>
        <div className="card auth-card animate-fade-in-up" style={{ maxWidth: 480 }}>
          <div className="card-body p-4">
            <div className="text-center mb-4">
              <div className="auth-logo">₹</div>
              <h4 className="fw-800 mb-1" style={{ color: 'var(--text)' }}>Create Account</h4>
              <p className="text-muted mb-0" style={{ fontSize: '0.88rem' }}>Join SmartTracker to manage your finances</p>
            </div>

            {error && (
              <div className="alert alert-danger rounded-xl d-flex align-items-start gap-2" style={{ fontSize: '0.84rem' }}>
                <FiAlertCircle className="mt-1 flex-shrink-0" /> <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-6">
                  <label className="form-label">First Name</label>
                  <div className="input-group">
                    <span className="input-group-text" style={{ background:'var(--surface-alt)',border:'1.5px solid var(--border)',borderRight:'none',borderRadius:'10px 0 0 10px' }}><FiUser size={14} /></span>
                    <input className="form-control" style={{ borderLeft:'none',borderRadius:'0 10px 10px 0' }} placeholder="First" value={form.first_name} onChange={set('first_name')} required />
                  </div>
                </div>
                <div className="col-6">
                  <label className="form-label">Last Name</label>
                  <input className="form-control" placeholder="Last" value={form.last_name} onChange={set('last_name')} required />
                </div>
                <div className="col-12">
                  <label className="form-label">Username</label>
                  <div className="input-group">
                    <span className="input-group-text" style={{ background:'var(--surface-alt)',border:'1.5px solid var(--border)',borderRight:'none',borderRadius:'10px 0 0 10px' }}>@</span>
                    <input className="form-control" style={{ borderLeft:'none',borderRadius:'0 10px 10px 0' }} placeholder="Choose a username" value={form.username} onChange={set('username')} required />
                  </div>
                </div>
                <div className="col-12">
                  <label className="form-label">Email Address</label>
                  <div className="input-group">
                    <span className="input-group-text" style={{ background:'var(--surface-alt)',border:'1.5px solid var(--border)',borderRight:'none',borderRadius:'10px 0 0 10px' }}><FiMail size={14} /></span>
                    <input type="email" className="form-control" style={{ borderLeft:'none',borderRadius:'0 10px 10px 0' }} placeholder="your@email.com" value={form.email} onChange={set('email')} required />
                  </div>
                </div>
                <div className="col-12">
                  <label className="form-label">Mobile Number</label>
                  <div className="input-group">
                    <span className="input-group-text" style={{ background:'var(--surface-alt)',border:'1.5px solid var(--border)',borderRight:'none',borderRadius:'10px 0 0 10px' }}><FiPhone size={14} /></span>
                    <input className="form-control" style={{ borderLeft:'none',borderRadius:'0 10px 10px 0' }} placeholder="+91 98765 43210" value={form.mobile_number} onChange={set('mobile_number')} required />
                  </div>
                </div>
                <div className="col-12">
                  <label className="form-label">Password</label>
                  <div className="input-group">
                    <span className="input-group-text" style={{ background:'var(--surface-alt)',border:'1.5px solid var(--border)',borderRight:'none',borderRadius:'10px 0 0 10px' }}><FiLock size={14} /></span>
                    <input type={showPw?'text':'password'} className={`form-control ${fieldErrors.password?'is-invalid':''}`} style={{ borderLeft:'none',borderRight:'none',borderRadius:0 }} placeholder="Create strong password" value={form.password} onChange={set('password')} required />
                    <button type="button" className="input-group-text" style={{ background:'var(--surface-alt)',border:'1.5px solid var(--border)',borderLeft:'none',borderRadius:'0 10px 10px 0',cursor:'pointer' }} onClick={() => setShowPw(v=>!v)}>
                      {showPw ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                    </button>
                  </div>
                  {form.password && (
                    <div className="mt-2">
                      <div className="password-strength" style={{ background: 'var(--border)' }}>
                        <div className={`strength-${strength}`} style={{ height: '100%', borderRadius: 2, background: strengthColors[strength], width: `${strength * 25}%`, transition: 'all 0.3s' }} />
                      </div>
                      <small style={{ color: strengthColors[strength], fontWeight: 600 }}>{strengthLabels[strength]}</small>
                    </div>
                  )}
                  {fieldErrors.password && <div className="invalid-feedback d-block">{fieldErrors.password}</div>}
                </div>
                <div className="col-12">
                  <label className="form-label">Confirm Password</label>
                  <div className="input-group">
                    <span className="input-group-text" style={{ background:'var(--surface-alt)',border:'1.5px solid var(--border)',borderRight:'none',borderRadius:'10px 0 0 10px' }}><FiLock size={14} /></span>
                    <input type={showPwC?'text':'password'} className={`form-control ${fieldErrors.password_confirm?'is-invalid':''}`} style={{ borderLeft:'none',borderRight:'none',borderRadius:0 }} placeholder="Repeat password" value={form.password_confirm} onChange={set('password_confirm')} required />
                    <button type="button" className="input-group-text" style={{ background:'var(--surface-alt)',border:'1.5px solid var(--border)',borderLeft:'none',borderRadius:'0 10px 10px 0',cursor:'pointer' }} onClick={() => setShowPwC(v=>!v)}>
                      {showPwC ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                    </button>
                  </div>
                  {form.password && form.password_confirm && (
                    <small style={{ color: form.password === form.password_confirm ? '#2E7D32' : '#E53935', fontWeight: 600 }}>
                      {form.password === form.password_confirm ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </small>
                  )}
                  {fieldErrors.password_confirm && <div className="invalid-feedback d-block">{fieldErrors.password_confirm}</div>}
                </div>
                <div className="col-12">
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id="terms" checked={form.terms_accepted} onChange={set('terms_accepted')} style={{ accentColor: 'var(--primary)' }} />
                    <label className="form-check-label" htmlFor="terms" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      I accept the <a href="#" style={{ color: 'var(--primary)', fontWeight: 600 }}>Terms & Conditions</a>
                    </label>
                  </div>
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-100 fw-700 mt-4" style={{ padding: '0.75rem' }} disabled={loading}>
                {loading && <span className="spinner-border spinner-border-sm me-2" />}
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <p className="text-center mt-3 mb-0" style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
