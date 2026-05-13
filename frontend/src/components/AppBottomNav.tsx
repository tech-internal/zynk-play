import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useEntitlements } from '../context/EntitlementsContext';
import './AppBottomNav.css';

const iconFill = { fontVariationSettings: "'FILL' 1" } as const;

const AppBottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { canWatchPlayEarn, loading, needsProfileCompletion, needsSubscription } = useEntitlements();
  const [gateOpen, setGateOpen] = useState(false);
  const [gateMessage, setGateMessage] = useState('');

  const shareView = new URLSearchParams(location.search).get('view') === 'share';
  const earnActive = location.pathname === '/earn-share' && !shareView;
  const socialActive = location.pathname === '/earn-share' && shareView;

  const primaryLinkClass = ({ isActive }: { isActive: boolean }) =>
    `app-bottom-link${isActive ? ' app-bottom-link--active' : ''}`;

  const premiumMessage = () => {
    if (needsProfileCompletion) {
      return 'Please complete your profile (name and handle), then choose a plan and pay. After that you can watch, play, and earn.';
    }
    if (needsSubscription) {
      return 'Please subscribe to watch, play, and earn. Choose a plan and complete payment to unlock these tabs.';
    }
    return 'Please subscribe to watch, play, and earn.';
  };

  const tryPremiumNav = (path: string, state?: { view?: string }) => {
    if (loading) {
      return;
    }
    if (canWatchPlayEarn) {
      if (state?.view) {
        navigate({ pathname: path, search: `?view=${state.view}` });
      } else {
        navigate(path);
      }
      return;
    }
    setGateMessage(premiumMessage());
    setGateOpen(true);
  };

  return (
    <>
      <nav className="app-bottom-nav" aria-label="Mobile primary">
        <NavLink to="/dashboard" end className={primaryLinkClass}>
          {({ isActive }) => (
            <>
              {isActive ? <span className="app-bottom-link__pip" aria-hidden /> : null}
              <span className="material-symbols-outlined" style={isActive ? iconFill : undefined}>
                grid_view
              </span>
              <span className="app-bottom-label">Home</span>
            </>
          )}
        </NavLink>
        <button
          type="button"
          className={`app-bottom-link app-bottom-link--btn${location.pathname === '/streaming' ? ' app-bottom-link--active' : ''}`}
          onClick={() => tryPremiumNav('/streaming')}
        >
          {location.pathname === '/streaming' ? <span className="app-bottom-link__pip" aria-hidden /> : null}
          <span
            className="material-symbols-outlined"
            style={location.pathname === '/streaming' ? iconFill : undefined}
          >
            sensors
          </span>
          <span className="app-bottom-label">Watch</span>
        </button>
        <button
          type="button"
          className={`app-bottom-link app-bottom-link--btn${location.pathname === '/gameplay' ? ' app-bottom-link--active' : ''}`}
          onClick={() => tryPremiumNav('/gameplay')}
        >
          {location.pathname === '/gameplay' ? <span className="app-bottom-link__pip" aria-hidden /> : null}
          <span
            className="material-symbols-outlined"
            style={location.pathname === '/gameplay' ? iconFill : undefined}
          >
            sports_esports
          </span>
          <span className="app-bottom-label">Play</span>
        </button>
        <button
          type="button"
          className={`app-bottom-link app-bottom-link--earn-slot app-bottom-link--btn${
            earnActive ? ' app-bottom-link--active-earn' : ''
          }`}
          onClick={() => tryPremiumNav('/earn-share', { view: 'earn' })}
        >
          {earnActive ? <span className="app-bottom-link__pip app-bottom-link__pip--earn" aria-hidden /> : null}
          <span className="material-symbols-outlined" style={earnActive ? iconFill : undefined}>
            workspace_premium
          </span>
          <span className="app-bottom-label">Earn</span>
        </button>
        <NavLink
          to={{ pathname: '/earn-share', search: '?view=share' }}
          className={() => `app-bottom-link${socialActive ? ' app-bottom-link--active' : ''}`}
        >
          <>
            {socialActive ? <span className="app-bottom-link__pip" aria-hidden /> : null}
            <span className="material-symbols-outlined" style={socialActive ? iconFill : undefined}>
              hub
            </span>
            <span className="app-bottom-label">Social</span>
          </>
        </NavLink>
      </nav>

      {gateOpen ? (
        <div className="app-bottom-gate-root" role="dialog" aria-modal="true" aria-labelledby="app-bottom-gate-title">
          <button type="button" className="app-bottom-gate-backdrop" aria-label="Close" onClick={() => setGateOpen(false)} />
          <div className="app-bottom-gate-panel">
            <h2 id="app-bottom-gate-title">Fanverse Plus</h2>
            <p className="app-bottom-gate-body">{gateMessage}</p>
            <div className="app-bottom-gate-actions">
              <button
                type="button"
                className="app-bottom-gate-primary"
                onClick={() => {
                  setGateOpen(false);
                  navigate(needsProfileCompletion ? '/profile?onboarding=1' : '/subscription');
                }}
              >
                {needsProfileCompletion ? 'Complete profile' : 'View plans'}
              </button>
              <button type="button" className="app-bottom-gate-secondary" onClick={() => setGateOpen(false)}>
                Not now
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default AppBottomNav;
