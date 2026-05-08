import React from 'react';
import './ApiLoaderOverlay.css';

type ApiLoaderOverlayProps = {
  active: boolean;
  label?: string;
};

const ApiLoaderOverlay: React.FC<ApiLoaderOverlayProps> = ({ active, label = 'Loading match center...' }) => {
  if (!active) return null;
  return (
    <div className="api-loader-overlay" role="status" aria-live="polite" aria-busy="true">
      <div className="api-loader-card">
        <div className="api-loader-rings" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <p className="api-loader-text">{label}</p>
        <p className="api-loader-sub">Please wait while we sync your account and subscription.</p>
      </div>
    </div>
  );
};

export default ApiLoaderOverlay;
