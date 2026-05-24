import React from 'react';
import { Link } from 'react-router-dom';
import type { Language } from '../i18n';
import ScreenHeader from '../components/ScreenHeader';
import { useI18n, usePageTitle } from '../i18n';
import './SettingsPage.css';

const LANGUAGES: { code: Language; labelKey: 'lang.en' | 'lang.fa' | 'lang.ps' }[] = [
  { code: 'en', labelKey: 'lang.en' },
  { code: 'fa', labelKey: 'lang.fa' },
  { code: 'ps', labelKey: 'lang.ps' },
];

const SettingsPage: React.FC = () => {
  const { t, language, setLanguage } = useI18n();
  usePageTitle('settings.pageTitle', 'Settings | Fanverse');

  return (
    <main className="fv-settings-page">
      <ScreenHeader title={t('settings.title')} />
      <p className="fv-settings-sub">{t('settings.sub')}</p>
      <section className="fv-settings-section" aria-labelledby="settings-general">
        <h2 id="settings-general" className="fv-settings-section-title">
          {t('settings.general')}
        </h2>
        <div className="fv-settings-lang-block">
          <div className="fv-settings-row fv-settings-row--stack">
            <div>
              <span className="fv-settings-row-label">{t('settings.language')}</span>
              <p className="fv-settings-lang-hint">{t('settings.languageHint')}</p>
            </div>
            <div className="fv-settings-lang-options" role="group" aria-label={t('settings.language')}>
              {LANGUAGES.map(({ code, labelKey }) => (
                <button
                  key={code}
                  type="button"
                  className={`fv-settings-lang-btn${language === code ? ' fv-settings-lang-btn--active' : ''}`}
                  onClick={() => setLanguage(code)}
                  aria-pressed={language === code}
                >
                  {t(labelKey)}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="fv-settings-row">
          <span className="fv-settings-row-label">{t('settings.region')}</span>
          <span className="fv-settings-row-value">{t('settings.regionValue')}</span>
        </div>
      </section>
      <section className="fv-settings-section" aria-labelledby="settings-privacy">
        <h2 id="settings-privacy" className="fv-settings-section-title">
          {t('settings.privacy')}
        </h2>
        <div className="fv-settings-row">
          <span className="fv-settings-row-label">{t('settings.profileVisibility')}</span>
          <span className="fv-settings-row-value">{t('settings.public')}</span>
        </div>
      </section>
      <Link to="/profile" className="fv-settings-link">
        {t('settings.manageProfile')}
      </Link>
    </main>
  );
};

export default SettingsPage;
