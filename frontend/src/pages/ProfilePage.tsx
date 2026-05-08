import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './ProfilePage.css';

const ProfilePage: React.FC = () => {
  useEffect(() => {
    document.title = 'Game Plazio - User Profile';
  }, []);

  return (
    <div className="fanverse-profile-page">
      <main className="fanverse-main">
        <section className="fanverse-profile-hero">
          <div className="fanverse-avatar-wrap">
            <div className="fanverse-avatar-ring">
              <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCOhN2JII_NaJMChEafkeG_8nOJy6WpaaL00AjYhusN-PyUhmlozyh0LvppigFkjmcs_namjKPzALGzyI8XSPV9kdNiyb6MgftXVsz0ipPxkMCo_838vYImH3O4dp1fxYY5ZFtmjo5pnwSYdO2M9zMPzAPW2OhRn-gvcI2yzkf3ZrE3S6A5nl_ArZ-OiVdI3pdcm2CgCDFfI6tt4A2T_Q91qaNWWHsrKMZ7JvJsQML4sy-LNzL9VZQllio8N5hlianRa7eI-xkXS8p8" alt="User Avatar" />
            </div>
            <div className="fanverse-verified-badge">
              <span className="material-symbols-outlined">verified</span>
            </div>
          </div>
          <div className="fanverse-hero-text">
            <div className="fanverse-kicker">SOVEREIGN ATHLETE</div>
            <h1>AHMAD_WARRIOR</h1>
            <div className="fanverse-meta-row">
              <span className="fanverse-rank">Pro-Elite Rank</span>
              <span className="fanverse-joined">- Joined Jan 2024</span>
            </div>
          </div>
        </section>
        <section className="fanverse-grid">
          <div className="fanverse-col-main">
            <div className="fanverse-card fanverse-plus-card">
              <div className="fanverse-plus-watermark"><span className="material-symbols-outlined">workspace_premium</span></div>
              <div className="fanverse-plus-head">
                <div>
                  <h3>GAME PLAZIO PLUS</h3>
                  <p>Unlock the full cinematic arena and sovereign rewards.</p>
                </div>
                <div className="fanverse-status-pill">
                  <span className="material-symbols-outlined">lock</span>
                  <span>INACTIVE</span>
                </div>
              </div>
              <div className="fanverse-feature-grid">
                <div className="fanverse-feature-card">
                  <span className="material-symbols-outlined">sports_esports</span>
                  <div className="title">Play Access</div>
                  <div className="state">LOCKED</div>
                </div>
                <div className="fanverse-feature-card">
                  <span className="material-symbols-outlined">payments</span>
                  <div className="title">Earn Rewards</div>
                  <div className="state">LOCKED</div>
                </div>
              </div>
              <button type="button" className="fanverse-primary-btn">
                UPGRADE TO GAME PLAZIO PLUS
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
            <div className="fanverse-card fanverse-info-card">
              <h4>PERSONAL INFORMATION</h4>
              <div className="fanverse-info-grid">
                <div className="fanverse-info-field"><label>Full Name</label><div>Ahmad Rahimi</div></div>
                <div className="fanverse-info-field"><label>Email Address</label><div>ahmad.warrior@gameplazio.af</div></div>
                <div className="fanverse-info-field"><label>Region</label><div>Kabul, Afghanistan</div></div>
                <div className="fanverse-info-field"><label>Language</label><div>Dari / Pashto</div></div>
              </div>
              <button type="button" className="fanverse-link-btn"><span className="material-symbols-outlined">edit</span>Edit Details</button>
            </div>
          </div>
          <div className="fanverse-col-side">
            <div className="fanverse-card">
              <h4>CONNECTED ACCOUNTS</h4>
              <div className="fanverse-provider-card">
                <div className="fanverse-provider-left">
                  <div className="fanverse-provider-icon"><span className="material-symbols-outlined">cell_tower</span></div>
                  <div><div className="provider-name">AWCC Mobile</div><div className="provider-number">070-XXX-XXXX</div></div>
                </div>
                <span className="material-symbols-outlined fanverse-check-icon">check_circle</span>
              </div>
              <button type="button" className="fanverse-outline-btn">Connect New Provider</button>
            </div>
            <div className="fanverse-card">
              <h4>APP SETTINGS</h4>
              <div className="fanverse-settings-list">
                <div className="fanverse-setting-row">
                  <div className="fanverse-setting-left"><span className="material-symbols-outlined">dark_mode</span><span>Cinematic Theme</span></div>
                  <div className="fanverse-toggle fanverse-toggle-on"><div className="knob" /></div>
                </div>
                <div className="fanverse-setting-row">
                  <div className="fanverse-setting-left"><span className="material-symbols-outlined">notifications_active</span><span>Live Match Alerts</span></div>
                  <div className="fanverse-toggle fanverse-toggle-on"><div className="knob" /></div>
                </div>
                <Link to="/history" className="fanverse-setting-row" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="fanverse-setting-left"><span className="material-symbols-outlined">receipt_long</span><span>Transaction History</span></div>
                  <span className="material-symbols-outlined fanverse-chevron">chevron_right</span>
                </Link>
                <div className="fanverse-setting-row">
                  <div className="fanverse-setting-left"><span className="material-symbols-outlined">security</span><span>Privacy &amp; Security</span></div>
                  <span className="material-symbols-outlined fanverse-chevron">chevron_right</span>
                </div>
                <div className="fanverse-setting-row">
                  <div className="fanverse-setting-left fanverse-danger"><span className="material-symbols-outlined">logout</span><span>Logout Session</span></div>
                </div>
              </div>
            </div>
            <div className="fanverse-footer-mark">
              <div className="fanverse-version">GAME PLAZIO V2.0</div>
              <div className="fanverse-powered">POWERED BY AFGHAN TELECOM</div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ProfilePage;
