import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n';
import './ScreenHeader.css';

export type ScreenHeaderProps = {
  title: string;
  /** Right slot; defaults to XP pill when omitted */
  right?: React.ReactNode;
  xpLabel?: string;
  onBack?: () => void;
  className?: string;
};

const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  right,
  xpLabel,
  onBack,
  className = '',
}) => {
  const navigate = useNavigate();
  const { t } = useI18n();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    navigate(-1);
  };

  const rightContent =
    right ?? (
      <div className="scr-xp-pill">{xpLabel ?? t('header.xpPill', '⚡ 4.2K')}</div>
    );

  return (
    <header className={`scr-header${className ? ` ${className}` : ''}`}>
      <button
        type="button"
        className="scr-back"
        onClick={handleBack}
        aria-label={t('common.back')}
      >
        ‹
      </button>
      <div className="scr-title">{title}</div>
      <div className="scr-header__right">{rightContent}</div>
    </header>
  );
};

export default ScreenHeader;
