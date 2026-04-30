import { useState, useEffect, useCallback } from 'react';
import { fetchGlobalLeaderboard } from '../lib/leaderboard';

export function useGlobalLeaderboard(limit = 100) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchGlobalLeaderboard(limit);
      setLeaderboard(data);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return { leaderboard, isLoading, error, refresh: fetchLeaderboard };
}
