import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './DashboardPage.css';
import { fetchSubscriptionStatus } from '../api/subscriptions';
import ApiLoaderOverlay from '../components/ApiLoaderOverlay';
import {
  AFG_CRICKET_GAME_URL,
  AFG_CRICKET_STANDALONE_URL,
  AFG_CRICKET_IFRAME_ALLOW,
  LIVE_STREAM_HLS_URL,
  getWindowHls,
} from '../config/afgCricket';
import type { HlsLite } from '../config/afgCricket';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [gameLocked, setGameLocked] = useState(true);
  const [statusLoading, setStatusLoading] = useState(true);
  const [subGateMessage, setSubGateMessage] = useState<string | null>(null);
  const [activeGameTab, setActiveGameTab] = React.useState('keyboard');
  const [selectedStream, setSelectedStream] = React.useState(0);
  const [gameIframeLoading, setGameIframeLoading] = React.useState(true);
  const [gameIframeLoaded, setGameIframeLoaded] = React.useState(false);
  const [showGameFallback, setShowGameFallback] = React.useState(false);
  const [activeControlTip, setActiveControlTip] = React.useState('Pick a control to see pro guidance.');
  const gameIframeRef = useRef<HTMLIFrameElement>(null);
  const streamVideoRef = useRef<HTMLVideoElement>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const streamContainerRef = useRef<HTMLDivElement>(null);
  const streamHlsRef = useRef<HlsLite | null>(null);

  useEffect(() => {
    document.title = 'Game Palazio | MI India Cricket — Play Free';
  }, []);

  useEffect(() => {
    if (gameLocked) {
      return;
    }
    const el = gameIframeRef.current;
    if (!el) {
      return;
    }
    setGameIframeLoading(true);
    setGameIframeLoaded(false);
    setShowGameFallback(false);
    el.src = AFG_CRICKET_GAME_URL;
  }, [gameLocked]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStatusLoading(true);
      try {
        const st = await fetchSubscriptionStatus();
        if (cancelled) return;
        setGameLocked(!st.has_game_entitlement);
        setSubGateMessage(null);
      } catch {
        if (!cancelled) {
          setGameLocked(true);
          setSubGateMessage('Could not verify subscription. Ensure the API is running and you are signed in.');
        }
      } finally {
        if (!cancelled) {
          setStatusLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
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
    const t = window.setTimeout(() => {
      if (!gameIframeLoaded) {
        setGameIframeLoading(false);
        setShowGameFallback(true);
      }
    }, 10000);
    return () => clearTimeout(t);
  }, [gameIframeLoaded]);

  const handleGameIframeLoad = () => {
    setGameIframeLoaded(true);
    setShowGameFallback(false);
    window.setTimeout(() => setGameIframeLoading(false), 800);
  };

  // Reload game (same pattern as working static index.html: blank src, then restore)
  const handleReloadGame = () => {
    setGameIframeLoading(true);
    setGameIframeLoaded(false);
    setShowGameFallback(false);
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

  const keyboardTutorial = [
    'Click inside the game frame once to lock focus for keyboard control.',
    'Use Arrow keys or WASD to position your batsman before each ball.',
    'Press SPACE for normal shots; use timing to target gaps in the field.',
    'Use SHIFT for power hits when the ball is in your preferred zone.',
    'If controls stop responding, click game frame again and continue.',
  ];

  const touchTutorial = [
    'Tap the game area first so touch gestures are fully active.',
    'Swipe right for power drive and left for pull-shot direction control.',
    'Swipe up for lofted strokes and swipe down for safer defense.',
    'Quick tap can trigger fast run/single opportunities.',
    'Play in landscape mode for better control visibility and reaction time.',
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

  const heroHighlights = [
    {
      title: 'IPL Night Clash',
      tag: 'LIVE',
      image:
        'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80',
    },
    {
      title: 'Gaming Arena',
      tag: 'HOT',
      image:
        'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
    },
    {
      title: 'Cricket Stadium Cam',
      tag: 'TREND',
      image:
        'https://images.unsplash.com/photo-1624880357913-a8539238245b?auto=format&fit=crop&w=1200&q=80',
    },
  ];

  const currentStream = streams[selectedStream];

  return (
    <div className="dashboard-page">
      <ApiLoaderOverlay active={statusLoading} label="Loading your gameplay access..." />
      {/* Hero Section */}
      <section className="hero-dashboard">
        <div className="dashboard-bg-orb dashboard-bg-orb-a" aria-hidden="true" />
        <div className="dashboard-bg-orb dashboard-bg-orb-b" aria-hidden="true" />
        <div className="dashboard-bg-grid" aria-hidden="true" />
        <div className="hero-content">
          <div className="pill-badge pill-gold">🎮 🎬 ENTERTAINMENT HUB</div>
          <h1 className="hero-title">
            Cricket <span className="grad-text">Battle Zone</span>
          </h1>
          <p className="hero-sub">Play, stream, and compete in a cricket-first gaming universe</p>
          <div className="hero-meta-pills">
            <span>Live cricket visuals</span>
            <span>Arcade gameplay controls</span>
            <span>High-energy streaming zone</span>
          </div>
          <div className="hero-highlights">
            {heroHighlights.map((item) => (
              <article key={item.title} className="hero-highlight-card">
                <img src={item.image} alt={item.title} loading="lazy" />
                <div className="hero-highlight-overlay" />
                <div className="hero-highlight-content">
                  <span>{item.tag}</span>
                  <strong>{item.title}</strong>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="dashboard-top-leaderboard">
        <div className="container">
          <div className="top-board-wrap">
            <div className="top-board-head">
              <h2>🏆 Live Top Players</h2>
              <p>Updated rankings from recent MI India Cricket sessions.</p>
            </div>
            <div className="top-board-grid">
              {leaderboard.map((player) => (
                <article key={player.rank} className={`top-board-card r${player.rank}`}>
                  <div className="top-board-rank">#{player.rank}</div>
                  <div className="top-board-avatar">{player.avatar}</div>
                  <div className="top-board-player">
                    <h3>{player.name}</h3>
                    <p>{player.runs}</p>
                  </div>
                  <strong className="top-board-score">{player.score}</strong>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Dashboard Content */}
      <section className="dashboard-content">
        <div className="container">
          {/* Left Column - Gameplay with Game Embed */}
          <div className="dashboard-column">
            <div className="column-header">
              <h2 className="column-title">🏏 MI India Cricket</h2>
              <div className="header-controls">
                <button type="button" className="icon-btn" onClick={handleReloadGame} title="Reload Game">
                  ↺
                </button>
                <button type="button" className="icon-btn" onClick={handleGameFullscreen} title="Fullscreen">
                  ⛶
                </button>
                <a
                  className="icon-btn"
                  href={AFG_CRICKET_STANDALONE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open game in new tab"
                >
                  ↗
                </a>
              </div>
            </div>

            <p className="game-embed-hint">
              If the game looks stuck, click inside once, then wait a few seconds. Some browsers require user interaction
              before embedded WebGL can start.
            </p>

            {/* Game embed: loader is removed from the DOM when done so it cannot block clicks */}
            <div className="game-embed-container" id="dashboard-game-embed" ref={gameContainerRef}>
              {gameIframeLoading && (
                <div className="game-embed-loader" aria-live="polite" aria-busy>
                  <div className="game-embed-spinner" />
                  <p className="game-embed-loader-text">Loading MI India Cricket…</p>
                </div>
              )}
              <iframe
                ref={gameIframeRef}
                src={gameLocked ? 'about:blank' : AFG_CRICKET_GAME_URL}
                title="MI India Cricket Game"
                className="game-embed"
                allowFullScreen
                allow={AFG_CRICKET_IFRAME_ALLOW}
                loading="eager"
                referrerPolicy="strict-origin-when-cross-origin"
                onLoad={handleGameIframeLoad}
              />
              {gameLocked && (
                <div className="game-subscription-gate" role="dialog" aria-modal="true" aria-labelledby="sub-gate-title">
                  <div className="game-subscription-gate-card">
                    <h3 id="sub-gate-title">Subscription required to play</h3>
                    <p>
                      Choose a plan that includes <strong>game</strong> or <strong>game + streaming</strong>, then
                      complete checkout from your profile.
                    </p>
                    {subGateMessage && <p className="game-subscription-gate-warn">{subGateMessage}</p>}
                    <div className="game-subscription-gate-actions">
                      <button type="button" className="btn-gold" onClick={() => navigate('/profile')}>
                        View plans &amp; subscribe
                      </button>
                      <button type="button" className="btn-outline" onClick={() => navigate('/profile')}>
                        Open profile
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {showGameFallback && (
              <div className="game-fallback-strip">
                <p>
                  Embedded WebGL may be blocked in this browser session. Try: click inside the game, press reload, or open
                  the hosted build in a new tab.
                </p>
                <div className="header-controls">
                  <button type="button" className="icon-btn" onClick={handleReloadGame} title="Reload Game">
                    ↺
                  </button>
                  <a
                    href={AFG_CRICKET_STANDALONE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="game-fallback-link"
                  >
                    Open full game (hosted)
                  </a>
                </div>
              </div>
            )}

            {/* Game Controls Info */}
            <div className="controls-section">
              <div className="controls-header">
                <h3 className="section-mini-title">🎯 Gameplay controls</h3>
                <p>Switch keyboard or touch mode and follow each move exactly while playing.</p>
              </div>
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
                <div className="controls-tip-live" aria-live="polite">
                  <span className="dot" />
                  <p>{activeControlTip}</p>
                </div>
                {activeGameTab === 'keyboard' ? (
                  <div className="controls-grid">
                    {keyboardControls.map((ctrl) => (
                      <button
                        key={ctrl.action}
                        type="button"
                        className="control-item control-item-button"
                        onMouseEnter={() => setActiveControlTip(`${ctrl.action}: ${ctrl.desc}`)}
                        onFocus={() => setActiveControlTip(`${ctrl.action}: ${ctrl.desc}`)}
                        onClick={() => setActiveControlTip(`${ctrl.action}: ${ctrl.desc}`)}
                      >
                        <div className="ctrl-key">{ctrl.key}</div>
                        <div className="ctrl-content">
                          <div className="ctrl-action">{ctrl.action}</div>
                          <div className="ctrl-desc">{ctrl.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="controls-grid">
                    {touchControls.map((ctrl) => (
                      <button
                        key={ctrl.action}
                        type="button"
                        className="control-item control-item-button"
                        onMouseEnter={() => setActiveControlTip(`${ctrl.gesture}: ${ctrl.action}`)}
                        onFocus={() => setActiveControlTip(`${ctrl.gesture}: ${ctrl.action}`)}
                        onClick={() => setActiveControlTip(`${ctrl.gesture}: ${ctrl.action}`)}
                      >
                        <span className="touch-emoji">{ctrl.arrow}</span>
                        <div className="ctrl-content">
                          <div className="ctrl-action">{ctrl.gesture}</div>
                          <div className="ctrl-desc">→ {ctrl.action}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="gameplay-tutorials">
              <article className="tutorial-box">
                <p className="tutorial-box-kicker">Windows / keyboard guide</p>
                <ol>
                  {keyboardTutorial.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </article>
              <article className="tutorial-box tutorial-box-touch">
                <p className="tutorial-box-kicker">Mobile / touch guide</p>
                <ol>
                  {touchTutorial.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </article>
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
