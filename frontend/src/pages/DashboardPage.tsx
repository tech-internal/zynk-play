import React from 'react';
import { useNavigate } from 'react-router-dom';
import './DashboardPage.css';

const fanLoopQuadrants = [
  {
    num: '01',
    title: 'Watch',
    description: 'Live matches, exclusive ATN streams, and instant highlights in 4K.',
    cta: 'Enter Arena',
    icon: 'play_circle',
    to: '/streaming',
  },
  {
    num: '02',
    title: 'Play',
    description: 'Join Fantasy leagues, build your RPG team, and compete globally for glory.',
    cta: 'Level Up',
    icon: 'sports_esports',
    to: '/gameplay',
  },
  {
    num: '03',
    title: 'Earn',
    description: 'Redeem XP for real-world rewards, data packs, and Poolam tokens.',
    cta: 'Vault',
    icon: 'payments',
    to: '/earn-share',
  },
  {
    num: '04',
    title: 'Share',
    description: 'Post highlights, chat with fans, and influence the community elite.',
    cta: 'Connect',
    icon: 'share',
    to: '/earn-share',
  },
] as const;

const arenaCategories = [
  {
    title: 'Football',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC_Wbsw0hQWsYwD-_YNEHotpTrAJZu8tMLqc9eSkKUMKEeR7GjjeL-_N6G_Rj_fPod8HTOzTfJe774fzq_Zx2jYMKqvhY7DlS_UupjSQsesKoF0VgCPRJOoIYiweXb5rSwUrNHgfEEXXaXK1i-HvgyTW3TTYTqHlH7_QiR9-vTbcGKZuPAnGdRv1ItR6BxyzHGGyDrEF8tJ4lYtbv7m1YpIJYoWufKGbye0WsRQiCUFXChsqV0xRRjQe1BJOC8hiqik731RXwEmcQNX',
    statusDotClass: 'fv-dot--secondary',
    statusLabel: '14 Live Events',
    statusTextClass: 'fv-arena-meta--primary',
    to: '/streaming',
  },
  {
    title: 'Cricket',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCSKJoZAXMkfS7m6JUeaE907miV8fjhs6s2qIFkrpQkulkqd3aRRAUi49btrjEmwkO0yI_lb6wYXxUk_zkMgQSsJYbD2OmjKb7zEoOhPXXJB6J0vSZ1grNFHWZIgrrnqS6vyTYQEWqO4xejisflmeW8Ue8SqT8RTEg3dACzeAGN6ipvTSHkcCN6VjW4gtm9iLDAiq53o9xtPpBP33nyONx0rvWCCQWPW2dGd5BKrYjmHV-5xfQyJX6g98Qwl5u19p3XClZUIVKnIl1J',
    statusDotClass: 'fv-dot--secondary fv-dot--pulse',
    statusLabel: 'Sovereign Cup Live',
    statusTextClass: 'fv-arena-meta--accent',
    to: '/gameplay',
  },
  {
    title: 'Basketball',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBXcdMflbRE63rXrZCgIGXvq2YuccvPUJLaYOU9Whih-wzzQG_zhVPVSQJM-e0kIpkUTG_D_1-nwZDO4-wuW2oq0loN-beIWo1s0CxzRRzMrdBaZhUDUE0BgxEpP1cGfjaLpqMcBUItfTau2lBMlJCksKr-ANKQN909XTN9ocEHI5tuc3k5N73_jE4uy9um2iJdx-NP53thTm7-XBH_4-qpAlaeDbSMvxYN0AFV7WZT9oV4aRh58t4Rsm1lqId_jYGQ9E36HPMNqQ49',
    statusDotClass: 'fv-dot--outline',
    statusLabel: 'Starts in 2h',
    statusTextClass: 'fv-arena-meta--primary',
    to: '/streaming',
  },
  {
    title: 'eSports',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB4x970T-yxOUWmxAJq9qnO0jcry0NVrx3F3lUjKUgTKunT4Z6a6MA9jJ-eMlBPQkIbXe_55qUboTuooeWL_yQT89tEVYLXWNZTGq9VWwZpff4ysSIyj9MXk8iP03wT_C8_5aBkPlm9doMw4RFwyLJ-LNjODg-kAz_WBPaz9AofYwihybMQwfI52Ho1h9HqhJjh1aLofrdZNJZn50eR2YCe2kOCGkq19Tosbk0pTBfWTWghsUIRIDO4FQWD0C5DimQIrj2rUkAYiOVi',
    statusDotClass: 'fv-dot--secondary',
    statusLabel: 'Pro League Live',
    statusTextClass: 'fv-arena-meta--primary',
    to: '/gameplay',
  },
  {
    title: 'Kabaddi',
    image: null as string | null,
    statusDotClass: 'fv-dot--outline',
    statusLabel: 'Offline',
    statusTextClass: 'fv-arena-meta--primary',
    to: '/streaming',
  },
] as const;

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="fv-page dark">
      <div className="fv-grid-bg" aria-hidden />
      <div className="fv-blob fv-blob--tr" aria-hidden />
      <div className="fv-blob fv-blob--bl" aria-hidden />

      <main className="fv-main">
        <section className="fv-section fv-hub">
          <div className="fv-hub-intro">
            <div className="fv-kicker">
              <span className="fv-kicker-line" aria-hidden />
              <span className="fv-kicker-text">Broadcast Central</span>
            </div>
            <h1 className="fv-title-xl">The Fan Loop Hub</h1>
          </div>

          <div className="fv-quadrant-grid">
            {fanLoopQuadrants.map((card) => (
              <button
                key={card.title}
                type="button"
                className="fv-quadrant fv-elite-border"
                onClick={() => navigate(card.to)}
              >
                <div className="fv-quadrant-bg-icon" aria-hidden>
                  <span className="material-symbols-outlined">{card.icon}</span>
                </div>
                <div>
                  <span className="fv-quadrant-num">{card.num}</span>
                  <h2 className="fv-quadrant-title">{card.title}</h2>
                  <p className="fv-quadrant-desc">{card.description}</p>
                </div>
                <div className="fv-quadrant-foot">
                  <span className="fv-quadrant-cta">{card.cta}</span>
                  <span className="material-symbols-outlined fv-quadrant-arrow" aria-hidden>
                    arrow_forward
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="fv-section fv-cta-wrap">
          <div className="fv-cta-card">
            <div className="fv-cta-accent" aria-hidden />
            <div className="fv-cta-inner">
              <div className="fv-cta-copy">
                <h2 className="fv-title-lg">The Next Gen Arena is Live</h2>
                <p className="fv-cta-body">
                  Experience the next generation of sports. Watch, Play, Earn, and Share within Afghanistan&apos;s
                  premier digital arena.
                </p>
              </div>
              <div className="fv-cta-actions">
                <button type="button" className="fv-btn fv-btn--primary" onClick={() => navigate('/streaming')}>
                  Watch Live Matches
                </button>
                <button type="button" className="fv-btn fv-btn--gold" onClick={() => navigate('/gameplay')}>
                  Elite Fantasy RPG
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="fv-section fv-arena-band">
          <div className="fv-section-head">
            <div>
              <h2 className="fv-title-lg fv-arena-heading">Choose Your Arena</h2>
              <div className="fv-arena-rule" aria-hidden />
            </div>
            <button type="button" className="fv-access-all" onClick={() => navigate('/streaming')}>
              Access All Portals
            </button>
          </div>
          <div className="fv-arena-rail">
            {arenaCategories.map((cat) => (
              <button
                key={cat.title}
                type="button"
                className="fv-arena-card"
                onClick={() => navigate(cat.to)}
              >
                <div className="fv-arena-media">
                  {cat.image ? (
                    <img src={cat.image} alt="" className="fv-arena-img" loading="lazy" />
                  ) : (
                    <span className="material-symbols-outlined fv-arena-placeholder-icon">sports_kabaddi</span>
                  )}
                  <div className="fv-arena-gradient" aria-hidden />
                  <div className="fv-arena-caption">
                    <span className="fv-arena-title">{cat.title}</span>
                    <div className={`fv-arena-meta ${cat.statusTextClass}`}>
                      <span className={`fv-dot ${cat.statusDotClass}`} aria-hidden />
                      <span>{cat.statusLabel}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default DashboardPage;
