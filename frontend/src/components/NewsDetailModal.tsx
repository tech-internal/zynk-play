import React, { useEffect } from 'react';
import type { SportsNewsItem } from '../api/sportsDb';
import './NewsDetailModal.css';

type NewsDetailModalProps = {
  item: SportsNewsItem | null;
  formatDate: (iso: string) => string;
  onClose: () => void;
};

const sportIcon: Record<SportsNewsItem['sport'], string> = {
  soccer: 'sports_soccer',
  cricket: 'sports_cricket',
};

const NewsDetailModal: React.FC<NewsDetailModalProps> = ({ item, formatDate, onClose }) => {
  useEffect(() => {
    if (!item) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [item, onClose]);

  if (!item) return null;

  const hasScore =
    item.kind === 'past' && item.homeScore != null && item.awayScore != null;
  const hero = item.bannerUrl ?? item.imageUrl;
  const paragraphs = item.body.split(/\n\n+/).filter(Boolean);

  return (
    <div className="fv-news-modal" role="dialog" aria-modal="true" aria-labelledby="fv-news-modal-title">
      <button type="button" className="fv-news-modal__backdrop" aria-label="Close" onClick={onClose} />
      <article className="fv-news-modal__panel">
        <button type="button" className="fv-news-modal__close" aria-label="Close" onClick={onClose}>
          <span className="material-symbols-outlined">close</span>
        </button>

        {hero ? (
          <img className="fv-news-modal__hero" src={hero} alt="" />
        ) : (
          <div className="fv-news-modal__hero fv-news-modal__hero--placeholder">
            <span className="material-symbols-outlined" aria-hidden>
              {sportIcon[item.sport]}
            </span>
          </div>
        )}

        <div className="fv-news-modal__body">
          <div className="fv-news-modal__tags">
            <span className="fv-news-modal__tag fv-news-modal__tag--sport">
              <span className="material-symbols-outlined" aria-hidden>
                {sportIcon[item.sport]}
              </span>
              {item.sport}
            </span>
            <span className="fv-news-modal__tag">{item.league}</span>
            {item.kind === 'next' ? (
              <span className="fv-news-modal__tag fv-news-modal__tag--upcoming">Upcoming</span>
            ) : (
              <span className="fv-news-modal__tag fv-news-modal__tag--result">Result</span>
            )}
          </div>

          <h2 id="fv-news-modal-title" className="fv-news-modal__title">
            {item.title}
          </h2>
          <p className="fv-news-modal__meta">
            {formatDate(item.publishedAt)}
            {item.kickoffLabel ? ` · ${item.kickoffLabel}` : ''}
          </p>

          <div className="fv-news-modal__match">
            <div className="fv-news-modal__team">
              {item.homeBadgeUrl ? (
                <img src={item.homeBadgeUrl} alt="" className="fv-news-modal__badge" />
              ) : null}
              <span>{item.homeTeam}</span>
            </div>
            <div className="fv-news-modal__score">
              {hasScore ? (
                <>
                  <span>{item.homeScore}</span>
                  <span className="fv-news-modal__score-sep">–</span>
                  <span>{item.awayScore}</span>
                </>
              ) : (
                <span className="fv-news-modal__vs">vs</span>
              )}
            </div>
            <div className="fv-news-modal__team">
              {item.awayBadgeUrl ? (
                <img src={item.awayBadgeUrl} alt="" className="fv-news-modal__badge" />
              ) : null}
              <span>{item.awayTeam}</span>
            </div>
          </div>

          {item.venue ? <p className="fv-news-modal__venue">{item.venue}</p> : null}

          <div className="fv-news-modal__article">
            {paragraphs.map((p) => (
              <p key={p.slice(0, 40)}>{p}</p>
            ))}
          </div>
        </div>
      </article>
    </div>
  );
};

export default NewsDetailModal;
