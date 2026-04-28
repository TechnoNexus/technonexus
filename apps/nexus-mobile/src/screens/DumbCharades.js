import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import SpatialBackground from '../components/SpatialBackground';
import GlassPanel from '../components/GlassPanel';
import NexusRoomBridge from '../networking/NexusRoomBridge';
import { Colors } from '../theme/Colors';
import * as Haptics from 'expo-haptics';
import QRCodeSVG from 'react-native-qrcode-svg';

const DATABASE = {
  Movies: [
    "The Godfather", "Pulp Fiction", "The Dark Knight", "Inception", "Interstellar", 
    "Parasite", "The Matrix", "Fight Club", "Seven", "Spirited Away", "Jaws", 
    "Star Wars", "Back to the Future", "The Lion King", "Jurassic Park"
  ],
  TV_Shows: [
    "Breaking Bad", "Stranger Things", "The Office", "Game of Thrones", "Succession",
    "The Bear", "Black Mirror", "The Boys", "The Last of Us", "Sopranos"
  ],
  Books: [
    "The Great Gatsby", "1984", "Brave New World", "Harry Potter", "The Hobbit",
    "Dune", "Project Hail Mary", "Atomic Habits", "Foundation", "Neuromancer"
  ]
};

export default function DumbCharades({ navigation }) {
  const bridgeRef = useRef(null);
  
  // Lobby State
  const [playerName, setPlayerName] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [status, setStatus] = useState('Disconnected');
  const [roomId, setRoomId] = useState('');
  const [isHost, setIsHost] = useState(false);

  // Game State
  const [category, setCategory] = useState('Movies');
  const [currentWord, setCurrentWord] = useState('');
  const [timer, setTimer] = useState(60);
  const [isActive, setIsActive] = useState(false);
  const [showWord, setShowWord] = useState(false);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [turn, setTurn] = useState('teamA');
  const [timerEndsAt, setTimerEndsAt] = useState(null);

  const handleMessage = (action, data) => {
    if (action === 'open') setStatus('Ready');
    else if (action === 'connectedToHost' || action === 'connection') setStatus('Player Connected');
    else if (action === 'close' || action === 'disconnectedFromHost') setStatus('Ready');
    else if (action === 'error') setStatus('Error');
    else if (action === 'data') {
      const payload = data.payload;
      if (payload.type === 'game-action' && payload.actionData && payload.actionData.gameType === 'charades') {
        const state = payload.actionData;
        if (state.category) setCategory(state.category);
        if (state.currentWord !== undefined) setCurrentWord(state.currentWord);
        if (state.isActive !== undefined) setIsActive(state.isActive);
        if (state.showWord !== undefined) setShowWord(state.showWord);
        if (state.score) {
          setScoreA(state.score.teamA || 0);
          setScoreB(state.score.teamB || 0);
        }
        if (state.turn) setTurn(state.turn);
        if (state.timerEndsAt) setTimerEndsAt(state.timerEndsAt);
        if (state.timer !== undefined && !state.isActive) setTimer(state.timer);
      }
    }
  };

  const syncState = (patch) => {
    const currentState = {
      gameType: 'charades',
      category, currentWord, isActive, showWord, 
      score: { teamA: scoreA, teamB: scoreB }, 
      turn, timerEndsAt, timer
    };
    const nextState = { ...currentState, ...patch };
    
    // Apply locally
    if (patch.category) setCategory(patch.category);
    if (patch.currentWord !== undefined) setCurrentWord(patch.currentWord);
    if (patch.isActive !== undefined) setIsActive(patch.isActive);
    if (patch.showWord !== undefined) setShowWord(patch.showWord);
    if (patch.score) { setScoreA(patch.score.teamA); setScoreB(patch.score.teamB); }
    if (patch.turn) setTurn(patch.turn);
    if (patch.timerEndsAt !== undefined) setTimerEndsAt(patch.timerEndsAt);
    if (patch.timer !== undefined) setTimer(patch.timer);

    // Broadcast if host
    if (isHost && bridgeRef.current) {
      bridgeRef.current.broadcastAction(nextState, 'playing');
    }
  };

  useEffect(() => {
    let interval = null;
    if (isActive && timerEndsAt) {
      interval = setInterval(() => {
        const nextTimer = Math.max(Math.ceil((timerEndsAt - Date.now()) / 1000), 0);
        setTimer(nextTimer);
        if (nextTimer <= 5 && nextTimer > 0) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (nextTimer === 0 && isHost) {
          syncState({ timer: 0, isActive: false, timerEndsAt: null });
        }
      }, 1000);
    } else if (timer === 0 && isActive) {
      setIsActive(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, timerEndsAt, isHost]);

  const generateWord = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const list = DATABASE[category];
    const word = list[Math.floor(Math.random() * list.length)];
    syncState({ currentWord: word, showWord: false, timer: 60, timerEndsAt: null, isActive: false });
  };

  const handlePoint = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const nextScore = turn === 'teamA' ? { teamA: scoreA + 1, teamB: scoreB } : { teamA: scoreA, teamB: scoreB + 1 };
    const nextTurn = turn === 'teamA' ? 'teamB' : 'teamA';
    const list = DATABASE[category];
    const word = list[Math.floor(Math.random() * list.length)];
    syncState({ currentWord: word, showWord: false, timer: 60, timerEndsAt: null, isActive: false, score: nextScore, turn: nextTurn });
  };

  const startTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    syncState({ isActive: true, timerEndsAt: Date.now() + (timer * 1000) });
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
          <Text style={styles.headerTitle}>DUMB CHARADES</Text>
          <View style={styles.headerSpacer} />
        </View>

        {!roomId ? (
          <GlassPanel style={styles.panel} intensity={50}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>YOUR IDENTITY</Text>
              <TextInput style={styles.input} placeholder="NICKNAME" placeholderTextColor={Colors.slateGray} value={playerName} onChangeText={setPlayerName} autoCapitalize="characters" autoCorrect={false} />
            </View>
            <Pressable onPress={() => { if(playerName){ setIsHost(true); setStatus('Creating...'); bridgeRef.current?.createRoom(playerName); } }} style={[styles.primaryButton, !playerName && styles.disabled]}>
              <Text style={styles.primaryButtonText}>HOST GAME</Text>
            </Pressable>
            <View style={styles.joinRow}>
              <TextInput style={[styles.input, styles.flexInput]} placeholder="ROOM ID" placeholderTextColor={Colors.slateGray} value={joinRoomId} onChangeText={setJoinRoomId} autoCapitalize="characters" autoCorrect={false} />
              <Pressable onPress={() => { if(playerName && joinRoomId){ setIsHost(false); setRoomId(joinRoomId); setStatus('Connecting...'); bridgeRef.current?.joinRoom(joinRoomId, playerName); } }} style={[styles.joinButton, (!playerName || !joinRoomId) && styles.disabled]}>
                <Text style={styles.primaryButtonText}>JOIN</Text>
              </Pressable>
            </View>
            <Text style={styles.statusText}>STATUS: {status.toUpperCase()}</Text>
          </GlassPanel>
        ) : (
          <GlassPanel style={styles.panel} intensity={50}>
            <View style={styles.scoreBoard}>
              <View style={styles.scoreCol}>
                <Text style={styles.scoreLabel}>TEAM A</Text>
                <Text style={styles.scoreValue}>{scoreA}</Text>
              </View>
              <View style={styles.scoreCol}>
                <Text style={styles.scoreLabel}>TEAM B</Text>
                <Text style={styles.scoreValue}>{scoreB}</Text>
              </View>
            </View>
            
            <Text style={styles.timerText}>{timer}s</Text>

            {isHost ? (
              <View>
                {!currentWord ? (
                  <View>
                    <View style={{ alignItems: 'center', marginBottom: 24 }}>
                      <View style={{ padding: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0,255,255,0.2)' }}>
                        <QRCodeSVG
                          value={`https://technonexus.ca/games/dumb-charades?join=${roomId}`}
                          size={140}
                          color={Colors.neonCyan}
                          backgroundColor="transparent"
                        />
                      </View>
                      <Text style={{ color: Colors.neonCyan, fontSize: 8, fontWeight: '900', letterSpacing: 2, marginTop: 8 }}>SCAN TO JOIN ROOM</Text>
                    </View>

                    <Pressable onPress={generateWord} style={styles.primaryButton}>
                      <Text style={styles.primaryButtonText}>GENERATE WORD</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View>
                    <Text style={styles.turnText}>TURN: {turn === 'teamA' ? 'TEAM A' : 'TEAM B'}</Text>
                    {showWord ? (
                      <Text style={styles.wordText}>{currentWord}</Text>
                    ) : (
                      <Pressable onPress={() => syncState({ showWord: true })} style={styles.revealButton}>
                        <Text style={styles.primaryButtonText}>REVEAL WORD</Text>
                      </Pressable>
                    )}
                    {isActive ? (
                      <View style={styles.actionRow}>
                        <Pressable onPress={handlePoint} style={[styles.actionButton, {backgroundColor: Colors.neonCyan}]}>
                          <Text style={styles.actionButtonTextBlack}>GUESSED!</Text>
                        </Pressable>
                        <Pressable onPress={generateWord} style={[styles.actionButton, {backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.slateGray}]}>
                          <Text style={styles.actionButtonText}>PASS</Text>
                        </Pressable>
                      </View>
                    ) : (
                      <Pressable onPress={startTimer} style={styles.primaryButton}>
                        <Text style={styles.primaryButtonText}>START TIMER</Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.guestView}>
                <Text style={styles.guestTitle}>GUEST DISPLAY</Text>
                {currentWord ? (
                  <View>
                    <Text style={styles.hiddenWord}>SECRET WORD HIDDEN</Text>
                    <Text style={styles.turnText}>TURN: {turn === 'teamA' ? 'TEAM A' : 'TEAM B'}</Text>
                  </View>
                ) : (
                  <Text style={styles.waitingText}>Waiting for host...</Text>
                )}
              </View>
            )}
          </GlassPanel>
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
  headerTitle: { color: Colors.white, fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  headerSpacer: { width: 40 },
  panel: { padding: 24 },
  inputGroup: { marginBottom: 24 },
  label: { color: Colors.slateGray, fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8 },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 16, color: Colors.white, fontSize: 16, fontWeight: 'bold' },
  primaryButton: { backgroundColor: Colors.cyanGlow, borderColor: Colors.neonCyan, borderWidth: 1, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginBottom: 16 },
  primaryButtonText: { color: Colors.neonCyan, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  joinRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  flexInput: { flex: 1 },
  joinButton: { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderRadius: 16, paddingHorizontal: 24, justifyContent: 'center' },
  disabled: { opacity: 0.5 },
  statusText: { color: Colors.slateGray, fontSize: 10, fontWeight: 'bold', textAlign: 'center' },
  scoreBoard: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 24 },
  scoreCol: { alignItems: 'center' },
  scoreLabel: { color: Colors.slateGray, fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 4 },
  scoreValue: { color: Colors.white, fontSize: 32, fontWeight: '900' },
  timerText: { color: Colors.electricViolet, fontSize: 48, fontWeight: '900', textAlign: 'center', marginBottom: 24 },
  turnText: { color: Colors.slateGray, fontSize: 12, fontWeight: 'bold', letterSpacing: 1, textAlign: 'center', marginBottom: 16 },
  wordText: { color: Colors.white, fontSize: 32, fontWeight: '900', textAlign: 'center', marginBottom: 24 },
  revealButton: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, paddingVertical: 40, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderStyle: 'dashed' },
  actionRow: { flexDirection: 'row', gap: 16 },
  actionButton: { flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  actionButtonTextBlack: { color: Colors.black, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  actionButtonText: { color: Colors.slateGray, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  guestView: { alignItems: 'center', paddingVertical: 24 },
  guestTitle: { color: Colors.neonCyan, fontSize: 12, fontWeight: '900', letterSpacing: 2, marginBottom: 16 },
  hiddenWord: { color: Colors.white, fontSize: 18, fontWeight: 'bold', letterSpacing: 2, marginBottom: 16 },
  waitingText: { color: Colors.slateGray, fontSize: 14, fontStyle: 'italic' },
});
