import React, { useEffect } from 'react';

import { useLocation } from 'react-router-dom';

import PremiumAccessWall from '../components/PremiumAccessWall';

import EarnHubPanel from '../components/EarnHubPanel';
import ScreenHeader from '../components/ScreenHeader';
import { useXpEarnHub } from '../hooks/useXpEarnHub';
import { useEntitlements } from '../context/EntitlementsContext';
import { useI18n, usePageTitle } from '../i18n';
import { formatXpPill } from '../utils/xpDisplay';

import './EarnSharePage.css';



const imgStadium =

  'https://lh3.googleusercontent.com/aida-public/AB6AXuAqh6es2uc3I3FHlwNLGtrax_EvCda81ekuPZfTJqAMkaJkYUl_pBlxhAVmebJXFaiYpJKz7J1RRgUB97iPTc9tgef7CI4enEpTawALYj4Q2OnP0OqwiL7F5Sgv8qrsc-dQnCvpNmegzGJBARx7spAzq-WtOy-oo8GzwW6KIbftLFnBIwwuv6y1qoFyV9V5oQMExdjXmAXHBs5UuWwtYDHOUdRbFic0vGDW1pjygF9c1ZLDv9LbAa7JlFX2JJ4Q5SmlM38FhXjicnPp';

const imgChestBg =

  'https://lh3.googleusercontent.com/aida-public/AB6AXuDjGakB98WuKH_Fcjoc2jtpc5QlmQRLdn-dg-YrDfkSpvSQWXkqZrvNToZUpiVrzv3kEkCnJ3AG4heOz9sFWgTfkeTG2vK4VWL2r9_GBiINmK2OYOQGmCjgeD3DnaDnKC0eI3bcIZe00ctRjAvExDM2Q2xEhMVPSwb9I9syO-DffISYQvhGkMVztLjOCicZzfqbnGqXJYQMZ9JGmfucy7ySsKutas3T_h-g5iwMLnkOUP8W75d8UN2y_Uejkgy6-jLfsG9KAj5WcKPc';

const imgCreator1 =

  'https://lh3.googleusercontent.com/aida-public/AB6AXuCg5QfDsoM1U75GbneVLIQT249VpbOktCRX4w4iJsqVw-w3MkRNms6i8Vg15RoG_BUVpyPgp521YohUe-UbC8xnHEqR4Ahr9p-Yeb5KUZq5P1QdDKRfjR3uCpaJyZsdNQBhwgG_sbco32yId_IYr61Zflxui0Sl_ZL5tMr0JDw4wxFQmuWJnFBaq5eQETCGRI61L6d8VPE3aUGEI2YaXSQ_VKMWYY6jLqWGM2NZjcpwGA2j_XIIRzYqHSY8iwjqz8h8P9ctfXEJvizg';

const imgCreator2 =

  'https://lh3.googleusercontent.com/aida-public/AB6AXuDZj5XpkAIXqMzSNhRoielWVbOvPz9LAskPGyN5C6aWK5MVO5rXA1Rl2FnK8FAUWKQ7Yqqveyp5HoQHz-66xi32drKWG42t2syt_Wf3-KAMF6lGzi_guGxvUgCOzj5D0K67zeQLJHAZtVY54YGzADlsOJpJuvdN79AJRa-8-qaYEATAnXnT3a3-nrmBFj0gj5EWuBpOZigRynW9c5k10BmWGlL6cKH6iNmk95u8CacNML4IPpW2g0JpGNBt2bBSa3-kYKx0_obEyejX';



const EarnSharePage: React.FC = () => {

  const { t } = useI18n();

  usePageTitle('earn.pageTitle', 'FANVERSE | Earn & Share');

  const location = useLocation();

  const { canWatchPlayEarn, loading: entLoading } = useEntitlements();

  const view = new URLSearchParams(location.search).get('view');

  const socialOnly = view === 'share';

  const blockEarn = !socialOnly && !entLoading && !canWatchPlayEarn;

  const xpHub = useXpEarnHub();

  useEffect(() => {
    if (socialOnly || blockEarn) return;
    void xpHub.refresh();
  }, [socialOnly, blockEarn, xpHub.refresh]);
  const xpHeaderPill = xpHub.loading ? '…' : formatXpPill(xpHub.availableXp);

  useEffect(() => {

    if (view !== 'share') return;

    document.getElementById('share-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  }, [location.search, view]);

  return (

    <div className="earn-share-page dark">

      {blockEarn ? (

        <main className="earn-mobile">

          <ScreenHeader title={t('earn.screenTitle')} xpLabel={xpHeaderPill} />

          <PremiumAccessWall />

        </main>

      ) : socialOnly ? (

        <main className="earn-share-main">

          <ScreenHeader title={t('share.screenTitle')} />

          <section id="share-section" className="es-section es-share-wrap">

            <div className="es-share-hero">

              <h2 className="es-share-headline">{t('earn.craftMoment')}</h2>

              <p className="es-share-sub">

                Use our AI clip generator to transform live action into social-ready masterpieces with

                holographic overlays.

              </p>

            </div>



            <div className="es-share-grid">

              <article className="es-glass es-editor-card">

                <div className="es-editor-stage" style={{ backgroundImage: `url(${imgStadium})` }}>

                  <div className="es-editor-hud">

                    <div className="es-hud-line">

                      <span className="material-symbols-outlined es-hud-cam">auto_videocam</span>

                      <span className="es-label-caps es-hud-text">MATCH MOMENT DETECTED: 6-HIT</span>

                    </div>

                    <div className="es-xp-pill">XP MULTIPLIER ACTIVE x1.5</div>

                  </div>

                  <div className="es-editor-bottom">

                    <div className="es-scrub">

                      <div className="es-scrub-track">

                        <div className="es-scrub-range" />

                        <div className="es-scrub-knob" />

                      </div>

                      <div className="es-player-row">

                        <div className="es-player-icons">

                          <span className="material-symbols-outlined es-player-ic">play_arrow</span>

                          <span className="material-symbols-outlined es-player-ic">skip_next</span>

                          <span className="material-symbols-outlined es-player-ic">volume_up</span>

                        </div>

                        <div className="es-overlay-btns">

                          <button type="button" className="es-chip-btn">

                            ADD XP OVERLAY

                          </button>

                          <button type="button" className="es-chip-btn">

                            CULTURAL MOTIF

                          </button>

                        </div>

                      </div>

                    </div>

                  </div>

                </div>

                <div className="es-editor-toolbar">

                  <div className="es-tool-icons">

                    <div className="es-tool-cell">

                      <div className="es-tool-box">

                        <span className="material-symbols-outlined">text_fields</span>

                      </div>

                      <span className="es-tool-label">CAPTION</span>

                    </div>

                    <div className="es-tool-cell">

                      <div className="es-tool-box es-tool-box--on">

                        <span className="material-symbols-outlined">sticker</span>

                      </div>

                      <span className="es-tool-label">STICKERS</span>

                    </div>

                    <div className="es-tool-cell">

                      <div className="es-tool-box">

                        <span className="material-symbols-outlined">music_note</span>

                      </div>

                      <span className="es-tool-label">AUDIO</span>

                    </div>

                  </div>

                  <div className="es-toolbar-actions">

                    <button type="button" className="es-btn-draft">

                      SAVE DRAFT

                    </button>

                    <button type="button" className="es-btn es-btn-cashout es-btn-share">

                      GENERATE &amp; SHARE

                    </button>

                  </div>

                </div>

              </article>



              <div className="es-side-col">

                <article className="es-glass es-sticker-card">

                  <div className="es-sticker-head">

                    <h3 className="es-label-caps">CALLIGRAPHY PACK</h3>

                    <span className="es-new-pill">NEW</span>

                  </div>

                  <div className="es-sticker-grid">

                    <button type="button" className="es-sticker-cell">

                      <span className="es-sticker-ar">وطن</span>

                    </button>

                    <button type="button" className="es-sticker-cell es-sticker-cell--gold">

                      <span className="material-symbols-outlined">stars</span>

                    </button>

                    <button type="button" className="es-sticker-cell es-sticker-cell--frame" aria-label="Frame" />

                    <button type="button" className="es-sticker-cell">

                      <span className="es-sticker-ar">قهرمان</span>

                    </button>

                    <button type="button" className="es-sticker-cell">

                      <span className="material-symbols-outlined es-ms-fill">shield</span>

                    </button>

                    <button type="button" className="es-sticker-cell es-sticker-cell--heart">

                      <span className="material-symbols-outlined">favorite</span>

                    </button>

                  </div>

                </article>



                <article className="es-glass es-leader-card">

                  <h3 className="es-label-caps es-leader-title">TOP CREATORS</h3>

                  <div className="es-creator-list">

                    <div className="es-creator-row">

                      <span className="es-creator-rank es-creator-rank--1">1</span>

                      <div className="es-creator-avatar es-creator-avatar--ring">

                        <img src={imgCreator1} alt="" loading="lazy" />

                      </div>

                      <div className="es-creator-info">

                        <p className="es-body-strong">@KabulKing</p>

                        <p className="es-micro">1.2M Views</p>

                      </div>

                      <span className="es-creator-xp">+12k XP</span>

                    </div>

                    <div className="es-creator-row">

                      <span className="es-creator-rank">2</span>

                      <div className="es-creator-avatar">

                        <img src={imgCreator2} alt="" loading="lazy" />

                      </div>

                      <div className="es-creator-info">

                        <p className="es-body-strong">@ZalaSports</p>

                        <p className="es-micro">890k Views</p>

                      </div>

                      <span className="es-creator-xp">+8k XP</span>

                    </div>

                  </div>

                  <button type="button" className="es-leaderboard-btn">

                    FULL LEADERBOARD

                  </button>

                </article>

              </div>

            </div>

          </section>



          <div className="es-chest">

            <div

              className="es-chest-pattern"

              style={{ backgroundImage: `url('${imgChestBg}')` }}

              aria-hidden

            />

            <div className="es-chest-icon-wrap">

              <div className="es-chest-glow" aria-hidden />

              <div className="es-chest-icon-ring">

                <span className="material-symbols-outlined es-chest-icon es-ms-fill">inventory_2</span>

              </div>

            </div>

            <div className="es-chest-copy">

              <h3 className="es-chest-title">DAILY MYSTERY CHEST</h3>

              <p className="es-subline">

                You have one unopened reward waiting from last night&apos;s match.

              </p>

              <div className="es-chest-timer">

                <span className="material-symbols-outlined es-timer-ic">timer</span>

                <span className="es-label-caps es-timer-text">EXPIRES IN 14H</span>

              </div>

            </div>

            <button type="button" className="es-btn es-btn-cashout es-chest-btn">

              OPEN NOW

            </button>

          </div>

        </main>

      ) : (

        <main className="earn-mobile" id="earn-section">

          <ScreenHeader title={t('earn.screenTitle')} xpLabel={xpHeaderPill} />

          <EarnHubPanel hub={xpHub} />

        </main>

      )}

    </div>

  );

};



export default EarnSharePage;

