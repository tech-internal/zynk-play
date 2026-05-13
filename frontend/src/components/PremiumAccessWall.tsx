import React from 'react';
import { Link } from 'react-router-dom';
import { useEntitlements } from '../context/EntitlementsContext';
import './PremiumAccessWall.css';

const PremiumAccessWall: React.FC = () => {
  const { loading, needsProfileCompletion, needsSubscription } = useEntitlements();

  if (loading) {
    return (
      <div className="premium-wall premium-wall--loading">
        <div className="premium-wall-panel">
          <p>Loading your access…</p>
        </div>
      </div>
    );
  }

  let headline = 'Subscribe to watch, play, and earn';
  let body =
    'Choose a plan and complete secure checkout. When your subscription is active, Watch, Play, and Earn unlock.';
  let primaryTo = '/subscription';
  let primaryLabel = 'View plans';

  if (needsProfileCompletion) {
    headline = 'Complete your profile';
    body =
      'Add your display name and public handle, then pick a plan and pay. You will unlock Watch, Play, and Earn.';
    primaryTo = '/profile?onboarding=1';
    primaryLabel = 'Complete profile';
  } else if (needsSubscription) {
    headline = 'Subscription required';
    body = 'Please subscribe to watch, play, and earn. Select a plan and complete payment to continue.';
    primaryTo = '/subscription';
    primaryLabel = 'View plans';
  }

  return (
    <div className="premium-wall">
      <div className="premium-wall-panel">
        <h2>{headline}</h2>
        <p>{body}</p>
        <div className="premium-wall-actions">
          <Link to={primaryTo} className="premium-wall-btn">
            {primaryLabel}
          </Link>
          <Link to="/dashboard" className="premium-wall-link">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PremiumAccessWall;
