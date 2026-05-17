import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { hubNavItems } from '../config/hubNav';
import { useEntitlements } from '../context/EntitlementsContext';
import './AppBottomNav.css';

const iconFill = { fontVariationSettings: "'FILL' 1" } as const;

const AppBottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { canWatchPlayEarn, loading, needsProfileCompletion, needsSubscription } = useEntitlements();
  const [gateOpen, setGateOpen] = useState(false);
  const [gateMessage, setGateMessage] = useState('');

  const premiumMessage = () => {
    if (needsProfileCompletion) {
      return 'Please complete your profile (name and handle), then choose a plan and pay. After that you can watch, play, and earn.';
    }
    if (needsSubscription) {
      return 'Please subscribe to watch, play, and earn. Choose a plan and complete payment to unlock these tabs.';
    }
    return 'Please subscribe to watch, play, and earn.';
  };

  const tryNavigate = (item: (typeof hubNavItems)[number]) => {
    if (item.premium && !loading && !canWatchPlayEarn) {
      setGateMessage(premiumMessage());
      setGateOpen(true);
      return;
    }
    navigate(item.to);
  };

  return (
    <>
      <nav className="app-bottom-nav" aria-label="Mobile primary">
        {hubNavItems.map((item) => {
          const isActive = item.match(location.pathname, location.search);
          const content = (
            <>
              <div className={`app-bottom-nav__icon${isActive ? ' app-bottom-nav__icon--active' : ''}`}>
                <span
                  className="material-symbols-outlined"
                  style={isActive ? iconFill : undefined}
                  aria-hidden
                >
                  {item.icon}
                </span>
              </div>
              <span className="app-bottom-nav__label">{item.label}</span>
            </>
          );

          if (item.premium) {
            return (
              <button
                key={item.label}
                type="button"
                className={`app-bottom-nav__link app-bottom-nav__link--btn${isActive ? ' app-bottom-nav__link--active' : ''}`}
                onClick={() => tryNavigate(item)}
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              key={item.label}
              to={item.to}
              className={`app-bottom-nav__link${isActive ? ' app-bottom-nav__link--active' : ''}`}
            >
              {content}
            </Link>
          );
        })}
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
