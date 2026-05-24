import React, { useEffect, useMemo, useState } from 'react';
import {
  fetchAllXpTransactions,
  fetchXpBalance,
  getAuthUserId,
  type XpCategory,
  type XpTransaction,
} from '../api/xp';
import { useI18n } from '../i18n';
import { formatXpCompact, humanizeEventCode } from '../utils/xpDisplay';

const PAGE_SIZE = 12;

type TxnTypeFilter = 'all' | 'credit' | 'debit' | 'bonus' | 'expire' | 'reversal';
type CatFilter = 'all' | XpCategory;

const TYPE_FILTERS: TxnTypeFilter[] = ['all', 'credit', 'debit', 'bonus'];
const CAT_FILTERS: CatFilter[] = ['all', 'watch', 'platform', 'win', 'share', 'pay'];

function formatXpDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${month} ${day}, ${year} • ${hours}:${minutes}`;
}

function xpAmountClass(type: string): string {
  if (type === 'credit' || type === 'bonus') return 'thp-xp-amt thp-xp-amt--pos';
  if (type === 'debit' || type === 'expire') return 'thp-xp-amt thp-xp-amt--neg';
  return 'thp-xp-amt';
}

function xpAmountLabel(txn: XpTransaction): string {
  const sign = txn.transaction_type === 'credit' || txn.transaction_type === 'bonus' ? '+' : '−';
  return `${sign}${formatXpCompact(Math.abs(txn.xp_amount))} XP`;
}

const HistoryXpLedger: React.FC = () => {
  const { t } = useI18n();
  const userId = getAuthUserId();
  const [balance, setBalance] = useState<{ available_xp: number; total_xp_earned: number } | null>(
    null,
  );
  const [items, setItems] = useState<XpTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<TxnTypeFilter>('all');
  const [catFilter, setCatFilter] = useState<CatFilter>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setError('Sign in to view XP history');
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      fetchXpBalance(userId),
      fetchAllXpTransactions(userId, { per_page: 100 }),
    ])
      .then(([bal, txns]) => {
        if (cancelled) return;
        setBalance(bal);
        setItems(txns);
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setError(e.message || 'Unable to load XP transactions');
        setBalance(null);
        setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const filtered = useMemo(() => {
    const start = startDate ? new Date(startDate).getTime() : null;
    const end = endDate ? new Date(endDate).getTime() + 24 * 60 * 60 * 1000 - 1 : null;
    return items.filter((txn) => {
      if (typeFilter !== 'all' && txn.transaction_type !== typeFilter) return false;
      if (catFilter !== 'all' && txn.category !== catFilter) return false;
      const ts = new Date(txn.created_at).getTime();
      if (start && ts < start) return false;
      if (end && ts > end) return false;
      return true;
    });
  }, [items, typeFilter, catFilter, startDate, endDate]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <>
      <div className="thp-stats-row">
        <div className="thp-stats-group">
          <div className="thp-stat-card thp-stat-pos">
            <span className="thp-stat-label">{t('history.xpAvailable')}</span>
            <span className="thp-stat-value">
              {loading ? '…' : `${formatXpCompact(balance?.available_xp ?? 0)} XP`}
            </span>
          </div>
          <div className="thp-stat-card thp-stat-xp">
            <span className="thp-stat-label">{t('history.xpEarned')}</span>
            <span className="thp-stat-value">
              {loading ? '…' : `${formatXpCompact(balance?.total_xp_earned ?? 0)} XP`}
            </span>
          </div>
        </div>
      </div>

      <div className="thp-xp-filters">
        <span className="thp-xp-filter-label">{t('history.xpFilterAll')}</span>
        <div className="thp-xp-filter-row">
          {TYPE_FILTERS.map((id) => {
            const label =
              id === 'all'
                ? t('history.xpFilterAll')
                : id === 'credit'
                  ? t('history.xpFilterCredit')
                  : id === 'debit'
                    ? t('history.xpFilterDebit')
                    : id;
            return (
              <button
                key={id}
                type="button"
                className={`thp-xp-chip${typeFilter === id ? ' is-active' : ''}`}
                onClick={() => {
                  setTypeFilter(id);
                  setVisibleCount(PAGE_SIZE);
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
        <span className="thp-xp-filter-label">{t('history.xpFilterCategory')}</span>
        <div className="thp-xp-filter-row">
          {CAT_FILTERS.map((id) => (
            <button
              key={id}
              type="button"
              className={`thp-xp-chip${catFilter === id ? ' is-active' : ''}`}
              onClick={() => {
                setCatFilter(id);
                setVisibleCount(PAGE_SIZE);
              }}
            >
              {id === 'all' ? t('history.xpFilterAll') : t(`earn.category.${id}` as 'earn.category.watch')}
            </button>
          ))}
        </div>
        <div className="thp-date-fields">
          <label className="thp-date-input">
            <span className="material-symbols-outlined">calendar_today</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
            />
          </label>
          <label className="thp-date-input">
            <span className="material-symbols-outlined">event</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
            />
          </label>
        </div>
      </div>

      <div className="thp-list">
        {loading && (
          <div className="thp-empty">
            <span className="material-symbols-outlined">progress_activity</span>
            <p>{t('history.xpLoading')}</p>
          </div>
        )}
        {!loading && error && (
          <div className="thp-empty thp-empty-error">
            <span className="material-symbols-outlined">error</span>
            <p>{error}</p>
          </div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div className="thp-empty">
            <span className="material-symbols-outlined">bolt</span>
            <p>{t('history.xpEmpty')}</p>
          </div>
        )}
        {!loading &&
          !error &&
          visible.map((txn) => (
            <article key={txn.id} className="thp-tx thp-tx-xp">
              <div className="thp-tx-left">
                <div className="thp-tx-icon thp-tx-icon-xp">
                  <span className="material-symbols-outlined">bolt</span>
                </div>
                <div className="thp-tx-text">
                  <h4>{txn.event_code ? humanizeEventCode(txn.event_code) : txn.transaction_type}</h4>
                  <p>
                    {[txn.category, txn.transaction_type, txn.status].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </div>
              <div className="thp-tx-right">
                <div className={xpAmountClass(txn.transaction_type)}>{xpAmountLabel(txn)}</div>
                <div className="thp-tx-date">{formatXpDate(txn.created_at)}</div>
              </div>
            </article>
          ))}
      </div>

      {!loading && hasMore && (
        <div className="thp-load-more-wrap">
          <button
            type="button"
            className="thp-load-more"
            onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
          >
            LOAD_MORE_XP
          </button>
        </div>
      )}
    </>
  );
};

export default HistoryXpLedger;
