import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Modal, ActivityIndicator, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SpatialBackground from '../components/SpatialBackground';
import GlassPanel from '../components/GlassPanel';
import { Colors } from '../theme/Colors';
import * as Haptics from 'expo-haptics';
import { useGlobalLeaderboard } from '../hooks/useGlobalLeaderboard';

export default function Dashboard({ navigation }) {
  const [modalVisible, setModalVisible] = useState(false);
  const { leaderboard, isLoading, refresh } = useGlobalLeaderboard();

  const top5 = leaderboard.slice(0, 5);

  const renderLeaderboardRow = (item, index, isModal = false) => {
    let rankColor = Colors.slateGray;
    if (index === 0) rankColor = '#FFD700'; // Gold
    else if (index === 1) rankColor = '#C0C0C0'; // Silver
    else if (index === 2) rankColor = '#CD7F32'; // Bronze

    return (
      <View key={index} style={[styles.leaderboardRow, isModal && styles.modalLeaderboardRow]}>
        <View style={styles.rankContainer}>
          <Text style={[styles.rankText, { color: rankColor }]}>#{index + 1}</Text>
        </View>
        <View style={styles.playerContainer}>
          <Text style={styles.playerName} numberOfLines={1}>
            {item.player_name || 'Anonymous'}
          </Text>
        </View>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>{item.wins} WINS</Text>
        </View>
      </View>
    );
  };

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

        {/* Global Leaderboards Card */}
        <View style={styles.moduleWrapper}>
          <GlassPanel style={styles.moduleCard} intensity={50}>
            <View style={styles.moduleHeader}>
              <Text style={styles.moduleTitle}>NEXUS RANKINGS</Text>
              <Pressable onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                refresh();
              }}>
                <Text style={[styles.statusText, { color: Colors.slateGray, padding: 4 }]}>↻ REFRESH</Text>
              </Pressable>
            </View>
            
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={Colors.neonCyan} />
              </View>
            ) : leaderboard.length === 0 ? (
              <Text style={styles.moduleDescription}>No rankings available.</Text>
            ) : (
              <View style={styles.leaderboardContainer}>
                {top5.map((item, index) => renderLeaderboardRow(item, index, false))}
              </View>
            )}

            <Pressable 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setModalVisible(true);
              }}
              style={[styles.enterButton, { marginTop: 16, backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }]}
            >
              <Text style={[styles.enterText, { color: Colors.slateGray }]}>VIEW TOP 100</Text>
            </Pressable>
          </GlassPanel>
        </View>

      </ScrollView>

      {/* Leaderboard Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <GlassPanel style={styles.modalContent} intensity={80}>
            <SafeAreaView style={{ flex: 1 }}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>GLOBAL RANKINGS</Text>
                <Pressable 
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setModalVisible(false);
                  }}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>CLOSE</Text>
                </Pressable>
              </View>
              <FlatList
                data={leaderboard}
                keyExtractor={(_, index) => index.toString()}
                renderItem={({ item, index }) => renderLeaderboardRow(item, index, true)}
                contentContainerStyle={styles.modalScroll}
              />
            </SafeAreaView>
          </GlassPanel>
        </View>
      </Modal>
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
    paddingBottom: 100,
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
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  leaderboardContainer: {
    marginTop: 8,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  modalLeaderboardRow: {
    paddingVertical: 14,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  rankContainer: {
    width: 40,
  },
  rankText: {
    fontSize: 16,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  playerContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  playerName: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  scoreContainer: {
    width: 70,
    alignItems: 'flex-end',
  },
  scoreText: {
    color: Colors.neonCyan,
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '90%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -1,
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
  },
  closeButtonText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalScroll: {
    paddingBottom: 40,
  }
});
