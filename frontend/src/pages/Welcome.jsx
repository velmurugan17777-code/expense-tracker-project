import React from 'react';
import { Link } from 'react-router-dom';
import { FiShield, FiTrendingUp, FiPieChart, FiCpu } from 'react-icons/fi';

const features = [
  { icon: FiTrendingUp, label: 'Track Income & Expenses',   color: '#2E7D32', bg: '#E8F5E9' },
  { icon: FiPieChart,   label: 'Smart Budget Planning',      color: '#1565C0', bg: '#E3F2FD' },
  { icon: FiCpu,        label: 'AI Financial Advice',        color: '#FF6B00', bg: '#FFF3E0' },
  { icon: FiShield,     label: 'Bank-Grade Security',        color: '#6A1B9A', bg: '#F3E5F5' },
];

const Welcome = () => (
  <div className="welcome-hero">
    {/* Header */}
    <div className="text-center pt-5 pb-3 px-3 animate-fade-in-up">
      <div className="d-inline-flex align-items-center justify-content-center rounded-2xl mb-3"
        style={{ width: 80, height: 80, background: 'linear-gradient(135deg, #FF6B00, #FF8C3A)', fontSize: '2.2rem', color: 'white', boxShadow: '0 8px 24px rgba(255,107,0,0.3)' }}>
        ₹
      </div>
      <h1 className="fw-800 mb-2" style={{ fontSize: 'clamp(1.8rem, 5vw, 2.8rem)', color: 'var(--text)' }}>
        Welcome to <span style={{ color: 'var(--primary)' }}>SmartTracker</span>
      </h1>
      <p className="text-muted mb-0 mx-auto" style={{ maxWidth: 420, fontSize: '1rem' }}>
        Your AI-powered personal finance manager. Track expenses, plan budgets, and achieve your financial goals.
      </p>
    </div>

    {/* Feature cards */}
    <div className="container px-3 py-4">
      <div className="row g-3 justify-content-center">
        {features.map(({ icon: Icon, label, color, bg }) => (
          <div key={label} className="col-6 col-md-3 animate-fade-in-up">
            <div className="feature-card h-100">
              <div className="feature-icon mb-2 mx-auto" style={{ background: bg, color }}>
                <Icon size={22} />
              </div>
              <p className="mb-0 fw-600" style={{ fontSize: '0.82rem', color: 'var(--text)' }}>{label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* CTA */}
    <div className="container px-3 pb-5 mt-auto">
      <div className="d-grid gap-3" style={{ maxWidth: 380, margin: '0 auto' }}>
        <Link to="/register" className="btn btn-primary btn-lg fw-700" style={{ borderRadius: 14, padding: '0.85rem' }}>
          Get Started — It's Free
        </Link>
        <Link to="/login" className="btn btn-outline-primary btn-lg fw-700" style={{ borderRadius: 14, padding: '0.85rem' }}>
          Sign In to My Account
        </Link>
      </div>
      <p className="text-center text-muted mt-3" style={{ fontSize: '0.78rem' }}>
        🔒 Your data is encrypted and secure
      </p>
    </div>
  </div>
);

export default Welcome;
