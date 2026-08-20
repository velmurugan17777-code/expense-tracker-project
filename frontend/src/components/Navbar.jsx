import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiBell, FiMenu, FiX, FiSun, FiMoon, FiUser, FiLogOut, FiSettings } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const PAGE_TITLES = {
  '/':             { title: 'Dashboard',           emoji: '📊' },
  '/income':       { title: 'Income Tracker',       emoji: '💰' },
  '/expenses':     { title: 'Expense Tracker',      emoji: '💸' },
  '/budgets':      { title: 'Budget Manager',       emoji: '🎯' },
  '/categories':   { title: 'Categories',           emoji: '🏷️' },
  '/goals':        { title: 'Goals',                emoji: '🏆' },
  '/analytics':    { title: 'Analytics',            emoji: '📈' },
  '/ai-advice':    { title: 'AI Financial Advisor', emoji: '🤖' },
  '/reports':      { title: 'Reports',              emoji: '📄' },
  '/notifications':{ title: 'Notifications',        emoji: '🔔' },
  '/profile':      { title: 'My Profile',           emoji: '👤' },
  '/settings':     { title: 'Settings',             emoji: '⚙️' },
};

const Navbar = ({ onMenuToggle, theme, onThemeToggle }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  const page = PAGE_TITLES[location.pathname] || { title: 'SmartTracker', emoji: '✨' };
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const initials = user
    ? ((user.first_name?.[0] || '') + (user.last_name?.[0] || '')).toUpperCase() || user.email?.[0]?.toUpperCase()
    : '?';

  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <nav className="app-navbar d-flex align-items-center justify-content-between">
      {/* Left */}
      <div className="d-flex align-items-center gap-3">
        <button
          className="btn btn-sm d-lg-none p-1 border-0"
          style={{ color: 'var(--text)', fontSize: '1.3rem' }}
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          <FiMenu />
        </button>
        <div>
          <div className="d-flex align-items-center gap-2">
            <span style={{ fontSize: '1.2rem' }}>{page.emoji}</span>
            <h6 className="mb-0 fw-800" style={{ fontSize: '1rem', color: 'var(--text)' }}>{page.title}</h6>
          </div>
          <div className="d-none d-sm-block" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {greeting}, <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{user?.first_name || 'there'}</span>!
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="d-flex align-items-center gap-2">
        {/* Theme toggle */}
        <button
          className="btn btn-sm border-0 p-2"
          style={{ color: 'var(--text-muted)', borderRadius: 10, background: 'var(--surface-alt)' }}
          onClick={onThemeToggle}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <FiSun size={16} /> : <FiMoon size={16} />}
        </button>

        {/* Notifications */}
        <Link to="/notifications"
          className="btn btn-sm border-0 p-2 position-relative"
          style={{ color: 'var(--text-muted)', borderRadius: 10, background: 'var(--surface-alt)' }}>
          <FiBell size={16} />
        </Link>

        {/* User menu */}
        <div className="position-relative" ref={userMenuRef}>
          <button
            className="btn btn-sm border-0 p-0 d-flex align-items-center gap-2"
            onClick={() => setShowUserMenu(v => !v)}
          >
            <div className="rounded-circle d-flex align-items-center justify-content-center text-white fw-700"
              style={{ width: 34, height: 34, background: 'var(--primary)', fontSize: '0.8rem' }}>
              {initials}
            </div>
            <div className="d-none d-sm-block text-start">
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)', lineHeight: 1.2 }}>
                {user?.first_name} {user?.last_name}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{user?.email}</div>
            </div>
          </button>

          {showUserMenu && (
            <div className="position-absolute end-0 mt-2 py-1 rounded-xl shadow-lg"
              style={{ minWidth: 180, background: 'var(--surface)', border: '1px solid var(--border)', zIndex: 1050, borderRadius: 12 }}>
              <Link to="/profile" className="dropdown-item d-flex align-items-center gap-2 px-3 py-2"
                onClick={() => setShowUserMenu(false)} style={{ fontSize: '0.88rem', color: 'var(--text)' }}>
                <FiUser size={14} /> Profile
              </Link>
              <Link to="/settings" className="dropdown-item d-flex align-items-center gap-2 px-3 py-2"
                onClick={() => setShowUserMenu(false)} style={{ fontSize: '0.88rem', color: 'var(--text)' }}>
                <FiSettings size={14} /> Settings
              </Link>
              <hr className="my-1" />
              <button className="dropdown-item d-flex align-items-center gap-2 px-3 py-2 text-danger"
                style={{ fontSize: '0.88rem', border: 'none', background: 'none', width: '100%' }}
                onClick={() => { logout(); navigate('/login'); }}>
                <FiLogOut size={14} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
