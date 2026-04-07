import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>🎮 Zynk Play</h1>
        <p>Entertainment Platform</p>
        
        <div className="status">
          <h2>Status</h2>
          <p>✅ Backend: <a href="http://localhost:8000" target="_blank" rel="noopener noreferrer">http://localhost:8000</a></p>
          <p>✅ Frontend: http://localhost:3000</p>
        </div>

        <div className="api-info">
          <h2>API Endpoints</h2>
          <ul>
            <li><a href="http://localhost:8000/admin/" target="_blank" rel="noopener noreferrer">Admin Panel</a></li>
            <li><a href="http://localhost:8000/" target="_blank" rel="noopener noreferrer">API Documentation</a></li>
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

export default App;
