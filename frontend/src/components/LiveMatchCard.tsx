import React from 'react';
import type { DashboardMatch } from '../api/sportsDb';
import './LiveMatchCard.css';

function TeamBadge({ team }: { team: DashboardMatch['home'] }) {
  if (team.badgeUrl) {
    return (
      <div className={`live-match-card__badge live-match-card__badge--${team.accent} live-match-card__badge--img`}>
        <img src={team.badgeUrl} alt="" />
      </div>
    );
  }
  return (
    <div className={`live-match-card__badge live-match-card__badge--${team.accent}`}>
      <span className="material-symbols-outlined" aria-hidden>
        sports_soccer
      </span>
    </div>
  );
}

export type LiveMatchCardProps = {
  match: DashboardMatch;
  activeIndex?: number;
  matchCount?: number;
  onSelect?: (index: number) => void;
};

const LiveMatchCard: React.FC<LiveMatchCardProps> = ({ match, activeIndex = 0, matchCount = 1, onSelect }) => {
  const showCarousel = matchCount > 1 && onSelect;

  return (
    <article className="live-match-card live-match-card--live" aria-live="polite">
      <span className="live-match-card__live-badge">
        <span className="live-match-card__live-dot" aria-hidden />
        LIVE
      </span>
      <span className="material-symbols-outlined live-match-card__watermark" aria-hidden>
        stadium
      </span>

      <div className="live-match-card__grid">
        <div className="live-match-card__team live-match-card__team--home">
          <TeamBadge team={match.home} />
          <h3 className="live-match-card__team-name">{match.home.name}</h3>
          <span className={`live-match-card__team-meta live-match-card__team-meta--${match.home.accent}`}>
            {match.home.rank}
          </span>
        </div>

        <div className="live-match-card__center">
          <span className="live-match-card__tournament">{match.tournament}</span>
          <div className="live-match-card__score-row">
            <span className="live-match-card__line" aria-hidden />
            <span className="live-match-card__score">
              {match.time}
              {match.period ? <span className="live-match-card__period"> {match.period}</span> : null}
            </span>
            <span className="live-match-card__line" aria-hidden />
          </div>
          <span className="live-match-card__status">{match.day}</span>
        </div>

        <div className="live-match-card__team live-match-card__team--away">
          <TeamBadge team={match.away} />
          <h3 className="live-match-card__team-name">{match.away.name}</h3>
          <span className={`live-match-card__team-meta live-match-card__team-meta--${match.away.accent}`}>
            {match.away.rank}
          </span>
        </div>
      </div>

      {showCarousel ? (
        <div className="live-match-card__dots" role="tablist" aria-label="Live matches">
          {Array.from({ length: matchCount }, (_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === activeIndex}
              aria-label={`Live match ${i + 1}`}
              className={`live-match-card__dot${i === activeIndex ? ' live-match-card__dot--active' : ''}`}
              onClick={() => onSelect(i)}
            />
          ))}
        </div>
      ) : null}
    </article>
  );
};

export default LiveMatchCard;
