import React from 'react';
import type { SportsNewsItem } from '../api/sportsDb';

type NewsScrollSectionProps = {
  id: string;
  title: string;
  icon: string;
  items: SportsNewsItem[];
  formatDate: (iso: string) => string;
  emptyLabel: string;
  onItemClick: (item: SportsNewsItem) => void;
};

const NewsScrollSection: React.FC<NewsScrollSectionProps> = ({
  id,
  title,
  icon,
  items,
  formatDate,
  emptyLabel,
  onItemClick,
}) => (
  <section className="fv-notif-news-section" aria-labelledby={id}>
    <h3 id={id} className="fv-notif-news-section-title">
      <span className="material-symbols-outlined" aria-hidden>
        {icon}
      </span>
      {title}
      <span className="fv-notif-news-section-count">{items.length}</span>
    </h3>
    <div className="fv-notif-news-scroll" tabIndex={0} role="region" aria-label={`${title} scrollable feed`}>
      {items.length === 0 ? (
        <p className="fv-notif-empty fv-notif-empty--inline">{emptyLabel}</p>
      ) : (
        <ul className="fv-notif-list fv-notif-list--news">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="fv-notif-item fv-notif-item--news fv-notif-item--clickable"
                onClick={() => onItemClick(item)}
              >
                {item.imageUrl ? (
                  <img className="fv-notif-news-thumb" src={item.imageUrl} alt="" />
                ) : (
                  <span className="material-symbols-outlined fv-notif-icon" aria-hidden>
                    {icon}
                  </span>
                )}
                <div className="fv-notif-copy">
                  <span className="fv-notif-news-league">{item.league}</span>
                  <strong>{item.title}</strong>
                  <span>{item.summary}</span>
                  <time className="fv-notif-time" dateTime={item.publishedAt}>
                    {formatDate(item.publishedAt)}
                  </time>
                </div>
                <span className="material-symbols-outlined fv-notif-chevron" aria-hidden>
                  chevron_right
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  </section>
);

export default NewsScrollSection;
