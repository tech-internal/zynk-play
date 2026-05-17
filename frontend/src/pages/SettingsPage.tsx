import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './SettingsPage.css';

const SettingsPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Settings | Fanverse';
  }, []);

  return (
    <main className="fv-settings-page">
      <header className="fv-settings-head">
        <h1 className="fv-settings-title">Settings</h1>
        <p className="fv-settings-sub">Preferences, privacy, and account controls</p>
      </header>
      <section className="fv-settings-section" aria-labelledby="settings-general">
        <h2 id="settings-general" className="fv-settings-section-title">
          General
        </h2>
        <div className="fv-settings-row">
          <span>Language</span>
          <span className="fv-settings-value">English</span>
        </div>
        <div className="fv-settings-row">
          <span>Region</span>
          <span className="fv-settings-value">Global</span>
        </div>
      </section>
      <section className="fv-settings-section" aria-labelledby="settings-privacy">
        <h2 id="settings-privacy" className="fv-settings-section-title">
          Privacy
        </h2>
        <div className="fv-settings-row">
          <span>Profile visibility</span>
          <span className="fv-settings-value">Public</span>
        </div>
      </section>
      <Link to="/profile" className="fv-settings-link">
        Manage profile
      </Link>
    </main>
  );
};

export default SettingsPage;
