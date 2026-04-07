import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import GamePlayPage from './pages/GamePlayPage';
import StreamingPage from './pages/StreamingPage';
import DashboardPage from './pages/DashboardPage';

function HomePage() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>🎮 Zynk Play</h1>
        <p>Entertainment Platform</p>
        
        <nav className="nav-menu">
          <Link to="/dashboard">📊 Dashboard</Link>
          <Link to="/gameplay">🏏 Gameplay</Link>
          <Link to="/streaming">🎬 Streaming</Link>
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
            <li><Link to="/dashboard">📊 Dashboard (Gaming & Streaming Side-by-Side)</Link></li>
            <li><Link to="/gameplay">🎮 Gameplay & Controls</Link></li>
            <li><Link to="/streaming">🎬 Live Streaming</Link></li>
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
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/gameplay" element={<GamePlayPage />} />
        <Route path="/streaming" element={<StreamingPage />} />
      </Routes>
    </Router>
  );
}

export default App;
