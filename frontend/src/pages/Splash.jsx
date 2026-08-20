import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Splash = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => navigate('/welcome'), 2500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="splash-screen">
      <div className="splash-logo">₹</div>
      <h1 className="fw-800 mb-1" style={{ fontSize: '2rem', letterSpacing: '-0.5px' }}>SmartTracker</h1>
      <p style={{ opacity: 0.8, fontSize: '0.9rem', letterSpacing: '2px', textTransform: 'uppercase' }}>Enterprise Edition</p>
      <div className="splash-progress">
        <div className="splash-progress-bar" />
      </div>
    </div>
  );
};

export default Splash;
