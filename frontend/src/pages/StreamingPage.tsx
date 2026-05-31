import React from 'react';
import './StreamingPage.css';
import ScreenHeader from '../components/ScreenHeader';
import ReelsFeed from '../components/ReelsFeed';
import { LIVE_STREAM_HLS_URL, getWindowHls } from '../config/afgCricket';
import { fetchReels, ReelItem } from '../config/reels';
import PremiumAccessWall from '../components/PremiumAccessWall';
import { useEntitlements } from '../context/EntitlementsContext';
import { useI18n } from '../i18n';
import { useWatchXp } from '../context/WatchXpContext';

function formatCountdown(totalSeconds: number): string {
  const clamped = Math.max(0, totalSeconds);
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

const StreamingPage: React.FC = () => {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const videoWrapRef = React.useRef<HTMLDivElement | null>(null);
  const pageRef = React.useRef<HTMLDivElement | null>(null);
  const { t } = useI18n();
  const { canWatchPlayEarn, loading: entLoading } = useEntitlements();
  const { todayWatchXp, perAwardXp, countdownSeconds, startSession } = useWatchXp();
  const [muted, setMuted] = React.useState(true);
  const [reelsMode, setReelsMode] = React.useState(false);
  const [reels, setReels] = React.useState<ReelItem[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    fetchReels()
      .then((items) => {
        if (!cancelled) setReels(items);
      })
      .catch(() => {
        if (!cancelled) setReels([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  const streamBlockRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    document.title = 'Game Plazio | IPL 2026 Live Stream';
  }, []);

  React.useEffect(() => {
    if (!canWatchPlayEarn) return;
    startSession();
  }, [canWatchPlayEarn, startSession]);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlay = () => {
      if (canWatchPlayEarn) {
        startSession();
      }
    };
    video.addEventListener('play', onPlay);
    return () => {
      video.removeEventListener('play', onPlay);
    };
  }, [canWatchPlayEarn, startSession]);

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

  React.useEffect(() => {
    const block = streamBlockRef.current;
    if (!block) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setReelsMode(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0.12 },
    );
    observer.observe(block);
    return () => observer.disconnect();
  }, [canWatchPlayEarn]);

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
    <div
      ref={pageRef}
      className={`watch-page${reelsMode ? ' watch-page--reels-mode' : ''}`}
    >
      <main className="watch-mobile">
        <ScreenHeader title={t('watch.liveMatch')} />
        {!entLoading && !canWatchPlayEarn ? (
          <PremiumAccessWall />
        ) : (
          <>
          <div className="watch-stream-block" ref={streamBlockRef}>
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

          <div className="watch-xp-ticker">
            <span>⚡ {t('watch.earningXp')}</span>
            <span className="watch-xp-gain">
              +{perAwardXp} XP / {formatCountdown(countdownSeconds)}
            </span>
          </div>

          <div className="watch-progress-block">
            <div className="watch-progress-row">
              <span className="watch-progress-l">{t('watch.todaysXp')}</span>
              <span className="watch-progress-v">{todayWatchXp} XP</span>
            </div>
          </div>
          </div>

          {reels.length > 0 ? (
            <>
              <h2 className="watch-reels-heading">{t('watch.reels')}</h2>
              <ReelsFeed reels={reels} scrollRootRef={pageRef} />
            </>
          ) : null}
          </>
        )}
      </main>
    </div>
  );
};

export default StreamingPage;
