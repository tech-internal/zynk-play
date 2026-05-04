import React, { useState, useEffect } from 'react';
import './DashboardPage.css';
import { AFG_CRICKET_GAME_URL } from '../config/afgCricket';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      video: React.VideoHTMLAttributes<HTMLVideoElement>;
      iframe: React.IframeHTMLAttributes<HTMLIFrameElement>;
    }
  }
}

const DashboardPage: React.FC = () => {
  const [activeGameTab, setActiveGameTab] = useState<'keyboard' | 'touch'>('keyboard');
  const [selectedStream, setSelectedStream] = useState(1);
  const [gameFullscreen, setGameFullscreen] = useState(false);
  const [streamFullscreen, setStreamFullscreen] = useState(false);
  const [streamLoading, setStreamLoading] = useState(true);
  const [streamError, setStreamError] = useState(false);

  // Keyboard Controls
  const keyboardControls = [
    { key: '↑ / W', action: 'Move Forward' },
    { key: '↓ / S', action: 'Move Backward' },
    { key: '← / A', action: 'Move Left' },
    { key: '→ / D', action: 'Move Right' },
    { key: 'SPACE', action: 'Play Shot' },
    { key: 'SHIFT', action: 'Power Shot' },
  ];

  // Touch Controls
  const touchControls = [
    { gesture: 'Swipe Right', arrow: '→', action: 'Power Drive' },
    { gesture: 'Swipe Left', arrow: '←', action: 'Pull Shot' },
    { gesture: 'Swipe Up', arrow: '↑', action: 'Lofted Shot' },
    { gesture: 'Tap', arrow: '●', action: 'Quick Single' },
  ];

  // Leaderboard
  const leaderboard = [
    { rank: 1, name: 'Champion Striker', runs: '342 runs', score: '8.5K', avatar: '⭐' },
    { rank: 2, name: 'Power Hitter', runs: '298 runs', score: '7.8K', avatar: '🔥' },
    { rank: 3, name: 'Quick Runner', runs: '267 runs', score: '7.1K', avatar: '⚡' },
  ];

  // Streams with real URLs
  const streams = [
    {
      id: 1,
      title: 'Live Cricket - PSL Finals',
      channel: 'ESPN Cricket',
      viewers: '45.2K',
      quality: '1080p',
      url: 'https://d1clrt8nxj7onv.cloudfront.net/live/myStream/playlist.m3u8',
      image: '🏏',
    },
    {
      id: 2,
      title: 'Gaming Championship 2025',
      channel: 'GameHub',
      viewers: '32.5K',
      quality: 'HD',
      url: 'https://d1clrt8nxj7onv.cloudfront.net/live/myStream/playlist.m3u8',
      image: '🎮',
    },
    {
      id: 3,
      title: 'Cricket Academy Live',
      channel: 'SportzTV',
      viewers: '18.9K',
      quality: '1080p',
      url: 'https://d1clrt8nxj7onv.cloudfront.net/live/myStream/playlist.m3u8',
      image: '📺',
    },
  ];

  // Categories
  const categories = [
    { name: 'Sports', icon: '⚽' },
    { name: 'Gaming', icon: '🎮' },
    { name: 'Music', icon: '🎵' },
    { name: 'Tech', icon: '💻' },
  ];

  // Features
  const features = [
    { icon: '⚡', title: 'Lightning Fast', desc: 'Play without lag' },
    { icon: '🌍', title: 'Global', desc: 'Connect worldwide' },
    { icon: '🎁', title: 'Rewards', desc: 'Win prizes' },
    { icon: '📱', title: 'Mobile Ready', desc: 'Play anywhere' },
  ];

  const GAME_URL = AFG_CRICKET_GAME_URL;

  // Get current stream
  const currentStream = streams.find(s => s.id === selectedStream);

  // Handle game launch
  const handlePlayGame = () => {
    window.open(GAME_URL, 'game', 'width=1024,height=768,resizable=yes,scrollbars=no');
  };

  // Handle stream watch
  const handleWatchStream = () => {
    if (currentStream) {
      // Try to open in new window, or open HLS URL directly
      const hlsUrl = currentStream.url;
      const width = window.innerWidth > 1024 ? 1024 : window.innerWidth - 40;
      const height = width * 0.5625;
      window.open(hlsUrl, 'stream', `width=${width},height=${height},resizable=yes`);
    }
  };

  // Toggle game fullscreen
  const toggleGameFullscreen = async () => {
    const element = document.getElementById('game-container');
    if (!element) return;

    try {
      if (!gameFullscreen) {
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        }
      } else {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        }
      }
      setGameFullscreen(!gameFullscreen);
    } catch (error) {
      console.log('Fullscreen not available');
      setGameFullscreen(!gameFullscreen);
    }
  };

  // Toggle stream fullscreen
  const toggleStreamFullscreen = async () => {
    const element = document.getElementById('stream-container');
    if (!element) return;

    try {
      if (!streamFullscreen) {
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        }
      } else {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        }
      }
      setStreamFullscreen(!streamFullscreen);
    } catch (error) {
      console.log('Fullscreen not available');
      setStreamFullscreen(!streamFullscreen);
    }
  };

  // Reload game
  const handleReloadGame = () => {
    const iframe = document.getElementById('game-iframe') as HTMLIFrameElement;
    if (iframe) {
      iframe.src = GAME_URL;
    }
  };

  // Reload stream
  const handleReloadStream = () => {
    setStreamLoading(true);
    setStreamError(false);
    const video = document.getElementById('stream-video') as HTMLVideoElement;
    if (video) {
      video.src = currentStream?.url || '';
      video.load();
    }
  };

  // Handle stream loaded
  const handleStreamLoaded = () => {
    setStreamLoading(false);
  };

  // Handle stream error
  const handleStreamError = () => {
    setStreamLoading(false);
    setStreamError(true);
  };

  return (
    <div className="dashboard-page">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1>🎮 Gaming & 📺 Streaming Dashboard</h1>
          <p>Play Games & Watch Streams Side-by-Side</p>
        </div>
      </div>

      {/* Main Container */}
      <div className="container dashboard-container">
        {/* Left Column - Gaming */}
        <div className="dashboard-column gaming-column">
          <div className="column-header">
            <h2>🎮 Gaming</h2>
            <div className="header-controls">
              <button className="icon-btn" onClick={handleReloadGame} title="Reload Game">↺</button>
              <button className="icon-btn" onClick={toggleGameFullscreen} title="Fullscreen">⛶</button>
            </div>
          </div>

          {/* Game Container */}
          <div className="game-container-wrap" id="game-container">
            <div className="game-embed">
              <iframe
                id="game-iframe"
                src={GAME_URL}
                title="AFG Cricket Game"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          </div>

          {/* Controls Section */}
          <div className="controls-section">
            <div className="controls-tabs">
              <button
                className={`tab-btn ${activeGameTab === 'keyboard' ? 'active' : ''}`}
                onClick={() => setActiveGameTab('keyboard')}
              >
                ⌨️ Keyboard
              </button>
              <button
                className={`tab-btn ${activeGameTab === 'touch' ? 'active' : ''}`}
                onClick={() => setActiveGameTab('touch')}
              >
                👆 Touch
              </button>
            </div>

            <div className="controls-list">
              {activeGameTab === 'keyboard' ? (
                <div className="controls-grid">
                  {keyboardControls.map((ctrl, i) => (
                    <div key={i} className="control-item">
                      <div className="control-key">{ctrl.key}</div>
                      <div className="control-action">{ctrl.action}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="controls-grid">
                  {touchControls.map((ctrl, i) => (
                    <div key={i} className="control-item">
                      <div className="control-gesture">{ctrl.gesture}</div>
                      <div className="control-action">{ctrl.action}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Leaderboard */}
          <div className="mini-leaderboard">
            <h3>🏆 Top Players</h3>
            <div className="leaderboard-list">
              {leaderboard.map((player) => (
                <div key={player.rank} className="leaderboard-item">
                  <div className="rank-badge">{player.rank}</div>
                  <div className="player-info">
                    <div className="player-name">{player.avatar} {player.name}</div>
                    <div className="player-stats">{player.runs}</div>
                  </div>
                  <div className="player-score">{player.score}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Play Button */}
          <button className="btn-primary" onClick={handlePlayGame}>
            ▶ Play Game Now
          </button>
        </div>

        {/* Right Column - Streaming */}
        <div className="dashboard-column streaming-column">
          <div className="column-header">
            <h2>📺 Streaming</h2>
            <div className="header-controls">
              <button className="icon-btn" onClick={handleReloadStream} title="Reload Stream">↺</button>
              <button className="icon-btn" onClick={toggleStreamFullscreen} title="Fullscreen">⛶</button>
            </div>
          </div>

          {/* Stream Player */}
          <div className="stream-player-wrap" id="stream-container">
            <div className="stream-player">
              <video
                id="stream-video"
                className="stream-video"
                controls
                onLoadedData={handleStreamLoaded}
                onError={handleStreamError}
                poster="https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=600&q=80"
              >
                <source src={currentStream?.url || ''} type="application/x-mpegURL" />
                Your browser does not support HTML5 video.
              </video>

              {streamLoading && (
                <div className="stream-overlay">
                  <div className="spinner"></div>
                  <p>Connecting to stream...</p>
                </div>
              )}

              {streamError && (
                <div className="stream-overlay">
                  <p>⚠️ Stream not available</p>
                </div>
              )}
            </div>
          </div>

          {/* Stream Info */}
          {currentStream && (
            <div className="stream-info">
              <div className="stream-header">
                <div className="stream-title">{currentStream.image} {currentStream.title}</div>
                <div className="stream-meta">
                  <span className="viewers">👁️ {currentStream.viewers}</span>
                  <span className="quality">{currentStream.quality}</span>
                </div>
              </div>
              <div className="stream-channel">Channel: {currentStream.channel}</div>
            </div>
          )}

          {/* Stream Selection */}
          <div className="streams-selector">
            <h3>📡 Live Streams</h3>
            <div className="streams-grid">
              {streams.map((stream) => (
                <div
                  key={stream.id}
                  className={`stream-card ${selectedStream === stream.id ? 'active' : ''}`}
                  onClick={() => setSelectedStream(stream.id)}
                >
                  <div className="stream-image">{stream.image}</div>
                  <div className="stream-title-sm">{stream.title}</div>
                  <div className="stream-viewers">🔴 {stream.viewers}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="categories-section">
            <h3>🎯 Categories</h3>
            <div className="categories-grid">
              {categories.map((cat, i) => (
                <div key={i} className="category-card">
                  <div className="cat-icon">{cat.icon}</div>
                  <div className="cat-name">{cat.name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Watch Button */}
          <button className="btn-primary" onClick={handleWatchStream}>
            ▶ Watch Stream
          </button>
        </div>
      </div>

      {/* Features Section */}
      <div className="features-section">
        <div className="container">
          <h2>✨ Why Choose Us</h2>
          <div className="features-grid">
            {features.map((feature, i) => (
              <div key={i} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="cta-section">
        <div className="container">
          <h2>Ready to Play & Watch?</h2>
          <div className="cta-buttons">
            <button className="btn-primary" onClick={handlePlayGame}>
              🎮 Get Started
            </button>
            <button className="btn-secondary" onClick={handleWatchStream}>
              📺 Explore
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
