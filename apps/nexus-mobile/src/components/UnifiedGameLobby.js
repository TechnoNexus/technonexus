import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '../theme/Colors';
import GlassPanel from './GlassPanel';
import QRCodeSVG from 'react-native-qrcode-svg';
import { getApiUrl } from '../lib/api';

export default function UnifiedGameLobby({ 
  gameTitle,
  gameSlug,
  customSettingsUI, 
  onStart, 
  isHost, 
  setIsHost,
  playerName, 
  setPlayerName,
  players,
  roomStatus,
  roomId,
  setRoomId,
  status,
  bridgeRef
}) {
  const [totalPlayers, setTotalPlayers] = useState(4);
  const [localNames, setLocalNames] = useState({}); // { index: name }
  const [isEditingNames, setIsEditingNames] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState('');

  const tap = async (style = Haptics.ImpactFeedbackStyle.Medium) => {
    await Haptics.impactAsync(style);
  };

  const allNetworkNames = [playerName, ...players.map(p => p.name)];
  
  const getUnifiedPlayers = () => {
    const unified = [];
    allNetworkNames.forEach((name, i) => {
      unified.push({
        name: name || (i === 0 ? 'HOST' : `PLAYER ${i+1}`),
        isLocal: i === 0,
        peerId: i === 0 ? null : players[i-1]?.peerId
      });
    });

    if (totalPlayers > unified.length) {
      for (let i = unified.length + 1; i <= totalPlayers; i++) {
        unified.push({
          name: localNames[i] || `GUEST ${i}`,
          isLocal: true,
          peerId: null
        });
      }
    }
    return unified.slice(0, totalPlayers);
  };

  const handleStart = () => {
    tap(Haptics.ImpactFeedbackStyle.Heavy);
    onStart(getUnifiedPlayers());
  };

  if (roomStatus !== 'idle' && roomStatus !== 'waiting') return null;

  return (
    <View style={{ gap: 24 }}>
      {!roomId ? (
        <GlassPanel style={styles.panel} intensity={50}>
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

          <View style={styles.primaryActions}>
            <Pressable 
              onPress={() => { 
                if (playerName) { 
                  setIsHost(true); 
                  bridgeRef.current?.createRoom(playerName); 
                } 
              }} 
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
                onPress={() => { 
                  if (playerName && joinRoomId) { 
                    setIsHost(false); 
                    setRoomId(joinRoomId); 
                    bridgeRef.current?.joinRoom(joinRoomId, playerName); 
                  } 
                }} 
                disabled={!playerName || !joinRoomId}
                style={[styles.joinButton, (!playerName || !joinRoomId) && styles.disabled]}
              >
                <Text style={styles.joinButtonText}>JOIN</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: status === 'Ready' || status === 'Player Connected' ? Colors.neonCyan : Colors.slateGray }
              ]}
            />
            <Text style={styles.statusText}>ENGINE STATUS: {(status || '').toUpperCase()}</Text>
          </View>
        </GlassPanel>
      ) : (
        <>
          <GlassPanel style={styles.panel} intensity={50}>
            <View style={styles.activeHeader}>
              <Text style={styles.label}>ACTIVE ROOM</Text>
              <Text style={styles.activeRoomId}>{roomId}</Text>
              <Text style={styles.miniStatus}>{(status || '').toUpperCase()}</Text>
            </View>

            {isHost && (
              <View style={styles.qrBlock}>
                <View style={styles.qrWrapper}>
                  <QRCodeSVG 
                    value={getApiUrl(`/games/${gameTitle.toLowerCase().replace(' ', '-')}?join=${roomId}`).replace('/api', '')} 
                    size={148} 
                    color={Colors.neonCyan} 
                    backgroundColor="transparent" 
                  />
                </View>
                <Text style={styles.qrLabel}>SCAN TO JOIN MISSION</Text>
              </View>
            )}

            <View style={styles.playerPanel}>
              <Text style={styles.subsectionTitle}>ROOM PRESENCE</Text>
              <Text style={styles.playerChipHost}>HOST: {(playerName || 'NEXUS').toUpperCase()}</Text>
              {(players || []).map((player) => (
                <Text key={player.peerId} style={styles.playerChipGuest}>
                  {player.name}
                </Text>
              ))}
              {!players.length && (
                <Text style={styles.waitingText}>
                  {isHost ? 'Waiting for guests to join...' : 'Connected to host. Waiting for mission setup...'}
                </Text>
              )}
            </View>

            <Text style={styles.sectionTitle}>MISSION PARAMETERS</Text>
            
            {isHost ? (
              <View style={styles.settingGroup}>
                <View style={styles.settingHeader}>
                  <Text style={styles.label}>TARGET PRESENCE</Text>
                  <Text style={styles.value}>{totalPlayers} UNITS</Text>
                </View>
                <View style={styles.sliderRow}>
                   {[1, 2, 3, 4, 5, 6, 8, 10, 12].map(num => (
                     <Pressable 
                      key={num} 
                      onPress={() => { 
                        tap(Haptics.ImpactFeedbackStyle.Light); 
                        setTotalPlayers(num);
                        if (isHost && bridgeRef.current) {
                           bridgeRef.current.updateHostSnapshot({
                              customGame: { totalPlayers: num }
                           });
                           bridgeRef.current.broadcastMessage({
                              type: 'game-action',
                              actionData: { totalPlayers: num },
                              timestamp: Date.now()
                           });
                        }
                      }}
                      style={[styles.numChip, totalPlayers === num && styles.numChipActive]}
                     >
                       <Text style={[styles.numText, totalPlayers === num && styles.numTextActive]}>{num}</Text>
                     </Pressable>
                   ))}
                </View>
              </View>
            ) : (
              <View style={styles.guestStatus}>
                 <ActivityIndicator color={Colors.neonCyan} size="small" />
                 <Text style={styles.guestText}>AWAITING COMMAND...</Text>
              </View>
            )}

            {isHost && customSettingsUI && (
              <View style={styles.customSettings}>
                {customSettingsUI}
              </View>
            )}

            {isHost && (
              <Pressable onPress={handleStart} style={styles.startButton}>
                <Text style={styles.startButtonText}>INITIALIZE MISSION</Text>
              </Pressable>
            )}
          </GlassPanel>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 24
  },
  header: {
    marginBottom: 10
  },
  eyebrow: {
    color: Colors.neonCyan,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2
  },
  title: {
    color: Colors.white,
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1
  },
  panel: {
    padding: 24
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 22,
    padding: 16,
    color: Colors.white,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  primaryActions: {
    marginTop: 18,
    gap: 16
  },
  hostButton: {
    backgroundColor: Colors.cyanGlow,
    borderColor: Colors.neonCyan,
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center'
  },
  hostButtonText: {
    color: Colors.neonCyan,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1
  },
  joinRow: {
    flexDirection: 'row',
    gap: 12
  },
  flexInput: {
    flex: 1
  },
  joinButton: {
    backgroundColor: Colors.glassWhite,
    borderColor: Colors.glassBorder,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 24,
    justifyContent: 'center'
  },
  joinButtonText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1
  },
  disabled: {
    opacity: 0.45
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  statusText: {
    color: Colors.slateGray,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1
  },
  activeHeader: {
    alignItems: 'center',
    marginBottom: 20
  },
  activeRoomId: {
    color: Colors.white,
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: 2
  },
  miniStatus: {
    color: Colors.neonCyan,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 6
  },
  qrBlock: {
    alignItems: 'center',
    marginBottom: 24
  },
  qrWrapper: {
    padding: 14,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(0,255,255,0.2)',
    borderWidth: 1
  },
  qrLabel: {
    color: Colors.neonCyan,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 10
  },
  playerPanel: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(0,0,0,0.25)',
    padding: 18,
    marginBottom: 20
  },
  playerChipHost: {
    color: Colors.neonCyan,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 10
  },
  playerChipGuest: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6
  },
  waitingText: {
    color: Colors.slateGray,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center'
  },
  subsectionTitle: {
    color: Colors.slateGray,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 16
  },
  sectionTitle: {
    color: Colors.slateGray,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 20
  },
  settingGroup: {
    marginBottom: 24
  },
  settingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  label: {
    color: Colors.slateGray,
    fontSize: 10,
    fontWeight: '900'
  },
  value: {
    color: Colors.neonCyan,
    fontSize: 20,
    fontWeight: '900'
  },
  sliderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  numChip: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  numChipActive: {
    backgroundColor: Colors.cyanGlow,
    borderColor: Colors.neonCyan
  },
  numText: {
    color: Colors.slateGray,
    fontWeight: '900'
  },
  numTextActive: {
    color: Colors.white
  },
  customSettings: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    marginBottom: 24
  },
  startButton: {
    backgroundColor: Colors.white,
    paddingVertical: 20,
    borderRadius: 18,
    alignItems: 'center'
  },
  startButtonText: {
    color: Colors.black,
    fontWeight: '900',
    letterSpacing: 2,
    fontSize: 12
  },
  guestStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'center',
    padding: 20
  },
  guestText: {
    color: Colors.slateGray,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1
  },
  rosterPanel: {
    paddingBottom: 40
  },
  rosterList: {
    gap: 12
  },
  playerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  networkCard: {
    backgroundColor: 'rgba(0,255,255,0.05)',
    borderColor: 'rgba(0,255,255,0.2)'
  },
  playerRole: {
    color: Colors.slateGray,
    fontSize: 8,
    fontWeight: '900',
    marginBottom: 2
  },
  playerName: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '900'
  },
  pulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.neonCyan,
    shadowColor: Colors.neonCyan,
    shadowRadius: 4,
    shadowOpacity: 0.8
  }
});
