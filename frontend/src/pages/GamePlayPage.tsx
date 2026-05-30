import React from 'react';
import './GamePlayPage.css';
import ScreenHeader from '../components/ScreenHeader';
import {
  AFG_CRICKET_GAME_BASE_URL,
  AFG_SOCCER_GAME_BASE_URL,
  AFG_SOCCER_REQUIRES_EXTERNAL_LAUNCH,
  buildUnityGameUrl,
  UNITY_GAME_IFRAME_ALLOW,
} from '../config/afgCricket';
import { getAuthUserId } from '../api/xp';
import PremiumAccessWall from '../components/PremiumAccessWall';
import { useEntitlements } from '../context/EntitlementsContext';
import { useI18n, usePageTitle } from '../i18n';

type HubGame = {
  id: string;
  icon: string;
  nameKey: string;
  nameFallback: string;
  descKey: string;
  descFallback: string;
  xpKey: string;
  xpFallback: string;
  variant: string;
  available: boolean;
};

const hubGames: HubGame[] = [
  {
    id: 'soccer',
    icon: '⚽',
    nameKey: 'play.soccer',
    nameFallback: 'Afghan Soccer',
    descKey: 'play.soccerDesc',
    descFallback: 'Unity simulator · score goals',
    xpKey: 'play.soccerXp',
    xpFallback: '+1 XP / goal · +5 XP / win',
    variant: 'game-soccer',
    available: true,
  },
  {
    id: 'cricket',
    icon: '🏏',
    nameKey: 'play.cricket',
    nameFallback: 'Street Cricket',
    descKey: 'play.cricketDesc',
    descFallback: 'MI India simulator · score runs',
    xpKey: 'play.cricketXp',
    xpFallback: '+1 XP / run · +5 XP / win',
    variant: 'game-cricket',
    available: true,
  },
  {
    id: 'quiz',
    icon: '🧠',
    nameKey: 'play.quiz',
    nameFallback: 'Daily Quiz',
    descKey: 'play.quizDesc',
    descFallback: '5 questions · Afghan football',
    xpKey: 'play.quizXp',
    xpFallback: '+1 XP each',
    variant: 'game-quiz',
    available: false,
  },
  {
    id: 'predict',
    icon: '🎯',
    nameKey: 'play.predict',
    nameFallback: 'Predict & Win',
    descKey: 'play.predictDesc',
    descFallback: 'Score · first scorer · MOTM',
    xpKey: 'play.predictXp',
    xpFallback: '+1 XP / correct',
    variant: 'game-predict',
    available: false,
  },
  {
    id: 'football',
    icon: '⚽',
    nameKey: 'play.football',
    nameFallback: 'Street Football',
    descKey: 'play.footballDesc',
    descFallback: 'In-app duels · score goals',
    xpKey: 'play.footballXp',
    xpFallback: '+1 XP / goal · +5 XP / win',
    variant: 'game-football',
    available: false,
  },
  {
    id: 'trivia',
    icon: '🏆',
    nameKey: 'play.trivia',
    nameFallback: 'Trivia Battle',
    descKey: 'play.triviaDesc',
    descFallback: '1v1 head-to-head',
    xpKey: 'play.triviaXp',
    xpFallback: '+5 XP / battle win',
    variant: 'game-trivia',
    available: false,
  },
];

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

type PlayGameArenaProps = {
  sectionId: string;
  ariaLabel: string;
  title: string;
  baseUrl: string;
  iframeTitle: string;
  loadingSub: string;
  openNewTabLabel: string;
  fullscreenLabel: string;
  loadingArenaLabel: string;
  launchGameLabel: string;
  launchHint?: string;
  userId: string | null;
  sectionRef?: React.Ref<HTMLElement>;
  /** Soccer CDN blocks iframes via X-Frame-Options: SAMEORIGIN */
  embedMode?: 'iframe' | 'external';
};

const PlayGameArena: React.FC<PlayGameArenaProps> = ({
  sectionId,
  ariaLabel,
  title,
  baseUrl,
  iframeTitle,
  loadingSub,
  openNewTabLabel,
  fullscreenLabel,
  loadingArenaLabel,
  launchGameLabel,
  launchHint,
  userId,
  sectionRef,
  embedMode = 'iframe',
}) => {
  const isExternalLaunch = embedMode === 'external';
  const [gameFullscreen, setGameFullscreen] = React.useState(false);
  const [gameReady, setGameReady] = React.useState(false);
  const stageRef = React.useRef<HTMLDivElement>(null);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const hadEnteredFsRef = React.useRef(false);

  const standaloneUrl = React.useMemo(
    () => buildUnityGameUrl(baseUrl, userId),
    [baseUrl, userId],
  );

  const launchInNewTab = React.useCallback(() => {
    window.open(standaloneUrl, '_blank', 'noopener,noreferrer');
  }, [standaloneUrl]);

  React.useEffect(() => {
    if (isExternalLaunch || !gameFullscreen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [gameFullscreen, isExternalLaunch]);

  const openGameFullscreen = React.useCallback(() => {
    if (isExternalLaunch) {
      launchInNewTab();
      return;
    }
    const iframe = iframeRef.current;
    if (iframe) {
      iframe.src = buildUnityGameUrl(baseUrl, userId);
    }
    const el = stageRef.current;
    if (!el) return;
    setGameFullscreen(true);
    hadEnteredFsRef.current = false;
    void requestGameFullscreen(el)
      .then(() => {
        hadEnteredFsRef.current = true;
      })
      .catch(() => {
        /* overlay fallback */
      });
  }, [baseUrl, userId, isExternalLaunch, launchInNewTab]);

  const exitGameFullscreenMode = React.useCallback(async () => {
    if (isExternalLaunch) return;
    try {
      await exitGameFullscreen();
    } catch {
      /* ignore */
    }
    const iframe = iframeRef.current;
    if (iframe) {
      iframe.src = baseUrl;
    }
    hadEnteredFsRef.current = false;
    setGameFullscreen(false);
  }, [baseUrl, isExternalLaunch]);

  React.useEffect(() => {
    if (isExternalLaunch) return undefined;
    const onFs = () => {
      if (!getFullscreenElement() && hadEnteredFsRef.current) {
        hadEnteredFsRef.current = false;
        const iframe = iframeRef.current;
        if (iframe) {
          iframe.src = baseUrl;
        }
        setGameFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', onFs);
    document.addEventListener('webkitfullscreenchange', onFs);
    return () => {
      document.removeEventListener('fullscreenchange', onFs);
      document.removeEventListener('webkitfullscreenchange', onFs);
    };
  }, [baseUrl, isExternalLaunch]);

  React.useEffect(() => {
    if (isExternalLaunch || !gameFullscreen) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') void exitGameFullscreenMode();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gameFullscreen, exitGameFullscreenMode, isExternalLaunch]);

  return (
    <section
      ref={sectionRef}
      id={sectionId}
      className="play-arena-section"
      aria-label={ariaLabel}
    >
      <div className="play-arena-head">
        <h2 className="play-arena-title">{title}</h2>
        <a
          className="play-arena-open"
          href={standaloneUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {openNewTabLabel}
        </a>
      </div>
      <div
        ref={stageRef}
        className={`play-game-stage${gameFullscreen ? ' play-game-stage--fullscreen' : ''}${
          isExternalLaunch ? ' play-game-stage--launch' : ''
        }`}
      >
        {isExternalLaunch ? (
          <div className="play-game-launch">
            <span className="play-game-launch-icon" aria-hidden>
              ⚽
            </span>
            <p className="play-game-launch-title">{title}</p>
            {launchHint ? <p className="play-game-launch-hint">{launchHint}</p> : null}
            <button type="button" className="play-game-launch-btn" onClick={launchInNewTab}>
              {launchGameLabel}
            </button>
          </div>
        ) : (
          <>
            {!gameReady && (
              <div className="play-loader" role="status" aria-live="polite">
                <p className="play-loader-title">{loadingArenaLabel}</p>
                <p className="play-loader-sub">{loadingSub}</p>
              </div>
            )}
            <iframe
              ref={iframeRef}
              className="play-game-iframe"
              src={baseUrl}
              allow={UNITY_GAME_IFRAME_ALLOW}
              allowFullScreen
              title={iframeTitle}
              onLoad={() => setGameReady(true)}
            />
            {!gameFullscreen && gameReady && (
              <button
                type="button"
                className="play-game-expand"
                onClick={openGameFullscreen}
                aria-label={fullscreenLabel}
              >
                {fullscreenLabel}
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
};

const GamePlayPage: React.FC = () => {
  const { t } = useI18n();
  usePageTitle('play.pageTitle', 'Game Plazio | Play Arena');
  const { canWatchPlayEarn, loading: entLoading } = useEntitlements();
  const userId = getAuthUserId();

  const soccerRef = React.useRef<HTMLElement>(null);
  const cricketRef = React.useRef<HTMLElement>(null);

  const scrollToArena = React.useCallback((ref: React.RefObject<HTMLElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const onGameCardClick = (game: HubGame) => {
    if (game.id === 'soccer') {
      scrollToArena(soccerRef);
      return;
    }
    if (game.id === 'cricket') {
      scrollToArena(cricketRef);
      return;
    }
    if (!game.available) return;
  };

  return (
    <div className="play-page">
      <main className="play-mobile">
        <ScreenHeader title={t('play.arenaTitle')} />
        {!entLoading && !canWatchPlayEarn ? (
          <PremiumAccessWall />
        ) : (
          <>

          <div className="play-banner">
            <div className="play-banner-tag">{t('play.bannerTag')}</div>
            <div className="play-banner-title">
              {t('play.bannerTitleLine1')}
              <br />
              {t('play.bannerTitleLine2')}
            </div>
            <div className="play-banner-sub">{t('play.bannerSub')}</div>
            <div className="play-banner-meta">
              <span className="play-pill-gold">{t('play.pillWins')}</span>
              <span className="play-pill-xp">{t('play.pillQuests')}</span>
            </div>
          </div>

          <div className="play-sec-title">{t('play.chooseGame')}</div>

          <div className="play-game-grid">
            {hubGames.map((game) => (
              <button
                key={game.id}
                type="button"
                className={`play-game-card ${game.variant}${game.available ? ' is-live' : ''}`}
                onClick={() => onGameCardClick(game)}
                aria-label={t(game.nameKey, game.nameFallback)}
                disabled={!game.available}
              >
                <span className="play-ic-big" aria-hidden>
                  {game.icon}
                </span>
                <span className="play-nm">{t(game.nameKey, game.nameFallback)}</span>
                <span className="play-ds">{t(game.descKey, game.descFallback)}</span>
                <span className="play-xp">{t(game.xpKey, game.xpFallback)}</span>
                {game.id === 'soccer' || game.id === 'cricket' ? (
                  <span className="play-game-live-tag">{t('play.liveNow')}</span>
                ) : null}
              </button>
            ))}
          </div>

          <PlayGameArena
            sectionRef={soccerRef}
            sectionId="play-soccer-arena"
            ariaLabel={t('play.soccerArena')}
            title={t('play.soccer')}
            baseUrl={AFG_SOCCER_GAME_BASE_URL}
            iframeTitle={t('play.soccerIframeTitle')}
            loadingSub={t('play.loadingSoccer')}
            openNewTabLabel={t('play.openNewTab')}
            fullscreenLabel={t('play.fullscreen')}
            loadingArenaLabel={t('play.loadingArena')}
            launchGameLabel={t('play.launchGame')}
            launchHint={t('play.soccerLaunchHint')}
            userId={userId}
            embedMode={AFG_SOCCER_REQUIRES_EXTERNAL_LAUNCH ? 'external' : 'iframe'}
          />

          <PlayGameArena
            sectionRef={cricketRef}
            sectionId="play-cricket-arena"
            ariaLabel={t('play.cricketArena')}
            title={t('play.cricket')}
            baseUrl={AFG_CRICKET_GAME_BASE_URL}
            iframeTitle={t('play.cricketIframeTitle')}
            loadingSub={t('play.loadingCricket')}
            openNewTabLabel={t('play.openNewTab')}
            fullscreenLabel={t('play.fullscreen')}
            loadingArenaLabel={t('play.loadingArena')}
            launchGameLabel={t('play.launchGame')}
            userId={userId}
          />

          <div className="play-progress-block">
            <div className="play-progress-row">
              <span className="play-progress-l">{t('play.weeklyWins')}</span>
              <span className="play-progress-v">{t('play.weeklyWinsProgress')}</span>
            </div>
            <div className="play-bar">
              <i style={{ width: '66%' }} />
            </div>
            <div className="play-progress-foot">{t('play.weeklyDrawHint')}</div>
          </div>
          </>
        )}
      </main>
    </div>
  );
};

export default GamePlayPage;
