import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FiHome, FiTrendingDown, FiTrendingUp, FiPieChart, FiTag, FiTarget, FiCpu, FiFileText, FiUser, FiBell, FiSettings, FiTrendingUp as FiLogo, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { label: 'Dashboard',   to: '/',            icon: FiHome,        exact: true },
  { label: 'Income',      to: '/income',      icon: FiTrendingUp },
  { label: 'Expenses',    to: '/expenses',    icon: FiTrendingDown },
  { label: 'Budgets',     to: '/budgets',     icon: FiPieChart },
  { label: 'Categories',  to: '/categories',  icon: FiTag },
  { label: 'Goals',       to: '/goals',       icon: FiTarget },
  { label: 'Analytics',   to: '/analytics',   icon: FiTrendingDown },
  { label: 'AI Advice',   to: '/ai-advice',   icon: FiCpu },
  { label: 'Reports',     to: '/reports',     icon: FiFileText },
];

const bottomNavItems = [
  { label: 'Home',     to: '/',          icon: FiHome,        exact: true },
  { label: 'Expenses', to: '/expenses',  icon: FiTrendingDown },
  { label: 'Income',   to: '/income',    icon: FiTrendingUp },
  { label: 'Reports',  to: '/reports',   icon: FiFileText },
  { label: 'Profile',  to: '/profile',   icon: FiUser },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user
    ? ((user.first_name?.[0] || '') + (user.last_name?.[0] || '')).toUpperCase() || user.email?.[0]?.toUpperCase()
    : '?';

  return (
    <>
      {/* Overlay — mobile only */}
      {isOpen && (
        <div
          className="d-lg-none position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
          style={{ zIndex: 1039 }}
          onClick={onClose}
        />
      )}

      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-logo">₹</div>
          <div className="sidebar-brand-text">
            <h6>SmartTracker</h6>
            <small>Enterprise</small>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Main Menu</div>
          {navItems.map(({ label, to, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
              onClick={onClose}
            >
              <span className="sidebar-icon"><Icon /></span>
              {label}
            </NavLink>
          ))}

          <div className="sidebar-section-label mt-3">Account</div>
          <NavLink to="/notifications" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`} onClick={onClose}>
            <span className="sidebar-icon"><FiBell /></span>
            Notifications
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`} onClick={onClose}>
            <span className="sidebar-icon"><FiUser /></span>
            Profile
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`} onClick={onClose}>
            <span className="sidebar-icon"><FiSettings /></span>
            Settings
          </NavLink>
        </nav>

        {/* Footer */}
        <div className="p-3 border-top" style={{ borderColor: 'var(--border)' }}>
          <div className="d-flex align-items-center gap-2 mb-3">
            <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-700"
              style={{ width: 36, height: 36, fontSize: '0.85rem', background: 'var(--primary)' }}>
              {initials}
            </div>
            <div>
              <div className="fw-600" style={{ fontSize: '0.85rem' }}>{user?.first_name} {user?.last_name}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{user?.email}</div>
            </div>
          </div>
          <button className="btn btn-sm w-100 d-flex align-items-center gap-2 justify-content-center text-danger"
            style={{ border: '1px solid #ffd5d5', borderRadius: 10, background: 'rgba(229,57,53,0.06)' }}
            onClick={handleLogout}>
            <FiLogOut size={14} /> Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export { navItems, bottomNavItems };
export default Sidebar;
