import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './SubscriptionPage.css';

const SubscriptionPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Game Palazio | Subscription';
  }, []);

  return (
    <div className="subscription-page">
      <main className="subscription-main">
        <section className="subscription-hero">
          <div className="subscription-kicker-wrap">
            <span className="subscription-kicker">PREMIUM ACCESS</span>
          </div>
          <h1 className="subscription-title">
            GAME PLAZIO <span>PLUS</span>
          </h1>
          <p className="subscription-lead">
            Elevate your fan experience to sovereign levels. Command the stadium with exclusive rewards, accelerated
            growth, and limitless connectivity.
          </p>
          <div className="subscription-hero-actions">
            <Link to="/profile" className="subscription-action ghost">
              Account settings
            </Link>
            <Link to="/dashboard" className="subscription-action solid">
              Back to dashboard
            </Link>
          </div>
        </section>

        <section className="benefits-grid">
          <article className="benefit-card benefit-wide">
            <span className="material-symbols-outlined">sports_esports</span>
            <h3>Unlock Play Arena</h3>
            <p>Access high-stakes competitive matches and exclusive tournaments limited to Plus members only.</p>
          </article>
          <article className="benefit-card">
            <div className="xp-badge">5X</div>
            <h3>XP MULTIPLIER</h3>
            <p>Ascend the leaderboards at lightning speed.</p>
          </article>
          <article className="benefit-card">
            <span className="material-symbols-outlined">cell_tower</span>
            <h3>AWCC ZERO-RATED</h3>
            <p>Stream live matches and play without consuming your data balance.</p>
          </article>
          <article className="benefit-card benefit-full">
            <span className="material-symbols-outlined">payments</span>
            <div>
              <h3>Unlock Earn Marketplace</h3>
              <p>Trade exclusive digital collectibles and monetize your fan achievements.</p>
            </div>
          </article>
        </section>

        <section className="pricing-grid">
          <article className="price-card">
            <h4>Monthly Pass</h4>
            <div className="price-row">
              <span>450</span>
              <small>POOLAM / MO</small>
            </div>
            <ul className="pass-points">
              <li>Basic Arena Access</li>
              <li>2x XP Booster</li>
              <li>Marketplace Browsing</li>
            </ul>
            <button type="button" className="select-btn">
              SELECT PLAN
            </button>
          </article>

          <article className="price-card featured">
            <span className="featured-pill">BEST VALUE</span>
            <h4>Season Pass</h4>
            <div className="price-row">
              <span>1,200</span>
              <small>AFN / SEASON</small>
            </div>
            <ul className="pass-points">
              <li>All Plus Benefits Included</li>
              <li>5x XP Multiplier (Permanent)</li>
              <li>Unlimited Zero-Rated Data</li>
              <li>Exclusive Afghan Motif Avatar Frame</li>
            </ul>
            <button type="button" className="upgrade-btn">
              UPGRADE NOW
            </button>
          </article>
        </section>

        <p className="muted page-note">This page is currently a UI-only placeholder for non-subscribed users.</p>
      </main>
    </div>
  );
};

export default SubscriptionPage;
