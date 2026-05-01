import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { supabase } from '../lib/supabase';
import SpatialBackground from '../components/SpatialBackground';
import GlassPanel from '../components/GlassPanel';
import { Colors } from '../theme/Colors';
import { useProfileData } from '../hooks/useProfileData';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hook handles data fetching and caching
  const { stats, vaultGames, isLoadingStats, isLoadingVault, isOfflineVault, refreshVault, deleteVaultGame } = useProfileData(user);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!mounted) return;
      setUser(user);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const handleSignOut = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await supabase.auth.signOut();
  };

  const handleDelete = (gameId, gameTitle) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Delete from Vault",
      `Are you sure you want to permanently delete "${gameTitle}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            const success = await deleteVaultGame(gameId);
            if (success) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert("Error", "Failed to delete game from vault.");
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <SpatialBackground />
        <ActivityIndicator size="large" color={Colors.neonCyan} style={{ flex: 1 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SpatialBackground />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Pressable
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              navigation.goBack();
            }}
            style={styles.backButton}
          >
            <Text style={styles.headerIcon}>{'<'}</Text>
          </Pressable>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.headerTitle, { color: Colors.neonCyan }]}>MEMBER IDENTITY</Text>
            <Text style={[styles.headerTitle, { fontSize: 20 }]}>NEXUS PROFILE</Text>
          </View>
        </View>

        <GlassPanel style={styles.panel} intensity={50}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitials}>
              {(user?.email || 'N')[0].toUpperCase()}
            </Text>
          </View>

          <View style={styles.infoGroup}>
            <Text style={styles.label}>LINKED PROTOCOL</Text>
            <Text style={styles.valueText}>{user?.email}</Text>
          </View>

          <View style={styles.infoGroup}>
            <Text style={styles.label}>LAST SYNC</Text>
            <Text style={styles.valueText}>
              {new Date(user?.last_sign_in_at || Date.now()).toLocaleDateString()}
            </Text>
          </View>

          {isLoadingStats ? (
             <ActivityIndicator size="small" color={Colors.neonCyan} style={{ marginVertical: 20 }} />
          ) : (
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>TOTAL WINS</Text>
                <Text style={styles.statValue}>{stats.wins}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>GAMES PLAYED</Text>
                <Text style={styles.statValue}>{stats.total_games}</Text>
              </View>
            </View>
          )}

          <Pressable 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate('NexusProPaywall');
            }} 
            style={styles.proButton}
          >
            <Text style={styles.proButtonText}>UPGRADE TO <Text style={{ color: Colors.electricViolet }}>PRO</Text></Text>
          </Pressable>

          <Pressable onPress={handleSignOut} style={styles.signOutButton}>
            <Text style={styles.signOutButtonText}>TERMINATE SESSION (SIGN OUT)</Text>
          </Pressable>
        </GlassPanel>

        <View style={styles.vaultHeader}>
          <View>
            <Text style={[styles.headerTitle, { fontSize: 20 }]}>NEXUS VAULT</Text>
            {isOfflineVault && (
              <Text style={styles.offlineText}>[OFFLINE CACHE]</Text>
            )}
          </View>
          <Pressable 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              refreshVault();
            }}
          >
            <Text style={styles.refreshText}>↻ REFRESH</Text>
          </Pressable>
        </View>

        {isLoadingVault ? (
           <ActivityIndicator size="small" color={Colors.neonCyan} style={{ marginVertical: 20 }} />
        ) : vaultGames.length === 0 ? (
          <GlassPanel style={styles.emptyVaultPanel} intensity={20}>
            <Text style={styles.emptyVaultText}>Vault is empty.</Text>
            <Text style={styles.emptyVaultSubtext}>Generate games in the Nexus Arcade to save them here.</Text>
          </GlassPanel>
        ) : (
          vaultGames.map((game) => (
            <GlassPanel key={game.id} style={styles.vaultCard} intensity={40}>
              <View style={styles.vaultCardHeader}>
                <View>
                  <Text style={styles.gameTitle} numberOfLines={1}>{game.game_title || 'Untitled Mission'}</Text>
                  <Text style={styles.gameDate}>
                    {new Date(game.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <Pressable
                  onPress={() => handleDelete(game.id, game.game_title)}
                  style={styles.deleteButton}
                >
                  <Text style={styles.deleteButtonText}>DELETE</Text>
                </Pressable>
              </View>
              {game.config_json?.gameMode && (
                <View style={styles.tagContainer}>
                  <Text style={styles.tagText}>{game.config_json.gameMode.toUpperCase()}</Text>
                </View>
              )}
            </GlassPanel>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkBg
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 120
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 40
  },
  backButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center'
  },
  headerIcon: {
    color: Colors.neonCyan,
    fontSize: 24,
    fontWeight: 'bold'
  },
  headerTitle: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2
  },
  panel: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 40
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 2,
    borderColor: Colors.neonCyan,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    shadowColor: Colors.neonCyan,
    shadowRadius: 20,
    shadowOpacity: 0.3
  },
  avatarInitials: {
    color: Colors.white,
    fontSize: 36,
    fontWeight: '900'
  },
  infoGroup: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 16
  },
  label: {
    color: Colors.slateGray,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 6
  },
  valueText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginBottom: 30
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(0,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0,255,255,0.2)',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center'
  },
  statLabel: {
    color: Colors.neonCyan,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4
  },
  statValue: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1
  },
  signOutButton: {
    width: '100%',
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderColor: 'rgba(248,113,113,0.4)',
    borderWidth: 1,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center'
  },
  signOutButtonText: {
    color: '#F87171',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1
  },
  proButton: {
    width: '100%',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderColor: Colors.electricViolet,
    borderWidth: 1,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16
  },
  proButtonText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1
  },
  vaultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 20
  },
  offlineText: {
    color: Colors.slateGray,
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 4
  },
  refreshText: {
    color: Colors.slateGray,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    padding: 8
  },
  vaultCard: {
    padding: 20,
    marginBottom: 16
  },
  vaultCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  gameTitle: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    maxWidth: 200
  },
  gameDate: {
    color: Colors.slateGray,
    fontSize: 12
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.3)'
  },
  deleteButtonText: {
    color: '#F87171',
    fontSize: 10,
    fontWeight: 'bold'
  },
  tagContainer: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  tagText: {
    color: Colors.slateGray,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1
  },
  emptyVaultPanel: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed'
  },
  emptyVaultText: {
    color: Colors.slateGray,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8
  },
  emptyVaultSubtext: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    textAlign: 'center'
  }
});
