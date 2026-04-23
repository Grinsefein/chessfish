import { useState, useEffect, useCallback } from 'react';

export interface GameStats {
  rating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  avgAccuracy: number;
}

const INITIAL_RATING = 800;
const K_FACTOR = 32;

export function usePerformanceScaling() {
  const [stats, setStats] = useState<GameStats>(() => {
    const saved = localStorage.getItem('chess_player_stats');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse player stats", e);
      }
    }
    return {
      rating: INITIAL_RATING,
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      avgAccuracy: 0,
    };
  });

  useEffect(() => {
    localStorage.setItem('chess_player_stats', JSON.stringify(stats));
  }, [stats]);

  const recordGameResult = useCallback((result: 'win' | 'loss' | 'draw', botElo: number, accuracy: number) => {
    setStats(prev => {
      const score = result === 'win' ? 1 : result === 'draw' ? 0.5 : 0;
      
      // Basic ELO formula: Ra' = Ra + K * (Sa - Ea)
      // Ea = 1 / (1 + 10^((Rb - Ra) / 400))
      const expectedScore = 1 / (1 + Math.pow(10, (botElo - prev.rating) / 400));
      const ratingChange = Math.round(K_FACTOR * (score - expectedScore));
      const newRating = Math.max(100, Math.min(3500, prev.rating + ratingChange));

      const newGamesPlayed = prev.gamesPlayed + 1;
      const newAvgAccuracy = ((prev.avgAccuracy * prev.gamesPlayed) + accuracy) / newGamesPlayed;

      return {
        rating: newRating,
        gamesPlayed: newGamesPlayed,
        wins: prev.wins + (result === 'win' ? 1 : 0),
        losses: prev.losses + (result === 'loss' ? 1 : 0),
        draws: prev.draws + (result === 'draw' ? 1 : 0),
        avgAccuracy: newAvgAccuracy
      };
    });
  }, []);

  // Return a modifier that applies to any bot's base skill level
  const getDifficultyAdjustment = useCallback((botElo: number) => {
    // If player is much stronger than bot, increase skill level
    // If player is much weaker, decrease it
    const diff = stats.rating - botElo;
    
    // Scale adjustment: every 200 points diff = 1 skillLevel change up or down
    const levelAdjust = Math.floor(diff / 200);
    
    // Also adjust thinking time: better players force faster bots
    const timeAdjust = diff > 0 ? -Math.min(300, diff / 2) : Math.min(500, Math.abs(diff) / 2);

    return {
      skillLevelBonus: levelAdjust,
      thinkTimeBonus: timeAdjust,
      isAdapting: Math.abs(levelAdjust) > 0
    };
  }, [stats.rating]);

  return {
    stats,
    recordGameResult,
    getDifficultyAdjustment
  };
}
