import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

const portalImg =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDsyWmGsekSZNUiIyzr3WXuommQlkphRb8MetdkdwCBY8qSkJD4EnWn5DKGvVuWIPzhD4t6vEIyYhZK4FkxGtoqD_NZ2gQwLStArNqMc0IHvs6jQSQwlqf2z8RIblVlQ7nt_p0Cg6SsCSJIMWD-8oDAk6thBUc4C_QdgvQk9GnLiQzd0Ze-12xMCf6n-H_FV-T56tcPw5D35jip8vCFELBMcIbhOjMFqzms7M8jssVavxiirfgUIah56NqzKc-Lt5q2nC9NTHCY3Wag';

const imgWatch =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC5jRrZpUJ6tZYlaK37OZPfbMLmqpN6GYkyKX22yJbN-JX88It3NdzKDgIdr7Pl3Te5XTgnBPw0Bz92Quudb6J0M9yvodPmBQNN2zt6lWDsh7ed6iBm0Nwl1TtmiNCbHpZQxq09mIAa1AyLV0mApCZVjuxpgkcsiGrBojwIIZWcHlrZWaErNzgimtDWUdmLa4ZLhSaX3ljtFcmC0bKnX3-AAcvH74c583MqaWKYrJiYa4bdGrMnNKgWAH-uUiXIe29YcDfjiXEtqIfJ';
const imgPlay =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBFBEExmB0jPbtj22a8pUWzmiq5I1oRTzcscqb7rCfLtfkdE3mfctGjlhs21jSunTDfj9YjT_5_fn8P2AiTCEz7xvgGc_dudVfChOYw7fe8ah_jQ9OnngROORBKjHNyOjEyLSAQ_vWL_hjPEMW1cnXG-evve_0YDzdBOQvGFZtTHMyfsK4hp42knRNMh4dX1SE1IlI9tl-48a46xmrzvLHAmcDcPrG7XVrsKIYc0Lgm-b5fmLoxDclloF8DxifeqOoYJBvIrOQu-P9Z';
const imgEarn =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDhXRdmuU2qIO1Trb9ZhDrz2EcnzwWN2K8UguTT-Sk0WrR-HKnNuPbd6K2K3hwiO3B18A08uKUe0G4F3m5JKnVgvVCbvnJq1MBvz4EYxvR0ELaPIiBCQSrjR7W9wiDqdBSEL9u5G-Qhw-0vTHX8CnWTgon3j2DtFrSiFMDVM4M0Y1ur3Azq4BHn1WMA25Pgn9gtGf7NY1KEALmMQ3hKjGW7jz3AW475r5XTqq8bkrJsvUqfSzWJQ07Pfed2iZDlPXrbmx_PNeQP5aGK';
const imgShare =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCyFk0SnZOVJVJWtZ6y1FvyrRhrm0mKZQcvtx94y6zyfz0wqQ1VYA0T9mSZPzKaF-vL7NlifjzxXs7NqMKD9cPRfdoQfJOaW8hZ8Hpw1Xd83vryguvfMnl5X7VClSQbCqFAGrXI76NibbkBJCIu3oMX7t7fdl5W1Z7oTxAPwwy3kToVwne3_CJxYYsOfHls3IANhzElyzaaXsmkpR9OBMP7wM5nlV9gv3W57tRWuXQaMgu-DjI2b8RQ2mL2jSd_cMrabNWJC11jodHD';

function TickerLoop(): React.ReactElement {
  return (
    <>
      <div className="fv-ldg-ticker-seg">
        <span className="fv-ldg-ticker-tag fv-ldg-ticker-tag--secondary">NEW CHALLENGE</span>
        <span className="fv-ldg-ticker-msg">Player778 started &quot;Urban Strike&quot; Blitz</span>
      </div>
      <div className="fv-ldg-ticker-dot" aria-hidden />
      <div className="fv-ldg-ticker-seg">
        <span className="fv-ldg-ticker-tag fv-ldg-ticker-tag--tertiary">XP MULTIPLIER</span>
        <span className="fv-ldg-ticker-msg">Global 2X Boost active for 00:14:22</span>
      </div>
      <div className="fv-ldg-ticker-dot" aria-hidden />
      <div className="fv-ldg-ticker-seg">
        <span className="fv-ldg-ticker-tag fv-ldg-ticker-tag--primary">DROP ALERT</span>
        <span className="fv-ldg-ticker-msg">Legendary Skins dropping in Sector 4</span>
      </div>
      <div className="fv-ldg-ticker-dot" aria-hidden />
    </>
  );
}

const HomePage: React.FC = () => {
  useEffect(() => {
    document.title = 'Fanverse | Pro League Arena';
    const root = document.documentElement;
    root.classList.add('fv-ldg-page', 'dark');
    return () => {
      root.classList.remove('fv-ldg-page', 'dark');
    };
  }, []);

  return (
    <div className="fv-ldg">
      <aside className="fv-ldg-sidenav" aria-label="Command">
        <div className="fv-ldg-sidenav-head">
          <span className="fv-ldg-sidenav-label">COMMAND</span>
          <span className="fv-ldg-sidenav-sub">PRO LEAGUE</span>
        </div>
        <div className="fv-ldg-sidenav-items">
          <Link to="/streaming" className="fv-ldg-sidenav-item fv-ldg-sidenav-item--active">
            <span className="material-symbols-outlined fv-ldg-icon-fill" aria-hidden>
              live_tv
            </span>
            <span className="fv-ldg-sidenav-item-label">Watch</span>
          </Link>
          <Link to="/gameplay" className="fv-ldg-sidenav-item">
            <span className="material-symbols-outlined" aria-hidden>
              sports_esports
            </span>
            <span className="fv-ldg-sidenav-item-label">Play</span>
          </Link>
          <Link to="/earn-share?view=earn" className="fv-ldg-sidenav-item">
            <span className="material-symbols-outlined" aria-hidden>
              monetization_on
            </span>
            <span className="fv-ldg-sidenav-item-label">Earn</span>
          </Link>
          <Link to="/earn-share?view=share" className="fv-ldg-sidenav-item">
            <span className="material-symbols-outlined" aria-hidden>
              hub
            </span>
            <span className="fv-ldg-sidenav-item-label">Share</span>
          </Link>
        </div>
      </aside>

      <main className="fv-ldg-main">
        <section className="fv-ldg-hero">
          <div className="fv-ldg-hero-gradient" aria-hidden />
          <div className="fv-ldg-hero-scanline" aria-hidden />
          <div className="fv-ldg-hero-portal-wrap" aria-hidden>
            <img className="fv-ldg-hero-portal-img" src={portalImg} alt="" />
          </div>

          <div className="fv-ldg-hero-inner">
            <div className="fv-ldg-hero-mobile-grid">
              <Link to="/streaming" className="fv-ldg-mtile fv-ldg-mtile--accent">
                <img className="fv-ldg-mtile-img" src={imgWatch} alt="" />
                <div className="fv-ldg-mtile-grad" />
                <div className="fv-ldg-mtile-meta">
                  <span className="fv-ldg-mtile-num fv-ldg-mtile-num--accent">01</span>
                  <span className="fv-ldg-mtile-title">Watch</span>
                </div>
              </Link>
              <Link to="/gameplay" className="fv-ldg-mtile fv-ldg-mtile--accent">
                <img className="fv-ldg-mtile-img" src={imgPlay} alt="" />
                <div className="fv-ldg-mtile-grad" />
                <div className="fv-ldg-mtile-meta">
                  <span className="fv-ldg-mtile-num fv-ldg-mtile-num--accent">02</span>
                  <span className="fv-ldg-mtile-title">Play</span>
                </div>
              </Link>
              <Link to="/earn-share?view=earn" className="fv-ldg-mtile fv-ldg-mtile--cyan">
                <img className="fv-ldg-mtile-img" src={imgEarn} alt="" />
                <div className="fv-ldg-mtile-grad" />
                <div className="fv-ldg-mtile-meta">
                  <span className="fv-ldg-mtile-num fv-ldg-mtile-num--cyan">03</span>
                  <span className="fv-ldg-mtile-title">Earn</span>
                </div>
              </Link>
              <Link to="/earn-share?view=share" className="fv-ldg-mtile fv-ldg-mtile--cyan">
                <img className="fv-ldg-mtile-img" src={imgShare} alt="" />
                <div className="fv-ldg-mtile-grad" />
                <div className="fv-ldg-mtile-meta">
                  <span className="fv-ldg-mtile-num fv-ldg-mtile-num--cyan">04</span>
                  <span className="fv-ldg-mtile-title">Share</span>
                </div>
              </Link>
            </div>

            <div className="fv-ldg-badge">
              <span className="fv-ldg-badge-dot" aria-hidden />
              <span className="fv-ldg-badge-text">Live Arena Entry Authorized</span>
            </div>

            <h1 className="fv-ldg-hero-title">
              The Arena <span className="fv-ldg-text-accent fv-ldg-glow-orange">is Yours</span>
            </h1>
            <p className="fv-ldg-hero-lede">
              Enter the Fanverse Pro League. Experience real-time stadium dynamics, compete in high-stakes predictive
              gaming, and claim your status among the elite.
            </p>
            <div className="fv-ldg-hero-cta-row">
              <Link to="/streaming" className="fv-ldg-btn fv-ldg-btn--secondary">
                Enter Live Hub
                <span className="material-symbols-outlined fv-ldg-btn-icon" aria-hidden>
                  bolt
                </span>
              </Link>
              <Link to="/earn-share?view=earn" className="fv-ldg-btn fv-ldg-btn--ghost">
                View Standings
              </Link>
            </div>
          </div>

          <div className="fv-ldg-hero-deco fv-ldg-hero-deco--left" aria-hidden>
            <span className="fv-ldg-hero-deco-label">LATENCY: 12ms</span>
            <span className="fv-ldg-hero-deco-value">OPTIMAL</span>
          </div>
          <div className="fv-ldg-hero-deco fv-ldg-hero-deco--right" aria-hidden>
            <span className="fv-ldg-hero-deco-label fv-ldg-hero-deco-label--tertiary">GLOBAL USERS</span>
            <span className="fv-ldg-hero-deco-value fv-ldg-text-tertiary">422,901</span>
          </div>
        </section>

        <div className="fv-ldg-ticker" role="region" aria-label="Arena feed">
          <div className="fv-ldg-ticker-track">
            <TickerLoop />
            <TickerLoop />
          </div>
        </div>

        <section className="fv-ldg-core" aria-labelledby="core-ops-heading">
          <div className="fv-ldg-core-head">
            <h2 id="core-ops-heading" className="fv-ldg-core-title">
              Core Operations
            </h2>
            <span className="fv-ldg-core-sub">SELECT DESTINATION SECTOR</span>
          </div>
          <div className="fv-ldg-core-grid">
            <div className="fv-ldg-card fv-ldg-card--accent">
              <img className="fv-ldg-card-bg" src={imgWatch} alt="" />
              <div className="fv-ldg-card-grad" />
              <div className="fv-ldg-card-live">
                <span className="fv-ldg-card-live-dot" aria-hidden />
                <span className="fv-ldg-card-live-text">Live Stream</span>
              </div>
              <div className="fv-ldg-card-body">
                <span className="fv-ldg-card-op">Operation 01</span>
                <h3 className="fv-ldg-card-title">Watch</h3>
                <p className="fv-ldg-card-desc">
                  Immersive broadcast with interactive 3D overlays and multi-cam perspectives.
                </p>
                <Link to="/streaming" className="fv-ldg-card-link">
                  Access Channel <span className="material-symbols-outlined">arrow_right_alt</span>
                </Link>
              </div>
            </div>

            <div className="fv-ldg-card fv-ldg-card--accent">
              <img className="fv-ldg-card-bg" src={imgPlay} alt="" />
              <div className="fv-ldg-card-grad" />
              <div className="fv-ldg-card-body">
                <span className="fv-ldg-card-op">Operation 02</span>
                <h3 className="fv-ldg-card-title">Play</h3>
                <p className="fv-ldg-card-desc">
                  Join real-time lobbies and compete in prediction-based challenges for glory.
                </p>
                <Link to="/gameplay" className="fv-ldg-card-link">
                  Enter Lobby <span className="material-symbols-outlined">arrow_right_alt</span>
                </Link>
              </div>
            </div>

            <div className="fv-ldg-card fv-ldg-card--cyan">
              <img className="fv-ldg-card-bg" src={imgEarn} alt="" />
              <div className="fv-ldg-card-grad" />
              <div className="fv-ldg-card-body">
                <span className="fv-ldg-card-op">Operation 03</span>
                <h3 className="fv-ldg-card-title">Earn</h3>
                <p className="fv-ldg-card-desc">
                  Convert your arena performance into Elite XP and exclusive digital rewards.
                </p>
                <Link to="/earn-share?view=earn" className="fv-ldg-card-link">
                  View Rewards <span className="material-symbols-outlined">arrow_right_alt</span>
                </Link>
              </div>
            </div>

            <div className="fv-ldg-card fv-ldg-card--cyan">
              <img className="fv-ldg-card-bg" src={imgShare} alt="" />
              <div className="fv-ldg-card-grad" />
              <div className="fv-ldg-card-body">
                <span className="fv-ldg-card-op">Operation 04</span>
                <h3 className="fv-ldg-card-title">Share</h3>
                <p className="fv-ldg-card-desc">
                  Build your squad, stream your highlights, and lead the community conversation.
                </p>
                <Link to="/earn-share?view=share" className="fv-ldg-card-link">
                  Social Hub <span className="material-symbols-outlined">arrow_right_alt</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="fv-ldg-partners" aria-labelledby="partners-heading">
          <div className="fv-ldg-partners-inner">
            <div className="fv-ldg-partners-copy">
              <span className="fv-ldg-partners-eyebrow">Authorized Networks</span>
              <h2 id="partners-heading" className="fv-ldg-partners-title">
                Premium Partners
              </h2>
              <div className="fv-ldg-partners-rule" aria-hidden />
            </div>
            <div className="fv-ldg-partners-logos">
              <div className="fv-ldg-partner">
                <span className="fv-ldg-partner-name">AWCC</span>
                <span className="fv-ldg-partner-sub">COMMUNICATIONS</span>
              </div>
              <div className="fv-ldg-partner">
                <span className="fv-ldg-partner-name">ATN</span>
                <span className="fv-ldg-partner-sub">TECH NETWORK</span>
              </div>
              <div className="fv-ldg-partner">
                <span className="fv-ldg-partner-name">ELITE</span>
                <span className="fv-ldg-partner-sub">GEAR CO.</span>
              </div>
            </div>
          </div>
        </section>

        <section className="fv-ldg-dash" aria-labelledby="analytics-heading">
          <div className="fv-ldg-dash-grid">
            <div className="fv-ldg-analytics">
              <div className="fv-ldg-analytics-watermark" aria-hidden>
                <span className="material-symbols-outlined">monitoring</span>
              </div>
              <h3 id="analytics-heading" className="fv-ldg-analytics-title">
                System Analytics
              </h3>
              <div className="fv-ldg-analytics-stats">
                <div className="fv-ldg-stat fv-ldg-stat--primary">
                  <span className="fv-ldg-stat-label">Arena Load</span>
                  <div className="fv-ldg-stat-value">84%</div>
                  <div className="fv-ldg-bar">
                    <div className="fv-ldg-bar-fill fv-ldg-bar-fill--primary" style={{ width: '84%' }} />
                  </div>
                </div>
                <div className="fv-ldg-stat fv-ldg-stat--secondary">
                  <span className="fv-ldg-stat-label">Active Pools</span>
                  <div className="fv-ldg-stat-value">1.2K</div>
                  <div className="fv-ldg-bar">
                    <div className="fv-ldg-bar-fill fv-ldg-bar-fill--secondary" style={{ width: '65%' }} />
                  </div>
                </div>
                <div className="fv-ldg-stat fv-ldg-stat--tertiary">
                  <span className="fv-ldg-stat-label">Global Ranking</span>
                  <div className="fv-ldg-stat-value">Top 5</div>
                  <div className="fv-ldg-stars" aria-hidden>
                    {[0, 1, 2, 3, 4].map((i) => (
                      <span key={i} className="material-symbols-outlined fv-ldg-star fv-ldg-icon-fill">
                        star
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="fv-ldg-analytics-foot">
                <div className="fv-ldg-analytics-tags">
                  <span className="fv-ldg-tag fv-ldg-tag--primary">REAL-TIME SYNC: ACTIVE</span>
                  <span className="fv-ldg-tag fv-ldg-tag--tertiary">ENCRYPTION: LEVEL 9</span>
                </div>
                <span className="fv-ldg-analytics-refresh">REFRESH IN: 5s</span>
              </div>
            </div>

            <div className="fv-ldg-elite">
              <div className="fv-ldg-elite-texture" aria-hidden />
              <div>
                <div className="fv-ldg-elite-top">
                  <span className="material-symbols-outlined fv-ldg-elite-icon fv-ldg-glow-gold" aria-hidden>
                    military_tech
                  </span>
                  <div className="fv-ldg-elite-status">
                    <span className="fv-ldg-elite-status-label">Status</span>
                    <span className="fv-ldg-elite-status-value">ELITE TIER</span>
                  </div>
                </div>
                <h3 className="fv-ldg-elite-title">
                  Claim Your <span className="fv-ldg-text-tertiary">Gold Badge</span>
                </h3>
                <p className="fv-ldg-elite-desc">
                  Unlock premium tournament entries, ad-free viewing, and exclusive digital assets by upgrading to
                  Elite.
                </p>
              </div>
              <Link to="/subscription" className="fv-ldg-elite-btn">
                Upgrade Now
              </Link>
            </div>
          </div>
        </section>

        <footer className="fv-ldg-footer">
          <div className="fv-ldg-footer-brand">
            <span className="fv-ldg-footer-name">Fanverse Interactive</span>
            <span className="fv-ldg-footer-copy">Â© 2024 FANVERSE INTERACTIVE. ALL RIGHTS RESERVED.</span>
          </div>
          <div className="fv-ldg-footer-links">
            <button type="button">Partners</button>
            <button type="button">Legal</button>
            <button type="button">Privacy</button>
            <button type="button">Support</button>
            <button type="button">API</button>
          </div>
          <div className="fv-ldg-footer-icons">
            <button type="button" className="fv-ldg-icon-btn" aria-label="Language">
              <span className="material-symbols-outlined">language</span>
            </button>
            <button type="button" className="fv-ldg-icon-btn" aria-label="Region">
              <span className="material-symbols-outlined">public</span>
            </button>
          </div>
        </footer>
      </main>

      <button type="button" className="fv-ldg-fab" aria-label="Open chat">
        <span className="material-symbols-outlined fv-ldg-icon-fill">chat_bubble</span>
      </button>
    </div>
  );
};

export default HomePage;
