import React, { useEffect, useState } from 'react';

import type { LuckyDraw, LuckyDrawCategory } from '../api/luckyDraw';
import type { useLuckyDraws } from '../hooks/useLuckyDraws';
import { useI18n } from '../i18n';
import {
  categoryAccentClass,
  categoryIcon,
  formatCountdown,
  getCountdown,
  slotsFillPercent,
  slotsRemaining,
} from '../utils/luckyDrawDisplay';

type LuckyDrawHub = ReturnType<typeof useLuckyDraws>;

type LuckyDrawPanelProps = {
  availableXp: number;
  hub: LuckyDrawHub;
  onEnterSuccess?: () => void;
};

function useNowTick(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [active]);
  return now;
}

function PrizeVisual({ url, category }: { url: string; category: LuckyDrawCategory }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(url?.trim()) && !failed;

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [url]);

  return (
    <div className="ld-card__prize-media" aria-hidden={!showImage && !url}>
      {showImage ? (
        <>
          {!loaded ? <div className="ld-card__prize-shimmer" aria-label="Loading prize image" /> : null}
          <img
            src={url}
            alt=""
            className={`ld-card__prize-img${loaded ? ' is-visible' : ''}`}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
          />
        </>
      ) : (
        <div className="ld-card__prize-fallback">
          <span className="material-symbols-outlined">{categoryIcon(category)}</span>
        </div>
      )}
    </div>
  );
}

function LuckyDrawCard({
  draw,
  availableXp,
  entering,
  onEnter,
}: {
  draw: LuckyDraw;
  availableXp: number;
  entering: boolean;
  onEnter: (drawId: string) => void;
}) {
  const { t } = useI18n();
  const now = useNowTick(draw.status === 'open');
  const countdown = getCountdown(draw.end_date, now);
  const slotsLeft = slotsRemaining(draw);
  const fill = slotsFillPercent(draw);
  const canEnter =
    draw.is_accepting_entries && !draw.user_entered && !countdown.expired && slotsLeft > 0;
  const insufficientXp = availableXp < draw.entry_xp;
  const slotsUrgent = slotsLeft > 0 && slotsLeft <= Math.max(3, Math.ceil(draw.max_participants * 0.15));

  let ctaLabel = t('share.luckyDraws.enter', 'Enter draw');
  let ctaClass = 'ld-card__cta';
  let disabled = entering;

  if (draw.user_entered) {
    ctaLabel = t('share.luckyDraws.entered', "You're in ✓");
    ctaClass += ' ld-card__cta--entered';
    disabled = true;
  } else if (countdown.expired || slotsLeft === 0) {
    ctaLabel =
      slotsLeft === 0
        ? t('share.luckyDraws.slotsFull', 'All slots taken')
        : t('share.luckyDraws.ended', 'Entry closed');
    ctaClass += ' ld-card__cta--muted';
    disabled = true;
  } else if (insufficientXp) {
    ctaLabel = t('share.luckyDraws.insufficientXp', 'Need more XP');
    ctaClass += ' ld-card__cta--warn';
    disabled = true;
  } else if (entering) {
    ctaLabel = t('share.luckyDraws.entering', 'Entering…');
    ctaClass += ' ld-card__cta--busy';
  }

  return (
    <article
      className={`ld-card ${categoryAccentClass(draw.category)}${draw.user_entered ? ' ld-card--entered' : ''}`}
    >
      <div className="ld-card__glow" aria-hidden />
      <div className="ld-card__shine" aria-hidden />

      <div className="ld-card__top">
        <div className="ld-card__badge">
          <span className="material-symbols-outlined ld-card__badge-ic">{categoryIcon(draw.category)}</span>
          <span>{draw.category}</span>
        </div>
        <div className="ld-card__xp">
          <span className="material-symbols-outlined ld-card__xp-ic">bolt</span>
          {draw.entry_xp.toLocaleString()} XP
        </div>
      </div>

      <div className="ld-card__prize">
        <PrizeVisual url={draw.prize_image_url} category={draw.category} />
        <div className="ld-card__prize-copy">
          <h3 className="ld-card__title">{draw.prize_title}</h3>
          <p className="ld-card__subtitle">{draw.title}</p>
          {draw.prize_description ? <p className="ld-card__desc">{draw.prize_description}</p> : null}
        </div>
      </div>

      <div className="ld-card__stats">
        <div className={`ld-card__stat${countdown.expired ? ' ld-card__stat--dim' : ''}`}>
          <span className="ld-card__stat-label">{t('share.luckyDraws.endsIn', 'Ends in')}</span>
          <span className={`ld-card__stat-value${countdown.expired ? ' is-expired' : ''}`}>
            <span className="material-symbols-outlined ld-card__stat-ic">schedule</span>
            {countdown.expired ? t('share.luckyDraws.ended', 'Entry closed') : formatCountdown(countdown)}
          </span>
        </div>
        <div className={`ld-card__stat${slotsUrgent ? ' ld-card__stat--urgent' : ''}`}>
          <span className="ld-card__stat-label">{t('share.luckyDraws.slotsLeft', 'Slots left')}</span>
          <span className="ld-card__stat-value">
            <span className="material-symbols-outlined ld-card__stat-ic">group</span>
            <span className={slotsUrgent ? 'ld-card__stat-hot' : undefined}>{slotsLeft}</span>
            <span className="ld-card__stat-muted"> / {draw.max_participants}</span>
          </span>
        </div>
      </div>

      <div className="ld-card__progress" aria-label={`${fill}% filled`}>
        <div className="ld-card__progress-track">
          <div
            className={`ld-card__progress-fill${fill >= 85 ? ' ld-card__progress-fill--hot' : ''}`}
            style={{ width: `${fill}%` }}
          />
        </div>
        <div className="ld-card__progress-meta">
          <span className="ld-card__progress-label">
            {draw.participant_count.toLocaleString()} {t('share.luckyDraws.joined', 'joined')}
          </span>
          <span className="ld-card__progress-pct">{fill}%</span>
        </div>
      </div>

      <button
        type="button"
        className={ctaClass}
        disabled={disabled || !canEnter}
        onClick={() => onEnter(draw.id)}
      >
        {entering ? <span className="ld-card__cta-spinner" aria-hidden /> : null}
        {ctaLabel}
      </button>
    </article>
  );
}

function DrawSection({
  title,
  count,
  variant,
  children,
}: {
  title: string;
  count: number;
  variant: 'entered' | 'open';
  children: React.ReactNode;
}) {
  return (
    <div className={`ld-section ld-section--${variant}`}>
      <div className="ld-section__head">
        <h3 className="ld-section__title">{title}</h3>
        <span className="ld-section__count">{count}</span>
      </div>
      <div className="ld-grid">{children}</div>
    </div>
  );
}

const LuckyDrawPanel: React.FC<LuckyDrawPanelProps> = ({ availableXp, hub, onEnterSuccess }) => {
  const { t } = useI18n();
  const { draws, announcements, error, enteringId, refresh, enter } = hub;
  const [toast, setToast] = useState<string | null>(null);

  const enteredDraws = draws.filter((d) => d.user_entered);
  const openDraws = draws.filter((d) => !d.user_entered);

  const handleEnter = async (drawId: string) => {
    setToast(null);
    try {
      const result = await enter(drawId);
      setToast(
        result.auto_drawn
          ? t('share.luckyDraws.enterAndDrawn', "You're in — draw completed!")
          : t('share.luckyDraws.enterSuccess', "You're in the lucky draw!"),
      );
      onEnterSuccess?.();
    } catch (e) {
      setToast(e instanceof Error ? e.message : t('share.luckyDraws.enterFailed', 'Could not enter'));
    }
  };

  return (
    <section id="share-section" className="ld-panel">
      <div className="ld-panel__hero">
        <div className="ld-panel__hero-icon" aria-hidden>
          <span className="material-symbols-outlined">casino</span>
        </div>
        <div>
          <p className="ld-panel__kicker">{t('share.luckyDraws.kicker', 'XP Lucky Draw')}</p>
          <h2 className="ld-panel__title">{t('share.luckyDraws.title', 'Win big with your XP')}</h2>
          <p className="ld-panel__sub">
            {t(
              'share.luckyDraws.subtitle',
              'Spend XP to enter live draws. Limited slots — when time runs out or slots fill, winners are picked at random.',
            )}
          </p>
        </div>
      </div>

      {announcements.length > 0 ? (
        <div className="ld-winners">
          <div className="ld-winners__head">
            <span className="material-symbols-outlined">celebration</span>
            <span>{t('share.luckyDraws.recentWinners', 'Recent winners')}</span>
          </div>
          <div className="ld-winners__list">
            {announcements.slice(0, 3).map((item) => (
              <div key={item.draw_id} className="ld-winners__row">
                <div className="ld-winners__prize">{item.prize_title}</div>
                <div className="ld-winners__names">
                  {item.winners.map((w) => (
                    <span key={`${item.draw_id}-${w.rank}`} className="ld-winners__chip">
                      🏆 {w.display_name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {toast ? <div className="ld-toast">{toast}</div> : null}

      {error ? (
        <div className="ld-status ld-status--error">
          {error}
          <button type="button" className="earn-retry" onClick={() => void refresh()}>
            {t('earn.retry', 'Retry')}
          </button>
        </div>
      ) : draws.length === 0 ? (
        <div className="ld-status ld-empty">
          <span className="material-symbols-outlined ld-empty__ic">inventory_2</span>
          <p>{t('share.luckyDraws.empty', 'No open draws right now. Check back soon!')}</p>
        </div>
      ) : (
        <div className="ld-sections">
          {enteredDraws.length > 0 ? (
            <DrawSection
              title={t('share.luckyDraws.participated', 'Participated')}
              count={enteredDraws.length}
              variant="entered"
            >
              {enteredDraws.map((draw) => (
                <LuckyDrawCard
                  key={draw.id}
                  draw={draw}
                  availableXp={availableXp}
                  entering={enteringId === draw.id}
                  onEnter={(id) => void handleEnter(id)}
                />
              ))}
            </DrawSection>
          ) : null}

          {openDraws.length > 0 ? (
            <DrawSection
              title={t('share.luckyDraws.notParticipated', 'Available to enter')}
              count={openDraws.length}
              variant="open"
            >
              {openDraws.map((draw) => (
                <LuckyDrawCard
                  key={draw.id}
                  draw={draw}
                  availableXp={availableXp}
                  entering={enteringId === draw.id}
                  onEnter={(id) => void handleEnter(id)}
                />
              ))}
            </DrawSection>
          ) : null}

          {enteredDraws.length > 0 && openDraws.length === 0 ? (
            <p className="ld-section__hint">
              {t('share.luckyDraws.allEntered', "You're in every open draw. Check back for new ones!")}
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
};

export default LuckyDrawPanel;
