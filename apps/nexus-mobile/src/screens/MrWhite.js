import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import SpatialBackground from '../components/SpatialBackground';
import GlassPanel from '../components/GlassPanel';
import NexusRoomBridge from '../networking/NexusRoomBridge';
import UnifiedGameLobby from '../components/UnifiedGameLobby';
import { Colors } from '../theme/Colors';
import * as Haptics from 'expo-haptics';
export default function MrWhite({ navigation }) {
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
  const [isActive, setIsActive] = useState(false);
  const [word, setWord] = useState('');
  const [undercoverWord, setUndercoverWord] = useState('');
  const [undercoverPlayers, setUndercoverPlayers] = useState([]);
  const [mrWhitePlayers, setMrWhitePlayers] = useState([]);
  const [civilianPlayers, setCivilianPlayers] = useState([]);
  const [phase, setPhase] = useState('lobby'); // 'lobby', 'revealing', 'speaking', 'voting', 'guessing', 'end'
  const [speakerOrder, setSpeakerOrder] = useState([]);
  const [currentSpeakerIndex, setCurrentSpeakerIndex] = useState(0);
  const [eliminatedPlayers, setEliminatedPlayers] = useState([]);
  const [guessingPlayer, setGuessingPlayer] = useState(null);
  const [winner, setWinner] = useState(null);

  // Host Configuration
  const [settings, setSettings] = useState({ undercovers: 1, mrWhites: 0 });

  // Local Pass-and-Play State
  const [localRevealIndex, setLocalRevealIndex] = useState(0);
  const [localShowWord, setLocalShowWord] = useState(false);

  const handleMessage = (action, data) => {
    if (action === 'open') setStatus('Ready');
    else if (action === 'connectedToHost' || action === 'connection') setStatus('Player Connected');
    else if (action === 'close' || action === 'disconnectedFromHost') setStatus('Ready');
    else if (action === 'error') setStatus('Error');
    else if (action === 'data') {
      const payload = data.payload;
      
      if (payload.type === 'game-action' && payload.actionData && payload.actionData.gameType === 'mr-white') {
        const state = payload.actionData;
        applyState(state);
      }
    }
  };

  const applyState = (state) => {
    if (state.isActive !== undefined) setIsActive(state.isActive);
    if (state.word !== undefined) setWord(state.word);
    if (state.undercoverWord !== undefined) setUndercoverWord(state.undercoverWord);
    if (state.undercoverPlayers !== undefined) setUndercoverPlayers(state.undercoverPlayers);
    if (state.mrWhitePlayers !== undefined) setMrWhitePlayers(state.mrWhitePlayers);
    if (state.civilianPlayers !== undefined) setCivilianPlayers(state.civilianPlayers);
    if (state.phase !== undefined) setPhase(state.phase);
    if (state.speakerOrder !== undefined) setSpeakerOrder(state.speakerOrder);
    if (state.currentSpeakerIndex !== undefined) setCurrentSpeakerIndex(state.currentSpeakerIndex);
    if (state.eliminatedPlayers !== undefined) setEliminatedPlayers(state.eliminatedPlayers);
    if (state.guessingPlayer !== undefined) setGuessingPlayer(state.guessingPlayer);
    if (state.winner !== undefined) setWinner(state.winner);
  };

  const syncState = (patch, nextStatus) => {
    const currentState = { gameType: 'mr-white', isActive, word, undercoverWord, undercoverPlayers, mrWhitePlayers, civilianPlayers, phase, speakerOrder, currentSpeakerIndex, eliminatedPlayers, guessingPlayer, winner };
    const nextState = { ...currentState, ...patch };
    
    applyState(patch);

    if (isHost && bridgeRef.current) {
        bridgeRef.current.broadcastAction(nextState, nextStatus || 'playing');
    }
  };

  useEffect(() => {
    if (customGame?.gameType === 'mr-white') {
        applyState(customGame);
    }
  }, [customGame]);

  const allNetNames = [playerName, ...players.map(p => p.name)];
  const myDevicePlayers = (speakerOrder || []).filter(p => 
    p === playerName || (isHost && !allNetNames.includes(p))
  );

  useEffect(() => {
    if (phase === 'revealing') {
      setLocalRevealIndex(0);
      setLocalShowWord(false);
    }
  }, [phase, myDevicePlayers.length]);

  const handleStartMission = (unifiedPlayers) => {
    const playerNames = unifiedPlayers.map(p => p.name);
    
    if (settings.undercovers + settings.mrWhites >= playerNames.length) {
      alert("Too many special roles!");
      return;
    }

    const pair = WORD_PAIRS[Math.floor(Math.random() * WORD_PAIRS.length)];
    const shuffled = shuffle(playerNames);
    
    const undercovers = shuffled.slice(0, settings.undercovers);
    const mrWhites = shuffled.slice(settings.undercovers, settings.undercovers + settings.mrWhites);
    const civilians = shuffled.slice(settings.undercovers + settings.mrWhites);
    const newSpeakerOrder = shuffle(playerNames);

    syncState({ 
        isActive: true, word: pair[0], undercoverWord: pair[1], 
        undercoverPlayers: undercovers, mrWhitePlayers: mrWhites, civilianPlayers: civilians, 
        phase: 'revealing', speakerOrder: newSpeakerOrder, currentSpeakerIndex: 0, 
        eliminatedPlayers: [], guessingPlayer: null, winner: null 
    }, 'playing');
  };

  const eliminatePlayer = (name) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const isCivilian = civilianPlayers.includes(name);
      
      const newEliminated = [...eliminatedPlayers, name];
      const allActivePlayers = [...undercoverPlayers, ...mrWhitePlayers, ...civilianPlayers].filter(p => !newEliminated.includes(p));
      
      if (isCivilian) {
          if (allActivePlayers.length <= 3) {
              syncState({ eliminatedPlayers: newEliminated, phase: 'end', winner: 'Imposters' });
          } else {
              const newSpeakerOrder = shuffle(allActivePlayers);
              syncState({ eliminatedPlayers: newEliminated, phase: 'speaking', speakerOrder: newSpeakerOrder, currentSpeakerIndex: 0 });
          }
      } else {
          syncState({ eliminatedPlayers: newEliminated, guessingPlayer: name, phase: 'guessing' });
      }
  };

  const handleGuess = (correct) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      if (correct) {
          syncState({ phase: 'end', winner: 'Imposters' });
      } else {
          const imposters = [...undercoverPlayers, ...mrWhitePlayers];
          const remainingImposters = imposters.filter(p => !eliminatedPlayers.includes(p));
          
          if (remainingImposters.length === 0) {
              syncState({ phase: 'end', winner: 'Civilians' });
          } else {
              const allActivePlayers = [...undercoverPlayers, ...mrWhitePlayers, ...civilianPlayers].filter(p => !eliminatedPlayers.includes(p));
              if (allActivePlayers.length <= 3) {
                  syncState({ phase: 'end', winner: 'Imposters' });
              } else {
                  const newSpeakerOrder = shuffle(allActivePlayers);
                  syncState({ phase: 'speaking', speakerOrder: newSpeakerOrder, currentSpeakerIndex: 0, guessingPlayer: null });
              }
          }
      }
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
          <Text style={styles.headerTitle}>UNDERCOVER</Text>
          <View style={styles.headerSpacer} />
        </View>

        {phase === 'lobby' ? (
          <UnifiedGameLobby
            gameTitle="Undercover"
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
              <View style={styles.settingsBlock}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Undercovers</Text>
                  <TextInput 
                    style={styles.input} 
                    keyboardType="number-pad" 
                    value={settings.undercovers.toString()} 
                    onChangeText={v => setSettings({...settings, undercovers: parseInt(v) || 0})} 
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Mr. Whites</Text>
                  <TextInput 
                    style={styles.input} 
                    keyboardType="number-pad" 
                    value={settings.mrWhites.toString()} 
                    onChangeText={v => setSettings({...settings, mrWhites: parseInt(v) || 0})} 
                  />
                </View>
              </View>
            }
          />
        ) : (
          <GlassPanel style={styles.panel} intensity={50}>
            {phase === 'revealing' ? (
              <View>
                {myDevicePlayers.length === 0 ? (
                  <Text style={styles.waitingText}>SPECTATING (No role assigned)</Text>
                ) : localRevealIndex < myDevicePlayers.length ? (
                  <View>
                    <Text style={styles.passText}>PASS DEVICE TO:</Text>
                    <Text style={styles.currentPlayerText}>{myDevicePlayers[localRevealIndex]}</Text>
                    
                    {!localShowWord ? (
                      <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setLocalShowWord(true); }} style={styles.revealButton}>
                        <Text style={styles.revealText}>TAP TO REVEAL</Text>
                      </Pressable>
                    ) : (
                      <View style={{alignItems: 'center'}}>
                        <View style={styles.wordBox}>
                            <Text style={styles.wordBoxLabel}>YOUR SECRET WORD</Text>
                            {(() => {
                                const p = myDevicePlayers[localRevealIndex];
                                let role = 'Civilian';
                                if (undercoverPlayers.includes(p)) role = 'Undercover';
                                if (mrWhitePlayers.includes(p)) role = 'Mr. White';
                                const myWord = role === 'Undercover' ? undercoverWord : (role === 'Mr. White' ? 'MR. WHITE (No Word)' : word);
                                return <Text style={[styles.actualWord, role === 'Mr. White' && {color: Colors.neonRed}]}>{myWord}</Text>;
                            })()}
                        </View>
                        <Pressable onPress={() => { 
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); 
                            setLocalShowWord(false); 
                            setLocalRevealIndex(localRevealIndex + 1); 
                        }} style={styles.primaryButton}>
                          <Text style={styles.primaryButtonText}>HIDE & NEXT</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                ) : (
                  <View>
                    <Text style={styles.wordText}>Roles revealed!</Text>
                    <Text style={styles.passText}>Waiting for host to start speaking phase.</Text>
                    {isHost && (
                      <Pressable onPress={() => syncState({ phase: 'speaking' })} style={[styles.primaryButton, {marginTop: 24, backgroundColor: Colors.electricViolet, borderColor: Colors.electricViolet}]}>
                        <Text style={[styles.primaryButtonText, {color: Colors.white}]}>START SPEAKING</Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>
            ) : phase === 'speaking' ? (
                <View>
                    <Text style={styles.passText}>CURRENT SPEAKER:</Text>
                    
                    {currentSpeakerIndex < speakerOrder.length ? (
                        <View>
                            <View style={styles.speakerBox}>
                                <Text style={styles.speakerText}>{speakerOrder[currentSpeakerIndex]}</Text>
                            </View>
                            
                            {isHost && (
                                <Pressable onPress={() => syncState({ currentSpeakerIndex: currentSpeakerIndex + 1 })} style={[styles.primaryButton, {backgroundColor: 'transparent', borderColor: Colors.white}]}>
                                    <Text style={[styles.primaryButtonText, {color: Colors.white}]}>NEXT SPEAKER</Text>
                                </Pressable>
                            )}
                        </View>
                    ) : (
                        <View>
                            <Text style={styles.wordText}>Everyone has spoken!</Text>
                            {isHost && (
                                <Pressable onPress={() => syncState({ phase: 'voting' })} style={styles.primaryButton}>
                                    <Text style={styles.primaryButtonText}>START VOTING</Text>
                                </Pressable>
                            )}
                        </View>
                    )}
                </View>
            ) : phase === 'voting' ? (
                <View>
                    <Text style={styles.wordText}>TIME TO VOTE</Text>
                    <Text style={styles.passText}>Host: Eliminate the voted player.</Text>
                    
                    {isHost ? (
                        <View style={{marginTop: 16}}>
                            {speakerOrder.filter(p => !eliminatedPlayers.includes(p)).map(p => (
                                <Pressable 
                                    key={p} 
                                    onPress={() => eliminatePlayer(p)} 
                                    style={[styles.primaryButton, {backgroundColor: 'rgba(255,0,0,0.1)', borderColor: 'rgba(255,0,0,0.3)', marginBottom: 8}]}
                                >
                                    <Text style={[styles.primaryButtonText, {color: Colors.neonRed}]}>ELIMINATE {p}</Text>
                                </Pressable>
                            ))}
                        </View>
                    ) : (
                        <Text style={styles.waitingText}>Waiting for host to record vote...</Text>
                    )}
                </View>
            ) : phase === 'guessing' ? (
                <View>
                    <Text style={[styles.wordText, {color: Colors.neonRed}]}>CAUGHT!</Text>
                    <Text style={styles.passText}>{guessingPlayer} was an Imposter!</Text>
                    
                    {isHost ? (
                        <View style={{marginTop: 24}}>
                            <Pressable 
                                onPress={() => handleGuess(true)} 
                                style={[styles.primaryButton, {backgroundColor: 'rgba(255,0,0,0.1)', borderColor: 'rgba(255,0,0,0.3)'}]}
                            >
                                <Text style={[styles.primaryButtonText, {color: Colors.neonRed}]}>THEY GUESSED IT!</Text>
                            </Pressable>
                            <Pressable 
                                onPress={() => handleGuess(false)} 
                                style={styles.primaryButton}
                            >
                                <Text style={styles.primaryButtonText}>THEY WERE WRONG!</Text>
                            </Pressable>
                        </View>
                    ) : (
                        <Text style={styles.waitingText}>Waiting for host to judge...</Text>
                    )}
                </View>
            ) : (
              <View>
                 <Text style={[styles.wordText, {color: winner === 'Imposters' ? Colors.neonRed : Colors.neonCyan}]}>
                     {winner === 'Imposters' ? 'IMPOSTERS WIN' : 'CIVILIANS WIN'}
                 </Text>
                 <View style={styles.resultBox}>
                   <Text style={styles.resultRole}>CIVILIAN</Text>
                   <Text style={styles.resultWord}>{word}</Text>
                 </View>
                 <View style={[styles.resultBox, {backgroundColor: 'rgba(0,255,255,0.1)', borderColor: 'rgba(0,255,255,0.3)'}]}>
                   <Text style={[styles.resultRole, {color: Colors.neonCyan}]}>UNDERCOVER</Text>
                   <Text style={styles.resultWord}>{undercoverWord}</Text>
                 </View>

                 {isHost && (
                   <Pressable onPress={() => syncState({ phase: 'lobby' }, 'idle')} style={[styles.primaryButton, {marginTop: 24}]}>
                     <Text style={styles.primaryButtonText}>PLAY AGAIN</Text>
                   </Pressable>
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
  inputGroup: { marginBottom: 16 },
  label: { color: Colors.slateGray, fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8 },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 16, color: Colors.white, fontSize: 16, fontWeight: 'bold' },
  primaryButton: { backgroundColor: Colors.cyanGlow, borderColor: Colors.neonCyan, borderWidth: 1, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginBottom: 16, width: '100%' },
  primaryButtonText: { color: Colors.neonCyan, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  joinRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  flexInput: { flex: 1 },
  joinButton: { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderRadius: 16, paddingHorizontal: 24, justifyContent: 'center' },
  disabled: { opacity: 0.5 },
  statusText: { color: Colors.slateGray, fontSize: 10, fontWeight: 'bold', textAlign: 'center' },
  
  roomCodeTitle: { color: Colors.neonCyan, fontSize: 16, fontWeight: '900', textAlign: 'center', marginBottom: 24, letterSpacing: 2 },
  settingsBlock: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 16, marginBottom: 24 },
  waitingText: { color: Colors.slateGray, fontSize: 14, fontStyle: 'italic', textAlign: 'center', marginVertical: 24 },
  passText: { color: Colors.slateGray, fontSize: 10, fontWeight: 'bold', letterSpacing: 2, textAlign: 'center', marginBottom: 8 },
  currentPlayerText: { color: Colors.white, fontSize: 32, fontWeight: '900', textAlign: 'center', marginBottom: 24 },
  renameRow: { flexDirection: 'row', gap: 8, alignItems: 'center', width: '100%' },
  saveButton: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, paddingHorizontal: 24, justifyContent: 'center', height: '100%' },
  saveButtonText: { color: Colors.white, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  revealButton: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', borderStyle: 'dashed', borderRadius: 24, paddingVertical: 48, alignItems: 'center', marginBottom: 24, width: '100%' },
  revealText: { color: Colors.neonCyan, fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  wordBox: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 2, borderColor: 'rgba(0,255,255,0.2)', borderRadius: 24, padding: 32, alignItems: 'center', marginBottom: 24, width: '100%' },
  wordBoxLabel: { color: Colors.slateGray, fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 16 },
  actualWord: { color: Colors.white, fontSize: 32, fontWeight: '900', textAlign: 'center' },
  wordText: { color: Colors.white, fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: 24 },
  speakerBox: { backgroundColor: 'rgba(0,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(0,255,255,0.3)', borderRadius: 24, padding: 32, alignItems: 'center', marginBottom: 24, width: '100%' },
  speakerText: { color: Colors.neonCyan, fontSize: 40, fontWeight: '900', textAlign: 'center' },
  resultBox: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 16, borderRadius: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  resultRole: { color: Colors.slateGray, fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  resultWord: { color: Colors.white, fontSize: 16, fontWeight: '900' },
  listHeader: { color: Colors.neonRed, fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginTop: 12, marginBottom: 4 },
  listText: { color: Colors.white, fontSize: 14, fontWeight: 'bold' }
});