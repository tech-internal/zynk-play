import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './EarnSharePage.css';

const rewardCards = [
  {
    title: '5GB DATA PACK',
    subtitle: 'Roshan / Etisalat',
    price: '15,000 P',
    icon: 'signal_cellular_alt',
    tone: 'primary',
  },
  {
    title: 'FAN EDITION JERSEY',
    subtitle: 'Limited Edition',
    price: '120,000 P',
    icon: 'apparel',
    tone: 'tertiary',
  },
];

const EarnSharePage: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    document.title = 'Game Plazio | Earn & Share';
  }, []);

  useEffect(() => {
    const search = new URLSearchParams(location.search);
    const view = search.get('view');
    if (view === 'share') {
      document.getElementById('share-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (view === 'earn') {
      document.getElementById('earn-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.search]);

  return (
    <div className="earn-share-page">
      <main className="earn-share-main">
        <section id="earn-section" className="es-grid">
          <div className="es-wallet-col">
            <article className="es-card es-wallet-card">
              <div className="es-kicker">AVAILABLE BALANCE</div>
              <div className="es-balance-row">
                <h1>45,820</h1>
                <span>POOLAM</span>
              </div>
              <div className="es-tier-badge">ELITE FAN</div>

              <div className="es-wallet-stats">
                <div>
                  <small>ESTIMATED VALUE</small>
                  <strong>~ $124.50</strong>
                </div>
                <div>
                  <small>PENDING XP</small>
                  <strong className="gold">+850</strong>
                </div>
              </div>

              <div className="es-actions">
                <button type="button" className="es-btn es-btn-primary">
                  CASHOUT TO MOBILE CREDIT
                </button>
                <Link to="/history" className="es-btn es-btn-outline">
                  VIEW WALLET HISTORY
                </Link>
              </div>
            </article>

            <article className="es-card">
              <h3>ACTIVITY LOG</h3>
              <div className="es-activity-item">
                <span className="material-symbols-outlined filled">redeem</span>
                <div>
                  <p>Watch Reward</p>
                  <small>Afghanistan vs India Match</small>
                </div>
                <div className="es-amount">
                  <b>+250 P</b>
                  <small>2h ago</small>
                </div>
              </div>
              <div className="es-activity-item">
                <span className="material-symbols-outlined filled bolt">bolt</span>
                <div>
                  <p>XP Level Up</p>
                  <small>Fan Milestone Achieved</small>
                </div>
                <div className="es-amount">
                  <b className="gold">+1,000 XP</b>
                  <small>Yesterday</small>
                </div>
              </div>
            </article>
          </div>

          <div className="es-market-col">
            <div className="es-section-head">
              <div>
                <h2>REWARDS MARKETPLACE</h2>
                <p>Convert your Poolam into exclusive digital and physical gear.</p>
              </div>
              <button type="button">SEE ALL</button>
            </div>

            <div className="es-reward-grid">
              {rewardCards.map((card) => (
                <article key={card.title} className="es-reward-card">
                  <div className={`es-reward-visual ${card.tone}`}>
                    <span className="material-symbols-outlined">{card.icon}</span>
                    <h4>{card.title}</h4>
                  </div>
                  <div className="es-reward-foot">
                    <div>
                      <small>{card.subtitle}</small>
                      <strong>{card.price}</strong>
                    </div>
                    <button type="button">REDEEM</button>
                  </div>
                </article>
              ))}
            </div>

            <article className="es-card es-chest-card">
              <div>
                <h3>DAILY MYSTERY CHEST</h3>
                <p>You have one unopened reward waiting from last night&apos;s match.</p>
                <span className="es-expire">EXPIRES IN 14H</span>
              </div>
              <button type="button" className="es-btn es-btn-primary">
                OPEN NOW
              </button>
            </article>
          </div>
        </section>

        <section id="share-section" className="es-share-section">
          <div className="es-share-head">
            <h2>CRAFT YOUR MOMENT</h2>
            <p>Turn live action into social-ready clips with Game Plazio overlays.</p>
          </div>

          <div className="es-share-grid">
            <article className="es-card es-editor-card">
              <div className="es-editor-stage">
                <div className="es-stage-overlay">
                  <div className="es-hud">MATCH MOMENT DETECTED: 6-HIT</div>
                  <div className="es-xp-multi">XP MULTIPLIER ACTIVE x1.5</div>
                </div>
                <div className="es-stage-timeline">
                  <div className="es-track">
                    <span />
                  </div>
                  <div className="es-play-controls">
                    <span className="material-symbols-outlined">play_arrow</span>
                    <span className="material-symbols-outlined">skip_next</span>
                    <span className="material-symbols-outlined">volume_up</span>
                  </div>
                </div>
              </div>
              <div className="es-editor-footer">
                <div className="es-tool-row">
                  <button type="button">CAPTION</button>
                  <button type="button" className="active">STICKERS</button>
                  <button type="button">AUDIO</button>
                </div>
                <div className="es-footer-actions">
                  <button type="button">SAVE DRAFT</button>
                  <button type="button" className="es-btn-primary">GENERATE &amp; SHARE</button>
                </div>
              </div>
            </article>

            <div className="es-side-col">
              <article className="es-card">
                <div className="es-side-head">
                  <h3>CALLIGRAPHY PACK</h3>
                  <span>NEW</span>
                </div>
                <div className="es-sticker-grid">
                  <button type="button">وطن</button>
                  <button type="button">
                    <span className="material-symbols-outlined">stars</span>
                  </button>
                  <button type="button">قهرمان</button>
                  <button type="button">
                    <span className="material-symbols-outlined filled">shield</span>
                  </button>
                  <button type="button">
                    <span className="material-symbols-outlined">favorite</span>
                  </button>
                  <button type="button">XP</button>
                </div>
              </article>

              <article className="es-card">
                <h3>TOP CREATORS</h3>
                <div className="es-creator-item">
                  <span>1</span>
                  <div>
                    <p>@KabulKing</p>
                    <small>1.2M Views</small>
                  </div>
                  <b>+12k XP</b>
                </div>
                <div className="es-creator-item">
                  <span>2</span>
                  <div>
                    <p>@ZalaSports</p>
                    <small>890k Views</small>
                  </div>
                  <b>+8k XP</b>
                </div>
                <button type="button" className="es-leaderboard-btn">
                  FULL LEADERBOARD
                </button>
              </article>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default EarnSharePage;
