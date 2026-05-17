import React, { useEffect, useState } from 'react';
import './ApiLoaderOverlay.css';

const STATUS_LINES = [
  'Calibrating live arena feed…',
  'Syncing elite profile…',
  'Loading watch · play · win · share…',
  'Verifying secure session…',
];

type ApiLoaderOverlayProps = {
  active: boolean;
  label?: string;
  subline?: string;
};

const ApiLoaderOverlay: React.FC<ApiLoaderOverlayProps> = ({
  active,
  label = 'Entering the arena',
  subline,
}) => {
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    if (!active) {
      setLineIndex(0);
      return undefined;
    }
    const id = window.setInterval(() => {
      setLineIndex((i) => (i + 1) % STATUS_LINES.length);
    }, 2400);
    return () => window.clearInterval(id);
  }, [active]);

  if (!active) return null;

  const hint = subline ?? STATUS_LINES[lineIndex];

  return (
    <div className="api-loader-overlay" role="status" aria-live="polite" aria-busy="true">
      <div className="api-loader-backdrop" aria-hidden />
      <div className="api-loader-grid" aria-hidden />

      <div className="api-loader-stage">
        <p className="api-loader-brand" aria-hidden>
          FANVERSE<span className="api-loader-brand-accent">ELITE</span>
        </p>

        <div className="api-loader-portal" aria-hidden>
          <span className="api-loader-ring api-loader-ring--outer" />
          <span className="api-loader-ring api-loader-ring--mid" />
          <span className="api-loader-ring api-loader-ring--inner" />
          <span className="api-loader-core">
            <span className="material-symbols-outlined api-loader-core-icon">bolt</span>
          </span>
        </div>

        <p className="api-loader-text">{label}</p>
        <p className="api-loader-sub" key={hint}>
          {hint}
        </p>

        <div className="api-loader-track" aria-hidden>
          <span className="api-loader-track-fill" />
        </div>
      </div>
    </div>
  );
};

export default ApiLoaderOverlay;
