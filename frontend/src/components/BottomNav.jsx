import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiHome, FiTrendingDown, FiTrendingUp, FiFileText, FiUser } from 'react-icons/fi';

const BottomNav = () => {
  const items = [
    { label: 'Home',     to: '/',          icon: FiHome,        exact: true },
    { label: 'Expenses', to: '/expenses',  icon: FiTrendingDown },
    { label: 'Income',   to: '/income',    icon: FiTrendingUp },
    { label: 'Reports',  to: '/reports',   icon: FiFileText },
    { label: 'Profile',  to: '/profile',   icon: FiUser },
  ];

  return (
    <nav className="bottom-nav">
      {items.map(({ label, to, icon: Icon, exact }) => (
        <NavLink
          key={to}
          to={to}
          end={exact}
          className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
        >
          <Icon className="nav-icon" />
          <span>{label}</span>
          <div className="nav-dot" />
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;
