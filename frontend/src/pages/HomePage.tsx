import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import './HomePage.css';

const LEADERBOARD = [
  { rank: 1, name: 'CricketMaster', points: '98,750' },
  { rank: 2, name: 'SixerKing', points: '95,320' },
  { rank: 3, name: 'BoundaryHunter', points: '92,180' },
  { rank: 4, name: 'SpinWizard', points: '87,450' },
  { rank: 5, name: 'FastBowler', points: '84,920' },
];

const HomePage: React.FC = () => {
  const { t } = useI18n();

  useEffect(() => {
    document.title = t('home.title', 'Premium Cricket Streaming Landing Page');
  }, [t]);

  return (
    <main className="make-landing">
      <section className="make-hero">
        <div className="make-hero-bg">
          <img
            src="https://images.unsplash.com/photo-1750716413444-c8a957fcf35c?auto=format&fit=crop&w=1920&q=80"
            alt="Cricket stadium"
          />
        </div>
        <div className="make-hero-overlay" />
        <div className="make-hero-noise" />
        <div className="make-hero-beam" />
        <div className="make-hero-glow make-hero-glow-left" />
        <div className="make-hero-glow make-hero-glow-right" />
        <div className="make-hero-glow make-hero-glow-mid" />

        <div className="make-wrap">
          <p className="make-badge">{t('home.hero.badge', 'Live matches streaming now')}</p>
          <h1 className="make-title">{t('home.hero.heading', 'Watch. Play. Win.')}</h1>
          <p className="make-subtitle">{t('home.hero.sub')}</p>

          <div className="make-pill-row">
            <span>HD Live Streaming</span>
            <span>Real-Time Gaming</span>
            <span>Win Big Prizes</span>
          </div>

          <div className="make-screen-grid">
            <article className="make-screen-card make-screen-card-left">
              <div className="make-screen-aura make-screen-aura-green" />
              <div className="make-screen-top">
                <span className="tag-live">LIVE</span>
                <span className="tag-meta">WiFi • HD</span>
              </div>
              <img
                src="https://images.unsplash.com/photo-1750716413444-c8a957fcf35c?auto=format&fit=crop&w=1200&q=80"
                alt="Live cricket stream"
              />
              <div className="make-screen-info">
                <strong>IND 284/4</strong>
                <span>45.2 overs • Need 72 runs</span>
                <div className="make-mini-tags">
                  <em>KOHLI 89*</em>
                  <em>DHONI 34*</em>
                </div>
              </div>
            </article>

            <article className="make-screen-card make-screen-card-right">
              <div className="make-screen-aura make-screen-aura-blue" />
              <div className="make-screen-top">
                <span className="tag-news">NEWS</span>
                <span className="tag-meta">18:45</span>
              </div>
              <img
                src="https://images.unsplash.com/photo-1641135698530-8d919344c0e5?auto=format&fit=crop&w=1200&q=80"
                alt="Sports news stream"
              />
              <div className="make-screen-info">
                <strong>Breaking sports updates</strong>
                <span>India wins thriller by 3 wickets</span>
                <div className="make-ticker">
                  <p>BREAKING: India wins thriller by 3 wickets • Kohli masterclass • Reactions coming up next</p>
                </div>
              </div>
            </article>
          </div>

          <div className="make-cta-row">
            <Link to="/login" className="make-btn make-btn-primary">
              {t('home.hero.ctaContinue', 'Continue')}
            </Link>
            <Link to="/login" className="make-btn make-btn-secondary">
              {t('home.hero.ctaTrial', 'Start Free 5-Min Trial')}
            </Link>
          </div>
        </div>
      </section>

      <section className="make-section">
        <div className="make-wrap">
          <h2>Try Before You Subscribe</h2>
          <p>Experience the action with a free trial.</p>
          <div className="make-card-grid make-card-grid-3">
            <article className="make-card">
              <h3>5-Min Free Trial</h3>
              <p>Watch any live match for 5 minutes absolutely free.</p>
              <strong className="price">FREE</strong>
            </article>
            <article className="make-card make-card-popular">
              <span className="popular-badge">Most Popular</span>
              <h3>Daily Pass</h3>
              <p>Unlimited streaming + gaming access for 24 hours.</p>
              <strong className="price">₹20/day</strong>
              <Link to="/login" className="make-btn make-btn-primary make-btn-full">
                {t('home.pricing.continue', 'Continue to Login')}
              </Link>
            </article>
            <article className="make-card">
              <h3>What You Get</h3>
              <ul>
                <li>HD/4K live streaming</li>
                <li>Real-time fantasy gaming</li>
                <li>Leaderboard competition</li>
                <li>Cross-platform access</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="make-section make-section-alt">
        <div className="make-wrap">
          <h2>Gaming Meets Live Cricket</h2>
          <p>Play fantasy games that sync with every ball bowled.</p>
          <div className="make-feature-card">
            <div className="make-feature-copy">
              <p className="make-inline-kicker">Live Sync</p>
              <h3>Real-Time Match Integration</h3>
              <p>Make predictions, score points, and compete as the match unfolds.</p>
              <div className="make-feature-list">
                <article>
                  <strong>Ball-by-Ball Predictions</strong>
                  <span>Predict runs, wickets, and outcomes before each delivery.</span>
                </article>
                <article>
                  <strong>Instant Updates</strong>
                  <span>Scores update in real-time with minimal lag.</span>
                </article>
              </div>
            </div>
            <img
              src="https://images.unsplash.com/photo-1593341646782-e0b495cff86d?auto=format&fit=crop&w=900&q=80"
              alt="Cricket action"
            />
          </div>
          <div className="make-device-cards">
            <article className="make-card make-device-card">
              <h3>Mobile Experience</h3>
              <p>Optimized for iOS and Android with responsive gameplay and streaming.</p>
              <div className="make-chip-row"><span>iOS</span><span>Android</span><span>PWA</span></div>
            </article>
            <article className="make-card make-device-card">
              <h3>Desktop Power</h3>
              <p>Immersive full-screen viewing with multi-view support and overlays.</p>
              <div className="make-chip-row"><span>Web</span><span>4K</span><span>Multi-view</span></div>
            </article>
          </div>
        </div>
      </section>

      <section className="make-section">
        <div className="make-wrap">
          <h2>Compete & Win Big</h2>
          <p>Climb the leaderboard and earn rewards.</p>
          <div className="make-card-grid make-card-grid-2">
            <article className="make-card make-leaderboard-card">
              <h3>Top Players Today</h3>
              <div className="make-leaderboard">
                {LEADERBOARD.map((item) => (
                  <div key={item.rank} className="make-leaderboard-row">
                    <span>#{item.rank}</span>
                    <strong>{item.name}</strong>
                    <em>{item.points} pts</em>
                  </div>
                ))}
              </div>
            </article>
            <article className="make-card make-reward-card">
              <h3>Weekly Prizes</h3>
              <ul>
                <li>1st Place: ₹10,000</li>
                <li>2nd Place: ₹5,000</li>
                <li>3rd Place: ₹3,000</li>
              </ul>
              <h3>Daily Bonuses</h3>
              <ul>
                <li>First prediction: +500 pts</li>
                <li>Perfect over: +1000 pts</li>
                <li>Win streak bonus: +2000 pts</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="make-section make-section-alt">
        <div className="make-wrap">
          <h2>How It Works</h2>
          <p>Get started in 4 simple steps.</p>
          <div className="make-steps">
            <article className="make-card"><h3>1. Start Watching</h3><p>Begin your free trial instantly.</p></article>
            <article className="make-card"><h3>2. Make Predictions</h3><p>Predict outcomes ball by ball.</p></article>
            <article className="make-card"><h3>3. Unlock Full Access</h3><p>Subscribe for ₹20/day access.</p></article>
            <article className="make-card"><h3>4. Win Rewards</h3><p>Rise up the leaderboard and win.</p></article>
          </div>
        </div>
      </section>

      <section className="make-section">
        <div className="make-wrap">
          <h2>About GamePalazio</h2>
          <p>The ultimate destination for cricket streaming and real-time gaming.</p>
          <div className="make-card-grid make-card-grid-4">
            <article className="make-card make-stat-card">
              <strong>2M+</strong>
              <span>Active Users</span>
            </article>
            <article className="make-card make-stat-card">
              <strong>500+</strong>
              <span>Live Matches</span>
            </article>
            <article className="make-card make-stat-card">
              <strong>₹5Cr+</strong>
              <span>Prizes Awarded</span>
            </article>
            <article className="make-card make-stat-card">
              <strong>100%</strong>
              <span>Secure & Fair</span>
            </article>
          </div>
        </div>
      </section>

      <footer className="make-footer">
        <div className="make-wrap">
          <h3>GamePalazio</h3>
          <p>© 2026 GamePalazio. All rights reserved. 18+ only. Play responsibly.</p>
        </div>
      </footer>
    </main>
  );
};

export default HomePage;
