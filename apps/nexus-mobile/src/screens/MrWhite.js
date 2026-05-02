import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import SpatialBackground from '../components/SpatialBackground';
import GlassPanel from '../components/GlassPanel';
import NexusRoomBridge from '../networking/NexusRoomBridge';
import { Colors } from '../theme/Colors';
import * as Haptics from 'expo-haptics';

const WORD_PAIRS = [
  ['Apple', 'Pear'], ['Car', 'Bus'], ['Guitar', 'Violin'], ['Ocean', 'Lake'],
  ['Sun', 'Moon'], ['Coffee', 'Tea'], ['Lion', 'Tiger'], ['Pizza', 'Burger'],
  ['Pencil', 'Pen'], ['Mountain', 'Hill'], ['Hospital', 'Clinic'],
  ['Batman', 'Superman'], ['Facebook', 'Instagram'], ['Winter', 'Summer'],
  ['Teacher', 'Student']
];

const shuffle = (array) => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export default function MrWhite({ navigation }) {
  const bridgeRef = useRef(null);

  // Lobby State
  const [playerName, setPlayerName] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [status, setStatus] = useState('Disconnected');
  const [roomId, setRoomId] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [networkPlayers, setNetworkPlayers] = useState([]);

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
  const [settings, setSettings] = useState({ totalPlayers: '4', undercovers: '1', mrWhites: '0' });

  // Local Pass-and-Play State
  const [localRevealIndex, setLocalRevealIndex] = useState(0);
  const [localShowWord, setLocalShowWord] = useState(false);
  const [editingName, setEditingName] = useState('');

  const handleMessage = (action, data) => {
    if (action === 'open') setStatus('Ready');
    else if (action === 'connectedToHost' || action === 'connection') setStatus('Player Connected');
    else if (action === 'close' || action === 'disconnectedFromHost') setStatus('Ready');
    else if (action === 'error') setStatus('Error');
    else if (action === 'data') {
      const payload = data.payload;
      
      // Update network players list
      if (payload.type === 'player-list-update' || payload.type === 'welcome') {
          if (payload.players) setNetworkPlayers(payload.players);
      }

      if (payload.type === 'game-action' && payload.actionData && payload.actionData.gameType === 'mr-white') {
        const state = payload.actionData;
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
      }
    }
  };

  const syncState = (patch) => {
    const currentState = { gameType: 'mr-white', isActive, word, undercoverWord, undercoverPlayers, mrWhitePlayers, civilianPlayers, phase, speakerOrder, currentSpeakerIndex, eliminatedPlayers, guessingPlayer, winner };
    const nextState = { ...currentState, ...patch };
    
    if (patch.isActive !== undefined) setIsActive(patch.isActive);
    if (patch.word !== undefined) setWord(patch.word);
    if (patch.undercoverWord !== undefined) setUndercoverWord(patch.undercoverWord);
    if (patch.undercoverPlayers !== undefined) setUndercoverPlayers(patch.undercoverPlayers);
    if (patch.mrWhitePlayers !== undefined) setMrWhitePlayers(patch.mrWhitePlayers);
    if (patch.civilianPlayers !== undefined) setCivilianPlayers(patch.civilianPlayers);
    if (patch.phase !== undefined) setPhase(patch.phase);
    if (patch.speakerOrder !== undefined) setSpeakerOrder(patch.speakerOrder);
    if (patch.currentSpeakerIndex !== undefined) setCurrentSpeakerIndex(patch.currentSpeakerIndex);
    if (patch.eliminatedPlayers !== undefined) setEliminatedPlayers(patch.eliminatedPlayers);
    if (patch.guessingPlayer !== undefined) setGuessingPlayer(patch.guessingPlayer);
    if (patch.winner !== undefined) setWinner(patch.winner);

    if (isHost && bridgeRef.current) bridgeRef.current.broadcastAction(nextState, 'playing');
  };

  const allAssigned = [...undercoverPlayers, ...mrWhitePlayers, ...civilianPlayers];
  const allNetNames = [playerName, ...networkPlayers.map(p => p.name)];
  
  const myDevicePlayers = (speakerOrder || []).filter(p => 
    p === playerName || (isHost && !allNetNames.includes(p))
  );

  useEffect(() => {
    if (phase === 'revealing') {
      setLocalRevealIndex(0);
      setLocalShowWord(false);
      if (myDevicePlayers[0]) setEditingName(myDevicePlayers[0]);
    }
  }, [phase, myDevicePlayers.length]);

  const startGame = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    let allPlayers = [...allNetNames];
    
    // Get custom local names from previous game state
    const previousLocals = [...undercoverPlayers, ...mrWhitePlayers, ...civilianPlayers]
        .filter(p => !allNetNames.includes(p));

    const totalReq = parseInt(settings.totalPlayers) || 3;
    const undersReq = parseInt(settings.undercovers) || 0;
    const whitesReq = parseInt(settings.mrWhites) || 0;

    if (totalReq > allPlayers.length) {
        for (let i = allPlayers.length + 1; i <= totalReq; i++) {
            const prevName = previousLocals[i - allNetNames.length - 1];
            allPlayers.push(prevName || `Player ${i}`);
        }
    } else if (totalReq < allPlayers.length) {
        allPlayers = allPlayers.slice(0, totalReq);
    }

    if (undersReq + whitesReq >= allPlayers.length) {
        alert("Too many special roles!");
        return;
    }

    const shuffle = (array) => {
      const result = [...array];
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
      return result;
    };

    const pair = WORD_PAIRS[Math.floor(Math.random() * WORD_PAIRS.length)];
    let shuffled = shuffle(allPlayers);
    
    const undercovers = shuffled.slice(0, undersReq);
    const mrWhites = shuffled.slice(undersReq, undersReq + whitesReq);
    const civilians = shuffled.slice(undersReq + whitesReq);
    const newSpeakerOrder = shuffle(allPlayers);

    syncState({ 
        isActive: true, word: pair[0], undercoverWord: pair[1], 
        undercoverPlayers: undercovers, mrWhitePlayers: mrWhites, civilianPlayers: civilians, 
        phase: 'revealing', speakerOrder: newSpeakerOrder, currentSpeakerIndex: 0, 
        eliminatedPlayers: [], guessingPlayer: null, winner: null 
    });
  };

  const handleRename = (oldName) => {
      if (!editingName || editingName === oldName) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const replace = (arr) => arr.map(p => p === oldName ? editingName : p);
      syncState({
          undercoverPlayers: replace(undercoverPlayers),
          mrWhitePlayers: replace(mrWhitePlayers),
          civilianPlayers: replace(civilianPlayers),
          speakerOrder: replace(speakerOrder)
      });
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
            <Text style={styles.roomCodeTitle}>ROOM: {roomId}</Text>
            {phase === 'lobby' ? (
              <View>
                {isHost ? (
                  <View>
                    <View style={styles.settingsBlock}>
                        <Text style={styles.label}>Total Players (Net + Local)</Text>
                        <TextInput style={styles.input} keyboardType="number-pad" value={settings.totalPlayers} onChangeText={v => setSettings({...settings, totalPlayers: v})} />
                        <Text style={[styles.label, {marginTop: 16}]}>Undercovers</Text>
                        <TextInput style={styles.input} keyboardType="number-pad" value={settings.undercovers} onChangeText={v => setSettings({...settings, undercovers: v})} />
                        <Text style={[styles.label, {marginTop: 16}]}>Mr. Whites</Text>
                        <TextInput style={styles.input} keyboardType="number-pad" value={settings.mrWhites} onChangeText={v => setSettings({...settings, mrWhites: v})} />
                    </View>
                    <Pressable onPress={startGame} style={styles.primaryButton}>
                      <Text style={styles.primaryButtonText}>START ROUND</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Text style={styles.waitingText}>Waiting for host to configure game...</Text>
                )}
              </View>
            ) : phase === 'revealing' ? (
              <View>
                {myDevicePlayers.length === 0 ? (
                  <Text style={styles.waitingText}>SPECTATING (No role assigned)</Text>
                ) : localRevealIndex < myDevicePlayers.length ? (
                  <View>
                    <Text style={styles.passText}>PASS DEVICE TO:</Text>
                    
                    {!localShowWord ? (
                        <View style={{ marginBottom: 24, alignItems: 'center' }}>
                            {myDevicePlayers[localRevealIndex].startsWith('Player ') ? (
                                <View style={styles.renameRow}>
                                    <TextInput 
                                        style={[styles.input, styles.flexInput, {textAlign: 'center'}]}
                                        value={editingName}
                                        onChangeText={setEditingName}
                                        placeholder="Enter your name"
                                        placeholderTextColor={Colors.slateGray}
                                    />
                                    <Pressable onPress={() => handleRename(myDevicePlayers[localRevealIndex])} style={styles.saveButton}>
                                        <Text style={styles.saveButtonText}>SAVE</Text>
                                    </Pressable>
                                </View>
                            ) : (
                                <Text style={styles.currentPlayerText}>{myDevicePlayers[localRevealIndex]}</Text>
                            )}
                        </View>
                    ) : (
                        <Text style={styles.currentPlayerText}>{myDevicePlayers[localRevealIndex]}</Text>
                    )}
                    
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
                            if (myDevicePlayers[localRevealIndex + 1]) setEditingName(myDevicePlayers[localRevealIndex + 1]);
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

                    {eliminatedPlayers.length > 0 && (
                        <Text style={[styles.passText, {color: Colors.neonRed, marginBottom: 16}]}>
                            Eliminated: {eliminatedPlayers.join(', ')}
                        </Text>
                    )}
                    
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
                            {speakerOrder.map(p => (
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
                    <Text style={styles.waitingText}>They have one chance to guess the civilian word.</Text>
                    
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
                 {eliminatedPlayers.length > 0 && (
                     <Text style={[styles.passText, {marginBottom: 24}]}>Eliminated: {eliminatedPlayers.join(', ')}</Text>
                 )}
                 <View style={styles.resultBox}>
                   <Text style={styles.resultRole}>CIVILIAN</Text>
                   <Text style={styles.resultWord}>{word}</Text>
                 </View>
                 
                 {undercoverPlayers.length > 0 && (
                     <View style={[styles.resultBox, {backgroundColor: 'rgba(0,255,255,0.1)', borderColor: 'rgba(0,255,255,0.3)'}]}>
                       <Text style={[styles.resultRole, {color: Colors.neonCyan}]}>UNDERCOVER</Text>
                       <Text style={styles.resultWord}>{undercoverWord}</Text>
                     </View>
                 )}
                 
                 {undercoverPlayers.length > 0 && (
                     <View>
                         <Text style={styles.listHeader}>UNDERCOVERS:</Text>
                         <Text style={styles.listText}>{undercoverPlayers.join(', ') || 'None'}</Text>
                     </View>
                 )}
                 
                 {mrWhitePlayers.length > 0 && (
                   <View>
                     <Text style={[styles.listHeader, {color: 'orange'}]}>MR. WHITES:</Text>
                     <Text style={[styles.listText, {color: 'orange'}]}>{mrWhitePlayers.join(', ')}</Text>
                   </View>
                 )}

                 {isHost && (
                   <Pressable onPress={() => syncState({ phase: 'lobby' })} style={[styles.primaryButton, {marginTop: 24}]}>
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
  inputGroup: { marginBottom: 24 },
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