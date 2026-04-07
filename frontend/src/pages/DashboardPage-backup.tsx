import React from 'react';
import './DashboardPage.css';

const DashboardPage: React.FC = () => {
  const [activeGameTab, setActiveGameTab] = React.useState('keyboard');
  const [selectedStream, setSelectedStream] = React.useState(0);

  // Gameplay Data
  const keyboardControls = [
    { key: '↑ / W', action: 'Move Forward', desc: 'Move the batsman forward' },
    { key: '↓ / S', action: 'Move Backward', desc: 'Step back away from the ball' },
    { key: '← / A', action: 'Move Left', desc: 'Move to the off side' },
    { key: '→ / D', action: 'Move Right', desc: 'Move to the leg side' },
    { key: 'SPACE', action: 'Play Shot', desc: 'Execute a batting shot' },
    { key: 'SHIFT', action: 'Power Shot', desc: 'Perform a powerful stroke' },
  ];

  const touchControls = [
    { gesture: 'Swipe Right', arrow: '→', action: 'Power Drive' },
    { gesture: 'Swipe Left', arrow: '←', action: 'Pull Shot' },
    { gesture: 'Swipe Up', arrow: '↑', action: 'Lofted Shot' },
    { gesture: 'Tap', arrow: '●', action: 'Quick Single' },
  ];

  const leaderboard = [
    { rank: 1, name: 'Champion Striker', runs: '342 runs', score: '8.5K', avatar: '⭐' },
    { rank: 2, name: 'Power Hitter', runs: '298 runs', score: '7.8K', avatar: '🔥' },
    { rank: 3, name: 'Quick Runner', runs: '267 runs', score: '7.1K', avatar: '⚡' },
  ];

  // Streaming Data
  const streams = [
    {
      id: 1,
      title: 'Live Cricket Tournament',
      channel: 'Cricket Masters',
      viewers: '12.5K',
      image: '🏏',
      quality: '4K',
    },
    {
      id: 2,
      title: 'Gaming Legends Battle',
      channel: 'Gaming Hub',
      viewers: '8.3K',
      image: '🎮',
      quality: 'HD',
    },
    {
      id: 3,
      title: 'Music Festival Live',
      channel: 'Entertainment Plus',
      viewers: '15.7K',
      image: '🎵',
      quality: '4K',
    },
  ];

  const categories = [
    { name: 'Sports', count: 18, icon: '🏏' },
    { name: 'Gaming', count: 25, icon: '🎮' },
    { name: 'Music', count: 12, icon: '🎵' },
    { name: 'Technology', count: 8, icon: '💻' },
  ];

  return (
    <div className="dashboard-page">
      {/* Hero Section */}
      <section className="hero-dashboard">
        <div className="hero-content">
          <div className="pill-badge pill-gold">🎮 🎬 ENTERTAINMENT HUB</div>
          <h1 className="hero-title">
            Gaming & <span className="grad-text">Streaming</span>
          </h1>
          <p className="hero-sub">Play games and watch live streams all in one place</p>
        </div>
      </section>

      {/* Main Dashboard Content */}
      <section className="dashboard-content">
        <div className="container">
          {/* Left Column - Gameplay */}
          <div className="dashboard-column">
            <div className="column-header">
              <h2 className="column-title">🏏 Gameplay</h2>
              <p className="column-sub">Master cricket game controls</p>
            </div>

            {/* Game Controls Tabs */}
            <div className="mini-tabs">
              <button
                className={`mini-tab ${activeGameTab === 'keyboard' ? 'active' : ''}`}
                onClick={() => setActiveGameTab('keyboard')}
              >
                ⌨️ Keyboard
              </button>
              <button
                className={`mini-tab ${activeGameTab === 'touch' ? 'active' : ''}`}
                onClick={() => setActiveGameTab('touch')}
              >
                📱 Touch
              </button>
            </div>

            {/* Keyboard Controls */}
            {activeGameTab === 'keyboard' && (
              <div className="controls-list">
                {keyboardControls.map((ctrl, idx) => (
                  <div key={idx} className="control-item">
                    <div className="ctrl-key">{ctrl.key}</div>
                    <div className="ctrl-content">
                      <div className="ctrl-action">{ctrl.action}</div>
                      <div className="ctrl-desc">{ctrl.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Touch Controls */}
            {activeGameTab === 'touch' && (
              <div className="controls-list">
                {touchControls.map((ctrl, idx) => (
                  <div key={idx} className="touch-item">
                    <span className="touch-emoji">{ctrl.arrow}</span>
                    <div className="touch-content">
                      <div className="touch-gesture">{ctrl.gesture}</div>
                      <div className="touch-action">→ {ctrl.action}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Leaderboard */}
            <div className="mini-leaderboard">
              <h3 className="section-mini-title">⭐ Top Players</h3>
              <div className="leaderboard-list">
                {leaderboard.map((player, idx) => (
                  <div key={idx} className="lb-item">
                    <div className={`lb-rank r${player.rank}`}>{player.rank}</div>
                    <div className="lb-avatar">{player.avatar}</div>
                    <div className="lb-details">
                      <div className="lb-name">{player.name}</div>
                      <div className="lb-info">{player.runs}</div>
                    </div>
                    <div className="lb-score">{player.score}</div>
                  </div>
                ))}
              </div>
            </div>

            <button className="btn-small btn-gold">Play Now</button>
          </div>

          {/* Right Column - Streaming */}
          <div className="dashboard-column">
            <div className="column-header">
              <h2 className="column-title">🎬 Streaming</h2>
              <p className="column-sub">Watch live entertainment</p>
            </div>

            {/* Featured Stream Selector */}
            <div className="featured-compact">
              <div className="stream-player">
                <span className="stream-emoji">{streams[selectedStream].image}</span>
                <div className="live-badge">● LIVE</div>
              </div>

              <div className="stream-info-compact">
                <h3 className="stream-title-compact">{streams[selectedStream].title}</h3>
                <p className="stream-channel-compact">{streams[selectedStream].channel}</p>
                <div className="stream-meta-compact">
                  <span>👁️ {streams[selectedStream].viewers}</span>
                  <span className="quality-badge">{streams[selectedStream].quality}</span>
                </div>
              </div>

              <button className="btn-small btn-gold">Watch</button>
            </div>

            {/* Stream Carousel */}
            <h3 className="section-mini-title">📡 Live Streams</h3>
            <div className="stream-grid-compact">
              {streams.map((stream, idx) => (
                <div
                  key={stream.id}
                  className={`stream-card-compact ${idx === selectedStream ? 'active' : ''}`}
                  onClick={() => setSelectedStream(idx)}
                >
                  <div className="stream-thumb">{stream.image}</div>
                  <div className="stream-card-info">
                    <div className="stream-card-title">{stream.title}</div>
                    <div className="stream-card-viewers">👁️ {stream.viewers}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Categories */}
            <h3 className="section-mini-title">🎯 Categories</h3>
            <div className="categories-grid-compact">
              {categories.map((cat, idx) => (
                <div key={idx} className="category-mini">
                  <div className="cat-icon-mini">{cat.icon}</div>
                  <div className="cat-info-mini">
                    <div className="cat-name-mini">{cat.name}</div>
                    <div className="cat-count-mini">{cat.count}</div>
                  </div>
                </div>
              ))}
            </div>

            <button className="btn-small btn-gold">Explore All</button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="dashboard-features">
        <div className="container">
          <h2 className="section-title text-center">Why Join Us?</h2>
          <div className="features-grid-dashboard">
            <div className="feature-compact">
              <div className="feat-icon">🏆</div>
              <h3>Competitive Gaming</h3>
              <p>Compete with players worldwide</p>
            </div>
            <div className="feature-compact">
              <div className="feat-icon">📺</div>
              <h3>HD Streaming</h3>
              <p>Crystal clear 4K quality</p>
            </div>
            <div className="feature-compact">
              <div className="feat-icon">💬</div>
              <h3>Live Chat</h3>
              <p>Connect with other users</p>
            </div>
            <div className="feature-compact">
              <div className="feat-icon">⭐</div>
              <h3>Premium Content</h3>
              <p>Exclusive streams & games</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="dashboard-cta">
        <div className="container text-center">
          <h2 className="section-title">Start Your Journey</h2>
          <p className="section-sub">Join millions of gamers and streamers today</p>
          <div className="cta-buttons-dashboard">
            <button className="btn-gold">Get Started</button>
            <button className="btn-outline">Learn More</button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
