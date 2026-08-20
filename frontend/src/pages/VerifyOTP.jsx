import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiShield, FiRefreshCw, FiAlertCircle } from 'react-icons/fi';
import api from '../services/api';

const VerifyOTP = () => {
  const [params] = useSearchParams();
  const identifier = params.get('identifier');
  const navigate = useNavigate();

  const [otp, setOtp] = useState(Array(6).fill(''));
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const refs = useRef([]);

  useEffect(() => {
    if (!identifier) { navigate('/register'); return; }
    const t = setInterval(() => setTimer(s => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [identifier, navigate]);

  const handleChange = (e, i) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (!val && e.nativeEvent.inputType !== 'deleteContentBackward') return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (e, i) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      refs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) { setError('Please enter all 6 digits.'); return; }
    setError(''); setLoading(true);
    try {
      await api.post('/accounts/verify-otp/', { identifier, otp_code: code, type: 'SMS' });
      navigate('/login?verified=true');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setError(''); setMessage('');
    try {
      await api.post('/accounts/resend-otp/', { identifier, type: 'SMS' });
      setTimer(60); setMessage('New OTP sent to your email and mobile.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to resend OTP.');
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="w-100" style={{ maxWidth: 440 }}>
        <div className="card auth-card animate-fade-in-up">
          <div className="card-body p-4 text-center">
            <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
              style={{ width: 72, height: 72, background: 'linear-gradient(135deg, #FF6B00, #FF8C3A)', fontSize: '1.8rem', color: 'white', boxShadow: '0 8px 24px rgba(255,107,0,0.3)' }}>
              <FiShield />
            </div>
            <h4 className="fw-800 mb-1" style={{ color: 'var(--text)' }}>Verify Your Account</h4>
            <p className="text-muted mb-0" style={{ fontSize: '0.88rem' }}>
              We sent a 6-digit code to <strong>{identifier}</strong>
            </p>
            <p className="text-muted mt-1" style={{ fontSize: '0.8rem' }}>Check your email and SMS</p>

            {error && <div className="alert alert-danger rounded-xl mt-3 d-flex align-items-center gap-2" style={{ fontSize: '0.84rem', textAlign: 'left' }}><FiAlertCircle />{error}</div>}
            {message && <div className="alert alert-success rounded-xl mt-3" style={{ fontSize: '0.84rem' }}>✅ {message}</div>}

            <form onSubmit={handleSubmit} className="mt-4">
              <div className="d-flex justify-content-center gap-2 mb-4" onPaste={handlePaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => (refs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className="otp-input"
                    value={digit}
                    onChange={e => handleChange(e, i)}
                    onKeyDown={e => handleKeyDown(e, i)}
                  />
                ))}
              </div>

              <button type="submit" className="btn btn-primary w-100 fw-700 mb-3" style={{ padding: '0.75rem' }} disabled={loading}>
                {loading && <span className="spinner-border spinner-border-sm me-2" />}
                {loading ? 'Verifying...' : 'Verify Account'}
              </button>
            </form>

            <button
              type="button"
              onClick={handleResend}
              disabled={timer > 0}
              className="btn btn-link p-0 d-flex align-items-center gap-2 mx-auto"
              style={{ color: timer > 0 ? 'var(--text-muted)' : 'var(--primary)', fontSize: '0.88rem', fontWeight: 600, textDecoration: 'none' }}>
              <FiRefreshCw size={14} />
              {timer > 0 ? `Resend code in ${timer}s` : 'Resend Code'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;