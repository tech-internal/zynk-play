import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n';
import { useWatchXp } from '../context/WatchXpContext';
import './ScreenHeader.css';

export type ScreenHeaderProps = {
  title?: string;
  /** Hide center title (back + right slot only) */
  hideTitle?: boolean;
  /** Right slot; defaults to XP pill when omitted */
  right?: React.ReactNode;
  xpLabel?: string;
  onBack?: () => void;
  className?: string;
};

const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title = '',
  hideTitle = false,
  right,
  xpLabel,
  onBack,
  className = '',
}) => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { availableXp, loading } = useWatchXp();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    navigate(-1);
  };

  const rightContent =
    right ?? (
      <div className="scr-xp-pill">{xpLabel ?? `⚡ ${loading ? '...' : availableXp.toLocaleString()}`}</div>
    );

  return (
    <header
      className={`scr-header${hideTitle ? ' scr-header--no-title' : ''}${className ? ` ${className}` : ''}`}
    >
      <button
        type="button"
        className="scr-back"
        onClick={handleBack}
        aria-label={t('common.back')}
      >
        ‹
      </button>
      {!hideTitle ? <div className="scr-title">{title}</div> : null}
      <div className="scr-header__right">{rightContent}</div>
    </header>
  );
};

export default ScreenHeader;
