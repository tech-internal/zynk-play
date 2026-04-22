import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

const HomePage: React.FC = () => {
  useEffect(() => {
    document.title = 'Game Palazio — Stream & Play';
  }, []);

  return (
    <div className="landing">
      <div className="landing-bg" aria-hidden="true">
        <div className="orb orb-a" />
        <div className="orb orb-b" />
        <div className="orb orb-c" />
        <div className="grid-overlay" />
      </div>

      <section className="landing-hero">
        <p className="landing-eyebrow">All-in-one entertainment</p>
        <h1 className="landing-title">
          Experience streaming and gaming
          <span className="landing-title-accent"> like never before</span>
        </h1>
        <p className="landing-lead">
          Log in to play and watch — one account for live streams, cricket, and your favourite games.
        </p>
        <div className="landing-cta-row">
          <Link to="/login" className="btn-primary-landing">
            Log in to play &amp; watch
          </Link>
          <Link to="/dashboard" className="btn-ghost-landing">
            Explore the app
          </Link>
        </div>
        <div className="landing-stats" aria-label="Highlights">
          <div className="landing-stat">
            <span className="landing-stat-val">Live</span>
            <span className="landing-stat-label">Streams</span>
          </div>
          <div className="landing-stat">
            <span className="landing-stat-val">Browser</span>
            <span className="landing-stat-label">Games</span>
          </div>
          <div className="landing-stat">
            <span className="landing-stat-val">OTP</span>
            <span className="landing-stat-label">Secure login</span>
          </div>
        </div>
        <p className="landing-note">Secure sign-in with a one-time code. No password to remember.</p>
      </section>

      <section className="landing-cards" aria-label="Highlights">
        <article className="feature-card">
          <span className="feature-icon" aria-hidden="true">▶</span>
          <h2>Streaming</h2>
          <p>Crisp live and on-demand video with a player tuned for smooth playback.</p>
        </article>
        <article className="feature-card">
          <span className="feature-icon" aria-hidden="true">◎</span>
          <h2>Gaming</h2>
          <p>Launch titles from your browser with fullscreen and quick reload when you need it.</p>
        </article>
        <article className="feature-card">
          <span className="feature-icon" aria-hidden="true">✦</span>
          <h2>One place</h2>
          <p>Dashboard, streams, and gameplay — connected in a single polished experience.</p>
        </article>
      </section>
    </div>
  );
};

export default HomePage;
