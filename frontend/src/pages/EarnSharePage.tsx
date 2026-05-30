import React, { useEffect, useRef } from 'react';

import { useLocation } from 'react-router-dom';

import ApiLoaderOverlay from '../components/ApiLoaderOverlay';
import LuckyDrawPanel from '../components/LuckyDrawPanel';
import PremiumAccessWall from '../components/PremiumAccessWall';
import EarnHubPanel from '../components/EarnHubPanel';
import ScreenHeader from '../components/ScreenHeader';
import { useLuckyDraws } from '../hooks/useLuckyDraws';
import { useXpBalance } from '../hooks/useXpBalance';
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

  const xpHub = useXpEarnHub({ enabled: !socialOnly });
  const xpBalance = useXpBalance({ enabled: socialOnly });
  const luckyDraw = useLuckyDraws();

  const prevBlockEarn = useRef(blockEarn);
  useEffect(() => {
    if (prevBlockEarn.current && !blockEarn) {
      void xpHub.refresh();
    }
    prevBlockEarn.current = blockEarn;
  }, [blockEarn, xpHub]);

  const availableXp = socialOnly ? xpBalance.availableXp : xpHub.availableXp;
  const xpLoading = socialOnly ? xpBalance.loading : xpHub.loading;
  const refreshXp = socialOnly ? xpBalance.refresh : xpHub.refresh;

  const xpHeaderPill = xpLoading ? '…' : formatXpPill(availableXp);
  const sharePageLoading = socialOnly && (xpLoading || luckyDraw.loading);

  useEffect(() => {
    if (view !== 'share') return;
    document.getElementById('share-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [location.search, view]);

  return (
    <div className="earn-share-page dark">
      {socialOnly ? (
        <ApiLoaderOverlay
          active={sharePageLoading}
          label={t('share.luckyDraws.loading', 'Loading lucky draws…')}
          subline={t('share.luckyDraws.loadingHint', 'Fetching live draws and your XP balance…')}
        />
      ) : null}

      {blockEarn ? (
        <main className="earn-mobile">
          <ScreenHeader title={t('earn.screenTitle')} xpLabel={xpHeaderPill} />
          <PremiumAccessWall />
        </main>
      ) : socialOnly ? (
        <main className="earn-share-main">
          <ScreenHeader hideTitle xpLabel={xpHeaderPill} />

          {!sharePageLoading ? (
            <LuckyDrawPanel
              availableXp={availableXp}
              hub={luckyDraw}
              onEnterSuccess={() => void refreshXp()}
            />
          ) : null}
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
