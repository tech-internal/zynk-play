import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import PremiumAccessWall from '../components/PremiumAccessWall';
import { useEntitlements } from '../context/EntitlementsContext';
import { useI18n, usePageTitle } from '../i18n';
import './EarnSharePage.css';

const imgDataPack =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC9QHEEt_vXmfyL2ovwMXS0z_CCcHwzx7PzS7_ukNNjfswPUxQCtqNZdwT_dATO5uBIbxRzhPXYB8TsvDCO9yu1rIzLfxKoTUF2gSF8sFjdz0QRRQELzVU4AKYbpZcI8Ne5g5n9nzjmwqMMc1GdxT851KHUmFAxPhsXqA8zF2pS8oZ4OejBcByVKH2k1XOOsT0ovH75PtT2GD1UFD8Of7ju6HrQeK0lPtg2N2LxaemxlRMxiabINysTIer0o1ieAz-rBhVcBlP4kL8K';
const imgJersey =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBzcHeCVt7P7yCnjwrU0jeVyooNFxspwhVnBhg5gE8waDfXWHx7TRbGKIpxnlI_-qvi_IfubF7BiD91lyFxn09vPuW3-NQh-6RqsrI5hrN18_0yD5ka3XfmTqMm2EZUng68DSLUMdbiZ1PyLQqtdcnZy47cUHkG9MIe1KlykdEvLS6PkI_zyqkK_ZZ5qNnArmTVJqjySxUJA2iD0O0ZeRazdPsCwS_EQ9Wi50HP-iRrK2tJG9rXIj2pb3YWAa0Du1ukz-4713B0itJU';
const imgStadium =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAqh6es2uc3I3FHlwNLGtrax_EvCda81ekuPZfTJqAMkaJkYUl_pBlxhAVmebJXFaiYpJKz7J1RRgUB97iPTc9tgef7CI4enEpTawALYj4Q2OnP0OqwiL7F5Sgv8qrsc-dQnCvpNmegzGJBARx7spAzq-WtOy-oo8GzwW6KIbftLFnBIwwuv6y1qoFyV9V5oQMExdjXmAXHBs5UuWwtYDHOUdRbFic0vGDW1pjygF9c1ZLDv9LbAa7JlFX2JJ4Q5SmlM38FhXjicnPp';
const imgChestBg =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDjGakB98WuKH_Fcjoc2jtpc5QlmQRLdn-dg-YrDfkSpvSQWXkqZrvNToZUpiVrzv3kEkCnJ3AG4heOz9sFWgTfkeTG2vK4VWL2r9_GBiINmK2OYOQGmCjgeD3DnaDnKC0eI3bcIZe00ctRjAvExDM2Q2xEhMVPSwb9I9syO-DffISYQvhGkMVztLjOCicZzfqbnGqXJYQMZ9JGmfucy7ySsKutas3T_h-g5iwMLnkOUP8W75d8UN2y_Uejkgy6-jLfsG9KAj5WcKPc';
const imgCreator1 =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCg5QfDsoM1U75GbneVLIQT249VpbOktCRX4w4iJsqVw-w3MkRNms6i8Vg15RoG_BUVpyPgp521YohUe-UbC8xnHEqR4Ahr9p-Yeb5KUZq5P1QdDKRfjR3uCpaJyZsdNQBhwgG_sbco32yId_IYr61Zflxui0Sl_ZL5tMr0JDw4wxFQmuWJnFBaq5eQETCGRI61L6d8VPE3aUGEI2YaXSQ_VKMWYY6jLqWGM2NZjcpwGA2j_XIIRzYqHSY8iwjqz8h8P9ctfXEJvizg';
const imgCreator2 =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDZj5XpkAIXqMzSNhRoielWVbOvPz9LAskPGyN5C6aWK5MVO5rXA1Rl2FnK8FAUWKQ7Yqqveyp5HoQHz-66xi32drKWG42t2syt_Wf3-KAMF6lGzi_guGxvUgCOzj5D0K67zeQLJHAZtVY54YGzADlsOJpJuvdN79AJRa-8-qaYEATAnXnT3a3-nrmBFj0gj5EWuBpOZigRynW9c5k10BmWGlL6cKH6iNmk95u8CacNML4IPpW2g0JpGNBt2bBSa3-kYKx0_obEyejX';

const rewardCards = [
  {
    title: '5GB DATA PACK',
    subtitle: 'Roshan / Etisalat',
    price: '15,000 P',
    icon: 'signal_cellular_alt',
    tone: 'primary' as const,
    image: imgDataPack,
    cta: 'REDEEM',
    ctaVariant: 'secondary' as const,
  },
  {
    title: 'FAN EDITION JERSEY',
    subtitle: 'Limited Edition',
    price: '120,000 P',
    icon: 'apparel',
    tone: 'tertiary' as const,
    image: imgJersey,
    cta: 'BUY NOW',
    ctaVariant: 'tertiary' as const,
  },
];

const EarnSharePage: React.FC = () => {
  const { t } = useI18n();
  usePageTitle('earn.pageTitle', 'FANVERSE | Earn & Share');
  const location = useLocation();
  const { canWatchPlayEarn, loading: entLoading } = useEntitlements();
  const view = new URLSearchParams(location.search).get('view');
  const socialOnly = view === 'share';
  const blockEarn = !socialOnly && !entLoading && !canWatchPlayEarn;

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
    <div className="earn-share-page dark">
      <div className="es-stadium-bg" aria-hidden />
      {blockEarn ? (
        <PremiumAccessWall />
      ) : (
        <>
        <main className="earn-share-main">
        <section id="earn-section" className="es-section es-earn-grid">
          <div className="es-wallet-col">
            <article className="es-glass es-wallet-card">
              <div className="es-wallet-glow" aria-hidden />
              <div className="es-wallet-inner">
                <div className="es-wallet-top">
                  <div>
                    <h2 className="es-label-caps es-muted-label">{t('earn.balance')}</h2>
                    <div className="es-balance-row">
                      <span className="es-balance-num">45,820</span>
                      <span className="es-label-caps es-balance-unit">POOLAM</span>
                    </div>
                  </div>
                  <div className="es-tier-badge">ELITE FAN</div>
                </div>

                <div className="es-wallet-stats">
                  <div className="es-stat-tile">
                    <span className="es-stat-kicker">ESTIMATED VALUE</span>
                    <p className="es-stat-value">≈ $124.50</p>
                  </div>
                  <div className="es-stat-tile">
                    <span className="es-stat-kicker">PENDING XP</span>
                    <p className="es-stat-value es-stat-value--gold">+850</p>
                  </div>
                </div>

                <div className="es-actions">
                  <button type="button" className="es-btn es-btn-cashout">
                    CASHOUT TO MOBILE CREDIT
                  </button>
                  <Link to="/history" className="es-btn es-btn-ghost">
                    VIEW WALLET HISTORY
                  </Link>
                </div>
              </div>
            </article>

            <article className="es-glass es-activity-card">
              <h3 className="es-label-caps es-activity-title">ACTIVITY LOG</h3>
              <div className="es-activity-list">
                <div className="es-activity-row">
                  <div className="es-activity-icon es-activity-icon--gift">
                    <span className="material-symbols-outlined es-ms-fill">redeem</span>
                  </div>
                  <div className="es-activity-body">
                    <p className="es-body-strong">Watch Reward</p>
                    <p className="es-micro">Afghanistan vs India Match</p>
                  </div>
                  <div className="es-activity-meta">
                    <p className="es-amount-primary">+250 P</p>
                    <p className="es-micro">2h ago</p>
                  </div>
                </div>
                <div className="es-activity-row es-activity-row--last">
                  <div className="es-activity-icon es-activity-icon--bolt">
                    <span className="material-symbols-outlined es-ms-fill">bolt</span>
                  </div>
                  <div className="es-activity-body">
                    <p className="es-body-strong">XP Level Up</p>
                    <p className="es-micro">Fan Milestone Achieved</p>
                  </div>
                  <div className="es-activity-meta">
                    <p className="es-amount-gold">+1,000 XP</p>
                    <p className="es-micro">Yesterday</p>
                  </div>
                </div>
              </div>
            </article>
          </div>

          <div className="es-market-col">
            <div className="es-market-head">
              <div>
                <h2 className="es-headline">{t('earn.marketplace')}</h2>
                <p className="es-subline">
                  Convert your Poolam into exclusive digital and physical gear.
                </p>
              </div>
              <button type="button" className="es-see-all">
                SEE ALL
                <span className="material-symbols-outlined es-see-all-icon">arrow_forward</span>
              </button>
            </div>

            <div className="es-reward-grid">
              {rewardCards.map((card) => (
                <article key={card.title} className={`es-reward-card es-reward-card--${card.tone}`}>
                  <div className={`es-reward-visual es-reward-visual--${card.tone}`}>
                    <img className="es-reward-img" src={card.image} alt="" loading="lazy" />
                    <div className="es-reward-visual-inner">
                      <span className={`material-symbols-outlined es-reward-icon-${card.tone}`}>
                        {card.icon}
                      </span>
                      <p className="es-reward-title">{card.title}</p>
                    </div>
                  </div>
                  <div className="es-reward-foot">
                    <div>
                      <p className="es-micro es-reward-sub">{card.subtitle}</p>
                      <p className={`es-reward-price es-reward-price--${card.tone}`}>{card.price}</p>
                    </div>
                    <button
                      type="button"
                      className={
                        card.ctaVariant === 'tertiary' ? 'es-reward-cta es-reward-cta--tertiary' : 'es-reward-cta'
                      }
                    >
                      {card.cta}
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="es-chest">
              <div
                className="es-chest-pattern"
                style={{ backgroundImage: `url('${imgChestBg}')` }}
                aria-hidden
              />
              <div className="es-chest-icon-wrap">
                <div className="es-chest-glow" aria-hidden />
                <div className="es-chest-icon-ring">
                  <span className="material-symbols-outlined es-chest-icon es-ms-fill">inventory_2</span>
                </div>
              </div>
              <div className="es-chest-copy">
                <h3 className="es-chest-title">DAILY MYSTERY CHEST</h3>
                <p className="es-subline">
                  You have one unopened reward waiting from last night&apos;s match.
                </p>
                <div className="es-chest-timer">
                  <span className="material-symbols-outlined es-timer-ic">timer</span>
                  <span className="es-label-caps es-timer-text">EXPIRES IN 14H</span>
                </div>
              </div>
              <button type="button" className="es-btn es-btn-cashout es-chest-btn">
                OPEN NOW
              </button>
            </div>
          </div>
        </section>

        <section id="share-section" className="es-section es-share-wrap">
          <div className="es-share-hero">
            <h2 className="es-share-headline">{t('earn.craftMoment')}</h2>
            <p className="es-share-sub">
              Use our AI clip generator to transform live action into social-ready masterpieces with
              holographic overlays.
            </p>
          </div>

          <div className="es-share-grid">
            <article className="es-glass es-editor-card">
              <div className="es-editor-stage" style={{ backgroundImage: `url(${imgStadium})` }}>
                <div className="es-editor-hud">
                  <div className="es-hud-line">
                    <span className="material-symbols-outlined es-hud-cam">auto_videocam</span>
                    <span className="es-label-caps es-hud-text">MATCH MOMENT DETECTED: 6-HIT</span>
                  </div>
                  <div className="es-xp-pill">XP MULTIPLIER ACTIVE x1.5</div>
                </div>
                <div className="es-editor-bottom">
                  <div className="es-scrub">
                    <div className="es-scrub-track">
                      <div className="es-scrub-range" />
                      <div className="es-scrub-knob" />
                    </div>
                    <div className="es-player-row">
                      <div className="es-player-icons">
                        <span className="material-symbols-outlined es-player-ic">play_arrow</span>
                        <span className="material-symbols-outlined es-player-ic">skip_next</span>
                        <span className="material-symbols-outlined es-player-ic">volume_up</span>
                      </div>
                      <div className="es-overlay-btns">
                        <button type="button" className="es-chip-btn">
                          ADD XP OVERLAY
                        </button>
                        <button type="button" className="es-chip-btn">
                          CULTURAL MOTIF
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="es-editor-toolbar">
                <div className="es-tool-icons">
                  <div className="es-tool-cell">
                    <div className="es-tool-box">
                      <span className="material-symbols-outlined">text_fields</span>
                    </div>
                    <span className="es-tool-label">CAPTION</span>
                  </div>
                  <div className="es-tool-cell">
                    <div className="es-tool-box es-tool-box--on">
                      <span className="material-symbols-outlined">sticker</span>
                    </div>
                    <span className="es-tool-label">STICKERS</span>
                  </div>
                  <div className="es-tool-cell">
                    <div className="es-tool-box">
                      <span className="material-symbols-outlined">music_note</span>
                    </div>
                    <span className="es-tool-label">AUDIO</span>
                  </div>
                </div>
                <div className="es-toolbar-actions">
                  <button type="button" className="es-btn-draft">
                    SAVE DRAFT
                  </button>
                  <button type="button" className="es-btn es-btn-cashout es-btn-share">
                    GENERATE &amp; SHARE
                  </button>
                </div>
              </div>
            </article>

            <div className="es-side-col">
              <article className="es-glass es-sticker-card">
                <div className="es-sticker-head">
                  <h3 className="es-label-caps">CALLIGRAPHY PACK</h3>
                  <span className="es-new-pill">NEW</span>
                </div>
                <div className="es-sticker-grid">
                  <button type="button" className="es-sticker-cell">
                    <span className="es-sticker-ar">وطن</span>
                  </button>
                  <button type="button" className="es-sticker-cell es-sticker-cell--gold">
                    <span className="material-symbols-outlined">stars</span>
                  </button>
                  <button type="button" className="es-sticker-cell es-sticker-cell--frame" aria-label="Frame" />
                  <button type="button" className="es-sticker-cell">
                    <span className="es-sticker-ar">قهرمان</span>
                  </button>
                  <button type="button" className="es-sticker-cell">
                    <span className="material-symbols-outlined es-ms-fill">shield</span>
                  </button>
                  <button type="button" className="es-sticker-cell es-sticker-cell--heart">
                    <span className="material-symbols-outlined">favorite</span>
                  </button>
                </div>
              </article>

              <article className="es-glass es-leader-card">
                <h3 className="es-label-caps es-leader-title">TOP CREATORS</h3>
                <div className="es-creator-list">
                  <div className="es-creator-row">
                    <span className="es-creator-rank es-creator-rank--1">1</span>
                    <div className="es-creator-avatar es-creator-avatar--ring">
                      <img src={imgCreator1} alt="" loading="lazy" />
                    </div>
                    <div className="es-creator-info">
                      <p className="es-body-strong">@KabulKing</p>
                      <p className="es-micro">1.2M Views</p>
                    </div>
                    <span className="es-creator-xp">+12k XP</span>
                  </div>
                  <div className="es-creator-row">
                    <span className="es-creator-rank">2</span>
                    <div className="es-creator-avatar">
                      <img src={imgCreator2} alt="" loading="lazy" />
                    </div>
                    <div className="es-creator-info">
                      <p className="es-body-strong">@ZalaSports</p>
                      <p className="es-micro">890k Views</p>
                    </div>
                    <span className="es-creator-xp">+8k XP</span>
                  </div>
                </div>
                <button type="button" className="es-leaderboard-btn">
                  FULL LEADERBOARD
                </button>
              </article>
            </div>
          </div>
        </section>
      </main>

      <div className="es-footer-deco" aria-hidden>
        <svg className="es-footer-svg" preserveAspectRatio="none" viewBox="0 0 1440 320">
          <path
            d="M0,192L48,176C96,160,192,128,288,138.7C384,149,480,203,576,213.3C672,224,768,192,864,165.3C960,139,1056,117,1152,128C1248,139,1344,181,1392,202.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            fill="#9bcbff"
            fillOpacity="0.2"
          />
        </svg>
      </div>
        </>
      )}
    </div>
  );
};

export default EarnSharePage;
