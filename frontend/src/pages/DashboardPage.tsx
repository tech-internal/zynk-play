import React, { useCallback, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { DashboardMatch } from '../api/sportsDb';
import { hubNavItems } from '../config/hubNav';
import { useEntitlements } from '../context/EntitlementsContext';
import { useSportsMatches } from '../hooks/useSportsMatches';
import { useI18n, usePageTitle } from '../i18n';
import imgWatch from '../images/Watch.png';
import imgPlay from '../images/Play.png';
import imgWin from '../images/Win.png';
import imgShare from '../images/Share.png';
import './DashboardPage.css';

const portals = [
  {
    num: '01',
    titleKey: 'dash.portal.watch',
    kickerKey: 'dash.portal.liveMatches',
    subKey: 'dash.portal.highlights',
    icon: 'play_arrow',
    iconFill: true,
    image: imgWatch,
    to: '/streaming',
    premium: true,
    accent: 'primary',
  },
  {
    num: '02',
    titleKey: 'dash.portal.play',
    kickerKey: 'dash.portal.games',
    subKey: 'dash.portal.compete',
    icon: 'sports_esports',
    iconFill: false,
    image: imgPlay,
    to: '/gameplay',
    premium: true,
    accent: 'primary',
  },
  {
    num: '03',
    titleKey: 'dash.portal.win',
    kickerKey: 'dash.portal.rewards',
    subKey: 'dash.portal.redeem',
    icon: 'payments',
    iconFill: false,
    image: imgWin,
    to: '/earn-share?view=earn',
    premium: true,
    accent: 'secondary',
  },
  {
    num: '04',
    titleKey: 'dash.portal.share',
    kickerKey: 'dash.portal.community',
    subKey: 'dash.portal.teamUp',
    icon: 'groups',
    iconFill: false,
    image: imgShare,
    to: '/earn-share?view=share',
    premium: false,
    accent: 'secondary',
  },
] as const;

const FALLBACK_UPCOMING: DashboardMatch[] = [
  {
    id: 'orion-nova',
    tournament: 'CHAMPIONS CUP',
    time: '7:30',
    period: 'PM',
    day: 'Today',
    home: { name: 'Team Orion', rank: 'RANK #2', accent: 'secondary' },
    away: { name: 'Team Nova', rank: 'RANK #4', accent: 'primary' },
    isLive: false,
  },
  {
    id: 'afg-uzb',
    tournament: 'AFC ASIAN CUP',
    time: '8:00',
    period: 'PM',
    day: 'Today',
    home: { name: 'Afghanistan', rank: 'RANK #6', accent: 'secondary' },
    away: { name: 'Uzbekistan', rank: 'RANK #3', accent: 'primary' },
    isLive: false,
  },
];

function TeamBadge({ team }: { team: DashboardMatch['home'] }) {
  if (team.badgeUrl) {
    return (
      <div className={`dash-hub__team-badge dash-hub__team-badge--${team.accent} dash-hub__team-badge--img`}>
        <img src={team.badgeUrl} alt="" />
      </div>
    );
  }
  return (
    <div className={`dash-hub__team-badge dash-hub__team-badge--${team.accent}`}>
      <span className="material-symbols-outlined" aria-hidden>
        sports_soccer
      </span>
    </div>
  );
}

type MatchCarouselProps = {
  matches: DashboardMatch[];
  activeIndex: number;
  onSelect: (index: number) => void;
  live?: boolean;
};

function MatchCarousel({ matches, activeIndex, onSelect, live }: MatchCarouselProps) {
  const match = matches[Math.min(activeIndex, matches.length - 1)];
  if (!match) return null;

  return (
    <div className={`dash-hub__match-card${live ? ' dash-hub__match-card--live' : ''}`}>
      {live ? (
        <span className="dash-hub__live-badge">
          <span className="dash-hub__live-dot" aria-hidden />
          LIVE
        </span>
      ) : null}
      <span className="material-symbols-outlined dash-hub__match-watermark" aria-hidden>
        stadium
      </span>
      <div className="dash-hub__match-grid">
        <div className="dash-hub__team dash-hub__team--home">
          <TeamBadge team={match.home} />
          <h3 className="dash-hub__team-name">{match.home.name}</h3>
          <span className={`dash-hub__team-rank dash-hub__team-rank--${match.home.accent}`}>
            {match.home.rank}
          </span>
        </div>

        <div className="dash-hub__match-center">
          <span className="dash-hub__match-tournament">{match.tournament}</span>
          <div className="dash-hub__match-time-row">
            <span className="dash-hub__match-line" aria-hidden />
            <span className="dash-hub__match-time dash-glow-orange">
              {match.time} <span className="dash-hub__match-period">{match.period}</span>
            </span>
            <span className="dash-hub__match-line" aria-hidden />
          </div>
          <span className="dash-hub__match-day">{match.day}</span>
        </div>

        <div className="dash-hub__team dash-hub__team--away">
        <TeamBadge team={match.away} />
        <h3 className="dash-hub__team-name">{match.away.name}</h3>
        <span className={`dash-hub__team-rank dash-hub__team-rank--${match.away.accent}`}>
          {match.away.rank}
        </span>
      </div>
    </div>

      {matches.length > 1 ? (
        <div className="dash-hub__match-dots" role="tablist" aria-label="Match carousel">
          {matches.map((m, i) => (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={i === activeIndex}
              aria-label={`Match ${i + 1}`}
              className={`dash-hub__dot${i === activeIndex ? ' dash-hub__dot--active' : ''}`}
              onClick={() => onSelect(i)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

const DashboardPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { canWatchPlayEarn, loading, needsProfileCompletion, needsSubscription } = useEntitlements();
  const [upcomingIndex, setUpcomingIndex] = useState(0);
  const [liveIndex, setLiveIndex] = useState(0);
  const [gateOpen, setGateOpen] = useState(false);
  const { upcoming, live, loading: sportsLoading } = useSportsMatches();

  const upcomingMatches = useMemo(
    () => (upcoming.length > 0 ? upcoming : FALLBACK_UPCOMING),
    [upcoming],
  );

  usePageTitle('dash.pageTitle', 'FANVERSE — Elite Home Hub');

  const premiumMessage = () => {
    if (needsProfileCompletion) {
      return t('gate.dash.profile');
    }
    if (needsSubscription) {
      return t('gate.dash.subscribe');
    }
    return t('gate.dash.default');
  };

  const tryNavigate = useCallback(
    (to: string, premium: boolean) => {
      if (premium && !loading && !canWatchPlayEarn) {
        setGateOpen(true);
        return;
      }
      navigate(to);
    },
    [canWatchPlayEarn, loading, navigate],
  );

  const activeLive = live.length > 0 ? live[Math.min(liveIndex, live.length - 1)] : null;

  return (
    <div className="dash-hub">
      <div className="dash-hub__bg-radial" aria-hidden />
      <div className="dash-hub__bg-grid" aria-hidden />
      <div className="dash-hub__glow dash-hub__glow--tr" aria-hidden />
      <div className="dash-hub__glow dash-hub__glow--bl" aria-hidden />

      <main className="dash-hub__main">
        <section className="dash-hub__portals" aria-label={t('dash.portalsAria')}>
          <div className="dash-hub__portal-grid">
            {portals.map((portal) => (
              <button
                key={portal.titleKey}
                type="button"
                className={`dash-hub__portal dash-hub__portal--${portal.accent}`}
                onClick={() => tryNavigate(portal.to, portal.premium)}
              >
                <div className="dash-hub__portal-media">
                  <img className="dash-hub__portal-img" src={portal.image} alt="" />
                </div>
                <div className="dash-hub__portal-caption">
                  <div className="dash-hub__portal-caption-head">
                    <span className="dash-hub__portal-num">{portal.num}</span>
                    <h2 className="dash-hub__portal-title">{t(portal.titleKey)}</h2>
                  </div>
                  <div className="dash-hub__portal-foot">
                    <div className="dash-hub__portal-meta">
                      <p className="dash-hub__portal-kicker">{t(portal.kickerKey)}</p>
                      <p className="dash-hub__portal-sub">{t(portal.subKey)}</p>
                    </div>
                    <div className="dash-hub__portal-icon-wrap">
                      <span
                        className={`material-symbols-outlined${portal.iconFill ? ' dash-icon-fill' : ''}`}
                        aria-hidden
                      >
                        {portal.icon}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="dash-hub__matches dash-hub__matches--live" aria-labelledby="dash-live-heading">
          <div className="dash-hub__matches-head">
            <div className="dash-hub__matches-title-wrap">
              <span className="material-symbols-outlined dash-glow-orange" aria-hidden>
                sensors
              </span>
              <h2 id="dash-live-heading" className="dash-hub__matches-title">
                {t('dash.liveMatches')}
              </h2>
            </div>
            <Link to="/notifications" className="dash-hub__view-all">
              {t('common.news')}
              <span className="material-symbols-outlined" aria-hidden>
                chevron_right
              </span>
            </Link>
          </div>

          {sportsLoading && live.length === 0 ? (
            <p className="dash-hub__matches-status">{t('dash.syncing')}</p>
          ) : null}

          {activeLive ? (
            <MatchCarousel matches={live} activeIndex={liveIndex} onSelect={setLiveIndex} live />
          ) : (
            <p className="dash-hub__matches-status">{t('dash.noLive')}</p>
          )}
        </section>

        <section className="dash-hub__matches" aria-labelledby="dash-upcoming-heading">
          <div className="dash-hub__matches-head">
            <div className="dash-hub__matches-title-wrap">
              <span className="material-symbols-outlined dash-glow-orange" aria-hidden>
                calendar_month
              </span>
              <h2 id="dash-upcoming-heading" className="dash-hub__matches-title">
                {t('dash.upcomingMatches')}
              </h2>
            </div>
            <Link to="/upcoming-matches" className="dash-hub__view-all">
              {t('common.viewAll')}
              <span className="material-symbols-outlined" aria-hidden>
                chevron_right
              </span>
            </Link>
          </div>

          {sportsLoading && upcoming.length === 0 ? (
            <p className="dash-hub__matches-status">{t('dash.loadingFixtures')}</p>
          ) : null}

          <MatchCarousel
            matches={upcomingMatches}
            activeIndex={upcomingIndex}
            onSelect={setUpcomingIndex}
          />
        </section>

<footer className="dash-hub__footer" aria-label={t('dash.hubNavAria')}>
          <div className="dash-hub__footer-inner">
            <div className="dash-hub__footer-brand">
              <h1 className="dash-hub__footer-logo">
                {t('brand.fanverse')}
                <span className="dash-hub__footer-elite">{t('brand.elite')}</span>
              </h1>
            </div>
            <nav className="dash-hub__footer-nav" aria-label="Secondary">
              {hubNavItems.map((item) => {
                const isActive = item.match(location.pathname, location.search);
                return (
                  <Link
                    key={item.labelKey}
                    to={item.to}
                    className={`dash-hub__footer-link${isActive ? ' dash-hub__footer-link--active' : ''}`}
                  >
                    <div
                      className={`dash-hub__footer-icon${isActive ? ' dash-hub__footer-icon--active' : ''}`}
                    >
                      <span
                        className={`material-symbols-outlined${isActive ? ' dash-icon-fill' : ''}`}
                        aria-hidden
                      >
                        {item.icon}
                      </span>
                    </div>
                    <span>{t(item.labelKey)}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="dash-hub__footer-actions">
              <Link to="/settings" className="dash-hub__footer-btn" aria-label="Settings">
                <span className="material-symbols-outlined">settings</span>
              </Link>
              <button type="button" className="dash-hub__footer-btn" aria-label="Help">
                <span className="material-symbols-outlined">help_outline</span>
              </button>
            </div>
          </div>
          <p className="dash-hub__footer-copy">{t('dash.footerCopy')}</p>
        </footer>
      </main>

      {gateOpen ? (
        <div className="dash-hub__gate" role="dialog" aria-modal="true" aria-labelledby="dash-gate-title">
          <button
            type="button"
            className="dash-hub__gate-backdrop"
            aria-label={t('a11y.close')}
            onClick={() => setGateOpen(false)}
          />
          <div className="dash-hub__gate-panel">
            <h2 id="dash-gate-title">{t('gate.title')}</h2>
            <p>{premiumMessage()}</p>
            <div className="dash-hub__gate-actions">
              <button
                type="button"
                className="dash-hub__gate-primary"
                onClick={() => {
                  setGateOpen(false);
                  navigate(needsProfileCompletion ? '/profile?onboarding=1' : '/subscription');
                }}
              >
                {needsProfileCompletion ? t('common.completeProfile') : t('common.viewPlans')}
              </button>
              <button type="button" className="dash-hub__gate-secondary" onClick={() => setGateOpen(false)}>
                {t('common.notNow')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default DashboardPage;
