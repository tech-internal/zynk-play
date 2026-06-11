// frontend/src/components/Streaming/StreamPlayer.tsx
// Video player component with trial and subscription controls

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient, StreamingContent } from '../../api/client';
import './StreamPlayer.css';

interface StreamPlayerState {
  stream: StreamingContent | null;
  signedUrl: string | null;
  expiresIn: number;
  timeRemaining: number;
  isTrialActive: boolean;
  loading: boolean;
  error: string;
  userHasSubscription: boolean;
}

export const StreamPlayer: React.FC = () => {
  const { streamId } = useParams<{ streamId: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<StreamPlayerState>({
    stream: null,
    signedUrl: null,
    expiresIn: 0,
    timeRemaining: 0,
    isTrialActive: false,
    loading: true,
    error: '',
    userHasSubscription: false,
  });

  useEffect(() => {
    if (!streamId) return;
    loadStreamData();
  }, [streamId]);

  // Timer for trial countdown
  useEffect(() => {
    if (!state.isTrialActive || state.timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setState((prev) => ({
        ...prev,
        timeRemaining: prev.timeRemaining - 1,
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [state.isTrialActive, state.timeRemaining]);

  const loadStreamData = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: '' }));

      // Get stream details
      const stream = await apiClient.getStream(streamId!);

      // Check subscription status
      const subStatus = await apiClient.getSubscriptionStatus();
      const hasSubscription = subStatus.has_active_subscription;

      // Request stream access
      const accessData = await apiClient.accessStream(streamId!);

      setState((prev) => ({
        ...prev,
        stream,
        signedUrl: accessData.signed_url,
        expiresIn: accessData.expires_in_seconds,
        timeRemaining: accessData.expires_in_seconds,
        isTrialActive: !hasSubscription,
        userHasSubscription: hasSubscription,
        loading: false,
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.response?.data?.error || 'Failed to load stream',
      }));
    }
  };

  const handleUpgrade = () => {
    navigate('/subscriptions');
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (state.loading) {
    return <div className="stream-container"><p>Loading...</p></div>;
  }

  if (state.error) {
    return (
      <div className="stream-container">
        <div className="error-box">
          <h2>Error</h2>
          <p>{state.error}</p>
          <button onClick={() => navigate('/streams')}>Back to Streams</button>
        </div>
      </div>
    );
  }

  if (!state.stream) {
    return <div className="stream-container"><p>Stream not found</p></div>;
  }

  return (
    <div className="stream-container">
      <div className="video-wrapper">
        <video
          key={state.signedUrl}
          controls
          autoPlay
          src={state.signedUrl || ''}
          className="video-player"
        />

        {state.isTrialActive && (
          <div className="trial-overlay">
            <div className="trial-info">
              <p>⏰ Free Trial</p>
              <p className="countdown">{formatTime(state.timeRemaining)}</p>
              <button onClick={handleUpgrade} className="btn-upgrade">
                Upgrade to Unlimited
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="stream-details">
        <h1>{state.stream.title}</h1>
        <p className="category">{state.stream.category}</p>
        <p>{state.stream.description}</p>

        {state.isTrialActive && state.timeRemaining <= 60 && (
          <div className="warning-banner">
            <p>⚠️ Trial ends in {formatTime(state.timeRemaining)}</p>
            <button onClick={handleUpgrade} className="btn-primary">
              Subscribe Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StreamPlayer;
