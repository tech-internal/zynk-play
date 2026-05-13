import React from 'react';
import './GamePlayPage.css';
import {
  AFG_CRICKET_GAME_URL,
  AFG_CRICKET_IFRAME_ALLOW,
  AFG_CRICKET_STANDALONE_URL,
} from '../config/afgCricket';
import PremiumAccessWall from '../components/PremiumAccessWall';
import { useEntitlements } from '../context/EntitlementsContext';

type ArenaGame = {
  title: string;
  image: string;
  available: boolean;
  cta: string;
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

const FLAG_AFG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBJSoGQIOo0g1DxU5cSFcDydgjkj-QUggNm33PNVs7krvlebaSyUKB_ZGxZbZyzytng6nlND7_fng3w1Y6ejCpcjkLBSrsRYUnOTHql0DwUwFQtkMcccVW7wSNAuyxrJI6se-46wcyE4ZWVd9DR8ZTfnaTCiuJ2zhdPh9yP4jKxazwRE34xG6vs3hX67g-pzGDgj-OcnxbVHfUOK3K0GgpIn-rn0hum8yJ1a17L0w2520VcLUWB_3wA3Q3HcnL8eMWTmc-WSYl1oQDt';

const FLAG_IND =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAKM_xuL8Ov7wN-8MfWMeJn4E_KvAjKgqYzsuL_a0TQyjFg_4RmIzqyqvF1zlXBwUMvKSwG3mxZ7J1R2XUtq7H0RQzEKcoPlv0hyvyESrlnQCbcQzRxTTMTsrbSwyNA5IujDnxnd2UP3ZEM0Dc3kxNmr8L9w7T5QRat-lRZDF0NfoSE2AqHrzISI63TnBslrhvDcvPi3X113vRWYnf7C2qayZDdEeXLrypaX170VPeDyZwguGbn9b08xKtfIpCx4AtjdW2l7v-DDAqp';

const SCORER_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBDizjYthojZOewTlgsAlcCvVrxeie-zKw6YtAMVDZRPS7rDyzgn5evWJzu3FE7JurGTqdchTBpyaBmvqXMM3jFMNtF1Qu3urCiKFHCdn44pquTLl1puGgHqhIxbxMLNLe9C3DsOcqpc_Bx-PLnzuyvIXXMtVOFTMvNoV6nzSYjRSOApcq7mIlIxCLN-LCJBgSP8l9HwtC5C3fvtocmZftCYQ6COmscizUKw63p4oy25wT1xH02coxhJCR9HFTIroyX5Z2KSV6NsDHh';

const AVATAR_HERO =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDPxzjAw_z5CVMlhv9Vz7R85FSvhDoCCvsojoMpUgkGh6veyIS5pdAnHL1QWcd-UNRtPCy1oOhNXd_8hw6D4zlh1K1I0wC5qjNUH6ByNmoHkyNfWGW24CTCkAYpv8BGHCfEljKhqcbkZRWMMSO-BhUayGG0kQrTKg_EY06M2oMprsBshE2yCgXQ9PVGliJjX9c7-kLkNXjMdez396sazos6IRKSXPH_jo_b3qu2OYcf635lNgll39YVFJqqICbCwxuJUhiGzMUeUphL';

function getFullscreenElement(): Element | null {
  const doc = document as Document & { webkitFullscreenElement?: Element | null };
  return document.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

async function requestGameFullscreen(el: HTMLElement): Promise<void> {
  const extended = el as HTMLElement & {
    webkitRequestFullscreen?: () => void;
    msRequestFullscreen?: () => void;
  };
  if (typeof el.requestFullscreen === 'function') {
    await el.requestFullscreen();
    return;
  }
  if (typeof extended.webkitRequestFullscreen === 'function') {
    extended.webkitRequestFullscreen();
    return;
  }
  if (typeof extended.msRequestFullscreen === 'function') {
    extended.msRequestFullscreen();
  }
}

async function exitGameFullscreen(): Promise<void> {
  const doc = document as Document & {
    webkitExitFullscreen?: () => void;
    msExitFullscreen?: () => void;
  };
  if (document.fullscreenElement && typeof document.exitFullscreen === 'function') {
    await document.exitFullscreen();
    return;
  }
  if (typeof doc.webkitExitFullscreen === 'function') {
    doc.webkitExitFullscreen();
    return;
  }
  if (typeof doc.msExitFullscreen === 'function') {
    doc.msExitFullscreen();
  }
}

const GamePlayPage: React.FC = () => {
  const { canWatchPlayEarn, loading: entLoading, profile } = useEntitlements();

  const playerName = React.useMemo(() => {
    if (!profile) return '';
    const name = (profile.full_name ?? '').trim();
    if (name) return name;
    const handle = (profile.username ?? '').trim();
    if (handle) return handle;
    return profile.phone_number;
  }, [profile]);

  React.useEffect(() => {
    document.title = 'Game Plazio | Play Cricket';
  }, []);

  const [gameOpen, setGameOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const hostRef = React.useRef<HTMLDivElement>(null);
  const hadEnteredFsRef = React.useRef(false);

  React.useEffect(() => {
    if (gameOpen) {
      document.body.style.overflow = 'hidden';
      setIsLoading(true);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [gameOpen]);

  React.useLayoutEffect(() => {
    if (!gameOpen || !hostRef.current) return;
    hadEnteredFsRef.current = false;
    const el = hostRef.current;
    void requestGameFullscreen(el)
      .then(() => {
        hadEnteredFsRef.current = true;
      })
      .catch(() => {
        /* fixed overlay fallback — still playable */
      });
  }, [gameOpen]);

  React.useEffect(() => {
    const onFs = () => {
      if (!getFullscreenElement() && hadEnteredFsRef.current) {
        hadEnteredFsRef.current = false;
        setGameOpen(false);
      }
    };
    document.addEventListener('fullscreenchange', onFs);
    document.addEventListener('webkitfullscreenchange', onFs);
    return () => {
      document.removeEventListener('fullscreenchange', onFs);
      document.removeEventListener('webkitfullscreenchange', onFs);
    };
  }, []);

  const closeGame = React.useCallback(async () => {
    try {
      await exitGameFullscreen();
    } catch {
      /* ignore */
    }
    hadEnteredFsRef.current = false;
    setGameOpen(false);
  }, []);

  React.useEffect(() => {
    if (!gameOpen) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') void closeGame();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gameOpen, closeGame]);

  return (
    <div className="play-page play-theme">
      {!entLoading && !canWatchPlayEarn ? (
        <PremiumAccessWall />
      ) : (
        <>
        <main className="play-main">
        <section className="play-section play-avatar-zone" aria-labelledby="play-hud-heading">
          <div className="play-inner">
            <div className="play-avatar-grid">
              <div className="play-avatar-visual play-hud-card play-holo">
                <div className="play-avatar-bloom" aria-hidden />
                <img src={AVATAR_HERO} alt="Elite player avatar" loading="eager" className="play-avatar-img" />
                <div className="play-avatar-scrim" />
                <div className="play-avatar-footer">
                  <div>
                    <p className="play-elite-tag">Pro-Elite rank</p>
                    <h1 id="play-hud-heading" className="play-avatar-name">
                      {playerName || '—'}
                    </h1>
                  </div>
                  <div className="play-avatar-lvl">
                    <span className="play-lvl-num">42</span>
                    <span className="play-lvl-label">LVL</span>
                  </div>
                </div>
              </div>

              <div className="play-hud-panel">
                <div className="play-hud-panel-head">
                  <h2 className="play-title-lg">Elite HUD terminal</h2>
                  <div className="play-accent-bar" />
                </div>

                <div className="play-stat-grid">
                  <div className="play-stat-tile play-hud-card border-l-primary">
                    <p className="play-stat-label">Club affiliation</p>
                    <p className="play-stat-value play-c-primary">Kabul Lions</p>
                  </div>
                  <div className="play-stat-tile play-hud-card border-l-tertiary">
                    <p className="play-stat-label">Skill tokens</p>
                    <p className="play-stat-value play-c-tertiary play-stat-inline">
                      850
                      <span className="material-symbols-outlined play-ms-xs">diamond</span>
                    </p>
                  </div>
                  <div className="play-stat-tile play-hud-card border-l-secondary play-stat-span">
                    <p className="play-stat-label">Streak</p>
                    <p className="play-stat-value play-c-orange play-stat-inline">
                      12 days
                      <span className="material-symbols-outlined play-ms-xs">local_fire_department</span>
                    </p>
                  </div>
                </div>

                <div className="play-evo">
                  <div className="play-evo-head">
                    <span className="play-stat-label play-evo-title">Evolution progress</span>
                    <span className="play-evo-pct">85% to Elite II</span>
                  </div>
                  <div className="play-evo-track">
                    <div className="play-evo-fill" style={{ width: '85%' }} />
                  </div>
                </div>

                <div className="play-hud-actions">
                  <button type="button" className="play-btn-primary">
                    <span className="material-symbols-outlined">bolt</span>
                    Update data pack
                  </button>
                  <button type="button" className="play-btn-outline-gold">
                    Customize elite gear
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="play-section play-match-zone" aria-labelledby="play-match-heading">
          <div className="play-inner">
            <div className="play-zone-head">
              <div>
                <h2 id="play-match-heading" className="play-title-lg">
                  Cricket match simulator
                </h2>
                <p className="play-subtitle">
                  Launch the AWS-hosted WebGL build in fullscreen. Opens only after you tap play.
                </p>
              </div>
              <div className="play-zone-actions">
                <a
                  className="play-btn-ghost"
                  href={AFG_CRICKET_STANDALONE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="material-symbols-outlined play-ms-sm">open_in_new</span>
                  Open in new tab
                </a>
              </div>
            </div>

            <button type="button" className="play-game-placeholder play-hud-card play-holo" onClick={() => setGameOpen(true)}>
              <img className="play-game-placeholder-bg" src={arenaCards[0].image} alt="" />
              <div className="play-game-placeholder-scrim" />
              <div className="play-game-placeholder-body">
                <span className="material-symbols-outlined play-game-placeholder-icon">sports_esports</span>
                <p className="play-game-placeholder-kicker">Unity WebGL · S3</p>
                <h3 className="play-game-placeholder-title">Enter full-screen arena</h3>
                <p className="play-game-placeholder-hint">Tap to load the match simulator</p>
              </div>
            </button>
            <p className="play-note">Use Esc or the close control to exit fullscreen and return here.</p>
          </div>
        </section>

        <section className="play-section play-fantasy-zone" aria-labelledby="play-fantasy-heading">
          <div className="play-inner">
            <div className="play-section-row">
              <div>
                <h2 id="play-fantasy-heading" className="play-title-lg">
                  Fantasy arena
                </h2>
                <p className="play-kicker">Elite squad management</p>
              </div>
              <button type="button" className="play-link-chevron">
                View all matches
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>

            <div className="play-fantasy-bento">
              <article className="play-fantasy-main play-hud-card play-holo">
                <div className="play-fantasy-main-head">
                  <h3 className="play-fantasy-badge">
                    <span className="play-pulse-dot" aria-hidden />
                    Active squad: Elite XI
                  </h3>
                  <span className="play-chip-tertiary">2.5x Elite multiplier</span>
                </div>

                <div className="play-pitch-v2">
                  <div className="play-pitch-grid" aria-hidden />
                  <div className="play-pitch-roster">
                    <div className="play-roster-slot">
                      <div className="play-roster-avatar ring-primary">
                        <img
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCiUyqBsGTjK0nOj1y69oSS1adFFYtAqjLFOsTmd0Hg_tR5O1JVta5q7F4KW0_D7P03Qtr1es7s7U5ssPVLH0_mD-hmnq0I--eao0kWCcGrhA5JBhfZrUhXgnpmnpFJyjZXwM79tOvwk9_22_qqF6X9fa4VouvEwi4h3ty1q7pUm13T-n_XZBleOwU5dOYxi25o8HdSrVBbpmp1inUsBpN_HZQe9LeI2zYdTx-chSnzZa8WijmxVPZZSBYTOoRoJFXUOAPV6VnsCiKs"
                          alt="Captain Khan"
                        />
                      </div>
                      <span className="play-roster-name">
                        Khan <span className="play-c-tertiary">(C)</span>
                      </span>
                    </div>
                    <div className="play-roster-slot">
                      <div className="play-roster-empty">
                        <span className="material-symbols-outlined">person_add</span>
                      </div>
                      <span className="play-roster-name muted">Available</span>
                    </div>
                    <div className="play-roster-slot">
                      <div className="play-roster-avatar ring-primary">
                        <img
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAAE6_BbV0duTpSCQvD-NHqaQCpQ1SjS_dpX652qori7vMxaI4XtycsAXLnpddz-Eeb1BHkoUAKDxCIr9UCpL8eimGZlqkU5VlOEAUzt1HAC2rx5N_tqPurmyTvANvKeNHoUL3cSLHlFZhLTPjAiom_F7c8vy2_uFh5uXV6aVGPbTOyW_zs8zVQR4A9uJhVev0kfDjdKPccT9nH91OQ6Q4VGO4Jb3jBfyZ5lW4FA6PbGvsfixs0P1c1-_SDAJpgu88gqnchdcE3wFtN"
                          alt="Zadran"
                        />
                      </div>
                      <span className="play-roster-name">Zadran</span>
                    </div>
                  </div>
                </div>

                <div className="play-fantasy-foot-v2">
                  <div className="play-fantasy-stats">
                    <div>
                      <p className="play-big-stat play-c-primary">480</p>
                      <p className="play-micro-label">Live score</p>
                    </div>
                    <div className="play-fantasy-divider" />
                    <div>
                      <p className="play-big-stat play-c-tertiary">#1,242</p>
                      <p className="play-micro-label">Global Elite</p>
                    </div>
                  </div>
                  <button type="button" className="play-btn-tactical">
                    Tactical edit
                  </button>
                </div>
              </article>

              <article className="play-fantasy-side play-hud-card play-gradient-side">
                <span className="material-symbols-outlined play-side-icon play-ms-fill">workspace_premium</span>
                <h3 className="play-side-title">Streak booster</h3>
                <p className="play-side-copy">
                  Secure 3 more victories to synthesize the <strong className="play-c-tertiary">Gold Crystal</strong>{' '}
                  XP multiplier.
                </p>
                <div className="play-side-progress">
                  <div className="play-side-progress-head">
                    <span className="play-stat-label">Synthesis progress</span>
                    <span className="play-c-tertiary play-hud-data">2/5 wins</span>
                  </div>
                  <div className="play-side-bars">
                    <span className="on" />
                    <span className="on" />
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="play-section play-prediction-zone" aria-labelledby="play-pred-heading">
          <div className="play-inner">
            <header className="play-pred-arena-header">
              <div>
                <h2 id="play-pred-heading" className="play-title-lg">
                  Prediction arena
                </h2>
                <p className="play-kicker">Stake skill tokens &amp; amplify power</p>
              </div>
              <div className="play-pred-arena-meta">
                <span className="play-pred-live-chip">
                  <span className="play-pred-live-dot" aria-hidden />
                  Live lines
                </span>
              </div>
            </header>

            <div className="play-prediction-board">
              <article className="play-pred-card play-pred-card--match play-hud-card">
                <div className="play-pred-card-glow play-pred-card-glow--primary" aria-hidden />
                <div className="play-pred-card-inner">
                  <header className="play-pred-card-head">
                    <span className="play-pred-chip play-pred-chip--primary">Match winner</span>
                    <div className="play-pred-odds-pill">
                      <span className="material-symbols-outlined play-ms-fill">database</span>
                      <span className="play-pred-odds-val">2.4×</span>
                    </div>
                  </header>

                  <div className="play-pred-match-v2">
                    <div className="play-pred-team-v2">
                      <div className="play-flag-hex">
                        <img src={FLAG_AFG} alt="" />
                      </div>
                      <p className="play-pred-team-label">Afghanistan</p>
                      <span className="play-pred-team-sub">Home</span>
                    </div>
                    <div className="play-pred-vs-pill" aria-hidden>
                      VS
                    </div>
                    <div className="play-pred-team-v2">
                      <div className="play-flag-hex">
                        <img src={FLAG_IND} alt="" />
                      </div>
                      <p className="play-pred-team-label">India</p>
                      <span className="play-pred-team-sub">Away</span>
                    </div>
                  </div>

                  <footer className="play-pred-card-foot">
                    <button type="button" className="play-pred-btn play-pred-btn--fill">
                      Stake home
                    </button>
                    <button type="button" className="play-pred-btn play-pred-btn--fill">
                      Stake away
                    </button>
                  </footer>
                </div>
              </article>

              <article className="play-pred-card play-pred-card--poll play-hud-card">
                <div className="play-pred-card-glow play-pred-card-glow--gold" aria-hidden />
                <div className="play-pred-card-inner">
                  <header className="play-pred-card-head">
                    <span className="play-pred-chip play-pred-chip--gold">Possession %</span>
                    <div className="play-pred-odds-pill play-pred-odds-pill--gold">
                      <span className="material-symbols-outlined play-ms-fill">database</span>
                      <span className="play-pred-odds-val">4.8×</span>
                    </div>
                  </header>

                  <div className="play-pred-poll-v2">
                    <p className="play-pred-poll-title">Will AFG hold over 55% possession?</p>
                    <div className="play-pred-meter">
                      <div className="play-pred-meter-track">
                        <div className="play-pred-meter-yes" style={{ width: '65%' }} />
                      </div>
                      <div className="play-pred-meter-labels">
                        <span>
                          <strong className="play-c-orange">Yes</strong> 65%
                        </span>
                        <span>
                          <strong>No</strong> 35%
                        </span>
                      </div>
                    </div>
                  </div>

                  <footer className="play-pred-card-foot">
                    <button type="button" className="play-pred-btn play-pred-btn--ghost">
                      Vote yes
                    </button>
                    <button type="button" className="play-pred-btn play-pred-btn--ghost">
                      Vote no
                    </button>
                  </footer>
                </div>
              </article>

              <article className="play-pred-card play-pred-card--scorer play-hud-card">
                <div className="play-pred-card-glow play-pred-card-glow--danger" aria-hidden />
                <div className="play-pred-card-inner">
                  <header className="play-pred-card-head">
                    <span className="play-pred-chip play-pred-chip--danger">First goalscorer</span>
                    <div className="play-pred-odds-pill play-pred-odds-pill--danger">
                      <span className="material-symbols-outlined play-ms-fill">database</span>
                      <span className="play-pred-odds-val">12.0×</span>
                    </div>
                  </header>

                  <div className="play-pred-scorer-v2">
                    <button type="button" className="play-pred-scorer-pick">
                      <div className="play-pred-scorer-avatar">
                        <img src={SCORER_IMG} alt="" />
                      </div>
                      <div className="play-pred-scorer-text">
                        <p className="play-pred-scorer-name">F. Ahmadi</p>
                        <p className="play-pred-scorer-role">Striker · In form</p>
                      </div>
                      <span className="material-symbols-outlined play-pred-scorer-chev">keyboard_arrow_down</span>
                    </button>
                    <p className="play-pred-scorer-hint">Calibrating strike data…</p>
                  </div>

                  <footer className="play-pred-card-foot play-pred-card-foot--single">
                    <button type="button" className="play-pred-btn play-pred-btn--stake">
                      Stake 50 tokens
                    </button>
                  </footer>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="play-section play-arena-zone" aria-labelledby="play-more-heading">
          <div className="play-inner">
            <div className="play-section-row">
              <div>
                <h2 id="play-more-heading" className="play-title-lg">
                  More games
                </h2>
                <p className="play-kicker">Arena roster</p>
              </div>
            </div>
            <div className="play-arena-rail">
              {arenaCards.map((card) => (
                <article key={card.title} className={`play-arena-card ${card.available ? 'is-live' : 'is-coming'}`}>
                  <img src={card.image} alt="" loading="lazy" />
                  <div className="play-arena-card-overlay" />
                  <div className={`play-badge ${card.available ? 'is-live' : 'is-coming'}`}>{card.cta}</div>
                  <h4>{card.title}</h4>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      {gameOpen && (
        <div ref={hostRef} className="play-fs-host" role="dialog" aria-modal="true" aria-label="Cricket game fullscreen">
          <div className="play-fs-toolbar">
            <p className="play-fs-title">Cricket match simulator</p>
            <button type="button" className="play-fs-close" onClick={() => void closeGame()}>
              <span className="material-symbols-outlined">close</span>
              Exit
            </button>
          </div>
          <div className="play-fs-frame">
            {isLoading && (
              <div className="play-loader" role="status">
                <div className="play-loader-spinner" />
                <p>Loading game…</p>
              </div>
            )}
            <iframe
              className="play-fs-iframe"
              src={AFG_CRICKET_GAME_URL}
              allow={AFG_CRICKET_IFRAME_ALLOW}
              allowFullScreen
              title="Afghan cricket game"
              onLoad={() => setIsLoading(false)}
            />
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default GamePlayPage;
