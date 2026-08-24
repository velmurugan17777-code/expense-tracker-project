import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FiEye, FiEyeOff, FiMail, FiPhone, FiUser, FiLock, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginTab, setLoginTab] = useState('email');
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const verified = params.get('verified');
  const registered = params.get('registered');

  const tabIcons = { email: FiMail, mobile: FiPhone, username: FiUser };
  const tabPlaceholders = { email: 'Enter your email', mobile: 'Enter mobile number', username: 'Enter username' };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/accounts/login/', { identifier, password });
      login(res.data.user, res.data.access, res.data.refresh);
      navigate('/');
    } catch (err) {
      const detail = err.response?.data?.detail || err.response?.data?.error || 'Login failed. Please check your credentials.';
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  const TabIcon = tabIcons[loginTab];

  return (
    <div className="auth-wrapper">
      <div className="w-100" style={{ maxWidth: 440 }}>
        {/* Verified notice */}
        {verified && (
          <div className="alert alert-success rounded-xl mb-3 d-flex align-items-center gap-2" role="alert">
            ✅ Account verified! Please log in.
          </div>
        )}
        {registered && (
          <div className="alert alert-success rounded-xl mb-3 d-flex align-items-center gap-2" role="alert">
            🎉 Account created successfully! Please log in.
          </div>
        )}

        <div className="card auth-card animate-fade-in-up">
          <div className="card-body p-4">
            {/* Logo */}
            <div className="text-center mb-4">
              <div className="auth-logo">₹</div>
              <h4 className="fw-800 mb-1" style={{ color: 'var(--text)' }}>Welcome Back</h4>
              <p className="text-muted mb-0" style={{ fontSize: '0.88rem' }}>Sign in to your SmartTracker account</p>
            </div>

            {/* Login Type Tabs */}
            <div className="d-flex rounded-xl overflow-hidden mb-4" style={{ background: 'var(--surface-alt)', padding: 4, gap: 4 }}>
              {['email', 'mobile', 'username'].map(tab => (
                <button key={tab}
                  type="button"
                  className="flex-fill btn btn-sm fw-600"
                  style={{
                    borderRadius: 9,
                    fontSize: '0.78rem',
                    padding: '0.4rem',
                    background: loginTab === tab ? 'var(--surface)' : 'transparent',
                    color: loginTab === tab ? 'var(--primary)' : 'var(--text-muted)',
                    boxShadow: loginTab === tab ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                    border: 'none',
                    transition: 'all 0.2s',
                  }}
                  onClick={() => { setLoginTab(tab); setIdentifier(''); }}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {error && (
              <div className="alert alert-danger rounded-xl d-flex align-items-center gap-2" style={{ fontSize: '0.85rem' }}>
                <FiAlertCircle /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">
                  {loginTab === 'email' ? 'Email Address' : loginTab === 'mobile' ? 'Mobile Number' : 'Username'}
                </label>
                <div className="input-group">
                  <span className="input-group-text" style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)', borderRight: 'none', borderRadius: '10px 0 0 10px' }}>
                    <TabIcon size={15} style={{ color: 'var(--text-muted)' }} />
                  </span>
                  <input
                    type={loginTab === 'email' ? 'email' : 'text'}
                    className="form-control"
                    style={{ borderLeft: 'none', borderRadius: '0 10px 10px 0' }}
                    placeholder={tabPlaceholders[loginTab]}
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Password</label>
                <div className="input-group">
                  <span className="input-group-text" style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)', borderRight: 'none', borderRadius: '10px 0 0 10px' }}>
                    <FiLock size={15} style={{ color: 'var(--text-muted)' }} />
                  </span>
                  <input
                    type={showPw ? 'text' : 'password'}
                    className="form-control"
                    style={{ borderLeft: 'none', borderRight: 'none', borderRadius: 0 }}
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                  <button type="button"
                    className="input-group-text"
                    style={{ background: 'var(--surface-alt)', border: '1.5px solid var(--border)', borderLeft: 'none', borderRadius: '0 10px 10px 0', cursor: 'pointer' }}
                    onClick={() => setShowPw(v => !v)}>
                    {showPw ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                  </button>
                </div>
              </div>

              <div className="d-flex align-items-center justify-content-between mb-4">
                <div className="form-check mb-0">
                  <input className="form-check-input" type="checkbox" id="rememberMe" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} style={{ accentColor: 'var(--primary)' }} />
                  <label className="form-check-label" htmlFor="rememberMe" style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>Remember me</label>
                </div>
                <Link to="/forgot-password" style={{ fontSize: '0.84rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                  Forgot password?
                </Link>
              </div>

              <button type="submit" className="btn btn-primary w-100 fw-700" style={{ padding: '0.75rem', fontSize: '0.95rem' }} disabled={loading}>
                {loading ? <span className="spinner-border spinner-border-sm me-2" role="status" /> : null}
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p className="text-center mt-4 mb-0" style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>Create Account</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
