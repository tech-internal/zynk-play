import React from 'react';
import './GamePlayPage.css';
import { AFG_CRICKET_GAME_URL, AFG_CRICKET_IFRAME_ALLOW } from '../config/afgCricket';

type ArenaGame = {
  title: string;
  image: string;
  available: boolean;
  cta: string;
};

type PredictionCard = {
  tag: string;
  odds: string;
  heading: string;
  detail: string;
  variant: 'primary' | 'gold' | 'error';
  actions: [string, string];
};

const arenaCards: ArenaGame[] = [
  {
    title: 'Cricket',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCSKJoZAXMkfS7m6JUeaE907miV8fjhs6s2qIFkrpQkulkqd3aRRAUi49btrjEmwkO0yI_lb6wYXxUk_zkMgQSsJYbD2OmjKb7zEoOhPXXJB6J0vSZ1grNFHWZIgrrnqS6vyTYQEWqO4xejisflmeW8Ue8SqT8RTEg3dACzeAGN6ipvTSHkcCN6VjW4gtm9iLDAiq53o9xtPpBP33nyONx0rvWCCQWPW2dGd5BKrYjmHV-5xfQyJX6g98Qwl5u19p3XClZUIVKnIl1J',
    available: true,
    cta: 'Live Now',
  },
  {
    title: 'FIFA',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC_Wbsw0hQWsYwD-_YNEHotpTrAJZu8tMLqc9eSkKUMKEeR7GjjeL-_N6G_Rj_fPod8HTOzTfJe774fzq_Zx2jYMKqvhY7DlS_UupjSQsesKoF0VgCPRJOoIYiweXb5rSwUrNHgfEEXXaXK1i-HvgyTW3TTYTqHlH7_QiR9-vTbcGKZuPAnGdRv1ItR6BxyzHGGyDrEF8tJ4lYtbv7m1YpIJYoWufKGbye0WsRQiCUFXChsqV0xRRjQe1BJOC8hiqik731RXwEmcQNX',
    available: false,
    cta: 'Coming Soon',
  },
  {
    title: 'Basketball',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBXcdMflbRE63rXrZCgIGXvq2YuccvPUJLaYOU9Whih-wzzQG_zhVPVSQJM-e0kIpkUTG_D_1-nwZDO4-wuW2oq0loN-beIWo1s0CxzRRzMrdBaZhUDUE0BgxEpP1cGfjaLpqMcBUItfTau2lBMlJCksKr-ANKQN909XTN9ocEHI5tuc3k5N73_jE4uy9um2iJdx-NP53thTm7-XBH_4-qpAlaeDbSMvxYN0AFV7WZT9oV4aRh58t4Rsm1lqId_jYGQ9E36HPMNqQ49',
    available: false,
    cta: 'Coming Soon',
  },
  {
    title: 'eSports',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB4x970T-yxOUWmxAJq9qnO0jcry0NVrx3F3lUjKUgTKunT4Z6a6MA9jJ-eMlBPQkIbXe_55qUboTuooeWL_yQT89tEVYLXWNZTGq9VWwZpff4ysSIyj9MXk8iP03wT_C8_5aBkPlm9doMw4RFwyLJ-LNjODg-kAz_WBPaz9AofYwihybMQwfI52Ho1h9HqhJjh1aLofrdZNJZn50eR2YCe2kOCGkq19Tosbk0pTBfWTWghsUIRIDO4FQWD0C5DimQIrj2rUkAYiOVi',
    available: false,
    cta: 'Coming Soon',
  },
  {
    title: 'Kabaddi',
    image: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&w=1000&q=80',
    available: false,
    cta: 'Coming Soon',
  },
];

const predictionCards: PredictionCard[] = [
  {
    tag: 'Match Winner',
    odds: '2.4x',
    heading: 'Afghanistan vs India',
    detail: 'Stake your skill tokens on the final winner.',
    variant: 'primary',
    actions: ['Stake Home', 'Stake Away'],
  },
  {
    tag: 'Possession %',
    odds: '4.8x',
    heading: 'AFG > 55% possession?',
    detail: 'Vote yes or no and multiply your prediction returns.',
    variant: 'gold',
    actions: ['Vote Yes', 'Vote No'],
  },
  {
    tag: 'Top Scorer',
    odds: '12.0x',
    heading: 'First goalscorer bonus',
    detail: 'Choose your player and lock the prediction early.',
    variant: 'error',
    actions: ['Pick Player', 'Stake 50'],
  },
];

const GamePlayPage: React.FC = () => {
  React.useEffect(() => {
    document.title = 'Game Plazio | Play Cricket';
  }, []);

  const [isLoading, setIsLoading] = React.useState(true);

  return (
    <div className="play-page play-theme">
      <main className="play-main">
        <section className="play-avatar-zone">
          <div className="play-avatar-grid">
            <article className="play-avatar-visual-card">
              <div className="play-avatar-glow" />
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDPxzjAw_z5CVMlhv9Vz7R85FSvhDoCCvsojoMpUgkGh6veyIS5pdAnHL1QWcd-UNRtPCy1oOhNXd_8hw6D4zlh1K1I0wC5qjNUH6ByNmoHkyNfWGW24CTCkAYpv8BGHCfEljKhqcbkZRWMMSO-BhUayGG0kQrTKg_EY06M2oMprsBshE2yCgXQ9PVGliJjX9c7-kLkNXjMdez396sazos6IRKSXPH_jo_b3qu2OYcf635lNgll39YVFJqqICbCwxuJUhiGzMUeUphL"
                alt="Avatar visual"
                loading="lazy"
              />
              <div className="play-avatar-footer">
                <div>
                  <p>Pro-Elite Rank</p>
                  <h3>Ahmad Shah</h3>
                </div>
                <span>LVL 42</span>
              </div>
            </article>

            <article className="play-avatar-stats-card">
              <div className="play-section-head">
                <h3>Avatar Hub</h3>
                <span>Identity</span>
              </div>

              <div className="play-stat-cards">
                <div className="play-stat-card">
                  <p>Club Affiliation</p>
                  <b>Kabul Lions</b>
                </div>
                <div className="play-stat-card">
                  <p>Skill Tokens</p>
                  <b>850</b>
                </div>
                <div className="play-stat-card">
                  <p>Streak</p>
                  <b>12 Days</b>
                </div>
              </div>

              <div className="play-power-wrap">
                <div className="play-power-head">
                  <span>Power Evolution</span>
                  <span>85% to next level</span>
                </div>
                <div className="play-power-track">
                  <div className="play-power-fill" />
                </div>
              </div>

              <div className="play-avatar-actions">
                <button type="button" className="play-action-primary">
                  Upgrade with Data Pack
                </button>
                <button type="button" className="play-action-outline">
                  Customize Gear
                </button>
              </div>
            </article>
          </div>
        </section>

        <section className="play-live-zone">
          <div className="play-live-zone-head">
            <h2>Play Live Cricket</h2>
            <p>Real game running from your hosted cricket build.</p>
          </div>

          <div className="play-live-card">
            <div className="play-card-head">
              <h3>Cricket Match Simulator</h3>
            </div>

            <div className="play-media-frame">
              {isLoading && (
                <div className="play-loader">
                  <div className="play-loader-spinner" />
                  <p>Loading cricket game...</p>
                </div>
              )}
              <iframe
                className="play-media-frame-embed"
                src={AFG_CRICKET_GAME_URL}
                allow={AFG_CRICKET_IFRAME_ALLOW}
                allowFullScreen
                title="Afghan cricket game"
                onLoad={() => setIsLoading(false)}
              />
            </div>
            <p className="play-note">If the game does not load in-app, use "Open Fullscreen".</p>
          </div>
        </section>

        <section className="play-feature-zone">
          <div className="play-section-head">
            <h3>Fantasy Arena</h3>
            <span>Manage Squad & Multipliers</span>
          </div>

          <div className="play-fantasy-grid">
            <article className="play-fantasy-main-card">
              <div className="play-fantasy-head">
                <h4>Active Squad: Elite XI</h4>
                <span>2.5x Multiplier Active</span>
              </div>

              <div className="play-pitch">
                <div className="play-player-dot is-live">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCiUyqBsGTjK0nOj1y69oSS1adFFYtAqjLFOsTmd0Hg_tR5O1JVta5q7F4KW0_D7P03Qtr1es7s7U5ssPVLH0_mD-hmnq0I--eao0kWCcGrhA5JBhfZrUhXgnpmnpFJyjZXwM79tOvwk9_22_qqF6X9fa4VouvEwi4h3ty1q7pUm13T-n_XZBleOwU5dOYxi25o8HdSrVBbpmp1inUsBpN_HZQe9LeI2zYdTx-chSnzZa8WijmxVPZZSBYTOoRoJFXUOAPV6VnsCiKs"
                    alt="Captain"
                  />
                </div>
                <div className="play-player-dot is-empty">+</div>
                <div className="play-player-dot is-live">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAAE6_BbV0duTpSCQvD-NHqaQCpQ1SjS_dpX652qori7vMxaI4XtycsAXLnpddz-Eeb1BHkoUAKDxCIr9UCpL8eimGZlqkU5VlOEAUzt1HAC2rx5N_tqPurmyTvANvKeNHoUL3cSLHlFZhLTPjAiom_F7c8vy2_uFh5uXV6aVGPbTOyW_zs8zVQR4A9uJhVev0kfDjdKPccT9nH91OQ6Q4VGO4Jb3jBfyZ5lW4FA6PbGvsfixs0P1c1-_SDAJpgu88gqnchdcE3wFtN"
                    alt="Player"
                  />
                </div>
              </div>

              <div className="play-fantasy-foot">
                <div>
                  <p>Live PTS</p>
                  <b>480</b>
                </div>
                <div>
                  <p>Global Rank</p>
                  <b>#1,242</b>
                </div>
                <button type="button">Edit Squad</button>
              </div>
            </article>

            <article className="play-fantasy-side-card">
              <h4>Streak Booster</h4>
              <p>Win 3 more predictions today to unlock Gold Crystal XP multiplier.</p>
              <div className="play-streak-progress">
                <span>Progress</span>
                <span>2/5 wins</span>
              </div>
              <div className="play-streak-bars">
                <i className="is-on" />
                <i className="is-on" />
                <i />
                <i />
                <i />
              </div>
            </article>
          </div>
        </section>

        <section className="play-prediction-zone">
          <div className="play-section-head">
            <h3>Prediction Arena</h3>
            <span>Stake Skill Tokens</span>
          </div>
          <div className="play-prediction-rail">
            {predictionCards.map((card) => (
              <article key={card.tag} className={`play-prediction-card is-${card.variant}`}>
                <div className="play-prediction-head">
                  <span>{card.tag}</span>
                  <b>{card.odds}</b>
                </div>
                <h4>{card.heading}</h4>
                <p>{card.detail}</p>
                <div className="play-prediction-actions">
                  <button type="button">{card.actions[0]}</button>
                  <button type="button">{card.actions[1]}</button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="play-arena">
          <div className="play-section-head">
            <h3>More Games</h3>
            <span>Coming Soon</span>
          </div>
          <div className="play-arena-rail">
            {arenaCards.map((card) => (
              <article key={card.title} className={`play-arena-card ${card.available ? 'is-live' : 'is-coming'}`}>
                <img src={card.image} alt={card.title} loading="lazy" />
                <div className="play-arena-card-overlay" />
                <div className={`play-badge ${card.available ? 'is-live' : 'is-coming'}`}>{card.cta}</div>
                <h4>{card.title}</h4>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default GamePlayPage;
