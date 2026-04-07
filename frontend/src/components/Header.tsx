import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header: React.FC = () => {
  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/" className="navbar-logo">
          <svg className="navbar-logo-svg" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="headerLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#c8e63c"/>
                <stop offset="33%" stopColor="#ff6b35"/>
                <stop offset="66%" stopColor="#e8356e"/>
                <stop offset="100%" stopColor="#7b2d8b"/>
              </linearGradient>
            </defs>
            <circle cx="19" cy="19" r="18" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
            <path d="M8 26 Q10 10 19 8 Q28 6 30 12 Q32 18 26 26" stroke="url(#headerLogoGrad)" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
            <circle cx="19" cy="22" r="4" fill="url(#headerLogoGrad)" opacity="0.9"/>
          </svg>
          <span>Game<span className="text-gold">Palazio</span></span>
        </Link>
        <div className="navbar-links">
          <Link to="/">🎮 Dashboard</Link>
          <Link to="/streaming">📺 Streaming</Link>
          <Link to="/gameplay">🏏 Gameplay</Link>
        </div>
      </div>
    </nav>
  );
};

export default Header;
