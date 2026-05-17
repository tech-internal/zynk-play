import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchSportsNewsFeed,
  type SportsNewsFeed,
  type SportsNewsItem,
} from '../api/sportsDb';
import NewsDetailModal from '../components/NewsDetailModal';
import NewsScrollSection from '../components/NewsScrollSection';
import './NotificationsPage.css';

export const MOCK_UNREAD_NOTIFICATIONS = 3;

type TabId = 'notifications' | 'news';

const USER_NOTIFICATIONS = [
  {
    id: 'xp-boost',
    unread: true,
    icon: 'bolt',
    title: 'XP Multiplier active',
    body: 'Global 2× boost ends in 14 minutes',
    time: '2 min ago',
  },
  {
    id: 'challenge',
    unread: true,
    icon: 'sports_esports',
    title: 'New challenge',
    body: 'Player778 started "Urban Strike" Blitz',
    time: '18 min ago',
  },
  {
    id: 'drop',
    unread: false,
    icon: 'inventory_2',
    title: 'Drop alert',
    body: 'Legendary skins available in Sector 4',
    time: '1 hr ago',
  },
] as const;

function formatNewsDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

const NotificationsPage: React.FC = () => {
  const [tab, setTab] = useState<TabId>('notifications');
  const [newsFeed, setNewsFeed] = useState<SportsNewsFeed>({ soccer: [], cricket: [] });
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [selectedNews, setSelectedNews] = useState<SportsNewsItem | null>(null);

  const hasNews = newsFeed.soccer.length > 0 || newsFeed.cricket.length > 0;

  useEffect(() => {
    document.title = 'Notifications | Fanverse';
  }, []);

  const loadNews = useCallback(async () => {
    setNewsLoading(true);
    setNewsError(null);
    try {
      const feed = await fetchSportsNewsFeed();
      setNewsFeed(feed);
    } catch {
      setNewsError('Unable to load sports news right now.');
      setNewsFeed({ soccer: [], cricket: [] });
    } finally {
      setNewsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'news' && !hasNews && !newsLoading && !newsError) {
      loadNews();
    }
  }, [tab, hasNews, newsLoading, newsError, loadNews]);

  return (
    <main className="fv-notif-page">
      <header className="fv-notif-head">
        <h1 className="fv-notif-title">Notifications</h1>
        <p className="fv-notif-sub">Your alerts and live sports news from TheSportsDB</p>
      </header>

      <div className="fv-notif-tabs" role="tablist" aria-label="Notification sections">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'notifications'}
          className={`fv-notif-tab${tab === 'notifications' ? ' fv-notif-tab--active' : ''}`}
          onClick={() => setTab('notifications')}
        >
          Your notifications
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'news'}
          className={`fv-notif-tab${tab === 'news' ? ' fv-notif-tab--active' : ''}`}
          onClick={() => setTab('news')}
        >
          News
        </button>
      </div>

      {tab === 'notifications' ? (
        <section className="fv-notif-panel" aria-labelledby="fv-notif-your-heading">
          <h2 id="fv-notif-your-heading" className="fv-notif-panel-title">
            Your notifications
          </h2>
          <ul className="fv-notif-list">
            {USER_NOTIFICATIONS.map((item) => (
              <li
                key={item.id}
                className={`fv-notif-item${item.unread ? ' fv-notif-item--unread' : ''}`}
              >
                <span className="material-symbols-outlined fv-notif-icon" aria-hidden>
                  {item.icon}
                </span>
                <div className="fv-notif-copy">
                  <strong>{item.title}</strong>
                  <span>{item.body}</span>
                  <time className="fv-notif-time" dateTime={item.time}>
                    {item.time}
                  </time>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="fv-notif-panel" aria-labelledby="fv-notif-news-heading">
          <div className="fv-notif-panel-head">
            <h2 id="fv-notif-news-heading" className="fv-notif-panel-title">
              Sports news
            </h2>
            <button type="button" className="fv-notif-refresh" onClick={loadNews} disabled={newsLoading}>
              {newsLoading ? 'Loading…' : 'Refresh'}
            </button>
          </div>
          <p className="fv-notif-api-note">
            Powered by TheSportsDB — scroll each section for more soccer and cricket updates
          </p>

          {newsLoading && !hasNews ? (
            <p className="fv-notif-empty" role="status">
              Loading sports news…
            </p>
          ) : null}

          {newsError ? (
            <p className="fv-notif-empty fv-notif-empty--error" role="alert">
              {newsError}
            </p>
          ) : null}

          <div className="fv-notif-news-sections">
            <NewsScrollSection
              id="fv-notif-soccer-heading"
              title="Soccer"
              icon="sports_soccer"
              items={newsFeed.soccer}
              formatDate={formatNewsDate}
              emptyLabel="No soccer news right now."
              onItemClick={setSelectedNews}
            />
            <NewsScrollSection
              id="fv-notif-cricket-heading"
              title="Cricket"
              icon="sports_cricket"
              items={newsFeed.cricket}
              formatDate={formatNewsDate}
              emptyLabel="No cricket news right now."
              onItemClick={setSelectedNews}
            />
          </div>

          <NewsDetailModal
            item={selectedNews}
            formatDate={formatNewsDate}
            onClose={() => setSelectedNews(null)}
          />
        </section>
      )}

      <Link to="/dashboard" className="fv-notif-back">
        Back to dashboard
      </Link>
    </main>
  );
};

export default NotificationsPage;
