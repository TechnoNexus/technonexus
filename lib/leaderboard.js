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

export async function recordGlobalWin(playerName) {
  const cleanName = playerName?.trim();
  if (!cleanName) return false;

  try {
    const { error } = await supabase.rpc('record_win', { p_name: cleanName });
    if (!error) return true;
    throw error;
  } catch (error) {
    console.warn('Global leaderboard write unavailable. Ensure record_win RPC is installed:', error.message);
    return false;
  }
}
