import React from 'react';
import { useNavigate } from 'react-router-dom';
import './DashboardPage.css';

const arenaCards = [
  {
    title: 'Cricket',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCSKJoZAXMkfS7m6JUeaE907miV8fjhs6s2qIFkrpQkulkqd3aRRAUi49btrjEmwkO0yI_lb6wYXxUk_zkMgQSsJYbD2OmjKb7zEoOhPXXJB6J0vSZ1grNFHWZIgrrnqS6vyTYQEWqO4xejisflmeW8Ue8SqT8RTEg3dACzeAGN6ipvTSHkcCN6VjW4gtm9iLDAiq53o9xtPpBP33nyONx0rvWCCQWPW2dGd5BKrYjmHV-5xfQyJX6g98Qwl5u19p3XClZUIVKnIl1J',
    available: true,
  },
  {
    title: 'Football',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC_Wbsw0hQWsYwD-_YNEHotpTrAJZu8tMLqc9eSkKUMKEeR7GjjeL-_N6G_Rj_fPod8HTOzTfJe774fzq_Zx2jYMKqvhY7DlS_UupjSQsesKoF0VgCPRJOoIYiweXb5rSwUrNHgfEEXXaXK1i-HvgyTW3TTYTqHlH7_QiR9-vTbcGKZuPAnGdRv1ItR6BxyzHGGyDrEF8tJ4lYtbv7m1YpIJYoWufKGbye0WsRQiCUFXChsqV0xRRjQe1BJOC8hiqik731RXwEmcQNX',
    available: false,
  },
  {
    title: 'Basketball',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBXcdMflbRE63rXrZCgIGXvq2YuccvPUJLaYOU9Whih-wzzQG_zhVPVSQJM-e0kIpkUTG_D_1-nwZDO4-wuW2oq0loN-beIWo1s0CxzRRzMrdBaZhUDUE0BgxEpP1cGfjaLpqMcBUItfTau2lBMlJCksKr-ANKQN909XTN9ocEHI5tuc3k5N73_jE4uy9um2iJdx-NP53thTm7-XBH_4-qpAlaeDbSMvxYN0AFV7WZT9oV4aRh58t4Rsm1lqId_jYGQ9E36HPMNqQ49',
    available: false,
  },
  {
    title: 'eSports',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB4x970T-yxOUWmxAJq9qnO0jcry0NVrx3F3lUjKUgTKunT4Z6a6MA9jJ-eMlBPQkIbXe_55qUboTuooeWL_yQT89tEVYLXWNZTGq9VWwZpff4ysSIyj9MXk8iP03wT_C8_5aBkPlm9doMw4RFwyLJ-LNjODg-kAz_WBPaz9AofYwihybMQwfI52Ho1h9HqhJjh1aLofrdZNJZn50eR2YCe2kOCGkq19Tosbk0pTBfWTWghsUIRIDO4FQWD0C5DimQIrj2rUkAYiOVi',
    available: false,
  },
];

const fanLoopCards = [
  {
    title: 'Watch',
    subtitle: 'Live matches, exclusive ATN streams, and instant highlights.',
    cta: 'Enter The Arena',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBY0NIcLpsT0kDERfZNJSSN-NVUVP4zB6V4YSPiNqduyiCrMM9CK66k53i6NOnHSxYK_Gb0YoE2PxK5HhoLSZ32Nk6rvKoAuXjLKGQ9gBDdrFDwYJambrPs0HpL20tqXgqmgwF3u4Bc9jL4bbFCz5uWEsC9Nq6MpPlbb5dAaM8ROwyrLm6cUcaEovtc52D_Y2gpOvv7FvXCy6dcN8VHhjD94YaWrMex7v6JEq_vgGMBA9VLIWVhM6VfWWvlOPFbifKggUdB7_p0KfRw',
  },
  {
    title: 'Play',
    subtitle: 'Join Fantasy leagues, build your RPG team, and compete globally.',
    cta: 'Level Up Now',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAnlhadEZxIg-OW9HCzSMSSkE1ap5aLaEtyEKZQ-kOtHyLPwWDlqsYcCZwaFsu1VdISM2X3lLEdx7gqXrqP2NDg3Ce5sMQM77OSY4wngbwr4gKdk6frOXnwKjh3SOrOBomwr59z_klY8JVpgQoDjIfahDC9sAYIgxRE5uJ035ejQdnBoUoxz6CMzPCM490O212SxowiplwvKYt5kduJSCRbnSSvIizLH-S3jnUfpGKwBOYfAilrRGP8hvUUZs6SUFtQ4gTfP4m8yib3',
  },
  {
    title: 'Earn',
    subtitle: 'Redeem XP for real-world rewards, data packs, and Poolam tokens.',
    cta: 'View Wallet',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCccqrPoWBl4IuAFeFEQuiqapUtci6hg005nk-1YKbmUrpM61eDVULSNgk6Z0yk65q1DW8jubtabjWYfFDXyLJXTGrtOlRwsakG9lnJchaqWyuG05OJ3zueVSGTKU6lqQjswCZ3mA_COBGgptmMlgcqJ1wudr3BGULvCwxGzgHX4Xc9o-FRlrQKAEeVq2_bhX8SnR09AFzIiu0F7-YWMlp5VucJjfSWKfk8s4Fp7_xvYqMtYQ0iGYbNwnQb0j1RrjU2ga5jf0VUst_O',
  },
  {
    title: 'Share',
    subtitle: 'Post your highlights, chat with fellow fans, and influence the community.',
    cta: 'Connect Fans',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDBp1SKPGaGzlcIdntZ7p9b3LMS4IyZQHNArNGCR1-mZBH_Zn3trwFlgCM1d7v9VDUfHM8BzJAOZIPkec5WH-vj8sLi_KckWNFlfnHb91vbfhMmD4XBMUSSwMp1y7DrxIJ_Jd_mNIJqqJanw4q7nMvkv2p9wDBhOWdMgkO7vj-VZH1X_c2PsrSYQJnKT8VmPZ-zDfWTuktN8TWzuZ7zhG7VN03onMSGwG8goLiKBwIZ8ME48SySMYl4LbSV2TsTjV8oG3slcJpPb3k4',
  },
];

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="dashboard-page gp-theme">
      <main className="gp-main">
        <section className="gp-hero">
          <div className="gp-hero-overlay" />
          <div className="gp-hero-content">
            <div className="gp-hero-chip-row">
              <span className="gp-chip">Live Now</span>
              <span className="gp-chip-text">AWCC x ATN x Poolam</span>
            </div>
            <h2>THE FAN LOOP HUB</h2>
            <p>
              Experience the next generation of sports. Watch, Play, Earn, and Share within Afghanistan&apos;s premier
              digital arena.
            </p>
            <div className="gp-hero-actions">
              <button type="button" className="gp-btn gp-btn-primary" onClick={() => navigate('/streaming')}>
                Watch Live Matches
              </button>
              <button type="button" className="gp-btn gp-btn-outline">
                Play Fantasy &amp; RPG
              </button>
            </div>
          </div>
        </section>

        <section className="gp-arena">
          <div className="gp-section-head">
            <h3>Choose Your Arena</h3>
            <span>View All</span>
          </div>
          <div className="gp-arena-rail">
            {arenaCards.map((card) => (
              <article
                key={card.title}
                className={`gp-arena-card ${card.available ? 'is-live' : 'is-coming'}`}
                role={card.title === 'Cricket' ? 'button' : undefined}
                tabIndex={card.title === 'Cricket' ? 0 : undefined}
                onClick={card.title === 'Cricket' ? () => navigate('/gameplay') : undefined}
                onKeyDown={
                  card.title === 'Cricket'
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          navigate('/gameplay');
                        }
                      }
                    : undefined
                }
              >
                <img src={card.image} alt={card.title} loading="lazy" />
                <div className="gp-arena-card-overlay" />
                {!card.available && <div className="gp-coming-soon">Coming Soon</div>}
                <h4>{card.title}</h4>
              </article>
            ))}
            <article className="gp-arena-card gp-arena-placeholder is-coming">
              <div className="gp-arena-placeholder-icon">🤼</div>
              <div className="gp-arena-card-overlay" />
              <div className="gp-coming-soon">Coming Soon</div>
              <h4>Kabaddi</h4>
            </article>
          </div>
        </section>

        <section className="gp-fan-loop">
          <h3>The Fan Loop</h3>
          <div className="gp-fan-loop-grid">
            {fanLoopCards.map((card) => (
              <article key={card.title} className="gp-loop-card">
                <img src={card.image} alt={card.title} loading="lazy" />
                <div className="gp-loop-overlay" />
                <div className="gp-loop-content">
                  <h4>{card.title}</h4>
                  <p>{card.subtitle}</p>
                  <span>{card.cta}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default DashboardPage;
