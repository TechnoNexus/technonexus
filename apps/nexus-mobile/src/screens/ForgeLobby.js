import React, { useRef, useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import SpatialBackground from '../components/SpatialBackground';
import GlassPanel from '../components/GlassPanel';
import NexusRoomBridge from '../networking/NexusRoomBridge';
import { Colors } from '../theme/Colors';
import * as Haptics from 'expo-haptics';

export default function ForgeLobby({ navigation }) {
  const bridgeRef = useRef(null);
  
  const [playerName, setPlayerName] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  
  const [status, setStatus] = useState('Disconnected');
  const [roomId, setRoomId] = useState('');
  const [isHost, setIsHost] = useState(false);

  const handleMessage = (action, data) => {
    if (action === 'open') {
      setStatus('Ready');
    } else if (action === 'connectedToHost' || action === 'connection') {
      setStatus('Player Connected');
    } else if (action === 'close' || action === 'disconnectedFromHost') {
      setStatus('Ready');
    } else if (action === 'error') {
      setStatus('Error');
    }
  };

  const handleCreateRoom = () => {
    if (!playerName) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsHost(true);
    setStatus('Creating...');
    bridgeRef.current?.createRoom(playerName);
  };

  const handleJoinRoom = () => {
    if (!playerName || !joinRoomId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsHost(false);
    setRoomId(joinRoomId);
    setStatus('Connecting...');
    bridgeRef.current?.joinRoom(joinRoomId, playerName);
  };

  const handleLeaveRoom = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
    setRoomId('');
    setStatus('Ready');
    // Note: Would need to destroy peer in a real app
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SpatialBackground />
      <NexusRoomBridge 
        ref={bridgeRef} 
        onMessage={handleMessage} 
        onRoomIdCreated={setRoomId} 
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.headerIcon}>{'<'}</Text>
          </Pressable>
          <Text style={styles.headerTitle}>AI FORGE LOBBY</Text>
          <View style={styles.headerSpacer} />
        </View>

        {!roomId ? (
          <GlassPanel style={styles.panel} intensity={50}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>YOUR IDENTITY</Text>
              <TextInput
                style={styles.input}
                placeholder="ENTER NICKNAME"
                placeholderTextColor={Colors.slateGray}
                value={playerName}
                onChangeText={setPlayerName}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </View>

            <Pressable 
              onPress={handleCreateRoom}
              disabled={!playerName}
              style={[styles.hostButton, !playerName && styles.disabled]}
            >
              <Text style={styles.hostButtonText}>HOST ROOM</Text>
            </Pressable>

            <View style={styles.joinRow}>
              <TextInput
                style={[styles.input, styles.flexInput]}
                placeholder="ROOM ID"
                placeholderTextColor={Colors.slateGray}
                value={joinRoomId}
                onChangeText={setJoinRoomId}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <Pressable 
                onPress={handleJoinRoom}
                disabled={!playerName || !joinRoomId}
                style={[styles.joinButton, (!playerName || !joinRoomId) && styles.disabled]}
              >
                <Text style={styles.joinButtonText}>JOIN</Text>
              </Pressable>
            </View>

            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: status === 'Ready' ? 'green' : Colors.slateGray }]} />
              <Text style={[styles.statusText, { color: status === 'Ready' ? 'green' : Colors.slateGray }]}>
                ENGINE STATUS: {status.toUpperCase()}
              </Text>
            </View>
          </GlassPanel>
        ) : (
          <GlassPanel style={styles.panel} intensity={50}>
            <View style={styles.activeHeader}>
              <Text style={styles.label}>ACTIVE ROOM</Text>
              <Text style={styles.activeRoomId}>{roomId}</Text>
            </View>

            <View style={styles.activeStatusRow}>
              <View style={[styles.statusDot, { backgroundColor: status === 'Player Connected' ? 'green' : Colors.neonCyan }]} />
              <Text style={[styles.activeStatusText, { color: status === 'Player Connected' ? 'green' : Colors.neonCyan }]}>
                {status.toUpperCase()}
              </Text>
            </View>

            {isHost && (
              <View style={styles.qrContainer}>
                <View style={styles.qrWrapper}>
                  <QRCode
                    value={`https://technonexus.ca/games/ai-forge?join=${roomId}`}
                    size={160}
                    color={Colors.neonCyan}
                    backgroundColor="transparent"
                  />
                </View>
                <Text style={styles.qrLabel}>SCAN TO JOIN MISSION</Text>
              </View>
            )}

            <Text style={styles.instructionsText}>
              {isHost 
                ? "Waiting for guests to join via Web or App..."
                : "Connected to Host. Waiting for mission to start..."}
            </Text>

            <Pressable onPress={handleLeaveRoom} style={styles.leaveButton}>
              <Text style={styles.leaveButtonText}>LEAVE ROOM</Text>
            </Pressable>
          </GlassPanel>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  backButton: {
    padding: 8,
  },
  headerIcon: {
    color: Colors.neonCyan,
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
  },
  headerSpacer: {
    width: 40,
  },
  panel: {
    padding: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    color: Colors.slateGray,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  hostButton: {
    backgroundColor: Colors.cyanGlow,
    borderColor: Colors.neonCyan,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  hostButtonText: {
    color: Colors.neonCyan,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  joinRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  flexInput: {
    flex: 1,
  },
  joinButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  joinButtonText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  disabled: {
    opacity: 0.5,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  activeHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  activeRoomId: {
    color: Colors.white,
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 2,
  },
  activeStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 32,
  },
  activeStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  instructionsText: {
    color: Colors.slateGray,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  leaveButton: {
    backgroundColor: 'rgba(255,0,0,0.1)',
    borderColor: 'rgba(255,0,0,0.3)',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  leaveButtonText: {
    color: 'red',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  }
});
