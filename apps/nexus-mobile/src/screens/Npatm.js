import React, { useRef, useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import SpatialBackground from '../components/SpatialBackground';
import GlassPanel from '../components/GlassPanel';
import NexusRoomBridge from '../networking/NexusRoomBridge';
import { Colors } from '../theme/Colors';
import * as Haptics from 'expo-haptics';
import QRCode from 'react-native-qrcode-svg';

const CATEGORIES = [
  { id: 'name', label: 'Name' },
  { id: 'place', label: 'Place' },
  { id: 'animal', label: 'Animal' },
  { id: 'thing', label: 'Thing' },
  { id: 'movie', label: 'Movie' }
];

export default function Npatm({ navigation }) {
  const bridgeRef = useRef(null);
  
  // Lobby State
  const [playerName, setPlayerName] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [status, setStatus] = useState('Disconnected');
  const [roomId, setRoomId] = useState('');
  const [isHost, setIsHost] = useState(false);

  // Game State
  const [roomStatus, setRoomStatus] = useState('idle'); // idle | playing | finished
  const [inputs, setInputs] = useState({ name: '', place: '', animal: '', thing: '', movie: '' });
  const [currentLetter, setCurrentLetter] = useState('');
  const [stopPressedBy, setStopPressedBy] = useState(null);
  const [roomScores, setRoomScores] = useState([]);

  const handleMessage = (action, data) => {
    if (action === 'open') setStatus('Ready');
    else if (action === 'connectedToHost' || action === 'connection') setStatus('Player Connected');
    else if (action === 'close' || action === 'disconnectedFromHost') setStatus('Ready');
    else if (action === 'data') {
      const payload = data.payload;
      if (payload.type === 'game-action' && payload.actionData && payload.actionData.gameType === 'npatm') {
        const state = payload.actionData;
        if (state.currentLetter) setCurrentLetter(state.currentLetter);
        if (state.stopPressedBy) setStopPressedBy(state.stopPressedBy);
        if (payload.roomStatus) setRoomStatus(payload.roomStatus);
        if (state.roomScores) setRoomScores(state.roomScores);
      }
    }
  };

  const syncState = (patch, nextStatus) => {
    if (isHost && bridgeRef.current) {
      bridgeRef.current.broadcastAction({
        gameType: 'npatm',
        ...patch
      }, nextStatus || roomStatus);
    }
  };

  const handleStartRound = () => {
    const letters = 'ABCDEFGHIJKLMNOPRSTW';
    const randomLetter = letters[Math.floor(Math.random() * letters.length)];
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    setInputs({ name: '', place: '', animal: '', thing: '', movie: '' });
    setStopPressedBy(null);
    setCurrentLetter(randomLetter);
    setRoomStatus('playing');
    setRoomScores([]);

    syncState({
      currentLetter: randomLetter,
      stopPressedBy: null,
      roomScores: []
    }, 'playing');
  };

  const handleSubmit = () => {
    if (stopPressedBy) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    const myName = playerName || 'Anonymous';
    setStopPressedBy(myName);
    setRoomStatus('finished');

    syncState({
      stopPressedBy: myName,
      // In a real implementation, we'd send the inputs to host for batch eval
      // For now, we simulate a simple finish
    }, 'finished');
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
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.headerTitle, { color: Colors.neonCyan }]}>NAME PLACE ANIMAL THING</Text>
            <Text style={[styles.headerTitle, { fontSize: 20 }]}>NEXUS NPATM</Text>
          </View>
        </View>

        {!roomId ? (
          <GlassPanel style={styles.panel} intensity={50}>
            <Text style={styles.label}>YOUR IDENTITY</Text>
            <TextInput style={styles.input} placeholder="NICKNAME" placeholderTextColor={Colors.slateGray} value={playerName} onChangeText={setPlayerName} autoCapitalize="characters" />
            <Pressable onPress={() => { if(playerName){ setIsHost(true); setStatus('Creating...'); bridgeRef.current?.createRoom(playerName); } }} style={[styles.primaryButton, !playerName && styles.disabled, { marginTop: 16 }]}>
              <Text style={styles.primaryButtonText}>HOST GAME</Text>
            </Pressable>
            <View style={styles.joinRow}>
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="ROOM ID" placeholderTextColor={Colors.slateGray} value={joinRoomId} onChangeText={setJoinRoomId} autoCapitalize="characters" />
              <Pressable onPress={() => { if(playerName && joinRoomId){ setIsHost(false); setRoomId(joinRoomId); setStatus('Connecting...'); bridgeRef.current?.joinRoom(joinRoomId, playerName); } }} style={[styles.joinButton, (!playerName || !joinRoomId) && styles.disabled]}>
                <Text style={styles.primaryButtonText}>JOIN</Text>
              </Pressable>
            </View>
          </GlassPanel>
        ) : (
          <View>
            {roomStatus === 'idle' ? (
              <GlassPanel style={styles.panel} intensity={50}>
                <View style={{ alignItems: 'center', marginBottom: 24 }}>
                   <Text style={styles.label}>ROOM ID: {roomId}</Text>
                   {isHost && (
                     <View style={{ marginVertical: 16, alignItems: 'center' }}>
                        <QRCode value={`https://technonexus.ca/games/npatm?join=${roomId}`} size={140} color={Colors.neonCyan} backgroundColor="transparent" />
                        <Text style={{ color: Colors.neonCyan, fontSize: 8, fontWeight: '900', letterSpacing: 2, marginTop: 8 }}>SCAN TO JOIN</Text>
                     </View>
                   )}
                </View>
                {isHost ? (
                  <Pressable onPress={handleStartRound} style={styles.primaryButton}>
                    <Text style={styles.primaryButtonText}>START MISSION</Text>
                  </Pressable>
                ) : (
                  <Text style={styles.waitingText}>Waiting for host to start...</Text>
                )}
              </GlassPanel>
            ) : roomStatus === 'playing' ? (
              <View style={{ gap: 20 }}>
                <GlassPanel style={{ padding: 20, alignItems: 'center' }} intensity={60}>
                  <Text style={styles.label}>ACTIVE LETTER</Text>
                  <Text style={{ color: Colors.neonCyan, fontSize: 64, fontWeight: '900' }}>{currentLetter}</Text>
                </GlassPanel>

                <View style={{ gap: 12 }}>
                  {CATEGORIES.map(cat => (
                    <View key={cat.id}>
                      <Text style={styles.label}>{cat.label}</Text>
                      <TextInput 
                        style={styles.input} 
                        value={inputs[cat.id]} 
                        onChangeText={v => setInputs(prev => ({...prev, [cat.id]: v}))} 
                        editable={!stopPressedBy}
                        placeholder={`Starting with ${currentLetter}...`}
                        placeholderTextColor="rgba(255,255,255,0.1)"
                      />
                    </View>
                  ))}
                </View>

                {!stopPressedBy && (
                  <Pressable 
                    onPress={handleSubmit} 
                    disabled={Object.values(inputs).some(v => !v)}
                    style={[styles.stopButton, Object.values(inputs).some(v => !v) && styles.disabled]}
                  >
                    <Text style={styles.stopButtonText}>STOP!</Text>
                  </Pressable>
                )}
              </View>
            ) : (
              <GlassPanel style={styles.panel} intensity={50}>
                <Text style={{ color: Colors.white, fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: 20 }}>ROUND OVER</Text>
                <Text style={{ color: Colors.slateGray, textAlign: 'center', marginBottom: 32 }}>
                  {stopPressedBy} pressed STOP! 
                  Awaiting AI judge analysis...
                </Text>
                {isHost && (
                  <Pressable onPress={handleStartRound} style={styles.primaryButton}>
                    <Text style={styles.primaryButtonText}>NEXT ROUND</Text>
                  </Pressable>
                )}
              </GlassPanel>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.darkBg },
  scrollContent: { padding: 24, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 },
  backButton: { padding: 8 },
  headerIcon: { color: Colors.neonCyan, fontSize: 24, fontWeight: 'bold' },
  headerTitle: { color: Colors.white, fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  panel: { padding: 24 },
  label: { color: Colors.slateGray, fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8 },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 16, color: Colors.white, fontSize: 16, fontWeight: 'bold' },
  primaryButton: { backgroundColor: Colors.cyanGlow, borderColor: Colors.neonCyan, borderWidth: 1, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginBottom: 16 },
  primaryButtonText: { color: Colors.neonCyan, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  joinRow: { flexDirection: 'row', gap: 16 },
  joinButton: { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderRadius: 16, paddingHorizontal: 24, justifyContent: 'center' },
  disabled: { opacity: 0.5 },
  waitingText: { color: Colors.slateGray, textAlign: 'center', paddingVertical: 20, fontStyle: 'italic' },
  stopButton: { backgroundColor: Colors.electricViolet, borderRadius: 24, paddingVertical: 20, alignItems: 'center', marginTop: 20, shadowColor: Colors.electricViolet, shadowRadius: 15, shadowOpacity: 0.4 },
  stopButtonText: { color: Colors.white, fontSize: 16, fontWeight: '900', letterSpacing: 4 },
});