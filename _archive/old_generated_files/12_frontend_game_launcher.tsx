// frontend/src/components/Games/GameLauncher.tsx
// Game catalog and launcher component

import React, { useState, useEffect } from 'react';
import { apiClient, Game } from '../../api/client';
import './GamesStyles.css';

interface GameLauncherState {
  games: Game[];
  loading: boolean;
  error: string;
  launchingGameId: string | null;
}

export const GameLauncher: React.FC = () => {
  const [state, setState] = useState<GameLauncherState>({
    games: [],
    loading: true,
    error: '',
    launchingGameId: null,
  });

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: '' }));
      const games = await apiClient.listGames();
      setState((prev) => ({
        ...prev,
        games,
        loading: false,
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.response?.data?.error || 'Failed to load games',
      }));
    }
  };

  const handleLaunchGame = async (gameId: string) => {
    setState((prev) => ({ ...prev, launchingGameId: gameId, error: '' }));

    try {
      const response = await apiClient.launchGame(gameId);

      // In production, this would launch the game in a new window or iframe
      window.open(response.game_source, '_blank');

      setState((prev) => ({
        ...prev,
        launchingGameId: null,
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        launchingGameId: null,
        error: error.response?.data?.error || 'Failed to launch game',
      }));
    }
  };

  if (state.loading) {
    return <div className="games-container"><p>Loading games...</p></div>;
  }

  if (state.error) {
    return (
      <div className="games-container">
        <div className="error-box">
          <p>{state.error}</p>
          <button onClick={loadGames}>Retry</button>
        </div>
      </div>
    );
  }

  if (state.games.length === 0) {
    return (
      <div className="games-container">
        <p>No games available</p>
      </div>
    );
  }

  return (
    <div className="games-container">
      <h1>Games Library</h1>
      <p className="subtitle">Play exclusive games with your subscription</p>

      <div className="games-grid">
        {state.games.map((game) => (
          <div key={game.id} className="game-card">
            {game.thumbnail_url && (
              <div className="game-thumbnail">
                <img src={game.thumbnail_url} alt={game.title} />
              </div>
            )}

            <div className="game-info">
              <h3>{game.title}</h3>
              <p className="category">{game.category}</p>
              <p className="description">{game.description}</p>
            </div>

            <button
              onClick={() => handleLaunchGame(game.id)}
              disabled={state.launchingGameId === game.id}
              className="btn-launch"
            >
              {state.launchingGameId === game.id ? '🚀 Launching...' : '🎮 Play'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameLauncher;
