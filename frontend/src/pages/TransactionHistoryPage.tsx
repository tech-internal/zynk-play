import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import './TransactionHistoryPage.css';
import { fetchPaymentHistory, PaymentTransactionRow } from '../api/subscriptions';

type FilterId = 'all' | 'earned' | 'spent' | 'subscription';

type Tone = 'positive' | 'negative' | 'neutral';

type DerivedTx = {
  raw: PaymentTransactionRow;
  tone: Tone;
  isElite: boolean;
  icon: string;
  iconFill: boolean;
  title: string;
  subtitle: string;
  amountLabel: string;
  amountClass: string;
  dateLabel: string;
  matchesFilter: (filter: FilterId) => boolean;
};

const FILTERS: Array<{ id: FilterId; label: string; icon: string }> = [
  { id: 'all', label: 'All Activity', icon: 'analytics' },
  { id: 'earned', label: 'Earned', icon: 'trending_up' },
  { id: 'spent', label: 'Spent', icon: 'trending_down' },
  { id: 'subscription', label: 'Elite Pass', icon: 'workspace_premium' },
];

const STATUS_LABEL: Record<string, string> = {
  completed: 'Completed',
  pending: 'Pending',
  failed: 'Failed',
  refunded: 'Refunded',
  cancelled: 'Cancelled',
};

function parseAmount(value: string | null | undefined): number {
  if (!value) return 0;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function formatAmount(amount: number, currency: string, signed: boolean): string {
  const abs = Math.abs(amount);
  const sign = signed ? (amount > 0 ? '+' : amount < 0 ? '-' : '') : '';
  const formatted = abs.toLocaleString(undefined, {
    minimumFractionDigits: abs % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${sign}${formatted} ${currency || 'AFN'}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${month} ${day}, ${year} • ${hours}:${minutes}`;
}

function deriveTransaction(row: PaymentTransactionRow): DerivedTx {
  const amount = parseAmount(row.amount);
  const status = (row.status || '').toLowerCase();
  const hasPlan = !!row.plan;
  const isElite = hasPlan && status === 'completed';

  let tone: Tone = 'neutral';
  let signed = 0;
  let icon = 'receipt_long';
  let iconFill = false;
  let title = 'Transaction';
  let subtitle = row.transaction_ref;

  if (status === 'refunded') {
    tone = 'positive';
    signed = amount;
    icon = 'undo';
    title = 'Refund Issued';
    subtitle = row.plan ? `${row.plan.name} - Reversal` : 'Reversal credit';
  } else if (status === 'completed') {
    tone = 'negative';
    signed = -amount;
    if (hasPlan) {
      icon = 'workspace_premium';
      iconFill = true;
      title = `${row.plan!.name}`;
      subtitle = row.plan!.billing_period
        ? `Subscription Renewal — ${row.plan!.billing_period} • Status: ACTIVE`
        : 'Subscription Renewal — Status: ACTIVE';
    } else {
      icon = 'shopping_bag';
      title = 'Marketplace Purchase';
      subtitle = `Ref ${row.transaction_ref.slice(0, 12)}`;
    }
  } else if (status === 'pending') {
    tone = 'neutral';
    icon = 'schedule';
    title = row.plan ? `${row.plan.name}` : 'Pending Payment';
    subtitle = 'Awaiting confirmation';
  } else if (status === 'failed' || status === 'cancelled') {
    tone = 'neutral';
    icon = status === 'failed' ? 'error' : 'cancel';
    title = row.plan ? `${row.plan.name}` : 'Transaction';
    subtitle = STATUS_LABEL[status] || status;
  } else {
    title = row.plan ? row.plan.name : 'Transaction';
  }

  const isInflow = tone === 'positive';
  const isOutflow = tone === 'negative';

  return {
    raw: row,
    tone,
    isElite,
    icon,
    iconFill,
    title,
    subtitle,
    amountLabel:
      tone === 'neutral' && status === 'pending'
        ? `${parseAmount(row.amount).toLocaleString()} ${row.currency || 'AFN'}`
        : formatAmount(signed, row.currency || 'AFN', true),
    amountClass:
      tone === 'positive' ? 'thp-amount thp-amount-pos' : tone === 'negative' ? 'thp-amount thp-amount-neg' : 'thp-amount thp-amount-muted',
    dateLabel: formatDate(row.created_at),
    matchesFilter: (filter: FilterId) => {
      if (filter === 'all') return true;
      if (filter === 'earned') return isInflow;
      if (filter === 'spent') return isOutflow;
      if (filter === 'subscription') return hasPlan;
      return true;
    },
  };
}

const PAGE_SIZE = 8;

function txRowToneClass(tx: DerivedTx): string {
  if (tx.isElite) return 'thp-tx-elite';
  if (tx.tone === 'positive') return 'thp-tx-earned';
  if (tx.tone === 'negative') return 'thp-tx-spent';
  return 'thp-tx-neutral';
}

function txIconClass(tx: DerivedTx): string {
  if (tx.isElite) return 'thp-tx-icon thp-tx-icon-elite';
  if (tx.tone === 'positive') return 'thp-tx-icon thp-tx-icon-earned';
  if (tx.tone === 'negative') return 'thp-tx-icon thp-tx-icon-spent';
  return 'thp-tx-icon thp-tx-icon-neutral';
}

const TransactionHistoryPage: React.FC = () => {
  const [transactions, setTransactions] = useState<PaymentTransactionRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterId>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);

  useEffect(() => {
    document.title = 'FANVERSE - Transaction History';
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchPaymentHistory()
      .then((rows) => {
        if (cancelled) return;
        setTransactions(rows);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message || 'Unable to load transaction history.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const derived = useMemo(() => transactions.map(deriveTransaction), [transactions]);

  const filtered = useMemo(() => {
    const start = startDate ? new Date(startDate).getTime() : null;
    const end = endDate ? new Date(endDate).getTime() + 24 * 60 * 60 * 1000 - 1 : null;
    return derived.filter((tx) => {
      if (!tx.matchesFilter(filter)) return false;
      const ts = new Date(tx.raw.created_at).getTime();
      if (start && ts < start) return false;
      if (end && ts > end) return false;
      return true;
    });
  }, [derived, filter, startDate, endDate]);

  const totals = useMemo(() => {
    let earned = 0;
    let spent = 0;
    let currency = 'AFN';
    derived.forEach((tx) => {
      if (tx.raw.currency) currency = tx.raw.currency;
      const amt = parseAmount(tx.raw.amount);
      const status = (tx.raw.status || '').toLowerCase();
      if (status === 'refunded') earned += amt;
      else if (status === 'completed') spent += amt;
    });
    return { earned, spent, currency };
  }, [derived]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const handleExport = () => {
    if (filtered.length === 0) return;
    const headers = ['Date', 'Reference', 'Plan', 'Status', 'Amount', 'Currency', 'Method'];
    const lines = [headers.join(',')];
    filtered.forEach((tx) => {
      const row = tx.raw;
      const planName = row.plan ? row.plan.name.replace(/"/g, '""') : '';
      lines.push(
        [
          row.created_at,
          row.transaction_ref,
          `"${planName}"`,
          row.status,
          row.amount,
          row.currency,
          row.payment_method ?? '',
        ].join(','),
      );
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fanverse-ledger-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="thp-page">
      <main className="thp-main">
        <div className="thp-container">
          <header className="thp-hero">
            <h1 className="thp-title">History</h1>
            <p className="thp-lead">
              Elite Ledger: Live feed of sovereign fan activities, rewards, and redemptions within the Fanverse sector.
            </p>
          </header>

          <div className="thp-grid">
            <aside className="thp-sidebar">
              <div className="thp-panel">
                <h3 className="thp-panel-title">
                  <span className="thp-panel-title-bar" aria-hidden />
                  Categories
                </h3>
                <nav className="thp-filter-list">
                  {FILTERS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      className={`thp-filter ${filter === f.id ? 'is-active' : ''}`}
                      onClick={() => {
                        setFilter(f.id);
                        setVisibleCount(PAGE_SIZE);
                      }}
                    >
                      <span>{f.label}</span>
                      <span className="material-symbols-outlined">{f.icon}</span>
                    </button>
                  ))}
                </nav>
              </div>

              <div className="thp-panel">
                <h3 className="thp-panel-title">
                  <span className="thp-panel-title-bar" aria-hidden />
                  Date scan
                </h3>
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
                      placeholder="Start timestamp"
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
                      placeholder="End timestamp"
                    />
                  </label>
                  {(startDate || endDate) && (
                    <button
                      type="button"
                      className="thp-clear-dates"
                      onClick={() => {
                        setStartDate('');
                        setEndDate('');
                      }}
                    >
                      Clear dates
                    </button>
                  )}
                </div>
              </div>

            </aside>

            <section className="thp-content">
              <div className="thp-stats-row">
                <div className="thp-stats-group">
                  <div className="thp-stat-card thp-stat-pos">
                    <span className="thp-stat-label">TOTAL EARNED</span>
                    <span className="thp-stat-value">+{totals.earned.toLocaleString()} {totals.currency}</span>
                  </div>
                  <div className="thp-stat-card thp-stat-neg">
                    <span className="thp-stat-label">TOTAL SPENT</span>
                    <span className="thp-stat-value">-{totals.spent.toLocaleString()} {totals.currency}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="thp-export-btn"
                  onClick={handleExport}
                  disabled={filtered.length === 0}
                >
                  <span className="material-symbols-outlined">download</span>
                  EXPORT_LEDGER.LOG
                </button>
              </div>

              <div className="thp-list">
                {loading && (
                  <div className="thp-empty">
                    <span className="material-symbols-outlined">progress_activity</span>
                    <p>Loading your ledger...</p>
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
                    <span className="material-symbols-outlined">receipt_long</span>
                    <p>No transactions match your filters yet.</p>
                    <Link to="/subscription" className="thp-empty-cta">
                      Explore subscription plans
                    </Link>
                  </div>
                )}

                {!loading &&
                  !error &&
                  visible.map((tx, idx) => (
                    <article
                      key={tx.raw.id}
                      className={`thp-tx ${txRowToneClass(tx)}${idx >= 4 ? ' thp-tx-faded' : ''}`}
                    >
                      <div className="thp-tx-left">
                        <div className={txIconClass(tx)}>
                          <span
                            className="material-symbols-outlined"
                            style={tx.iconFill ? { fontVariationSettings: "'FILL' 1" } : undefined}
                          >
                            {tx.icon}
                          </span>
                        </div>
                        <div className="thp-tx-text">
                          <h4>{tx.title}</h4>
                          <p>{tx.subtitle}</p>
                        </div>
                      </div>
                      <div className="thp-tx-right">
                        <div className={tx.amountClass}>{tx.amountLabel}</div>
                        <div className="thp-tx-date">{tx.dateLabel}</div>
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
                    LOAD_NEXT_SECTOR
                  </button>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TransactionHistoryPage;
