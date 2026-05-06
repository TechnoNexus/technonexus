import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import SpatialBackground from '../components/SpatialBackground';
import GlassPanel from '../components/GlassPanel';
import NexusRoomBridge from '../networking/NexusRoomBridge';
import UnifiedGameLobby from '../components/UnifiedGameLobby';
import { Colors } from '../theme/Colors';
import * as Haptics from 'expo-haptics';

const INITIAL_STATE = {
  gameType: 'mafia',
  isActive: false,
  phase: 'lobby', // lobby, roles, night, day, voting, end
  players: [], 
  nightActions: { target: null, save: null, check: null },
  lastDeath: null,
  winner: null
};

export default function Mafia({ navigation }) {
  const bridgeRef = useRef(null);

  // Replaced useGameStore with local state for Mobile
  const [roomId, setRoomId] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [players, setPlayers] = useState([]);
  const [customGame, setCustomGame] = useState(null);
  const [roomStatus, setRoomStatus] = useState('idle');

  const [status, setStatus] = useState('Disconnected');
  const [gameState, setGameState] = useState(INITIAL_STATE);

  const handleMessage = (action, data) => {
    if (action === 'open') setStatus('Ready');
    else if (action === 'connectedToHost' || action === 'connection') setStatus('Player Connected');
    else if (action === 'close' || action === 'disconnectedFromHost') setStatus('Ready');
    else if (action === 'error') setStatus('Error');
    else if (action === 'data') {
      const payload = data.payload;
      if (payload.type === 'game-action' && payload.actionData && payload.actionData.gameType === 'mafia') {
        setGameState(payload.actionData);
      }
    }
  };

  const syncState = (patch, nextStatus) => {
    const next = { ...gameState, ...patch, gameType: 'mafia' };
    setGameState(next);

    if (bridgeRef.current) {
        if (isHost) {
            bridgeRef.current.broadcastAction(next, nextStatus || 'playing');
        } else {
            bridgeRef.current.sendToHost({
                type: 'game-action',
                actionData: next,
                roomStatus: nextStatus
            });
        }
    }
  };

  useEffect(() => {
    if (customGame?.gameType === 'mafia') {
        setGameState(customGame);
    }
  }, [customGame]);

  const handleStartMission = (unifiedPlayers) => {
    if (unifiedPlayers.length < 4) {
      alert("Minimum 4 units required.");
      return;
    }

    const shuffled = [...unifiedPlayers];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const playersWithRoles = shuffled.map((p, i) => {
      let role = 'USER';
      if (i === 0) role = 'ROGUE AI';
      if (i === 1) role = 'DEBUGGER';
      if (i === 2) role = 'LOG AUDITOR';
      return { ...p, role, isAlive: true };
    });

    syncState({
      isActive: true,
      phase: 'roles',
      players: playersWithRoles,
      nightActions: { target: null, save: null, check: null },
      lastDeath: null,
      winner: null
    }, 'playing');
  };

  const myPlayer = gameState.players.find(p => p.name === playerName);

  const startNight = () => {
    syncState({ phase: 'night', nightActions: { target: null, save: null, check: null } });
  };

  const startDay = () => {
    const { target, save } = gameState.nightActions;
    let lastDeath = null;
    const nextPlayers = gameState.players.map(p => {
      if (p.name === target && target !== save) {
        lastDeath = p.name;
        return { ...p, isAlive: false };
      }
      return p;
    });

    const rogues = nextPlayers.filter(p => p.role === 'ROGUE AI' && p.isAlive);
    const others = nextPlayers.filter(p => p.role !== 'ROGUE AI' && p.isAlive);

    if (rogues.length === 0) {
      syncState({ players: nextPlayers, phase: 'end', winner: 'SYSTEM' });
    } else if (rogues.length >= others.length) {
      syncState({ players: nextPlayers, phase: 'end', winner: 'ROGUE AI' });
    } else {
      syncState({ players: nextPlayers, phase: 'day', lastDeath });
    }
  };

  const voteOut = (name) => {
    const nextPlayers = gameState.players.map(p => p.name === name ? { ...p, isAlive: false } : p);
    const rogues = nextPlayers.filter(p => p.role === 'ROGUE AI' && p.isAlive);
    const others = nextPlayers.filter(p => p.role !== 'ROGUE AI' && p.isAlive);

    if (rogues.length === 0) {
      syncState({ players: nextPlayers, phase: 'end', winner: 'SYSTEM' });
    } else if (rogues.length >= others.length) {
      syncState({ players: nextPlayers, phase: 'end', winner: 'ROGUE AI' });
    } else {
      syncState({ players: nextPlayers, phase: 'night' });
    }
  };

  const performNightAction = (type, target) => {
    syncState({ nightActions: { ...gameState.nightActions, [type]: target } });
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <SpatialBackground />
      <NexusRoomBridge ref={bridgeRef} onMessage={handleMessage} onRoomIdCreated={setRoomId} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.headerIcon}>{'<'}</Text>
          </Pressable>
          <Text style={styles.headerTitle}>MAFIA</Text>
          <View style={{width: 40}} />
        </View>

        {gameState.phase === 'lobby' ? (
          <UnifiedGameLobby
            gameTitle="Digital Insurgency"
            gameSlug="mafia"
            onStart={handleStartMission}
            isHost={isHost}
            setIsHost={setIsHost}
            playerName={playerName}
            setPlayerName={setPlayerName}
            players={players}
            roomStatus={roomStatus}
            roomId={roomId}
            setRoomId={setRoomId}
            status={status}
            bridgeRef={bridgeRef}
          />
        ) : (
          <View style={{ gap: 20 }}>
            <Text style={[styles.phaseTitle, { color: gameState.phase === 'night' ? Colors.electricViolet : Colors.neonCyan }]}>
               {gameState.phase.toUpperCase()}
            </Text>

            <GlassPanel style={styles.panel} intensity={50}>
              {gameState.phase === 'roles' && (
                <View style={{ alignItems: 'center', gap: 24 }}>
                   <Text style={styles.label}>YOUR DESIGNATED ROLE</Text>
                   <Text style={[styles.roleText, { color: myPlayer?.role === 'ROGUE AI' ? Colors.neonRed : Colors.neonCyan }]}>
                      {myPlayer?.role || 'SPECTATOR'}
                   </Text>
                   {isHost && (
                     <Pressable onPress={startNight} style={styles.primaryButton}>
                        <Text style={styles.primaryButtonText}>START FIRST CYCLE</Text>
                     </Pressable>
                   )}
                </View>
              )}

              {gameState.phase === 'night' && (
                <View style={{ gap: 20 }}>
                   <Text style={styles.flavorText}>Shadow agents are bypassing security protocols...</Text>
                   
                   {myPlayer?.isAlive && (
                     <View style={{ gap: 12 }}>
                        {myPlayer.role === 'ROGUE AI' && !gameState.nightActions.target && (
                           <>
                             <Text style={[styles.label, {color: Colors.neonRed}]}>ROGUE AI: COMPROMISE UNIT</Text>
                             <View style={styles.actionGrid}>
                               {gameState.players.filter(p => p.isAlive && p.role !== 'ROGUE AI').map(p => (
                                 <Pressable key={p.name} onPress={() => performNightAction('target', p.name)} style={[styles.actionButton, {borderColor: Colors.neonRed + '40'}]}>
                                    <Text style={[styles.actionButtonText, {color: Colors.neonRed}]}>{p.name}</Text>
                                 </Pressable>
                               ))}
                             </View>
                           </>
                        )}
                        {myPlayer.role === 'DEBUGGER' && !gameState.nightActions.save && (
                           <>
                             <Text style={[styles.label, {color: '#4ADE80'}]}>DEBUGGER: SHIELD UNIT</Text>
                             <View style={styles.actionGrid}>
                               {gameState.players.filter(p => p.isAlive).map(p => (
                                 <Pressable key={p.name} onPress={() => performNightAction('save', p.name)} style={[styles.actionButton, {borderColor: '#4ADE8040'}]}>
                                    <Text style={[styles.actionButtonText, {color: '#4ADE80'}]}>{p.name}</Text>
                                 </Pressable>
                               ))}
                             </View>
                           </>
                        )}
                        {myPlayer.role === 'LOG AUDITOR' && !gameState.nightActions.check && (
                           <>
                             <Text style={[styles.label, {color: '#FACC15'}]}>LOG AUDITOR: SCAN UNIT</Text>
                             <View style={styles.actionGrid}>
                               {gameState.players.filter(p => p.isAlive && p.name !== playerName).map(p => (
                                 <Pressable key={p.name} onPress={() => performNightAction('check', p.name)} style={[styles.actionButton, {borderColor: '#FACC1540'}]}>
                                    <Text style={[styles.actionButtonText, {color: '#FACC15'}]}>{p.name}</Text>
                                 </Pressable>
                               ))}
                             </View>
                           </>
                        )}
                        {(myPlayer.role === 'USER' || 
                          (myPlayer.role === 'ROGUE AI' && gameState.nightActions.target) ||
                          (myPlayer.role === 'DEBUGGER' && gameState.nightActions.save) ||
                          (myPlayer.role === 'LOG AUDITOR' && gameState.nightActions.check)) && (
                           <Text style={styles.waitingText}>Input logged. Waiting for system sync...</Text>
                        )}
                     </View>
                   )}

                   {isHost && (
                     <Pressable onPress={startDay} style={[styles.primaryButton, { backgroundColor: Colors.electricViolet }]}>
                        <Text style={[styles.primaryButtonText, { color: 'white' }]}>SYNC SYSTEM (DAY)</Text>
                     </Pressable>
                   )}
                </View>
              )}

              {gameState.phase === 'day' && (
                <View style={{ gap: 20 }}>
                   <Text style={styles.statusText}>{gameState.lastDeath ? `${gameState.lastDeath} COMPROMISED` : 'INTEGRITY SECURE'}</Text>
                   <View style={{ gap: 8 }}>
                      {gameState.players.filter(p => p.isAlive).map(p => (
                        <Pressable key={p.name} onPress={() => isHost && voteOut(p.name)} style={[styles.playerCard, isHost && {borderColor: Colors.neonRed}]}>
                           <Text style={styles.playerNameText}>{p.name}</Text>
                           {isHost && <Text style={styles.isolateText}>ISOLATE</Text>}
                        </Pressable>
                      ))}
                   </View>
                </View>
              )}

              {gameState.phase === 'end' && (
                <View style={{ alignItems: 'center', gap: 24 }}>
                   <Text style={styles.winnerText}>{gameState.winner} DOMINATES</Text>
                   {isHost && (
                     <Pressable onPress={() => syncState(INITIAL_STATE, 'idle')} style={styles.primaryButton}>
                        <Text style={styles.primaryButtonText}>RE-BOOT</Text>
                     </Pressable>
                   )}
                </View>
              )}
            </GlassPanel>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.darkBg },
  scrollContent: { padding: 24, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 },
  backButton: { padding: 8 },
  headerIcon: { color: Colors.neonCyan, fontSize: 24, fontWeight: 'bold' },
  headerTitle: { color: Colors.white, fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  phaseTitle: { fontSize: 32, fontWeight: '900', textAlign: 'center', marginBottom: 10 },
  panel: { padding: 32 },
  label: { color: Colors.slateGray, fontSize: 10, fontWeight: 'bold', letterSpacing: 1, textAlign: 'center' },
  roleText: { fontSize: 42, fontWeight: '900', textAlign: 'center' },
  primaryButton: { backgroundColor: Colors.white, paddingVertical: 18, borderRadius: 16, alignItems: 'center', width: '100%' },
  primaryButtonText: { color: Colors.black, fontWeight: '900', letterSpacing: 2 },
  flavorText: { color: Colors.slateGray, fontStyle: 'italic', textAlign: 'center', fontSize: 12 },
  actionButton: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 16, borderRadius: 14, flex: 1, minWidth: '45%' },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionButtonText: { color: Colors.white, fontWeight: 'bold', textAlign: 'center' },
  waitingText: { color: Colors.slateGray, textAlign: 'center', fontStyle: 'italic' },
  statusText: { color: Colors.white, fontSize: 24, fontWeight: '900', textAlign: 'center' },
  playerCard: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  playerNameText: { color: Colors.white, fontWeight: 'bold' },
  isolateText: { color: Colors.neonRed, fontWeight: 'bold', fontSize: 10 },
  winnerText: { fontSize: 48, fontWeight: '900', color: Colors.neonCyan, textAlign: 'center' }
});
