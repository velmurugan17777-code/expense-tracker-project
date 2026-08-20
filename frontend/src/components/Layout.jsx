import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import BottomNav from './BottomNav';
import { useAuth } from '../context/AuthContext';
import { FiPlus } from 'react-icons/fi';

const Layout = () => {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-bs-theme', next);
  };

  React.useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
  }, []);

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-warning" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div>
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area */}
      <div className="main-content">
        <Navbar
          onMenuToggle={() => setSidebarOpen(v => !v)}
          theme={theme}
          onThemeToggle={toggleTheme}
        />
        <main className="p-3 p-md-4">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav />

      {/* Floating Action Button (mobile) */}
      <button className="fab" onClick={() => {}} aria-label="Add transaction">
        <FiPlus />
      </button>
    </div>
  );
};

export default Layout;
