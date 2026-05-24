import React from 'react';
import './GamePlayPage.css';
import ScreenHeader from '../components/ScreenHeader';
import {
  AFG_CRICKET_GAME_URL,
  AFG_CRICKET_IFRAME_ALLOW,
  AFG_CRICKET_STANDALONE_URL,
} from '../config/afgCricket';
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
    id: 'cricket',
    icon: '🏏',
    nameKey: 'play.cricket',
    nameFallback: 'Street Cricket',
    descKey: 'play.cricketDesc',
    descFallback: 'AFG simulator · score runs',
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

const GamePlayPage: React.FC = () => {
  const { t } = useI18n();
  usePageTitle('play.pageTitle', 'Game Plazio | Play Arena');
  const { canWatchPlayEarn, loading: entLoading } = useEntitlements();

  const [gameFullscreen, setGameFullscreen] = React.useState(false);
  const [gameReady, setGameReady] = React.useState(false);
  const stageRef = React.useRef<HTMLDivElement>(null);
  const cricketRef = React.useRef<HTMLElement>(null);
  const hadEnteredFsRef = React.useRef(false);

  React.useEffect(() => {
    document.body.style.overflow = gameFullscreen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [gameFullscreen]);

  const openGameFullscreen = React.useCallback(() => {
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
  }, []);

  React.useEffect(() => {
    const onFs = () => {
      if (!getFullscreenElement() && hadEnteredFsRef.current) {
        hadEnteredFsRef.current = false;
        setGameFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', onFs);
    document.addEventListener('webkitfullscreenchange', onFs);
    return () => {
      document.removeEventListener('fullscreenchange', onFs);
      document.removeEventListener('webkitfullscreenchange', onFs);
    };
  }, []);

  const exitGameFullscreenMode = React.useCallback(async () => {
    try {
      await exitGameFullscreen();
    } catch {
      /* ignore */
    }
    hadEnteredFsRef.current = false;
    setGameFullscreen(false);
  }, []);

  React.useEffect(() => {
    if (!gameFullscreen) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') void exitGameFullscreenMode();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gameFullscreen, exitGameFullscreenMode]);

  const scrollToCricket = React.useCallback(() => {
    cricketRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const onGameCardClick = (game: HubGame) => {
    if (game.id === 'cricket') {
      scrollToCricket();
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
                {game.id === 'cricket' ? (
                  <span className="play-game-live-tag">{t('play.liveNow')}</span>
                ) : null}
              </button>
            ))}
          </div>

          <section
            ref={cricketRef}
            id="play-cricket-arena"
            className="play-cricket-section"
            aria-label={t('play.cricketArena')}
          >
            <div className="play-cricket-head">
              <h2 className="play-cricket-title">{t('play.cricket')}</h2>
              <a
                className="play-cricket-open"
                href={AFG_CRICKET_STANDALONE_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('play.openNewTab')}
              </a>
            </div>
            <div
              ref={stageRef}
              className={`play-game-stage${gameFullscreen ? ' play-game-stage--fullscreen' : ''}`}
            >
              {!gameReady && (
                <div className="play-loader" role="status" aria-live="polite">
                  <p className="play-loader-title">{t('play.loadingArena')}</p>
                  <p className="play-loader-sub">{t('play.loadingCricket')}</p>
                </div>
              )}
              <iframe
                className="play-game-iframe"
                src={AFG_CRICKET_GAME_URL}
                allow={AFG_CRICKET_IFRAME_ALLOW}
                allowFullScreen
                title={t('play.cricketIframeTitle')}
                onLoad={() => setGameReady(true)}
              />
              {!gameFullscreen && gameReady && (
                <button
                  type="button"
                  className="play-game-expand"
                  onClick={openGameFullscreen}
                  aria-label={t('play.fullscreen')}
                >
                  {t('play.fullscreen')}
                </button>
              )}
            </div>
          </section>

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
