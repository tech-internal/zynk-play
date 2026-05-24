import React from 'react';
import type { DashboardMatch } from '../api/sportsDb';
import { useUpcomingMatches } from '../hooks/useUpcomingMatches';
import ScreenHeader from '../components/ScreenHeader';
import { useI18n, usePageTitle } from '../i18n';
import './UpcomingMatchesPage.css';

function TeamBadge({ team }: { team: DashboardMatch['home'] }) {
  if (team.badgeUrl) {
    return (
      <div className={`upm-badge upm-badge--${team.accent} upm-badge--img`}>
        <img src={team.badgeUrl} alt="" />
      </div>
    );
  }
  return (
    <div className={`upm-badge upm-badge--${team.accent}`}>
      <span className="material-symbols-outlined" aria-hidden>
        sports
      </span>
    </div>
  );
}

function MatchRow({ match }: { match: DashboardMatch }) {
  return (
    <li className="upm-row">
      <div className="upm-row__meta">
        <span className="upm-row__league">{match.tournament}</span>
        <span className="upm-row__when">
          {match.day} · {match.time} {match.period}
        </span>
      </div>
      <div className="upm-row__teams">
        <div className="upm-row__team">
          <TeamBadge team={match.home} />
          <span className="upm-row__name">{match.home.name}</span>
          <span className="upm-row__detail">{match.home.rank}</span>
        </div>
        <span className="upm-row__vs">vs</span>
        <div className="upm-row__team upm-row__team--away">
          <TeamBadge team={match.away} />
          <span className="upm-row__name">{match.away.name}</span>
          <span className="upm-row__detail">{match.away.rank}</span>
        </div>
      </div>
    </li>
  );
}

type MatchSectionProps = {
  id: string;
  title: string;
  icon: string;
  matches: DashboardMatch[];
  emptyLabel: string;
};

function MatchSection({ id, title, icon, matches, emptyLabel }: MatchSectionProps) {
  return (
    <section className="upm-section" aria-labelledby={id}>
      <h2 id={id} className="upm-section__title">
        <span className="material-symbols-outlined" aria-hidden>
          {icon}
        </span>
        {title}
        <span className="upm-section__count">{matches.length}</span>
      </h2>
      {matches.length === 0 ? (
        <p className="upm-empty">{emptyLabel}</p>
      ) : (
        <ul className="upm-list">
          {matches.map((match) => (
            <MatchRow key={match.id} match={match} />
          ))}
        </ul>
      )}
    </section>
  );
}

const UpcomingMatchesPage: React.FC = () => {
  const { t } = useI18n();
  usePageTitle('upcoming.pageTitle', 'Upcoming Matches | Fanverse');
  const { feed, loading, error, refresh } = useUpcomingMatches();

  return (
    <main className="upm-page">
      <ScreenHeader title={t('upcoming.title')} />
      <div className="upm-head-meta">
        <p className="upm-sub">{t('upcoming.sub')}</p>
        <button type="button" className="upm-refresh" onClick={refresh} disabled={loading}>
          {loading ? t('common.loading') : t('upcoming.refresh')}
        </button>
      </div>

      {loading && feed.soccer.length === 0 && feed.cricket.length === 0 ? (
        <p className="upm-status" role="status">
          Loading fixtures…
        </p>
      ) : null}

      {error ? (
        <p className="upm-status upm-status--error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="upm-sections">
        <MatchSection
          id="upm-soccer"
          title="Soccer"
          icon="sports_soccer"
          matches={feed.soccer}
          emptyLabel="No upcoming soccer fixtures listed."
        />
        <MatchSection
          id="upm-cricket"
          title="Cricket"
          icon="sports_cricket"
          matches={feed.cricket}
          emptyLabel="No upcoming cricket fixtures listed."
        />
      </div>
    </main>
  );
};

export default UpcomingMatchesPage;
