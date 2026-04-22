import React, { useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './DashboardPage.css';
import {
  AFG_CRICKET_GAME_URL,
  AFG_CRICKET_ITCH_URL,
  AFG_CRICKET_IFRAME_ALLOW,
  LIVE_STREAM_HLS_URL,
  getWindowHls,
} from '../config/afgCricket';
import type { HlsLite } from '../config/afgCricket';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeGameTab, setActiveGameTab] = React.useState('keyboard');
  const [selectedStream, setSelectedStream] = React.useState(0);
  const [gameIframeLoading, setGameIframeLoading] = React.useState(true);
  const gameIframeRef = useRef<HTMLIFrameElement>(null);
  const streamVideoRef = useRef<HTMLVideoElement>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const streamContainerRef = useRef<HTMLDivElement>(null);
  const streamHlsRef = useRef<HlsLite | null>(null);

  useEffect(() => {
    document.title = 'Game Palazio | AFG Cricket — Play Free';
  }, []);

  const teardownStream = useCallback(() => {
    if (streamHlsRef.current) {
      try {
        streamHlsRef.current.destroy();
      } catch {
        /* ignore */
      }
      streamHlsRef.current = null;
    }
    const video = streamVideoRef.current;
    if (video) {
      try {
        video.pause();
      } catch {
        /* ignore */
      }
      video.removeAttribute('src');
      try {
        video.load();
      } catch {
        /* ignore */
      }
    }
  }, []);

  const initLiveStream = useCallback(() => {
    teardownStream();
    const video = streamVideoRef.current;
    if (!video) return;

    const u = LIVE_STREAM_HLS_URL;
    const HlsCtor = getWindowHls();

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = u;
    } else if (HlsCtor?.isSupported?.()) {
      const hls = new HlsCtor({ lowLatencyMode: true, backBufferLength: 30 });
      hls.loadSource(u);
      hls.attachMedia(video);
      streamHlsRef.current = hls;
    } else {
      video.src = u;
    }

    const p = video.play();
    if (p !== undefined && typeof p.catch === 'function') {
      p.catch(() => {
        /* autoplay may require user gesture */
      });
    }
  }, [teardownStream]);

  // Start HLS after the game iframe — reduces GPU / autoplay contention with Unity WebGL on the same page.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      initLiveStream();
    }, 1600);
    return () => {
      clearTimeout(timer);
      teardownStream();
    };
  }, [initLiveStream, teardownStream]);

  useEffect(() => {
    const t = window.setTimeout(() => setGameIframeLoading(false), 8000);
    return () => clearTimeout(t);
  }, []);

  const handleGameIframeLoad = () => {
    window.setTimeout(() => setGameIframeLoading(false), 800);
  };

  // Reload game (same pattern as working static index.html: blank src, then restore)
  const handleReloadGame = () => {
    setGameIframeLoading(true);
    const el = gameIframeRef.current;
    if (!el) return;
    const src = AFG_CRICKET_GAME_URL;
    el.src = '';
    window.setTimeout(() => {
      el.src = src;
    }, 100);
  };

  // Toggle game fullscreen
  const handleGameFullscreen = async () => {
    if (gameContainerRef.current) {
      try {
        if (!document.fullscreenElement) {
          await gameContainerRef.current.requestFullscreen();
        } else {
          await document.exitFullscreen();
        }
      } catch (error) {
        console.log('Fullscreen not available');
      }
    }
  };

  const handleReloadStream = () => {
    initLiveStream();
  };

  const scrollToGame = () => {
    document.getElementById('dashboard-game-embed')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Toggle stream fullscreen
  const handleStreamFullscreen = async () => {
    if (streamContainerRef.current) {
      try {
        if (!document.fullscreenElement) {
          await streamContainerRef.current.requestFullscreen();
        } else {
          await document.exitFullscreen();
        }
      } catch (error) {
        console.log('Fullscreen not available');
      }
    }
  };

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
      viewers: '45.2K',
      image: '🏏',
      quality: '1080p',
      url: LIVE_STREAM_HLS_URL,
    },
    {
      id: 2,
      title: 'Gaming Legends Battle',
      channel: 'Gaming Hub',
      viewers: '32.5K',
      image: '🎮',
      quality: 'HD',
      url: LIVE_STREAM_HLS_URL,
    },
    {
      id: 3,
      title: 'Music Festival Live',
      channel: 'Entertainment Plus',
      viewers: '18.9K',
      image: '🎵',
      quality: '1080p',
      url: LIVE_STREAM_HLS_URL,
    },
  ];

  const categories = [
    { name: 'Sports', count: 18, icon: '🏏' },
    { name: 'Gaming', count: 25, icon: '🎮' },
    { name: 'Music', count: 12, icon: '🎵' },
    { name: 'Technology', count: 8, icon: '💻' },
  ];

  const currentStream = streams[selectedStream];

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
          {/* Left Column - Gameplay with Game Embed */}
          <div className="dashboard-column">
            <div className="column-header">
              <h2 className="column-title">🏏 AFG Cricket Game</h2>
              <div className="header-controls">
                <button type="button" className="icon-btn" onClick={handleReloadGame} title="Reload Game">
                  ↺
                </button>
                <button type="button" className="icon-btn" onClick={handleGameFullscreen} title="Fullscreen">
                  ⛶
                </button>
                <a
                  className="icon-btn"
                  href={AFG_CRICKET_ITCH_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open on itch.io"
                >
                  ↗
                </a>
              </div>
            </div>

            <p className="game-embed-hint">
              Click inside the game once so keyboard and touch go to WebGL (embedded games need focus).
            </p>

            {/* Game embed: loader is removed from the DOM when done so it cannot block clicks */}
            <div className="game-embed-container" id="dashboard-game-embed" ref={gameContainerRef}>
              {gameIframeLoading && (
                <div className="game-embed-loader" aria-live="polite" aria-busy>
                  <div className="game-embed-spinner" />
                  <p className="game-embed-loader-text">Loading AFG Cricket…</p>
                </div>
              )}
              <iframe
                ref={gameIframeRef}
                src={AFG_CRICKET_GAME_URL}
                title="AFG Cricket Game"
                className="game-embed"
                allowFullScreen
                allow={AFG_CRICKET_IFRAME_ALLOW}
                loading="eager"
                referrerPolicy="strict-origin-when-cross-origin"
                onLoad={handleGameIframeLoad}
              />
            </div>

            <div className="game-fallback-strip">
              <p>Game not loading? Try opening on itch.io — some browsers block embedded WebGL until you interact.</p>
              <a
                href={AFG_CRICKET_ITCH_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="game-fallback-link"
              >
                Open full game on itch.io
              </a>
            </div>

            {/* Game Controls Info */}
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
                ) : (
                  <div className="controls-grid">
                    {touchControls.map((ctrl, idx) => (
                      <div key={idx} className="control-item">
                        <span className="touch-emoji">{ctrl.arrow}</span>
                        <div className="ctrl-content">
                          <div className="ctrl-action">{ctrl.gesture}</div>
                          <div className="ctrl-desc">→ {ctrl.action}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

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
          </div>

          {/* Right Column - Streaming with Video Embed */}
          <div className="dashboard-column">
            <div className="column-header">
              <h2 className="column-title">📺 Live Stream</h2>
              <div className="header-controls">
                <button type="button" className="icon-btn" onClick={handleReloadStream} title="Reload Stream">
                  ↺
                </button>
                <button type="button" className="icon-btn" onClick={handleStreamFullscreen} title="Fullscreen">
                  ⛶
                </button>
                <a
                  className="icon-btn"
                  href={LIVE_STREAM_HLS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open stream URL"
                >
                  ↗
                </a>
              </div>
            </div>

            {/* Stream Video Container */}
            <div className="stream-embed-container" ref={streamContainerRef}>
              <video
                ref={streamVideoRef}
                className="stream-embed"
                controls
                playsInline
                muted
                preload="none"
                poster="https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=600&q=80"
                title="Live stream"
              />
            </div>
            <p className="stream-hint">Tip: unmute after playback starts (browsers often require muted autoplay).</p>

            {/* Stream Info */}
            <div className="stream-info-section">
              <h3 className="stream-title-info">{currentStream.image} {currentStream.title}</h3>
              <p className="stream-channel-info">{currentStream.channel}</p>
              <div className="stream-meta-info">
                <span>👁️ {currentStream.viewers}</span>
                <span className="quality-badge">{currentStream.quality}</span>
              </div>
            </div>

            {/* Stream Selection */}
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
            <button className="btn-gold" type="button" onClick={scrollToGame}>
              Start gaming
            </button>
            <button className="btn-outline" onClick={() => navigate('/streaming')}>
              Watch streams
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
