import React, { useState, useEffect } from 'react';
import { FiSettings, FiMoon, FiSun, FiGlobe, FiBell, FiShield, FiTrash2, FiSave } from 'react-icons/fi';

const Settings = () => {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [currency, setCurrency] = useState(() => localStorage.getItem('currency') || 'INR');
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifBudget, setNotifBudget] = useState(true);
  const [notifDaily, setNotifDaily] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleTheme = (val) => {
    setTheme(val);
    localStorage.setItem('theme', val);
    document.documentElement.setAttribute('data-bs-theme', val);
  };

  const handleSave = () => {
    localStorage.setItem('currency', currency);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const Toggle = ({ checked, onChange, id }) => (
    <div className="form-check form-switch mb-0">
      <input className="form-check-input" type="checkbox" role="switch" id={id} checked={checked} onChange={e => onChange(e.target.checked)} style={{ accentColor: 'var(--primary)', cursor: 'pointer' }} />
    </div>
  );

  const Section = ({ title, icon: Icon, children }) => (
    <div className="card mb-3">
      <div className="card-header d-flex align-items-center gap-2 fw-700">
        <Icon size={16} style={{ color: 'var(--primary)' }} /> {title}
      </div>
      <div className="card-body p-0">{children}</div>
    </div>
  );

  const Row = ({ label, desc, children }) => (
    <div className="d-flex align-items-center justify-content-between px-3 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
      <div>
        <div className="fw-600" style={{ fontSize: '0.9rem', color: 'var(--text)' }}>{label}</div>
        {desc && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{desc}</div>}
      </div>
      {children}
    </div>
  );

  return (
    <div className="animate-fade-in-up" style={{ maxWidth: 640 }}>
      <div className="page-header mb-4">
        <h1 className="page-title d-flex align-items-center gap-2"><FiSettings /> Settings</h1>
        <p className="page-subtitle">Customize your SmartTracker experience</p>
      </div>

      {saved && <div className="alert alert-success rounded-xl mb-3">✅ Settings saved successfully!</div>}

      {/* Appearance */}
      <Section title="Appearance" icon={FiSun}>
        <Row label="Color Theme" desc="Choose between light and dark mode">
          <div className="d-flex gap-2">
            <button className={`btn btn-sm fw-600 d-flex align-items-center gap-1 ${theme === 'light' ? 'btn-primary' : 'btn-outline-secondary'}`} style={{ borderRadius: 9 }} onClick={() => handleTheme('light')}><FiSun size={13} /> Light</button>
            <button className={`btn btn-sm fw-600 d-flex align-items-center gap-1 ${theme === 'dark' ? 'btn-primary' : 'btn-outline-secondary'}`} style={{ borderRadius: 9 }} onClick={() => handleTheme('dark')}><FiMoon size={13} /> Dark</button>
          </div>
        </Row>
      </Section>

      {/* Regional */}
      <Section title="Regional" icon={FiGlobe}>
        <Row label="Currency" desc="Default currency for all transactions">
          <select className="form-select form-select-sm" style={{ width: 120, borderRadius: 10 }} value={currency} onChange={e => setCurrency(e.target.value)}>
            <option value="INR">₹ INR</option>
            <option value="USD">$ USD</option>
            <option value="EUR">€ EUR</option>
            <option value="GBP">£ GBP</option>
          </select>
        </Row>
      </Section>

      {/* Notifications */}
      <Section title="Notifications" icon={FiBell}>
        <Row label="Email Alerts" desc="Receive important alerts by email"><Toggle id="notif-email" checked={notifEmail} onChange={setNotifEmail} /></Row>
        <Row label="Budget Warnings" desc="Alert when nearing budget limit"><Toggle id="notif-budget" checked={notifBudget} onChange={setNotifBudget} /></Row>
        <Row label="Daily Reminder" desc="Daily spending reminder notification"><Toggle id="notif-daily" checked={notifDaily} onChange={setNotifDaily} /></Row>
      </Section>

      {/* Security */}
      <Section title="Security" icon={FiShield}>
        <Row label="Two-Factor Authentication" desc="Extra layer of security (coming soon)">
          <span className="badge" style={{ background: 'rgba(255,107,0,0.12)', color: 'var(--primary)' }}>Soon</span>
        </Row>
      </Section>

      {/* Danger Zone */}
      <Section title="Danger Zone" icon={FiTrash2}>
        <div className="p-3">
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Permanently delete your account and all data. This cannot be undone.</p>
          <button className="btn btn-outline-danger btn-sm fw-600 d-flex align-items-center gap-1" style={{ borderRadius: 10 }}>
            <FiTrash2 size={13} /> Delete My Account
          </button>
        </div>
      </Section>

      <div className="d-grid">
        <button className="btn btn-primary fw-700 d-flex align-items-center justify-content-center gap-2" style={{ padding: '0.75rem', borderRadius: 12 }} onClick={handleSave}>
          <FiSave size={16} /> Save Settings
        </button>
      </div>
    </div>
  );
};

export default Settings;
