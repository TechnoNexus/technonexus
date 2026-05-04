import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, PanResponder } from 'react-native';
import SpatialBackground from '../components/SpatialBackground';
import GlassPanel from '../components/GlassPanel';
import NexusRoomBridge from '../networking/NexusRoomBridge';
import UnifiedGameLobby from '../components/UnifiedGameLobby';
import { Colors } from '../theme/Colors';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
export default function Pictionary({ navigation }) {
  const bridgeRef = useRef(null);

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
  const [drawer, setDrawer] = useState('');
  const [paths, setPaths] = useState([]); // Array of { color, points: [{x, y}] }
  
  // Local Drawing
  const [currentColor, setCurrentColor] = useState('#00FFFF');
  const currentColorRef = useRef('#00FFFF');
  const [currentPath, setCurrentPath] = useState(null);

  // Update ref when state changes
  useEffect(() => {
    currentColorRef.current = currentColor;
  }, [currentColor]);

  const handleMessage = (action, data) => {
    if (action === 'open') setStatus('Ready');
    else if (action === 'connectedToHost' || action === 'connection') setStatus('Player Connected');
    else if (action === 'close' || action === 'disconnectedFromHost') setStatus('Ready');
    else if (action === 'error') setStatus('Error');
    else if (action === 'data') {
      const payload = data.payload;
      
      if (payload.type === 'game-action' && payload.actionData && payload.actionData.gameType === 'pictionary') {
        const state = payload.actionData;
        applyState(state);
        
        // Handle new path relay
        if (state.newPath) {
          setPaths(prev => [...prev, state.newPath]);
          // If host, relay to others
          if (isHost && bridgeRef.current) {
            bridgeRef.current.broadcastAction({ gameType: 'pictionary', newPath: state.newPath }, 'playing');
          }
        }
      }
    }
  };

  const applyState = (state) => {
    if (state.isActive !== undefined) setIsActive(state.isActive);
    if (state.word !== undefined) setWord(state.word);
    if (state.drawer !== undefined) setDrawer(state.drawer);
    if (state.paths !== undefined) setPaths(state.paths);
  };

  const syncState = (patch, broadcastDelta = null) => {
    const currentState = { gameType: 'pictionary', isActive, word, drawer, paths };
    const nextState = { ...currentState, ...patch };
    
    applyState(patch);

    if (bridgeRef.current) {
      if (isHost) {
        if (broadcastDelta) {
            bridgeRef.current.broadcastAction({ gameType: 'pictionary', ...broadcastDelta }, 'playing');
        } else {
            bridgeRef.current.broadcastAction(nextState, 'playing');
        }
      } else {
        // Guest sends to host
        bridgeRef.current.sendToHost({
          type: 'game-action',
          actionData: { gameType: 'pictionary', ...patch, ...broadcastDelta }
        });
      }
    }
  };

  useEffect(() => {
    if (customGame?.gameType === 'pictionary') {
        applyState(customGame);
    }
  }, [customGame]);

  const handleStartMission = (unifiedPlayers) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const playerNames = unifiedPlayers.map(p => p.name);
    
    const nextDrawer = playerNames[Math.floor(Math.random() * playerNames.length)] || playerName;
    const newWord = WORDS[Math.floor(Math.random() * WORDS.length)];

    syncState({ isActive: true, word: newWord, drawer: nextDrawer, paths: [] });
  };

  const clearCanvas = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    syncState({ paths: [] });
  };

  const isMyTurn = playerName === drawer || (!drawer && isHost);

  // SVG PanResponder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e, gestureState) => {
        const x = e.nativeEvent.locationX;
        const y = e.nativeEvent.locationY;
        setCurrentPath({ color: currentColorRef.current, points: [{ x, y }] });
      },
      onPanResponderMove: (e, gestureState) => {
        const x = e.nativeEvent.locationX;
        const y = e.nativeEvent.locationY;
        setCurrentPath(prev => {
            if (!prev) return prev;
            return { ...prev, points: [...prev.points, { x, y }] };
        });
      },
      onPanResponderRelease: () => {
        setCurrentPath(prev => {
            if (prev && prev.points.length > 1) {
                // Sync only the new path instead of entire array for performance
                syncState({}, { newPath: prev });
                setPaths(old => [...old, prev]);
            }
            return null;
        });
      }
    })
  ).current;


  // Convert points to SVG path data (M x y L x y ...)
  const generateSvgPath = (points) => {
    if (!points || points.length === 0) return '';
    return points.reduce((acc, point, idx) => {
        return acc + (idx === 0 ? `M ${point.x} ${point.y}` : ` L ${point.x} ${point.y}`);
    }, '');
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <SpatialBackground />
      <NexusRoomBridge ref={bridgeRef} onMessage={handleMessage} onRoomIdCreated={setRoomId} />
      
      <ScrollView contentContainerStyle={styles.scrollContent} scrollEnabled={!isMyTurn}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.headerIcon}>{'<'}</Text>
          </Pressable>
          <Text style={styles.headerTitle}>PICTIONARY</Text>
          <View style={styles.headerSpacer} />
        </View>

        {!roomId || (!isActive && roomStatus === 'idle') ? (
          <UnifiedGameLobby
            gameTitle="Nexus Pictionary"
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
          <View style={styles.gameContainer}>
            <View style={styles.playingView}>
                <Text style={styles.turnLabel}>DRAWER: {drawer}</Text>
                {isMyTurn ? (
                    <Text style={styles.myWordText}>{word}</Text>
                ) : (
                    <Text style={styles.guessText}>GUESS THE DRAWING</Text>
                )}

                {isMyTurn && (
                    <View style={styles.colorRow}>
                        {['#000000', '#00FFFF', '#8B5CF6', '#FFFFFF', '#FF0055', '#FFFF00', '#00FF00'].map(c => (
                            <Pressable 
                                key={c} 
                                onPress={() => setCurrentColor(c)}
                                style={[styles.colorBubble, {backgroundColor: c}, currentColor === c && styles.colorBubbleActive, c === '#000000' && {borderWidth: 1, borderColor: currentColor === c ? Colors.white : 'rgba(255,255,255,0.2)'}]}
                            />
                        ))}
                        <Pressable onPress={clearCanvas} style={styles.clearButton}>
                            <Text style={styles.clearButtonText}>CLEAR</Text>
                        </Pressable>
                    </View>
                )}

                <View style={styles.canvasContainer} {...(isMyTurn ? panResponder.panHandlers : {})}>
                    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
                        {/* Render synced paths */}
                        {paths.map((p, idx) => (
                            <Path 
                                key={`path-${idx}`} 
                                d={generateSvgPath(p.points)} 
                                stroke={p.color} 
                                strokeWidth={4} 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                fill="none" 
                            />
                        ))}
                        {/* Render active current drawing path */}
                        {currentPath && (
                            <Path 
                                d={generateSvgPath(currentPath.points)} 
                                stroke={currentPath.color} 
                                strokeWidth={4} 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                fill="none" 
                            />
                        )}
                    </Svg>
                </View>

                {isHost && (
                    <Pressable onPress={handleStartMission} style={[styles.primaryButton, {marginTop: 24, backgroundColor: 'transparent', borderColor: Colors.slateGray}]}>
                        <Text style={[styles.primaryButtonText, {color: Colors.slateGray}]}>NEXT ROUND</Text>
                    </Pressable>
                )}
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.darkBg },
  scrollContent: { padding: 24, paddingTop: 60, minHeight: '100%' },
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
  gameContainer: { flex: 1 },
  lobbyView: { alignItems: 'center', justifyContent: 'center', flex: 1, paddingVertical: 40 },
  waitingText: { color: Colors.slateGray, fontSize: 14, fontStyle: 'italic', textAlign: 'center' },
  playingView: { alignItems: 'center', width: '100%' },
  turnLabel: { color: Colors.slateGray, fontSize: 10, fontWeight: 'bold', letterSpacing: 2, marginBottom: 8 },
  myWordText: { color: Colors.neonCyan, fontSize: 28, fontWeight: '900', marginBottom: 16 },
  guessText: { color: Colors.white, fontSize: 24, fontWeight: '900', marginBottom: 16 },
  
  colorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, width: '100%', justifyContent: 'center', gap: 12 },
  colorBubble: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: 'transparent' },
  colorBubbleActive: { borderColor: Colors.white, transform: [{scale: 1.2}] },
  clearButton: { marginLeft: 16, backgroundColor: 'rgba(255,0,0,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  clearButtonText: { color: Colors.neonRed, fontSize: 10, fontWeight: 'bold' },

  canvasContainer: { width: '100%', aspectRatio: 0.8, backgroundColor: Colors.white, borderRadius: 24, overflow: 'hidden' }
});
