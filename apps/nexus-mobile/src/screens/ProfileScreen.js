import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { supabase } from '../lib/supabase';
import SpatialBackground from '../components/SpatialBackground';
import GlassPanel from '../components/GlassPanel';
import { Colors } from '../theme/Colors';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });
  }, []);

  const handleSignOut = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await supabase.auth.signOut();
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
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.goBack();
            }}
            style={styles.backButton}
          >
            <Text style={styles.backText}>← DASHBOARD</Text>
          </Pressable>
          <Text style={styles.subtitle}>MEMBER IDENTITY</Text>
          <Text style={styles.title}>NEXUS PROFILE</Text>
        </View>

        <GlassPanel style={styles.panel} intensity={50}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitials}>
              {(user?.email || 'N')[0].toUpperCase()}
            </Text>
          </View>

          <View style={styles.infoGroup}>
            <Text style={styles.label}>NEXUS ID</Text>
            <Text style={styles.valueText}>{user?.id}</Text>
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

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>NEXUS VAULT</Text>
              <Text style={styles.statValue}>ACTIVE</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>CLEARANCE</Text>
              <Text style={styles.statValue}>STANDARD</Text>
            </View>
          </View>

          <Pressable onPress={handleSignOut} style={styles.signOutButton}>
            <Text style={styles.signOutButtonText}>TERMINATE SESSION (SIGN OUT)</Text>
          </Pressable>
        </GlassPanel>
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
    alignItems: 'center'
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
  }
});
