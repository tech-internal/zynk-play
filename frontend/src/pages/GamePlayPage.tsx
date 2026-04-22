import React from 'react';
import { useNavigate } from 'react-router-dom';
import './GamePlayPage.css';

const GamePlayPage: React.FC = () => {
  const navigate = useNavigate();

  React.useEffect(() => {
    document.title = 'Game Palazio | AFG Cricket — Play Free';
  }, []);

  const [activeTab, setActiveTab] = React.useState('keyboard');

  const keyboardControls = [
    { key: '↑ / W', action: 'Move Forward', desc: 'Move the batsman forward' },
    { key: '↓ / S', action: 'Move Backward', desc: 'Step back away from the ball' },
    { key: '← / A', action: 'Move Left', desc: 'Move to the off side' },
    { key: '→ / D', action: 'Move Right', desc: 'Move to the leg side' },
    { key: 'SPACE', action: 'Play Shot', desc: 'Execute a batting shot' },
    { key: 'SHIFT', action: 'Power Shot', desc: 'Perform a powerful stroke' },
    { key: 'CTRL', action: 'Defensive', desc: 'Play a defensive shot' },
  ];

  const touchControls = [
    { gesture: 'Swipe Right', arrow: '→', action: 'Power Drive' },
    { gesture: 'Swipe Left', arrow: '←', action: 'Pull Shot' },
    { gesture: 'Swipe Up', arrow: '↑', action: 'Lofted Shot' },
    { gesture: 'Swipe Down', arrow: '↓', action: 'Defensive' },
    { gesture: 'Tap', arrow: '●', action: 'Quick Single' },
  ];

  const objectives = [
    {
      num: '1',
      title: 'Score More Runs',
      desc: 'Outscore your opponents by hitting boundaries and running between wickets.',
    },
    {
      num: '2',
      title: 'Stay in Control',
      desc: 'Master timing and positioning to play effective shots against varied bowling.',
    },
    {
      num: '3',
      title: 'Win the Match',
      desc: 'Accumulate the highest score or dismiss all opposing batsmen to win.',
    },
  ];

  const leaderboard = [
    { rank: 1, name: 'Champion Striker', runs: '342 runs', score: '8,540 pts', avatar: '⭐' },
    { rank: 2, name: 'Power Hitter', runs: '298 runs', score: '7,820 pts', avatar: '🔥' },
    { rank: 3, name: 'Quick Runner', runs: '267 runs', score: '7,140 pts', avatar: '⚡' },
    { rank: 4, name: 'Master Batsman', runs: '245 runs', score: '6,890 pts', avatar: '🎯' },
    { rank: 5, name: 'Sky Soarer', runs: '221 runs', score: '6,320 pts', avatar: '🚀' },
  ];

  const goPlayOnDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="gameplay-page">
      <section className="hero-gameplay">
        <div className="hero-content">
          <div className="pill-badge pill-gold">🎮 INTERACTIVE GAMEPLAY</div>
          <h1 className="hero-title">
            Master the Art of <span className="grad-text">Cricket</span>
          </h1>
          <p className="hero-sub">
            Learn game mechanics, control layouts, and pro strategies to dominate the leaderboard. The playable build lives on your
            dashboard.
          </p>
          <button className="btn-gold" type="button" onClick={goPlayOnDashboard}>
            Open dashboard to play
          </button>
        </div>
      </section>

      <section className="controls-section">
        <div className="container">
          <h2 className="section-title text-center">Game Controls</h2>
          <p className="section-sub text-center">Master these controls to elevate your gameplay</p>

          <div className="tabs-nav">
            <button
              className={`tab-btn ${activeTab === 'keyboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('keyboard')}
            >
              ⌨️ Keyboard
            </button>
            <button
              className={`tab-btn ${activeTab === 'touch' ? 'active' : ''}`}
              onClick={() => setActiveTab('touch')}
            >
              📱 Touch/Mobile
            </button>
          </div>

          {activeTab === 'keyboard' && (
            <div className="tab-panel active">
              <div className="controls-grid">
                {keyboardControls.map((ctrl, idx) => (
                  <div key={idx} className="ctrl-card">
                    <div className="ctrl-key">{ctrl.key}</div>
                    <div className="ctrl-info">
                      <div className="ctrl-action">{ctrl.action}</div>
                      <div className="ctrl-desc">{ctrl.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'touch' && (
            <div className="tab-panel active">
              <div className="touch-grid">
                {touchControls.map((ctrl, idx) => (
                  <div key={idx} className="touch-card">
                    <span className="touch-icon">{ctrl.arrow}</span>
                    <div className="touch-gesture">{ctrl.gesture}</div>
                    <div className="touch-arrow">→</div>
                    <div className="touch-action">{ctrl.action}</div>
                  </div>
                ))}
              </div>
              <div className="phone-mock-wrap">
                <div className="phone-mock">
                  <div className="phone-notch"></div>
                  <div className="phone-screen">
                    <span style={{ fontSize: '2rem' }}>🏏</span>
                    <div className="swipe-arrow">
                      <span className="swipe-line"></span>
                      SWIPE
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="objectives-section">
        <div className="container">
          <h2 className="section-title text-center">Game Objectives</h2>
          <p className="section-sub text-center">Achieve these goals to master the game</p>

          <div className="objectives-list">
            {objectives.map((obj, idx) => (
              <div key={idx} className="obj-item">
                <div className="obj-num">{obj.num}</div>
                <div className="obj-content">
                  <div className="obj-title">{obj.title}</div>
                  <div className="obj-desc">{obj.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="pro-tips">
            <h4>💡 Pro Tips</h4>
            <ul>
              <li>Perfect your timing for maximum power on shots</li>
              <li>Use positioning to predict ball movement</li>
              <li>Build momentum by scoring consistent runs</li>
              <li>Watch opponent patterns and adapt your strategy</li>
              <li>Practice special power shots for match-winning moments</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="leaderboard-section">
        <div className="container">
          <h2 className="section-title text-center">Top Players</h2>
          <p className="section-sub text-center">Global leaderboard - Can you reach the top?</p>

          <div className="lb-table">
            {leaderboard.map((player, idx) => (
              <div
                key={idx}
                className={`lb-row ${
                  player.rank === 1 ? 'top1' : player.rank === 2 ? 'top2' : player.rank === 3 ? 'top3' : ''
                }`}
              >
                <div className={`lb-rank r${player.rank}`}>{player.rank}</div>
                <div className="lb-avatar" style={{ background: '#FFD700' }}>
                  {player.avatar}
                </div>
                <div className="lb-info">
                  <div className="lb-name">{player.name}</div>
                  <div className="lb-runs">{player.runs}</div>
                </div>
                <div className="lb-score">{player.score}</div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <button className="btn-gold" type="button" onClick={goPlayOnDashboard}>
              Play on dashboard
            </button>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container text-center">
          <h2 className="section-title">Ready to Play?</h2>
          <p className="section-sub" style={{ maxWidth: '500px', margin: '0 auto 32px' }}>
            Jump into the action now and compete with players worldwide
          </p>
          <button className="btn-gold" style={{ fontSize: '1.1rem', padding: '16px 48px' }} type="button" onClick={goPlayOnDashboard}>
            Go to dashboard
          </button>
        </div>
      </section>
    </div>
  );
};

export default GamePlayPage;
