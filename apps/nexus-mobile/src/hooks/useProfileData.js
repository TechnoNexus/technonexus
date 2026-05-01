import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const VAULT_CACHE_KEY = '@nexus_vault_cache';

export function useProfileData(user) {
  const [stats, setStats] = useState({ wins: 0, total_games: 0, rank: 'N/A' });
  const [vaultGames, setVaultGames] = useState([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingVault, setIsLoadingVault] = useState(true);
  const [isOfflineVault, setIsOfflineVault] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!user) return;
    setIsLoadingStats(true);
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('wins, total_games')
        .in('player_name', [user.email, user.user_metadata?.name || user.email])
        .single();
      
      if (data && !error) {
        // We could fetch global rank by doing another query, but for now we just use a placeholder or simple logic
        setStats({
          wins: data.wins || 0,
          total_games: data.total_games || 0,
          rank: 'GLOBAL' // This could be enhanced later with an actual rank calculation
        });
      }
    } catch (err) {
      console.warn('Error fetching user stats:', err);
    } finally {
      setIsLoadingStats(false);
    }
  }, [user]);

  const fetchVault = useCallback(async () => {
    if (!user) return;
    setIsLoadingVault(true);
    setIsOfflineVault(false);
    try {
      const { data, error } = await supabase
        .from('user_games')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setVaultGames(data || []);
      await AsyncStorage.setItem(VAULT_CACHE_KEY, JSON.stringify(data || []));
    } catch (err) {
      console.warn('Error fetching vault from Supabase, attempting cache load...', err);
      // Fallback to offline cache
      const cached = await AsyncStorage.getItem(VAULT_CACHE_KEY);
      if (cached) {
        setVaultGames(JSON.parse(cached));
        setIsOfflineVault(true);
      }
    } finally {
      setIsLoadingVault(false);
    }
  }, [user]);

  const deleteVaultGame = async (gameId) => {
    if (!user) return false;
    
    // Optimistic UI update
    const previousGames = [...vaultGames];
    const newGames = vaultGames.filter(g => g.id !== gameId);
    setVaultGames(newGames);
    
    try {
      const { error } = await supabase
        .from('user_games')
        .delete()
        .eq('id', gameId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      // Update cache
      await AsyncStorage.setItem(VAULT_CACHE_KEY, JSON.stringify(newGames));
      return true;
    } catch (err) {
      console.warn('Error deleting game:', err);
      // Revert on failure
      setVaultGames(previousGames);
      return false;
    }
  };

  useEffect(() => {
    fetchStats();
    fetchVault();
  }, [fetchStats, fetchVault]);

  return {
    stats,
    vaultGames,
    isLoadingStats,
    isLoadingVault,
    isOfflineVault,
    refreshVault: fetchVault,
    deleteVaultGame
  };
}
