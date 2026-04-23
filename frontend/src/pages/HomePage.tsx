import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

const HomePage: React.FC = () => {
  const initialLeaderboard = [
    { rank: 1, name: 'Power Hitter', points: '8,540 pts' },
    { rank: 2, name: 'Cover Drive Pro', points: '8,120 pts' },
    { rank: 3, name: 'Spin Master', points: '7,940 pts' },
    { rank: 4, name: 'Yorker King', points: '7,680 pts' },
  ];
  const [liveLeaderboard, setLiveLeaderboard] = React.useState(initialLeaderboard);
  const [updatedRanks, setUpdatedRanks] = React.useState<number[]>([]);

  const desktopTutorial = [
    'Click Start with secure login and verify OTP.',
    'Open dashboard and click inside the game to focus controls.',
    'Use Arrow keys / WASD to move; Space for shot timing.',
    'Use Shift for power shot and watch run meter feedback.',
    'Keep live stream open side-by-side for match rhythm.',
  ];

  const mobileTutorial = [
    'Log in once and open dashboard on your phone.',
    'Tap on game frame first to activate touch gestures.',
    'Swipe right for drives, left for pull, up for loft.',
    'Tap quickly for quick singles and defensive resets.',
    'Rotate to landscape for a wider game + stream view.',
  ];

  useEffect(() => {
    document.title = 'Game Palazio — Stream & Play';
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLiveLeaderboard((prev) => {
        const next = [...prev];
        const indexToUpdate = Math.floor(Math.random() * next.length);
        const current = next[indexToUpdate];
        const numericPoints = Number(current.points.replace(/[^\d]/g, ''));
        const bump = Math.floor(Math.random() * 18) + 6;
        next[indexToUpdate] = {
          ...current,
          points: `${(numericPoints + bump).toLocaleString()} pts`,
        };
        setUpdatedRanks([next[indexToUpdate].rank]);
        return next;
      });
    }, 2200);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (updatedRanks.length === 0) return;
    const pulseTimer = window.setTimeout(() => setUpdatedRanks([]), 700);
    return () => window.clearTimeout(pulseTimer);
  }, [updatedRanks]);

  return (
    <div className="landing">
      <aside className="landing-live-leaderboard" aria-label="Live leaderboard">
        <p className="live-board-kicker">
          <span className="live-dot" />
          Live leaderboard
        </p>
        <div className="live-board-list">
          {liveLeaderboard.map((player) => (
            <div key={player.rank} className={`live-board-row ${updatedRanks.includes(player.rank) ? 'is-updated' : ''}`}>
              <span className={`live-board-rank r${player.rank}`}>#{player.rank}</span>
              <div className="live-board-meta">
                <strong>{player.name}</strong>
                <span>{player.points}</span>
              </div>
            </div>
          ))}
        </div>
      </aside>

      <div className="landing-bg" aria-hidden="true">
        <div className="orb orb-a" />
        <div className="orb orb-b" />
        <div className="orb orb-c" />
        <div className="grid-overlay" />
      </div>

      <section className="landing-hero">
        <p className="landing-eyebrow">All-in-one entertainment platform</p>
        <h1 className="landing-title">
          Experience premium streaming and gaming
          <span className="landing-title-accent"> in one interactive destination</span>
        </h1>
        <p className="landing-lead">
          Log in once to watch live streams, launch cricket games, and switch between experiences without breaking your flow.
        </p>
        <div className="landing-image-strip" aria-label="Cricket highlights">
          <figure className="hero-image-card">
            <img
              src="https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80"
              alt="Cricket stadium during live match"
              loading="lazy"
            />
          </figure>
          <figure className="hero-image-card hero-image-card-alt">
            <img
              src="https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1200&q=80"
              alt="Cricket crowd cheering in evening match"
              loading="lazy"
            />
          </figure>
        </div>
        <div className="landing-cta-row">
          <Link to="/login" className="btn-primary-landing">
            Start with secure login
          </Link>
          <Link to="/dashboard" className="btn-ghost-landing">
            Open live dashboard
          </Link>
        </div>
        <div className="landing-trust-row" aria-label="Platform trust badges">
          <span className="landing-trust-pill">OTP secure sign-in</span>
          <span className="landing-trust-pill">Responsive on mobile</span>
          <span className="landing-trust-pill">Live game + stream hub</span>
        </div>
        <div className="landing-stats" aria-label="Highlights">
          <div className="landing-stat">
            <span className="landing-stat-val">24/7</span>
            <span className="landing-stat-label">Live streams</span>
          </div>
          <div className="landing-stat">
            <span className="landing-stat-val">Web</span>
            <span className="landing-stat-label">Game ready</span>
          </div>
          <div className="landing-stat">
            <span className="landing-stat-val">Fast</span>
            <span className="landing-stat-label">OTP access</span>
          </div>
        </div>
        <p className="landing-note">Secure sign-in with a one-time code. No password to remember.</p>
      </section>

      <section className="landing-cards" aria-label="Highlights">
        <article className="feature-card">
          <span className="feature-icon" aria-hidden="true">▶</span>
          <h2>Streaming that feels live</h2>
          <p>Crisp playback with quick controls, fullscreen support, and a stream area built for smooth viewing.</p>
        </article>
        <article className="feature-card">
          <span className="feature-icon" aria-hidden="true">◎</span>
          <h2>Gameplay without installs</h2>
          <p>Launch browser-based cricket in seconds with quick reload and better focus for controls.</p>
        </article>
        <article className="feature-card">
          <span className="feature-icon" aria-hidden="true">✦</span>
          <h2>Unified dashboard flow</h2>
          <p>Move between game controls, live content, and highlights from one polished responsive UI.</p>
        </article>
      </section>

      <section className="landing-media" aria-label="Watch and play preview">
        <article className="media-card">
          <p className="media-badge media-badge-live">Live stream</p>
          <h3>Watch. Play. Win.</h3>
          <p>Dual-view style layout for matches, updates, and quick jump into gameplay from the same experience.</p>
          <div className="media-thumb media-thumb-left">
            <img
              src="https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80"
              alt="Cricket gameplay action on green field"
              loading="lazy"
            />
          </div>
        </article>
        <article className="media-card">
          <p className="media-badge media-badge-news">News feed</p>
          <h3>Action with real-time updates</h3>
          <p>Switch from live match to highlights and game controls without leaving your dashboard session.</p>
          <div className="media-thumb media-thumb-right">
            <img
              src="https://images.unsplash.com/photo-1543357480-c60d400e2ef9?auto=format&fit=crop&w=1200&q=80"
              alt="Cricket player practicing batting in nets"
              loading="lazy"
            />
          </div>
        </article>
      </section>

      <section className="landing-split" aria-label="Equal stream and gameplay panels">
        <article className="split-panel">
          <p className="split-kicker">Gameplay panel</p>
          <h3>Play MI India Cricket</h3>
          <p>Launch the game in-browser, use keyboard/touch controls, and keep your match pace with instant reload support.</p>
          <Link to="/dashboard" className="split-btn">
            Go to gameplay
          </Link>
        </article>
        <article className="split-panel">
          <p className="split-kicker">Streaming panel</p>
          <h3>Watch live coverage</h3>
          <p>Use the same-sized stream area for better visual balance while tracking scoreboard and game strategy side-by-side.</p>
          <Link to="/streaming" className="split-btn split-btn-alt">
            Open streaming
          </Link>
        </article>
      </section>

      <section className="cricket-gallery" aria-label="Cricket gameplay gallery">
        <article className="gallery-card">
          <img
            src="https://images.unsplash.com/photo-1471295253337-3ceaaedca402?auto=format&fit=crop&w=1200&q=80"
            alt="Cricket bowler delivering the ball"
            loading="lazy"
          />
          <p>Match intensity</p>
        </article>
        <article className="gallery-card">
          <img
            src="https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?auto=format&fit=crop&w=1200&q=80"
            alt="Cricket batter preparing for a shot"
            loading="lazy"
          />
          <p>Perfect timing</p>
        </article>
        <article className="gallery-card">
          <img
            src="https://images.unsplash.com/photo-1593766827228-8737b4534aa6?auto=format&fit=crop&w=1200&q=80"
            alt="Cricket wickets and pitch close-up"
            loading="lazy"
          />
          <p>Pitch control</p>
        </article>
        <article className="gallery-card">
          <img
            src="https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=1200&q=80"
            alt="Cricket stadium lights at night"
            loading="lazy"
          />
          <p>Night matches</p>
        </article>
      </section>

      <section className="landing-tutorial" aria-label="How to play">
        <h2 className="tutorial-title">How to play — complete quick tutorial</h2>
        <p className="tutorial-sub">Follow these steps to get smooth gameplay on both Windows and mobile devices.</p>
        <div className="tutorial-grid">
          <article className="tutorial-card">
            <p className="tutorial-kicker">Windows / desktop</p>
            <h3>Keyboard flow</h3>
            <ol>
              {desktopTutorial.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </article>
          <article className="tutorial-card tutorial-card-mobile">
            <p className="tutorial-kicker">Mobile / touch</p>
            <h3>Gesture flow</h3>
            <ol>
              {mobileTutorial.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </article>
        </div>
      </section>

      <section className="landing-showcase" aria-label="Product preview">
        <article className="showcase-card">
          <p className="showcase-kicker">Now playing</p>
          <h3>MI India Cricket</h3>
          <p>Jump into a responsive game and use your keyboard or touch controls from the same dashboard.</p>
          <div className="showcase-actions">
            <Link to="/dashboard" className="showcase-btn">
              Play on dashboard
            </Link>
            <Link to="/gameplay" className="showcase-link">
              View controls guide →
            </Link>
          </div>
        </article>
        <article className="showcase-card showcase-card-alt">
          <p className="showcase-kicker">Live experience</p>
          <h3>Watch and play together</h3>
          <p>Keep the stream running while switching to gameplay, leaderboard, and category feeds in one workspace.</p>
          <div className="showcase-image-wrap">
            <img
              src="https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=1200&q=80"
              alt="Cricket match view from stadium stands"
              loading="lazy"
            />
          </div>
          <div className="showcase-tags">
            <span>Fullscreen modes</span>
            <span>Touch friendly</span>
            <span>High contrast UI</span>
          </div>
        </article>
      </section>

      <section className="landing-pricing" aria-label="Trial and plans">
        <h2 className="pricing-title">Try before you subscribe</h2>
        <p className="pricing-sub">Experience gameplay and streaming first, then continue with a simple plan.</p>
        <div className="pricing-grid">
          <article className="pricing-card">
            <p className="pricing-kicker">5-min free trial</p>
            <h3>FREE</h3>
            <p>Watch one live match and test the game controls without signup friction.</p>
          </article>
          <article className="pricing-card pricing-card-popular">
            <span className="pricing-badge">Most Popular</span>
            <p className="pricing-kicker">Daily pass</p>
            <h3>₹20 / day</h3>
            <p>Unlimited access to streaming and game sessions for 24 hours.</p>
            <Link to="/login" className="pricing-btn">
              Continue to login
            </Link>
          </article>
          <article className="pricing-card">
            <p className="pricing-kicker">What you get</p>
            <ul className="pricing-list">
              <li>HD/4K stream-ready layout</li>
              <li>Responsive gameplay controls</li>
              <li>Leaderboard and match updates</li>
              <li>One account for all sections</li>
            </ul>
          </article>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
