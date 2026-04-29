import React from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import SpatialBackground from '../components/SpatialBackground';
import GlassPanel from '../components/GlassPanel';
import { Colors } from '../theme/Colors';
import * as Haptics from 'expo-haptics';
import { supabase } from '../lib/supabase';

export default function Dashboard({ navigation }) {
  return (
    <View style={styles.container}>
      <SpatialBackground />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.subtitle}>NEXUS DASHBOARD</Text>
            <Pressable 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate('Profile');
              }} 
              style={styles.profileButton}
            >
              <Text style={styles.profileText}>PROFILE</Text>
            </Pressable>
          </View>
          <View style={styles.titleRow}>
            <Text style={styles.titleWhite}>TECHNO</Text>
            <Text style={styles.titleCyan}>NEXUS</Text>
          </View>
        </View>

        <Pressable 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            navigation.navigate('ArcadeHome');
          }}
          style={({pressed}) => [
            { opacity: pressed ? 0.8 : 1 },
            styles.moduleWrapper
          ]}
        >
          <GlassPanel style={styles.moduleCard} intensity={50}>
            <View style={styles.moduleHeader}>
              <Text style={styles.moduleTitle}>NEXUS ARCADE</Text>
              <View style={[styles.statusBadge, { backgroundColor: Colors.cyanGlow, borderColor: Colors.neonCyan }]}>
                <Text style={[styles.statusText, { color: Colors.neonCyan }]}>LIVE</Text>
              </View>
            </View>
            <Text style={styles.moduleDescription}>
              High-performance multiplayer gaming hub.
            </Text>
            <View style={[styles.enterButton, { backgroundColor: Colors.cyanGlow, borderColor: Colors.neonCyan }]}>
              <Text style={[styles.enterText, { color: Colors.neonCyan }]}>ENTER MODULE</Text>
            </View>
          </GlassPanel>
        </Pressable>

        {/* Placeholder modules */}
        <View style={styles.moduleWrapper}>
          <GlassPanel style={styles.moduleCard} intensity={50}>
            <View style={styles.moduleHeader}>
              <Text style={styles.moduleTitle}>NEXUS FORGE</Text>
              <View style={[styles.statusBadge, { backgroundColor: Colors.violetGlow, borderColor: Colors.electricViolet }]}>
                <Text style={[styles.statusText, { color: Colors.electricViolet }]}>SYNCED</Text>
              </View>
            </View>
            <Text style={styles.moduleDescription}>
              Open-source repositories and automation.
            </Text>
          </GlassPanel>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkBg,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 40,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  profileButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  profileText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  subtitle: {
    color: Colors.neonCyan,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2,
  },
  titleRow: {
    flexDirection: 'row',
  },
  titleWhite: {
    color: Colors.white,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },
  titleCyan: {
    color: Colors.neonCyan,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },
  moduleWrapper: {
    marginBottom: 24,
  },
  moduleCard: {
    padding: 24,
  },
  moduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  moduleTitle: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
  moduleDescription: {
    color: Colors.slateGray,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  enterButton: {
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  enterText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  }
});