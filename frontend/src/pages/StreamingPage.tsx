import React, { useMemo, useState } from 'react';
import './StreamingPage.css';
import ScreenHeader from '../components/ScreenHeader';
import { LIVE_STREAM_HLS_URL, getWindowHls } from '../config/afgCricket';
import LiveMatchCard from '../components/LiveMatchCard';
import PremiumAccessWall from '../components/PremiumAccessWall';
import { useEntitlements } from '../context/EntitlementsContext';
import { useSportsMatches } from '../hooks/useSportsMatches';
import { useI18n } from '../i18n';
import {
  fetchAllXpTransactions,
  fetchXpRules,
  getAuthUserId,
  triggerXpEvent,
  type XpRule,
} from '../api/xp';
import { sumXpToday } from '../utils/xpDisplay';

function formatCountdown(totalSeconds: number): string {
  const clamped = Math.max(0, totalSeconds);
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

const StreamingPage: React.FC = () => {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const videoWrapRef = React.useRef<HTMLDivElement | null>(null);
  const awardingRef = React.useRef(false);
  const { t } = useI18n();
  const { canWatchPlayEarn, loading: entLoading } = useEntitlements();
  const { live, loading: sportsLoading } = useSportsMatches();
  const userId = getAuthUserId();
  const [liveIndex, setLiveIndex] = useState(0);
  const [muted, setMuted] = React.useState(true);
  const [watchRule, setWatchRule] = React.useState<XpRule | null>(null);
  const [watchTodayXp, setWatchTodayXp] = React.useState(0);
  const [countdownSeconds, setCountdownSeconds] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isPageVisible, setIsPageVisible] = React.useState(!document.hidden);

  const activeLive = useMemo(() => {
    if (live.length === 0) return null;
    return live[Math.min(liveIndex, live.length - 1)];
  }, [live, liveIndex]);

  const watchIntervalSeconds = watchRule?.cooldown_seconds ?? 300;
  const watchXpGain = watchRule?.base_xp ?? 0;
  const watchDailyGoal = watchRule?.daily_cap_xp ?? 0;
  const isActivelyWatching = isPlaying && isPageVisible;
  const watchProgressPct =
    watchDailyGoal > 0 ? Math.min(100, Math.round((watchTodayXp / watchDailyGoal) * 100)) : 0;
  const watchXpRemaining = watchDailyGoal > 0 ? Math.max(0, watchDailyGoal - watchTodayXp) : 0;

  React.useEffect(() => {
    document.title = 'Game Plazio | IPL 2026 Live Stream';
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    if (!userId || !canWatchPlayEarn) return;

    const loadWatchXpState = async () => {
      try {
        const [watchRules, txns] = await Promise.all([
          fetchXpRules({ category: 'watch', is_active: true }),
          fetchAllXpTransactions(userId, {
            transaction_type: 'credit',
            category: 'watch',
            per_page: 100,
          }),
        ]);
        if (cancelled) return;

        const selectedRule =
          watchRules
            .filter((r) => r.event_code.startsWith('WATCH_STREAM_') && r.cooldown_seconds > 0)
            .sort((a, b) => a.cooldown_seconds - b.cooldown_seconds)[0] ??
          watchRules.find((r) => r.cooldown_seconds > 0) ??
          null;
        setWatchRule(selectedRule);
        setWatchTodayXp(sumXpToday(txns));
        setCountdownSeconds(selectedRule?.cooldown_seconds ?? 300);
      } catch {
        if (cancelled) return;
        setWatchRule(null);
        setCountdownSeconds(300);
      }
    };

    void loadWatchXpState();

    return () => {
      cancelled = true;
    };
  }, [userId, canWatchPlayEarn]);

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
    const video = videoRef.current;
    if (!video) return;

    const syncPlayingState = () => {
      setIsPlaying(!video.paused && !video.ended);
    };
    syncPlayingState();

    video.addEventListener('play', syncPlayingState);
    video.addEventListener('pause', syncPlayingState);
    video.addEventListener('ended', syncPlayingState);
    video.addEventListener('waiting', syncPlayingState);

    return () => {
      video.removeEventListener('play', syncPlayingState);
      video.removeEventListener('pause', syncPlayingState);
      video.removeEventListener('ended', syncPlayingState);
      video.removeEventListener('waiting', syncPlayingState);
    };
  }, []);

  React.useEffect(() => {
    const onVisibility = () => {
      setIsPageVisible(!document.hidden);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  React.useEffect(() => {
    if (!userId || !canWatchPlayEarn || !watchRule || !watchRule.event_code) return;
    if (watchDailyGoal > 0 && watchTodayXp >= watchDailyGoal) return;
    if (!isActivelyWatching) return;

    const timer = window.setInterval(() => {
      setCountdownSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [userId, canWatchPlayEarn, watchRule, isActivelyWatching, watchDailyGoal, watchTodayXp]);

  React.useEffect(() => {
    if (!userId || !watchRule || countdownSeconds > 0 || awardingRef.current || !isActivelyWatching) return;
    if (watchDailyGoal > 0 && watchTodayXp >= watchDailyGoal) return;

    const award = async () => {
      awardingRef.current = true;
      try {
        const bucket = Math.floor(Date.now() / (watchIntervalSeconds * 1000));
        const result = await triggerXpEvent({
          event_code: watchRule.event_code,
          user_id: userId,
          idempotency_key: `watch-${watchRule.event_code}-${userId}-${bucket}`,
          source_metadata: { source: 'streaming_page', action: 'watch_interval' },
          unit_count: 1,
        });
        setWatchTodayXp((prev) => prev + Math.max(0, result.xp_awarded ?? watchXpGain));
      } catch {
        // Keep timer cycling even if this interval award fails.
      } finally {
        setCountdownSeconds(watchIntervalSeconds);
        awardingRef.current = false;
      }
    };

    void award();
  }, [
    userId,
    watchRule,
    countdownSeconds,
    isActivelyWatching,
    watchDailyGoal,
    watchTodayXp,
    watchIntervalSeconds,
    watchXpGain,
  ]);

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
            <span className="watch-xp-gain">
              +{watchXpGain} XP / {formatCountdown(countdownSeconds)}
            </span>
          </div>

          <div className="watch-progress-block">
            <div className="watch-progress-row">
              <span className="watch-progress-l">{t('watch.todaysXp')}</span>
              <span className="watch-progress-v">
                {watchTodayXp} / {watchDailyGoal > 0 ? watchDailyGoal : '∞'} XP
              </span>
            </div>
            <div className="watch-bar">
              <i style={{ width: `${watchProgressPct}%` }} />
            </div>
            <div className="watch-progress-foot">
              {watchDailyGoal > 0
                ? `${watchXpRemaining} XP to daily cap`
                : t('watch.dailyCapHint')}
            </div>
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
