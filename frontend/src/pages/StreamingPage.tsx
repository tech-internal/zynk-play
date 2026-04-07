import React from 'react';
import './StreamingPage.css';

const StreamingPage: React.FC = () => {
  const [selectedStream, setSelectedStream] = React.useState(0);

  const streams = [
    {
      id: 1,
      title: 'Live Cricket Tournament',
      channel: 'Cricket Masters',
      viewers: '12.5K',
      image: '🏏',
      category: 'Sports',
      quality: '4K',
    },
    {
      id: 2,
      title: 'Gaming Legends Battle',
      channel: 'Gaming Hub',
      viewers: '8.3K',
      image: '🎮',
      category: 'Gaming',
      quality: 'HD',
    },
    {
      id: 3,
      title: 'Music Festival Live',
      channel: 'Entertainment Plus',
      viewers: '15.7K',
      image: '🎵',
      category: 'Music',
      quality: '4K',
    },
    {
      id: 4,
      title: 'Tech Talk Show',
      channel: 'Tech Insider',
      viewers: '5.2K',
      image: '💻',
      category: 'Technology',
      quality: 'HD',
    },
  ];

  const categories = [
    { name: 'All', count: 42 },
    { name: 'Sports', count: 18 },
    { name: 'Gaming', count: 25 },
    { name: 'Music', count: 12 },
    { name: 'Technology', count: 8 },
  ];

  const recommendations = [
    { title: 'Best Cricket Moments', views: '2.3M', image: '🏆' },
    { title: 'Gaming Highlights 2024', views: '1.8M', image: '⭐' },
    { title: 'Live Music Sessions', views: '3.1M', image: '🎤' },
  ];

  return (
    <div className="streaming-page">
      {/* Hero Section */}
      <section className="hero-streaming">
        <div className="hero-content">
          <div className="pill-badge pill-gold">🎬 LIVE STREAMING</div>
          <h1 className="hero-title">
            Watch Live <span className="grad-text">Entertainment</span>
          </h1>
          <p className="hero-sub">Stream cricket matches, gaming tournaments, music shows, and more in HD and 4K quality</p>
          <button className="btn-gold">Explore Live Streams</button>
        </div>
      </section>

      {/* Featured Stream */}
      <section className="featured-stream">
        <div className="container">
          <h2 className="section-title">Featured Now</h2>
          
          <div className="featured-player">
            <div className="player-area">
              <div className="player-mock">
                <div className="player-badge">LIVE</div>
                <span style={{ fontSize: '4rem' }}>{streams[selectedStream].image}</span>
              </div>
            </div>
            
            <div className="player-info">
              <div className="stream-header">
                <div>
                  <h3 className="stream-title">{streams[selectedStream].title}</h3>
                  <p className="stream-channel">{streams[selectedStream].channel}</p>
                </div>
                <div className="stream-meta">
                  <span className="viewers">👁️ {streams[selectedStream].viewers} Watching</span>
                  <span className="quality">{streams[selectedStream].quality}</span>
                </div>
              </div>
              
              <p className="stream-desc">
                Join thousands of viewers for an exciting live experience. High-quality streaming with interactive features and live chat.
              </p>
              
              <div className="stream-actions">
                <button className="btn-gold">Watch Now</button>
                <button className="btn-outline">Share Stream</button>
              </div>
            </div>
          </div>

          {/* Stream Thumbnails */}
          <div className="stream-carousel">
            <h3 className="carousel-title">Other Live Streams</h3>
            <div className="carousel-grid">
              {streams.map((stream, idx) => (
                <div
                  key={stream.id}
                  className={`carousel-card ${idx === selectedStream ? 'active' : ''}`}
                  onClick={() => setSelectedStream(idx)}
                >
                  <div className="thumbnail">
                    <span className="thumb-image">{stream.image}</span>
                    <div className="thumb-overlay">
                      <span className="live-badge">● LIVE</span>
                    </div>
                  </div>
                  <div className="thumb-info">
                    <div className="thumb-title">{stream.title}</div>
                    <div className="thumb-channel">{stream.channel}</div>
                    <div className="thumb-viewers">👁️ {stream.viewers}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <div className="container">
          <h2 className="section-title">Browse by Category</h2>
          <p className="section-sub">Discover content that interests you</p>

          <div className="categories-grid">
            {categories.map((cat, idx) => (
              <div key={idx} className="category-card">
                <div className="cat-icon">
                  {cat.name === 'Sports'
                    ? '🏏'
                    : cat.name === 'Gaming'
                    ? '🎮'
                    : cat.name === 'Music'
                    ? '🎵'
                    : cat.name === 'Technology'
                    ? '💻'
                    : '📺'}
                </div>
                <h3 className="cat-name">{cat.name}</h3>
                <p className="cat-count">{cat.count} Streams</p>
                <button className="cat-btn">Explore</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recommendations Section */}
      <section className="recommendations-section">
        <div className="container">
          <h2 className="section-title">Popular Videos</h2>
          <p className="section-sub">Recommended for you</p>

          <div className="reco-grid">
            {recommendations.map((reco, idx) => (
              <div key={idx} className="reco-card">
                <div className="reco-image">{reco.image}</div>
                <div className="reco-info">
                  <h4 className="reco-title">{reco.title}</h4>
                  <p className="reco-views">👁️ {reco.views} views</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title text-center">Why Choose Us?</h2>
          <p className="section-sub text-center">Best streaming experience guaranteed</p>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feat-icon">📺</div>
              <h3>HD & 4K Quality</h3>
              <p>Watch in crystal clear quality with adaptive streaming technology</p>
            </div>
            <div className="feature-card">
              <div className="feat-icon">🌍</div>
              <h3>Global Access</h3>
              <p>Access streams from anywhere in the world with low latency</p>
            </div>
            <div className="feature-card">
              <div className="feat-icon">💬</div>
              <h3>Live Chat</h3>
              <p>Interact with other viewers and creators in real-time</p>
            </div>
            <div className="feature-card">
              <div className="feat-icon">⭐</div>
              <h3>Premium Content</h3>
              <p>Exclusive streams and behind-the-scenes content for subscribers</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-streaming">
        <div className="container text-center">
          <h2 className="section-title">Start Streaming Today</h2>
          <p className="section-sub" style={{ maxWidth: '500px', margin: '0 auto 32px' }}>
            Don't miss out on live entertainment. Subscribe to never miss your favorite streams.
          </p>
          <div className="cta-buttons">
            <button className="btn-gold">Subscribe Now</button>
            <button className="btn-outline">Watch Free</button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default StreamingPage;
