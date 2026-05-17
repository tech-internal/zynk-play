import React from 'react';
import './StreamingPage.css';
import { LIVE_STREAM_HLS_URL, getWindowHls } from '../config/afgCricket';
import PremiumAccessWall from '../components/PremiumAccessWall';
import { useEntitlements } from '../context/EntitlementsContext';

const StreamingPage: React.FC = () => {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const { canWatchPlayEarn, loading: entLoading } = useEntitlements();

  React.useEffect(() => {
    document.title = 'Game Plazio | IPL 2026 Live Stream';
  }, []);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const Hls = getWindowHls();
    let hlsInstance: { loadSource: (url: string) => void; attachMedia: (media: HTMLVideoElement) => void; destroy: () => void } | null = null;

    if (Hls?.isSupported()) {
      hlsInstance = new Hls();
      hlsInstance.loadSource(LIVE_STREAM_HLS_URL);
      hlsInstance.attachMedia(video);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = LIVE_STREAM_HLS_URL;
    }

    return () => {
      if (hlsInstance) hlsInstance.destroy();
    };
  }, []);

  return (
    <div className="watch-page">
      {!entLoading && !canWatchPlayEarn ? (
        <PremiumAccessWall />
      ) : (
        <main className="watch-main">
          <section className="watch-broadcast-header">
            <div>
              <div className="watch-live-meta">
                <span className="watch-live-pill">
                  <span className="dot" />
                  LIVE
                </span>
                <span className="watch-tournament">IPL 2026 - Live Broadcast</span>
              </div>
              <h1>IPL 2026</h1>
            </div>
            <div className="watch-xp-block">
              <div className="watch-xp-rate">
                <span className="material-symbols-outlined filled">bolt</span>
                <span>
                  45 XP <small>/min</small>
                </span>
              </div>
              <div className="watch-energy-bar">
                <span />
                <span />
                <span />
                <span />
                <span className="dim" />
              </div>
            </div>
          </section>

          <section className="watch-grid">
            <div className="watch-left-col">
              <div className="watch-player glass-panel">
                <video
                  ref={videoRef}
                  controls
                  autoPlay
                  playsInline
                  muted
                  className="watch-video"
                  aria-label="IPL 2026 live stream player"
                />

                <div className="watch-signal">
                  <div className="halo-wrap">
                    <div className="halo-ping" />
                    <span className="material-symbols-outlined">rss_feed</span>
                  </div>
                  <div>
                    <div>AWCC 5G</div>
                    <div>ULTRA-HD</div>
                  </div>
                </div>
              </div>

              <div className="watch-interactions">
                <div className="glass-panel watch-engagement">
                  <h3>Live Engagement</h3>
                  <div className="reaction-grid">
                    <button type="button">
                      <span>🔥</span>
                      <small>12.4K</small>
                    </button>
                    <button type="button">
                      <span>🙌</span>
                      <small>8.1K</small>
                    </button>
                    <button type="button">
                      <span>⚽</span>
                      <small>24K</small>
                    </button>
                    <button type="button">
                      <span>👏</span>
                      <small>5.2K</small>
                    </button>
                  </div>
                  <div className="xp-progress">
                    <div className="xp-progress-head">
                      <span>XP PROGRESSION</span>
                      <b>850 / 1000 XP</b>
                    </div>
                    <div className="xp-progress-track">
                      <div className="xp-progress-fill" />
                    </div>
                  </div>
                </div>

                <div className="glass-panel watch-poll">
                  <span className="material-symbols-outlined poll-icon">query_stats</span>
                  <h3>Match Prediction</h3>
                  <p>Who scores the next goal?</p>
                  <div className="poll-options">
                    <button type="button">
                      <span>Faisal Shayesteh</span>
                      <small>+250 XP</small>
                    </button>
                    <button type="button">
                      <span>Farshad Noor</span>
                      <small>+300 XP</small>
                    </button>
                    <button type="button">
                      <span>No Goals</span>
                      <small>+150 XP</small>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <aside className="watch-right-col">
              <div className="glass-panel watch-stats">
                <h3>MATCH STATS</h3>
                <div className="score-row">
                  <div>
                    <b>182</b>
                    <small>TEAM A</small>
                  </div>
                  <span>VS</span>
                  <div>
                    <b>175</b>
                    <small>TEAM B</small>
                  </div>
                </div>

                <div className="stat-block">
                  <div className="stat-head">
                    <span>POSSESSION</span>
                    <b>48% / 52%</b>
                  </div>
                  <div className="stat-track">
                    <div className="a" />
                    <div className="b" />
                  </div>
                </div>

                <div className="stat-block">
                  <div className="stat-head">
                    <span>SHOTS ON TARGET</span>
                    <b>6 / 4</b>
                  </div>
                  <div className="stat-track">
                    <div className="a strong" />
                    <div className="b weak" />
                  </div>
                </div>

                <div className="heatmap-wrap">
                  <div className="heatmap-head">
                    <span>HEATMAP</span>
                    <span className="material-symbols-outlined">open_in_full</span>
                  </div>
                  <div className="heatmap-card">
                    <img
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCMActQXpX1JfLC-M4dU0FVFSCJ-W1T3omK4x9UhuR0FtAS8p0syZVTCJhXpYCtI8YY1GBR_NVWqvbSxabhPkk5FOcOmBXKqAxXoNY-7ARkvxYq6KKTX8cmqscl1x2PB_iL-5oFKn6U_RJwO9KhczM3r8rlaezAJWABiqXlyydjlo3LA0egdRdI1VoCVXKjkYYmpS33oHKoSAEyFXe-0DZ2NZatKcdGOpTKdqFUOfV8Cwk55f2FdQm41ThnCb116QmuVuiEFYvWttSO"
                      alt="Match heat map"
                    />
                  </div>
                </div>
              </div>
            </aside>
          </section>
        </main>
      )}
    </div>
  );
};

export default StreamingPage;
