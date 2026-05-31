import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useI18n, usePageTitle } from '../i18n';
import imgWatch from '../images/Watch.png';
import imgPlay from '../images/Play.png';
import imgWin from '../images/Win.png';
import imgShare from '../images/Share.png';
import './HomePage.css';

const portalImg =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDsyWmGsekSZNUiIyzr3WXuommQlkphRb8MetdkdwCBY8qSkJD4EnWn5DKGvVuWIPzhD4t6vEIyYhZK4FkxGtoqD_NZ2gQwLStArNqMc0IHvs6jQSQwlqf2z8RIblVlQ7nt_p0Cg6SsCSJIMWD-8oDAk6thBUc4C_QdgvQk9GnLiQzd0Ze-12xMCf6n-H_FV-T56tcPw5D35jip8vCFELBMcIbhOjMFqzms7M8jssVavxiirfgUIah56NqzKc-Lt5q2nC9NTHCY3Wag';

function TickerLoop(): React.ReactElement {
  const { t } = useI18n();
  return (
    <>
      <div className="fv-ldg-ticker-seg">
        <span className="fv-ldg-ticker-tag fv-ldg-ticker-tag--secondary">{t('home.ticker.challenge')}</span>
        <span className="fv-ldg-ticker-msg">{t('home.ticker.challengeMsg')}</span>
      </div>
      <div className="fv-ldg-ticker-dot" aria-hidden />
      <div className="fv-ldg-ticker-seg">
        <span className="fv-ldg-ticker-tag fv-ldg-ticker-tag--tertiary">{t('home.ticker.xp')}</span>
        <span className="fv-ldg-ticker-msg">{t('home.ticker.xpMsg')}</span>
      </div>
      <div className="fv-ldg-ticker-dot" aria-hidden />
      <div className="fv-ldg-ticker-seg">
        <span className="fv-ldg-ticker-tag fv-ldg-ticker-tag--primary">{t('home.ticker.drop')}</span>
        <span className="fv-ldg-ticker-msg">{t('home.ticker.dropMsg')}</span>
      </div>
      <div className="fv-ldg-ticker-dot" aria-hidden />
    </>
  );
}

const HomePage: React.FC = () => {
  const { t } = useI18n();
  usePageTitle('home.pageTitle', 'Fanverse | Pro League Arena');

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('fv-ldg-page', 'dark');
    return () => {
      root.classList.remove('fv-ldg-page', 'dark');
    };
  }, []);

  return (
    <div className="fv-ldg">
      <aside className="fv-ldg-sidenav" aria-label={t('a11y.command')}>
        <div className="fv-ldg-sidenav-head">
          <span className="fv-ldg-sidenav-label">{t('home.command')}</span>
          <span className="fv-ldg-sidenav-sub">{t('home.proLeague')}</span>
        </div>
        <div className="fv-ldg-sidenav-items">
          <Link to="/streaming" className="fv-ldg-sidenav-item fv-ldg-sidenav-item--active">
            <span className="material-symbols-outlined fv-ldg-icon-fill" aria-hidden>
              live_tv
            </span>
            <span className="fv-ldg-sidenav-item-label">{t('nav.watch')}</span>
          </Link>
          <Link to="/gameplay" className="fv-ldg-sidenav-item">
            <span className="material-symbols-outlined" aria-hidden>
              sports_esports
            </span>
            <span className="fv-ldg-sidenav-item-label">{t('nav.play')}</span>
          </Link>
          <Link to="/earn-share?view=earn" className="fv-ldg-sidenav-item">
            <span className="material-symbols-outlined" aria-hidden>
              monetization_on
            </span>
            <span className="fv-ldg-sidenav-item-label">{t('nav.earn')}</span>
          </Link>
          <Link to="/earn-share?view=share" className="fv-ldg-sidenav-item">
            <span className="material-symbols-outlined" aria-hidden>
              hub
            </span>
            <span className="fv-ldg-sidenav-item-label">{t('nav.share')}</span>
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
                  <span className="fv-ldg-mtile-title">{t('nav.watch')}</span>
                </div>
              </Link>
              <Link to="/gameplay" className="fv-ldg-mtile fv-ldg-mtile--accent">
                <img className="fv-ldg-mtile-img" src={imgPlay} alt="" />
                <div className="fv-ldg-mtile-grad" />
                <div className="fv-ldg-mtile-meta">
                  <span className="fv-ldg-mtile-num fv-ldg-mtile-num--accent">02</span>
                  <span className="fv-ldg-mtile-title">{t('nav.play')}</span>
                </div>
              </Link>
              <Link to="/earn-share?view=earn" className="fv-ldg-mtile fv-ldg-mtile--cyan">
                <img className="fv-ldg-mtile-img" src={imgWin} alt="" />
                <div className="fv-ldg-mtile-grad" />
                <div className="fv-ldg-mtile-meta">
                  <span className="fv-ldg-mtile-num fv-ldg-mtile-num--cyan">03</span>
                  <span className="fv-ldg-mtile-title">{t('nav.earn')}</span>
                </div>
              </Link>
              <Link to="/earn-share?view=share" className="fv-ldg-mtile fv-ldg-mtile--cyan">
                <img className="fv-ldg-mtile-img" src={imgShare} alt="" />
                <div className="fv-ldg-mtile-grad" />
                <div className="fv-ldg-mtile-meta">
                  <span className="fv-ldg-mtile-num fv-ldg-mtile-num--cyan">04</span>
                  <span className="fv-ldg-mtile-title">{t('nav.share')}</span>
                </div>
              </Link>
            </div>

            <div className="fv-ldg-badge">
              <span className="fv-ldg-badge-dot" aria-hidden />
              <span className="fv-ldg-badge-text">{t('home.badge')}</span>
            </div>

            <h1 className="fv-ldg-hero-title">
              {t('home.heroTitle')} <span className="fv-ldg-hero-accent">{t('home.heroAccent')}</span>
            </h1>
            <p className="fv-ldg-hero-lede">{t('home.heroLede')}</p>
            <div className="fv-ldg-hero-cta-row">
              <Link to="/streaming" className="fv-ldg-btn fv-ldg-btn--secondary">
                {t('home.ctaLive')}
                <span className="material-symbols-outlined fv-ldg-btn-icon" aria-hidden>
                  bolt
                </span>
              </Link>
              <Link to="/earn-share?view=earn" className="fv-ldg-btn fv-ldg-btn--ghost">
                {t('home.ctaStandings')}
              </Link>
            </div>
          </div>

          <div className="fv-ldg-hero-deco fv-ldg-hero-deco--left" aria-hidden>
            <span className="fv-ldg-hero-deco-label">{t('home.latency')}</span>
            <span className="fv-ldg-hero-deco-value">{t('common.optimal')}</span>
          </div>
          <div className="fv-ldg-hero-deco fv-ldg-hero-deco--right" aria-hidden>
            <span className="fv-ldg-hero-deco-label fv-ldg-hero-deco-label--tertiary">{t('home.globalUsers')}</span>
            <span className="fv-ldg-hero-deco-value fv-ldg-text-tertiary">422,901</span>
          </div>
        </section>

        <div className="fv-ldg-ticker" role="region" aria-label={t('a11y.arenaFeed')}>
          <div className="fv-ldg-ticker-track">
            <TickerLoop />
            <TickerLoop />
          </div>
        </div>

        <section className="fv-ldg-core" aria-labelledby="core-ops-heading">
          <div className="fv-ldg-core-head">
            <h2 id="core-ops-heading" className="fv-ldg-core-title">
              {t('home.coreTitle')}
            </h2>
            <span className="fv-ldg-core-sub">{t('home.coreSub')}</span>
          </div>
          <div className="fv-ldg-core-grid">
            <div className="fv-ldg-card fv-ldg-card--accent">
              <img className="fv-ldg-card-bg" src={imgWatch} alt="" />
              <div className="fv-ldg-card-grad" />
              <div className="fv-ldg-card-live">
                <span className="fv-ldg-card-live-dot" aria-hidden />
                <span className="fv-ldg-card-live-text">{t('home.liveStream')}</span>
              </div>
              <div className="fv-ldg-card-body">
                <span className="fv-ldg-card-op">{t('home.op01')}</span>
                <h3 className="fv-ldg-card-title">{t('nav.watch')}</h3>
                <p className="fv-ldg-card-desc">{t('home.watchDesc')}</p>
                <Link to="/streaming" className="fv-ldg-card-link">
                  {t('home.accessChannel')} <span className="material-symbols-outlined">arrow_right_alt</span>
                </Link>
              </div>
            </div>

            <div className="fv-ldg-card fv-ldg-card--accent">
              <img className="fv-ldg-card-bg" src={imgPlay} alt="" />
              <div className="fv-ldg-card-grad" />
              <div className="fv-ldg-card-body">
                <span className="fv-ldg-card-op">{t('home.op02')}</span>
                <h3 className="fv-ldg-card-title">{t('nav.play')}</h3>
                <p className="fv-ldg-card-desc">{t('home.playDesc')}</p>
                <Link to="/gameplay" className="fv-ldg-card-link">
                  {t('home.enterLobby')} <span className="material-symbols-outlined">arrow_right_alt</span>
                </Link>
              </div>
            </div>

            <div className="fv-ldg-card fv-ldg-card--cyan">
              <img className="fv-ldg-card-bg" src={imgWin} alt="" />
              <div className="fv-ldg-card-grad" />
              <div className="fv-ldg-card-body">
                <span className="fv-ldg-card-op">{t('home.op03')}</span>
                <h3 className="fv-ldg-card-title">{t('nav.earn')}</h3>
                <p className="fv-ldg-card-desc">{t('home.earnDesc')}</p>
                <Link to="/earn-share?view=earn" className="fv-ldg-card-link">
                  {t('home.viewRewards')} <span className="material-symbols-outlined">arrow_right_alt</span>
                </Link>
              </div>
            </div>

            <div className="fv-ldg-card fv-ldg-card--cyan">
              <img className="fv-ldg-card-bg" src={imgShare} alt="" />
              <div className="fv-ldg-card-grad" />
              <div className="fv-ldg-card-body">
                <span className="fv-ldg-card-op">{t('home.op04')}</span>
                <h3 className="fv-ldg-card-title">{t('nav.share')}</h3>
                <p className="fv-ldg-card-desc">{t('home.shareDesc')}</p>
                <Link to="/earn-share?view=share" className="fv-ldg-card-link">
                  {t('home.socialHub')} <span className="material-symbols-outlined">arrow_right_alt</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="fv-ldg-partners" aria-labelledby="partners-heading">
          <div className="fv-ldg-partners-inner">
            <div className="fv-ldg-partners-copy">
              <span className="fv-ldg-partners-eyebrow">{t('home.partnersEyebrow')}</span>
              <h2 id="partners-heading" className="fv-ldg-partners-title">
                {t('home.partnersTitle')}
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
                {t('home.analyticsTitle')}
              </h3>
              <div className="fv-ldg-analytics-stats">
                <div className="fv-ldg-stat fv-ldg-stat--primary">
                  <span className="fv-ldg-stat-label">{t('home.arenaLoad')}</span>
                  <div className="fv-ldg-stat-value">84%</div>
                  <div className="fv-ldg-bar">
                    <div className="fv-ldg-bar-fill fv-ldg-bar-fill--primary" style={{ width: '84%' }} />
                  </div>
                </div>
                <div className="fv-ldg-stat fv-ldg-stat--secondary">
                  <span className="fv-ldg-stat-label">{t('home.activePools')}</span>
                  <div className="fv-ldg-stat-value">1.2K</div>
                  <div className="fv-ldg-bar">
                    <div className="fv-ldg-bar-fill fv-ldg-bar-fill--secondary" style={{ width: '65%' }} />
                  </div>
                </div>
                <div className="fv-ldg-stat fv-ldg-stat--tertiary">
                  <span className="fv-ldg-stat-label">{t('home.globalRanking')}</span>
                  <div className="fv-ldg-stat-value">{t('home.top5')}</div>
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
                  <span className="fv-ldg-tag fv-ldg-tag--primary">{t('home.syncActive')}</span>
                  <span className="fv-ldg-tag fv-ldg-tag--tertiary">{t('home.encryption')}</span>
                </div>
                <span className="fv-ldg-analytics-refresh">{t('home.refreshIn')}</span>
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
                    <span className="fv-ldg-elite-status-label">{t('home.status')}</span>
                    <span className="fv-ldg-elite-status-value">{t('home.eliteTier')}</span>
                  </div>
                </div>
                <h3 className="fv-ldg-elite-title">
                  {t('home.claimGold')} <span className="fv-ldg-text-tertiary">{t('home.goldBadge')}</span>
                </h3>
                <p className="fv-ldg-elite-desc">{t('home.eliteDesc')}</p>
              </div>
              <Link to="/subscription" className="fv-ldg-elite-btn">
                {t('home.upgradeNow')}
              </Link>
            </div>
          </div>
        </section>

        <footer className="fv-ldg-footer">
          <div className="fv-ldg-footer-brand">
            <span className="fv-ldg-footer-name">{t('brand.interactive')}</span>
            <span className="fv-ldg-footer-copy">{t('home.footerCopy')}</span>
          </div>
          <div className="fv-ldg-footer-links">
            <button type="button">{t('home.partners')}</button>
            <button type="button">{t('home.legal')}</button>
            <button type="button">{t('home.privacy')}</button>
            <button type="button">{t('home.support')}</button>
            <button type="button">{t('home.api')}</button>
          </div>
          <div className="fv-ldg-footer-icons">
            <Link to="/settings" className="fv-ldg-icon-btn" aria-label={t('a11y.language')}>
              <span className="material-symbols-outlined">language</span>
            </Link>
            <button type="button" className="fv-ldg-icon-btn" aria-label={t('a11y.region')}>
              <span className="material-symbols-outlined">public</span>
            </button>
          </div>
        </footer>
      </main>

      <button type="button" className="fv-ldg-fab" aria-label={t('a11y.openChat')}>
        <span className="material-symbols-outlined fv-ldg-icon-fill">chat_bubble</span>
      </button>
    </div>
  );
};

export default HomePage;
