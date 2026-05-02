import { supabase } from './supabase';

export function normalizeLeaderboardRows(rows = []) {
  return rows.map((row) => ({
    name: row.player_name || row.display_name || row.name || 'Anonymous',
    wins: row.wins ?? row.total_wins ?? 0,
    totalGames: row.total_games ?? row.totalGames ?? row.wins ?? 0,
    source: 'global'
  }));
}

export async function fetchGlobalLeaderboard() {
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('player_name,wins,total_games,updated_at')
      .order('wins', { ascending: false })
      .limit(50);

    if (error) throw error;
    return normalizeLeaderboardRows(data || []);
  } catch (error) {
    console.warn('Global leaderboard unavailable, using local fallback:', error.message);
    return null;
  }
}

export async function recordGlobalGame(playerName, isWinner) {
  const cleanName = playerName?.trim();
  if (!cleanName) return false;

  try {
    const { error } = await supabase.rpc('record_game', { p_name: cleanName, is_winner: isWinner });
    if (!error) return true;
    throw error;
  } catch (error) {
    console.warn('Global leaderboard write unavailable. Ensure record_game RPC is installed:', error.message);
    return false;
  }
}
