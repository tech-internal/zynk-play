import React, { useMemo, useState } from 'react';
import './StreamingPage.css';
import ScreenHeader from '../components/ScreenHeader';
import { LIVE_STREAM_HLS_URL, getWindowHls } from '../config/afgCricket';
import LiveMatchCard from '../components/LiveMatchCard';
import PremiumAccessWall from '../components/PremiumAccessWall';
import { useEntitlements } from '../context/EntitlementsContext';
import { useSportsMatches } from '../hooks/useSportsMatches';
import { useI18n } from '../i18n';

const StreamingPage: React.FC = () => {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const videoWrapRef = React.useRef<HTMLDivElement | null>(null);
  const { t } = useI18n();
  const { canWatchPlayEarn, loading: entLoading } = useEntitlements();
  const { live, loading: sportsLoading } = useSportsMatches();
  const [liveIndex, setLiveIndex] = useState(0);
  const [muted, setMuted] = React.useState(true);

  const activeLive = useMemo(() => {
    if (live.length === 0) return null;
    return live[Math.min(liveIndex, live.length - 1)];
  }, [live, liveIndex]);

  React.useEffect(() => {
    document.title = 'Game Plazio | IPL 2026 Live Stream';
  }, []);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const Hls = getWindowHls();
    let hlsInstance: {
      loadSource: (url: string) => void;
      attachMedia: (media: HTMLVideoElement) => void;
      destroy: () => void;
    } | null = null;

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

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  };

  const toggleFullscreen = async () => {
    const wrap = videoWrapRef.current;
    if (!wrap) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await wrap.requestFullscreen();
      }
    } catch {
      /* fullscreen not supported or denied */
    }
  };

  return (
    <div className="watch-page">
      <main className="watch-mobile">
        <ScreenHeader title={t('watch.liveMatch')} />
        {!entLoading && !canWatchPlayEarn ? (
          <PremiumAccessWall />
        ) : (
          <>

          <div className="watch-video-area" ref={videoWrapRef}>
            <video
              ref={videoRef}
              className="watch-video-el"
              playsInline
              muted={muted}
              autoPlay
              aria-label="IPL 2026 live stream player"
            />
            <div className="watch-video-controls">
              <button
                type="button"
                className="watch-video-ctrl-btn"
                onClick={toggleMute}
                aria-label={muted ? t('watch.unmute') : t('watch.mute')}
              >
                <span className="material-symbols-outlined" aria-hidden>
                  {muted ? 'volume_off' : 'volume_up'}
                </span>
              </button>
              <button
                type="button"
                className="watch-video-ctrl-btn"
                onClick={() => void toggleFullscreen()}
                aria-label={t('watch.fullscreen')}
              >
                <span className="material-symbols-outlined" aria-hidden>
                  fullscreen
                </span>
              </button>
            </div>
          </div>

          {sportsLoading && live.length === 0 ? (
            <p className="watch-match-status" role="status">
              {t('dash.syncing')}
            </p>
          ) : null}

          {activeLive ? (
            <LiveMatchCard
              match={activeLive}
              activeIndex={liveIndex}
              matchCount={live.length}
              onSelect={live.length > 1 ? setLiveIndex : undefined}
            />
          ) : !sportsLoading ? (
            <p className="watch-match-status">{t('dash.noLive')}</p>
          ) : null}

          <div className="watch-xp-ticker">
            <span>⚡ {t('watch.earningXp')}</span>
            <span className="watch-xp-gain">+3 XP</span>
          </div>

          <div className="watch-progress-block">
            <div className="watch-progress-row">
              <span className="watch-progress-l">{t('watch.todaysXp')}</span>
              <span className="watch-progress-v">7 / 10 XP</span>
            </div>
            <div className="watch-bar">
              <i style={{ width: '70%' }} />
            </div>
            <div className="watch-progress-foot">{t('watch.dailyCapHint')}</div>
          </div>

          <div className="watch-actions-row">
            <button type="button" className="watch-btn-cyan">
              {t('watch.answerQuiz')}
            </button>
            <button type="button" className="watch-btn-ghost">
              {t('watch.stats')}
            </button>
          </div>
          </>
        )}
      </main>
    </div>
  );
};

export default StreamingPage;
