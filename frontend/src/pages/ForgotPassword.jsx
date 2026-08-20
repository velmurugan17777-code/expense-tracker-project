import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import api from '../services/api';

const ForgotPassword = () => {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await api.post('/accounts/password-reset/', { identifier });
      setSent(true);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="w-100" style={{ maxWidth: 440 }}>
        <div className="card auth-card animate-fade-in-up">
          <div className="card-body p-4">
            <Link to="/login" className="d-inline-flex align-items-center gap-1 mb-3 text-muted text-decoration-none" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              <FiArrowLeft size={14} /> Back to Login
            </Link>

            {sent ? (
              <div className="text-center py-3">
                <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                  style={{ width: 72, height: 72, background: '#E8F5E9', fontSize: '2rem', color: '#2E7D32' }}>
                  <FiCheckCircle />
                </div>
                <h5 className="fw-800 mb-2">Check Your Email</h5>
                <p className="text-muted" style={{ fontSize: '0.9rem' }}>
                  We've sent a password reset link to <strong>{identifier}</strong>. Check your inbox and spam folder.
                </p>
                <Link to="/login" className="btn btn-primary w-100 fw-700 mt-2" style={{ borderRadius: 12, padding: '0.7rem' }}>Return to Login</Link>
              </div>
            ) : (
              <>
                <div className="text-center mb-4">
                  <div className="auth-logo"><FiMail /></div>
                  <h4 className="fw-800 mb-1" style={{ color: 'var(--text)' }}>Forgot Password?</h4>
                  <p className="text-muted" style={{ fontSize: '0.88rem' }}>Enter your email, mobile, or username and we'll send a reset link.</p>
                </div>
                {error && <div className="alert alert-danger rounded-xl" style={{ fontSize: '0.84rem' }}>{error}</div>}
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="form-label">Email / Mobile / Username</label>
                    <div className="input-group">
                      <span className="input-group-text" style={{ background:'var(--surface-alt)',border:'1.5px solid var(--border)',borderRight:'none',borderRadius:'10px 0 0 10px' }}><FiMail size={14} /></span>
                      <input className="form-control" style={{ borderLeft:'none',borderRadius:'0 10px 10px 0' }} placeholder="Enter your identifier" value={identifier} onChange={e => setIdentifier(e.target.value)} required />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary w-100 fw-700" style={{ padding: '0.75rem' }} disabled={loading}>
                    {loading && <span className="spinner-border spinner-border-sm me-2" />}
                    {loading ? 'Sending...' : 'Send Reset Link'}
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

export default ForgotPassword;
