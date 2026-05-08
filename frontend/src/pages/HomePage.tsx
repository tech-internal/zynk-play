import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

const HomePage: React.FC = () => {
  useEffect(() => {
    document.title = 'Game Plazio | The Sovereign Afghan Arena';
  }, []);

  return (
    <main className="gp-home">
      <section className="gp-hero stadium-gradient">
        <div className="gp-hero-image">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBEAXvHj62SPf3ggNg3PbFDix7hXcKwe3PhbRXrMbM6ckZF-_ZWJiDG0S20X2u372FvI7wO9NM7EtUK1-rqsjjHFqbyKKLsrQYMXrIlahoNRuNCZpRleM3x4B96UEZbJUUfdESNLmdZKfjHPNkJ5fyCIC5YrmoOTOz9ANHSm4mCDcwKwpvk1y8Oz2-Jqf9FHDGxy9UYzraFJ8rSzWTxTFZ-ASPTBOzqKjhMIV6vfZjxJseskGlc-OC8DnD3e1gCogejRAnN9w1DcBNc"
            alt="Cinematic Stadium"
          />
        </div>
        <div className="gp-container">
          <div className="gp-badge">
            <span className="gp-dot" />
            <span>NOW LIVE: AFGHAN PREMIER LEAGUE</span>
          </div>
          <h1 className="gp-hero-title">
            THE ARENA <br /> <span>IS YOURS</span>
          </h1>
          <p className="gp-hero-copy">
            Experience the next generation of sports in Afghanistan. Watch Live, Play Fantasy, Earn Rewards,
            and Share your moments in the world&apos;s first sovereign Game Plazio experience.
          </p>
          <div className="gp-hero-cta">
            <Link to="/login" className="gp-btn gp-btn-primary">
              ENTER THE ARENA
            </Link>
            <a className="gp-btn gp-btn-secondary" href="#fan-loop">
              EXPLORE FEATURES
            </a>
          </div>
        </div>
        <div className="gp-ticker-wrap">
          <div className="gp-ticker">
            <div>
              <strong>ACTIVE FANS:</strong> <span>42,891</span>
            </div>
            <div>
              <strong>XP EARNED TODAY:</strong> <span>1.2M+</span>
            </div>
            <div>
              <strong>LIVE MATCHES:</strong> <span>04</span>
            </div>
            <div>
              <strong>REWARDS DISTRIBUTED:</strong> <span>840GB</span>
            </div>
          </div>
        </div>
      </section>

      <section id="fan-loop" className="gp-section gp-fan-loop">
        <div className="gp-container">
          <h2>THE FAN LOOP</h2>
          <div className="gp-cards">
            <article className="gp-card">
              <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCjurLB-FjDvPprXyC9k7qZSZXG4KdvC5u81wNIDL4qc8uIBk7sk8p1yXW9zsMIhVV5VZwGYuGCgLoyzGL6ZWFTpVwd9y0ozeYulMQ9FN5cBCMxyPg7snoqo9x1u4CKZU41oc5p2NaFoiFJt_ZHJhou4RoQ2ei8Ss3P5uqsXGvjAv6CMpdEwMUOVmKuqIbwM9lmVU8RO8eJsR2d_4dYmnDBfWhlZRakWrFp576cCSM47Id8D_1GPhVO00xx3i2K9nyXxOBsu7crJbD4" alt="Watch Live" />
              <h3>WATCH</h3>
              <p>Broadcast-grade live matches with multi-angle feeds, real-time heatmaps, and XP progression as you spectate.</p>
              <Link to="/streaming">GO LIVE</Link>
            </article>
            <article className="gp-card">
              <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCVJr2kMq1UD6LoT7VBzrBei5s6TGXvjAMihWeIx6_27K8IJh3936-uUJlI139L89UC_DHoQzSiyIg9qC09lo4CdQ2Cf_kTbKp7M60QN857vO8WkiuOzsQ3wl7890NnjtD1Oavr-IXBdreMB-w9sEg2tjcpnsWMLU8BV2CqrsyZER7n0GP3ia1oK_J4eGrZaSyDFM8SzT5e0k7P980y5mLmEDdjUIHb0uDhtQjXghu5wd_GPqCx0TeMNQrjXcgY-UCfMfrNRsgpA117" alt="Play Fantasy" />
              <h3>PLAY</h3>
              <p>Build your RPG avatar, join Fantasy leagues, and predict match outcomes to prove your sports knowledge.</p>
              <Link to="/gameplay">DRAFT TEAM</Link>
            </article>
            <article className="gp-card">
              <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBFLLriKeW_CgqvwMUmwbJ7-xLW889BGrt8dhz33okP2-piYd0u1RcAzyBfSMO74ft1jeyhnhYbsqefjkWye7CVAerTR8U1U-Mff1qNeh0ip9rGG-nzvFIhaz8J8dN61ns1Vhvtnhm9Hvkav0fIcaWgxt2RA2s8T-LVONATcfUZiyOsUkr-B4ILmqdNMZPEWlTzMan98X_-_du-CE50xoNR-lvJZLgyxjZOFEN6Ii2jHjqKMLDSmhlefcIq8wh0UbGdCiLS4we_o8Xq" alt="Earn Rewards" />
              <h3>EARN</h3>
              <p>Convert your passion into Poolam tokens. Redeem your activity for real-world data packs, merch, and tickets.</p>
              <Link to="/earn-share?view=earn">REDEEM XP</Link>
            </article>
            <article className="gp-card">
              <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuD2xUoSIYUr-E3muExXHJBzY3BT8V_ddwsy3lCPfbkVD9HZ05cGbWzbZ2aC-n0YVfWCgSUl5y9qO1YZasD0WJXPnODikLTKoCDe408ShLKDAuZxMjP9ausiRzqwqLLxI76e0Lf8Uz67Ny5eVp4zUJ-kWIxmEAi5V9r-cw3nHqR6kydcGQySWIDf3q_RbioWj5IPrV5LvOKfmuutLW_lJYKKn4euHuOgizTL0cQlJUC0-o96jNEXyehy2MCnDrpYjARfAwQbcmcO-XQN" alt="Share Moments" />
              <h3>SHARE</h3>
              <p>Create AI-powered highlights with cultural calligraphy and climb the leaderboards to win creator multipliers.</p>
              <Link to="/earn-share?view=share">CREATE CLIP</Link>
            </article>
          </div>
        </div>
      </section>

      <section className="gp-section gp-activity">
        <div className="gp-container gp-activity-grid">
          <div className="gp-activity-panel">
            <div className="gp-activity-head">
              <div>
                <h3>ARENA ACTIVITY</h3>
                <p>Real-time engagement across Afghanistan</p>
              </div>
              <div>
                <strong>12.4M</strong>
                <span>TOTAL XP DISTRIBUTED</span>
              </div>
            </div>
            <div className="gp-feed-item"><p>Ahmad Shah</p><small>JUST REDEEMED: 5GB DATA PACK</small><em>+500 XP</em></div>
            <div className="gp-feed-item"><p>Kabul Kings Fan</p><small>PREDICTION STREAK: 5 MATCHES</small><em>+1,200 XP</em></div>
            <div className="gp-feed-item"><p>Zaranj Warrior</p><small>WATCHING: AFG VS IND LIVE</small><em>+50 XP</em></div>
          </div>
          <aside className="gp-partner-panel">
            <h4>AWCC × ATN</h4>
            <h3>POWERED BY NATIONAL PRIDE</h3>
            <p>Exclusive zero-rated data access for AWCC Cloud+ subscribers and high-definition ATN broadcasts.</p>
            <div className="gp-boost">
              <strong>GAME PLAZIO BOOST</strong>
              <p>Connect your AWCC account to get a 2x XP multiplier on all activities.</p>
              <button type="button">LINK ACCOUNT</button>
            </div>
          </aside>
        </div>
      </section>

      <section className="gp-section gp-cta">
        <div className="gp-container">
          <div className="gp-cta-card">
            <h2>READY TO JOIN?</h2>
            <p>The stadium is filling up. Claim your unique fan handle and start your journey today.</p>
            <Link to="/login" className="gp-btn gp-btn-primary">
              CREATE FREE ACCOUNT
            </Link>
            <small>NO DATA CHARGES FOR AWCC USERS</small>
          </div>
        </div>
      </section>

      <footer className="gp-footer">
        <div className="gp-container">
          <div className="gp-footer-grid">
            <div>
              <h3>GAME PLAZIO</h3>
              <p>The world&apos;s first digital sports ecosystem designed specifically for the Afghan fan community.</p>
            </div>
            <div>
              <h4>ECOSYSTEM</h4>
              <a href="#">Watch Live</a>
              <a href="#">Fantasy Sports</a>
              <a href="#">XP &amp; Rewards</a>
              <a href="#">Poolam Tokens</a>
            </div>
            <div>
              <h4>PARTNERS</h4>
              <a href="#">AWCC</a>
              <a href="#">ATN Network</a>
              <a href="#">Cloud+ Apps</a>
              <a href="#">Kabul Stadium</a>
            </div>
            <div>
              <h4>LEGAL</h4>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Cookie Settings</a>
              <a href="#">Help Center</a>
            </div>
          </div>
          <div className="gp-footer-bottom">
            <p>© 2024 GAME PLAZIO TECHNOLOGIES. BUILT WITH PASSION FOR AFGHANISTAN.</p>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default HomePage;
