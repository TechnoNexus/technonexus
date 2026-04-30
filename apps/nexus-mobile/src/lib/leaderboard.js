import { supabase } from './supabase';

export async function fetchGlobalLeaderboard(limit = 100) {
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('player_name, wins, total_games')
      .order('wins', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.warn('Error fetching native leaderboard:', error);
    return [];
  }
}
