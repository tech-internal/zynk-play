import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import GamePlayPage from './pages/GamePlayPage';
import StreamingPage from './pages/StreamingPage';
import DashboardPage from './pages/DashboardPage';

function HomePage() {
  return (
    <div className="App">
      <header className="App-header">
        <div className="logo-section">
          <svg className="logo-svg" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#c8e63c"/>
                <stop offset="33%" stopColor="#ff6b35"/>
                <stop offset="66%" stopColor="#e8356e"/>
                <stop offset="100%" stopColor="#7b2d8b"/>
              </linearGradient>
            </defs>
            <circle cx="19" cy="19" r="18" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
            <path d="M8 26 Q10 10 19 8 Q28 6 30 12 Q32 18 26 26" stroke="url(#logoGrad)" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
            <circle cx="19" cy="22" r="4" fill="url(#logoGrad)" opacity="0.9"/>
          </svg>
          <h1>Game<span className="text-gold">Palazio</span></h1>
        </div>
        <p className="tagline">Where Champions Play</p>
        
        <nav className="nav-menu">
          <Link to="/">📺 Streaming</Link>
          <Link to="/dashboard">📊 Dashboard</Link>
          <Link to="/gameplay">🏏 Gameplay</Link>
          <a href="http://localhost:8000/admin/" target="_blank" rel="noopener noreferrer">👨‍💼 Admin</a>
          <a href="http://localhost:8000/" target="_blank" rel="noopener noreferrer">📚 API</a>
        </nav>

        <div className="status">
          <h2>Status</h2>
          <p>✅ Backend: <a href="http://localhost:8000" target="_blank" rel="noopener noreferrer">http://localhost:8000</a></p>
          <p>✅ Frontend: http://localhost:3000</p>
        </div>

        <div className="api-info">
          <h2>Sections</h2>
          <ul>
            <li><Link to="/">📺 Streaming (Home)</Link></li>
            <li><Link to="/dashboard">📊 Dashboard (Gaming & Streaming)</Link></li>
            <li><Link to="/gameplay">🏏 Gameplay & Controls</Link></li>
            <li><a href="http://localhost:8000/admin/" target="_blank" rel="noopener noreferrer">👨‍💼 Admin Panel</a></li>
            <li><a href="http://localhost:8000/" target="_blank" rel="noopener noreferrer">📚 API Documentation</a></li>
          </ul>
        </div>

        <div className="features">
          <h2>Features</h2>
          <ul>
            <li>🔐 Authentication (OTP)</li>
            <li>🎬 Streaming Content</li>
            <li>🎮 Gaming Platform</li>
            <li>💳 Subscription Management</li>
            <li>💰 Payment Processing</li>
          </ul>
        </div>
      </header>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/streaming" element={<StreamingPage />} />
        <Route path="/gameplay" element={<GamePlayPage />} />
        <Route path="/home" element={<HomePage />} />
      </Routes>
    </Router>
  );
}

export default App;
