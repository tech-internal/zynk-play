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



const EarnSharePage: React.FC = () => {

  const { t } = useI18n();

  usePageTitle('earn.pageTitle', 'FANVERSE | Earn & Share');

  const location = useLocation();

  const { canWatchPlayEarn, loading: entLoading } = useEntitlements();

  const view = new URLSearchParams(location.search).get('view');

  const socialOnly = view === 'share';

  const blockEarn = !socialOnly && !entLoading && !canWatchPlayEarn;

  const xpHub = useXpEarnHub();
  const { refresh: refreshXpHub } = xpHub;

  useEffect(() => {
    if (socialOnly || blockEarn) return;
    void refreshXpHub();
  }, [socialOnly, blockEarn, refreshXpHub]);
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

          <ScreenHeader title={t('share.screenTitle')} xpLabel={xpHeaderPill} />

          <section id="share-section" className="es-share-coming">
            <div className="es-share-coming__icon" aria-hidden>
              <span className="material-symbols-outlined">campaign</span>
            </div>
            <h2 className="es-share-coming__title">Coming Soon</h2>
            <p className="es-share-coming__text">
              Something exciting is on the way. This social space will let you capture your favorite match
              moments, craft reels, and share on Facebook and other platforms.
            </p>
            <p className="es-share-coming__text">
              Watch. Create. Share. Earn.
            </p>
          </section>

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

