import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import SpatialBackground from '../components/SpatialBackground';
import GlassPanel from '../components/GlassPanel';
import NexusRoomBridge from '../networking/NexusRoomBridge';
import UnifiedGameLobby from '../components/UnifiedGameLobby';
import { Colors } from '../theme/Colors';
import * as Haptics from 'expo-haptics';
import { getApiUrl } from '../lib/api';

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
  
  // Replaced useGameStore with local state for Mobile
  const [roomId, setRoomId] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [players, setPlayers] = useState([]);
  const [customGame, setCustomGame] = useState(null);
  const [roomStatus, setRoomStatus] = useState('idle');

  const [status, setStatus] = useState('Disconnected');

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

  // AI Generation State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [customList, setCustomList] = useState(null);

  const handleMessage = (action, data) => {
    if (action === 'open') setStatus('Ready');
    else if (action === 'connectedToHost' || action === 'connection') setStatus('Player Connected');
    else if (action === 'close' || action === 'disconnectedFromHost') setStatus('Ready');
    else if (action === 'error') setStatus('Error');
    else if (action === 'data') {
      const payload = data.payload;
      if (payload.type === 'game-action' && payload.actionData && payload.actionData.gameType === 'charades') {
        const state = payload.actionData;
        applyState(state);
      }
    }
  };

  const applyState = (patch) => {
    if (patch.category) setCategory(patch.category);
    if (patch.currentWord !== undefined) setCurrentWord(patch.currentWord);
    if (patch.isActive !== undefined) setIsActive(patch.isActive);
    if (patch.showWord !== undefined) setShowWord(patch.showWord);
    if (patch.score) {
      setScoreA(patch.score.teamA || 0);
      setScoreB(patch.score.teamB || 0);
    }
    if (patch.turn) setTurn(patch.turn);
    if (patch.timerEndsAt !== undefined) setTimerEndsAt(patch.timerEndsAt);
    if (patch.timer !== undefined && !patch.isActive) setTimer(patch.timer);
    if (patch.customList !== undefined) setCustomList(patch.customList);
  };

  const syncState = (patch, nextStatus) => {
    const currentState = {
      gameType: 'charades',
      category, currentWord, isActive, showWord, 
      score: { teamA: scoreA, teamB: scoreB }, 
      turn, timerEndsAt, timer, customList
    };
    const nextState = { ...currentState, ...patch };
    
    applyState(patch);

    if (isHost && bridgeRef.current) {
      bridgeRef.current.broadcastAction(nextState, nextStatus || 'playing');
    }
  };

  useEffect(() => {
    if (customGame?.gameType === 'charades') {
        applyState(customGame);
    }
  }, [customGame]);

  useEffect(() => {
    let interval = null;
    if (isActive && timerEndsAt) {
      interval = setInterval(() => {
        const nextTimer = Math.max(Math.ceil((timerEndsAt - Date.now()) / 1000), 0);
        setTimer(nextTimer);
        if (nextTimer <= 5 && nextTimer > 0) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (nextTimer === 0 && isHost) {
          const nextTurn = turn === 'teamA' ? 'teamB' : 'teamA';
          syncState({ timer: 60, isActive: false, timerEndsAt: null, turn: nextTurn, currentWord: '', showWord: true });
        }
      }, 1000);
    } else if (timer === 0 && isActive) {
      setIsActive(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, timerEndsAt, isHost, turn]);

  const generateWord = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const list = customList || DATABASE[category];
    const word = list[Math.floor(Math.random() * list.length)];
    syncState({ currentWord: word, showWord: false, timer: 60, timerEndsAt: null, isActive: false });
  };

  const generateAIWords = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const response = await fetch(getApiUrl('/api/generate-game'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: `Generate a list of 20 items for a Dumb Charades game based on this topic: ${aiPrompt}. Return the list in gameContent.`,
          language: 'English'
        })
      });
      const data = await response.json();
      const list = data.gameContent || [];
      if (Array.isArray(list) && list.length > 0) {
        setCustomList(list);
        setCategory('AI Custom');
        const word = list[Math.floor(Math.random() * list.length)];
        syncState({ customList: list, category: 'AI Custom', currentWord: word, showWord: false });
      }
    } catch (error) {
      console.error('AI Generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePoint = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const nextScore = turn === 'teamA' ? { teamA: scoreA + 1, teamB: scoreB } : { teamA: scoreA, teamB: scoreB + 1 };
    const list = customList || DATABASE[category];
    const word = list[Math.floor(Math.random() * list.length)];
    syncState({ currentWord: word, showWord: true, score: nextScore });
  };

  const handlePass = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const list = customList || DATABASE[category];
    const word = list[Math.floor(Math.random() * list.length)];
    syncState({ currentWord: word, showWord: true });
  };

  const startTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    syncState({ isActive: true, timerEndsAt: Date.now() + (timer * 1000) });
  };

  const handleStartMission = (unifiedPlayers) => {
    generateWord();
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

        {(!roomId || (roomStatus === 'idle' && !currentWord)) ? (
           <UnifiedGameLobby
             gameTitle="Dumb Charades"
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
             customSettingsUI={
               <View>
                 <View style={styles.aiSection}>
                    <Text style={styles.label}>FORGE CUSTOM TOPIC</Text>
                    <View style={styles.joinRow}>
                      <TextInput 
                        style={[styles.input, styles.flexInput]} 
                        placeholder="e.g. Bollywood, Baby items" 
                        placeholderTextColor={Colors.slateGray} 
                        value={aiPrompt} 
                        onChangeText={setAiPrompt} 
                      />
                      <Pressable 
                        onPress={generateAIWords} 
                        disabled={isGenerating || !aiPrompt}
                        style={[styles.joinButton, {backgroundColor: Colors.electricViolet + '33', borderColor: Colors.electricViolet}]}>
                        <Text style={[styles.primaryButtonText, {color: Colors.electricViolet}]}>{isGenerating ? '...' : 'FORGE'}</Text>
                      </Pressable>
                    </View>
                  </View>

                  <Text style={[styles.label, {textAlign: 'center', marginBottom: 12}]}>OR CHOOSE CATEGORY</Text>
                  <View style={styles.categoryRow}>
                    {Object.keys(DATABASE).map(cat => (
                      <Pressable key={cat} onPress={() => { setCategory(cat); setCustomList(null); syncState({category: cat, customList: null}, 'idle'); }} style={[styles.catChip, category === cat && !customList && styles.catChipActive]}>
                        <Text style={[styles.catChipText, category === cat && !customList && styles.catChipTextActive]}>{cat.replace('_', ' ')}</Text>
                      </Pressable>
                    ))}
                  </View>
               </View>
             }
           />
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

            <View>
                <Text style={styles.turnText}>TURN: {turn === 'teamA' ? 'TEAM A' : 'TEAM B'}</Text>
                {isHost ? (
                    <View>
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
                            <Pressable onPress={handlePass} style={[styles.actionButton, {backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.slateGray}]}>
                            <Text style={styles.actionButtonText}>PASS</Text>
                            </Pressable>
                        </View>
                        ) : (
                        <View style={styles.actionRow}>
                            <Pressable onPress={startTimer} style={styles.primaryButton}>
                            <Text style={styles.primaryButtonText}>START TIMER</Text>
                            </Pressable>
                            <Pressable onPress={() => syncState({currentWord: ''}, 'idle')} style={[styles.primaryButton, {backgroundColor: 'transparent', flex: 0.4}]}>
                            <Text style={styles.primaryButtonText}>NEW TOPIC</Text>
                            </Pressable>
                        </View>
                        )}
                    </View>
                ) : (
                    <View style={styles.guestView}>
                        <Text style={styles.guestTitle}>GUEST DISPLAY</Text>
                        <Text style={styles.hiddenWord}>SECRET WORD HIDDEN</Text>
                        <Text style={styles.waitingText}>Watch the host's screen!</Text>
                    </View>
                )}
            </View>
          </GlassPanel>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.darkBg },
  scrollContent: { padding: 24, paddingTop: 60, paddingBottom: 120 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 },
  backButton: { padding: 8 },
  headerIcon: { color: Colors.neonCyan, fontSize: 24, fontWeight: 'bold' },
  headerTitle: { color: Colors.white, fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  headerSpacer: { width: 40 },
  panel: { padding: 24 },
  inputGroup: { marginBottom: 24 },
  label: { color: Colors.slateGray, fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8 },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 16, color: Colors.white, fontSize: 16, fontWeight: 'bold' },
  primaryButton: { backgroundColor: Colors.cyanGlow, borderColor: Colors.neonCyan, borderWidth: 1, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginBottom: 16, flex: 1 },
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
  aiSection: { marginBottom: 24, padding: 16, backgroundColor: 'rgba(139, 92, 246, 0.05)', borderRadius: 20, borderLeftWidth: 4, borderLeftColor: Colors.electricViolet },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24, justifyContent: 'center' },
  catChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)' },
  catChipActive: { borderColor: Colors.neonCyan, backgroundColor: Colors.neonCyan + '22' },
  catChipText: { color: Colors.slateGray, fontSize: 10, fontWeight: 'bold' },
  catChipTextActive: { color: Colors.neonCyan },
});
