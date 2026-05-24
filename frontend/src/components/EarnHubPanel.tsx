import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { XpCategory, XpRule } from '../api/xp';
import type { useXpEarnHub } from '../hooks/useXpEarnHub';
import { useI18n } from '../i18n';
import {
  categoryEmoji,
  categoryIconClass,
  formatRuleXpLabel,
  formatXpCompact,
  humanizeEventCode,
  isRuleCompleted,
  routeForXpCategory,
} from '../utils/xpDisplay';

type HubState = ReturnType<typeof useXpEarnHub>;

function EarnRuleRow({
  rule,
  credits,
}: {
  rule: XpRule;
  credits: HubState['credits'];
}) {
  const done = isRuleCompleted(rule, credits);
  const xpLabel = formatRuleXpLabel(rule);
  const to = routeForXpCategory(rule.category);
  const rowClass = `earn-row${done ? ' done' : ''}`;
  const big = rule.base_xp >= 500;

  const inner = (
    <>
      <div className={`earn-icon ${categoryIconClass(rule.category)}`}>
        {categoryEmoji(rule.category, rule.event_code)}
      </div>
      <div className="meta">
        <div className="nm">{humanizeEventCode(rule.event_code)}</div>
        <div className="ds">{rule.rule_name.replace(/ — Base Rule$/i, '')}</div>
      </div>
      {done ? (
        <div className="check" aria-hidden>
          ✓
        </div>
      ) : (
        <div className={`xp-tag${big ? ' big' : ''}`}>{xpLabel}</div>
      )}
    </>
  );

  if (to && !done) {
    return (
      <Link to={to} className={rowClass}>
        {inner}
      </Link>
    );
  }

  return <div className={rowClass}>{inner}</div>;
}

type EarnHubPanelProps = {
  hub: HubState;
};

const EarnHubPanel: React.FC<EarnHubPanelProps> = ({ hub }) => {
  const { t } = useI18n();
  const {
    balance,
    credits,
    rulesByCategory,
    categoriesWithRules,
    todayXp,
    dailyGoal,
    availableXp,
    loading,
    error,
    refresh,
  } = hub;

  const [activeCategory, setActiveCategory] = useState<XpCategory | null>(null);

  useEffect(() => {
    if (categoriesWithRules.length === 0) {
      setActiveCategory(null);
      return;
    }
    setActiveCategory((prev) =>
      prev && categoriesWithRules.includes(prev) ? prev : categoriesWithRules[0],
    );
  }, [categoriesWithRules]);

  const categoryTitle = (cat: XpCategory) => t(`earn.category.${cat}`, cat.toUpperCase());
  const activeRules = activeCategory ? (rulesByCategory[activeCategory] ?? []) : [];
  const activeDoneCount = activeRules.filter((r) => isRuleCompleted(r, credits)).length;

  return (
    <>
      <div className="earn-header-card">
        <div className="earn-header-left">
          <div className="l">{loading ? t('common.loading') : t('earn.todayXp')}</div>
          <div className="v">
            {loading ? '—' : todayXp}
            <span className="earn-cap"> / {dailyGoal}</span>
          </div>
          <div className="s">
            {loading
              ? '…'
              : `${t('earn.availableLabel', 'Available')} ${formatXpCompact(balance?.available_xp ?? availableXp)} XP`}
          </div>
        </div>
        <div className="earn-tickets">
          <div className="ic" aria-hidden>
            🎟️
          </div>
          <div className="t">
            {balance?.current_tier ?? '—'}
            {balance?.next_tier ? ` → ${balance.next_tier}` : ''}
          </div>
        </div>
      </div>

      {error ? (
        <div className="earn-status earn-status--error" role="alert">
          <p>{error}</p>
          <button type="button" className="earn-retry" onClick={() => void refresh()}>
            {t('earn.retry', 'Retry')}
          </button>
        </div>
      ) : null}

      {loading && !error ? (
        <p className="earn-status" role="status">
          {t('earn.loadingWays', 'Loading ways to earn…')}
        </p>
      ) : null}

      {!loading && !error && categoriesWithRules.length > 0 ? (
        <>
          <div className="earn-cat-tabs" role="tablist" aria-label={t('earn.pickCategory', 'Earn categories')}>
            {categoriesWithRules.map((cat) => {
              const count = rulesByCategory[cat]?.length ?? 0;
              const done = rulesByCategory[cat]?.filter((r) => isRuleCompleted(r, credits)).length ?? 0;
              return (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={activeCategory === cat}
                  className={`earn-cat-tab${activeCategory === cat ? ' is-active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  <span className="earn-cat-tab-ic" aria-hidden>
                    {categoryEmoji(cat, cat)}
                  </span>
                  <span className="earn-cat-tab-label">{categoryTitle(cat)}</span>
                  <span className="earn-cat-tab-count">
                    {done}/{count}
                  </span>
                </button>
              );
            })}
          </div>

          {activeCategory ? (
            <section className="earn-category-panel" aria-labelledby="earn-active-cat">
              <div className="sec-title" id="earn-active-cat">
                ▸ {categoryTitle(activeCategory)}
                <span className="earn-cat-progress">
                  {activeDoneCount}/{activeRules.length}
                </span>
              </div>
              <div className="earn-list earn-list--panel">
                {activeRules.map((rule) => (
                  <EarnRuleRow key={rule.id} rule={rule} credits={credits} />
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : null}
    </>
  );
};

export default EarnHubPanel;
