import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import * as Haptics from 'expo-haptics';
import QRCodeSVG from 'react-native-qrcode-svg';
import SpatialBackground from '../components/SpatialBackground';
import GlassPanel from '../components/GlassPanel';
import NexusRoomBridge from '../networking/NexusRoomBridge';
import { Colors } from '../theme/Colors';
import { getApiUrl } from '../lib/api';

const EMPTY_INPUTS = {
  name: '',
  place: '',
  animal: '',
  thing: '',
  movie: ''
};

const CATEGORIES = [
  { id: 'name', label: 'Name' },
  { id: 'place', label: 'Place' },
  { id: 'animal', label: 'Animal' },
  { id: 'thing', label: 'Thing' },
  { id: 'movie', label: 'Movie' }
];

const upsertSubmission = (list, entry) => {
  const filtered = list.filter((item) => item.name !== entry.name);
  return [...filtered, entry];
};

const getPlayerDisplayName = (name) => {
  const normalized = `${name || ''}`.trim().toUpperCase();
  return normalized || 'ANONYMOUS';
};

const parseDetail = (rawValue) => {
  const value = `${rawValue || ''}`.trim();
  const parts = value.split('[');
  const word = (parts[0] || '').trim();
  const status = parts[1] ? parts[1].replace(']', '').trim() : value;
  return {
    word: word || '---',
    status: status || 'UNKNOWN'
  };
};

export default function Npatm({ navigation }) {
  const bridgeRef = useRef(null);
  const roundIdRef = useRef(null);

  const [playerName, setPlayerName] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [status, setStatus] = useState('Disconnected');
  const [roomId, setRoomId] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [players, setPlayers] = useState([]);

  const [roomStatus, setRoomStatus] = useState('idle');
  const [inputs, setInputs] = useState(EMPTY_INPUTS);
  const [currentLetter, setCurrentLetter] = useState('');
  const [stopPressedBy, setStopPressedBy] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [roomScores, setRoomScores] = useState([]);
  const [roundVerdict, setRoundVerdict] = useState(null);
  const [localEvaluation, setLocalEvaluation] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isEvaluatingBatch, setIsEvaluatingBatch] = useState(false);

  const expectedSubmissions = players.length + 1;

  const tap = async (style = Haptics.ImpactFeedbackStyle.Medium) => {
    try {
      await Haptics.impactAsync(style);
    } catch (error) {}
  };

  const notify = async (type = Haptics.NotificationFeedbackType.Success) => {
    try {
      await Haptics.notificationAsync(type);
    } catch (error) {}
  };

  const resetRoundState = (nextLetter = '') => {
    setInputs(EMPTY_INPUTS);
    setCurrentLetter(nextLetter);
    setStopPressedBy(null);
    setSubmissions([]);
    setRoomScores([]);
    setRoundVerdict(null);
    setLocalEvaluation(null);
    setHasSubmitted(false);
  };

  const syncState = (patch, nextStatus) => {
    if (isHost && bridgeRef.current) {
      bridgeRef.current.broadcastAction(
        {
          gameType: 'npatm',
          ...patch
        },
        nextStatus || roomStatus
      );
    }
  };

  const handleStartRound = async () => {
    const letters = 'ABCDEFGHIJKLMNOPRSTW';
    const randomLetter = letters[Math.floor(Math.random() * letters.length)];
    const nextRoundId = Date.now();

    await tap();
    roundIdRef.current = nextRoundId;
    resetRoundState(randomLetter);
    setRoomStatus('playing');

    syncState(
      {
        roundId: nextRoundId,
        currentLetter: randomLetter,
        stopPressedBy: null,
        roomScores: []
      },
      'playing'
    );
  };

  const handleMessage = (action, data) => {
    if (action === 'open') {
      setStatus('Ready');
      return;
    }

    if (action === 'connectedToHost' || action === 'connection' || action === 'connection-open') {
      setStatus('Player Connected');
      return;
    }

    if (action === 'player-joined' || action === 'player-left') {
      setPlayers(data.players || []);
      setStatus((data.players || []).length > 0 ? 'Player Connected' : 'Ready');
      return;
    }

    if (action === 'close' || action === 'disconnectedFromHost') {
      setStatus('Ready');
      return;
    }

    if (action === 'error') {
      setStatus('Error');
      return;
    }

    if (action !== 'data' || !data?.payload) return;

    const payload = data.payload;

    if (payload.type === 'welcome') {
      setStatus('Player Connected');
      setPlayers(payload.players || []);
      setRoomStatus(payload.roomStatus || 'idle');

      const snapshot = payload.customGame || {};
      if (snapshot.roundId) {
        roundIdRef.current = snapshot.roundId;
      }
      if (snapshot.currentLetter) {
        setCurrentLetter(snapshot.currentLetter);
      }
      if (snapshot.stopPressedBy) {
        setStopPressedBy(snapshot.stopPressedBy);
      }
      return;
    }

    if (payload.type === 'player-list-update') {
      setPlayers(payload.players || []);
      return;
    }

    if (payload.type === 'npatm-submit' && isHost) {
      const submitterName = getPlayerDisplayName(payload.name);

      if (payload.submission) {
        setSubmissions((current) => upsertSubmission(current, {
          name: submitterName,
          submission: payload.submission
        }));
      }

      if (payload.action === 'STOP' && !stopPressedBy) {
        setStopPressedBy(submitterName);
        setRoomStatus('finished');
        syncState({ stopPressedBy: submitterName }, 'finished');
      }
      return;
    }

    if (payload.type === 'batch-results') {
      const results = payload.results || [];
      setRoomScores(results);
      setRoomStatus('finished');

      const myResult = results.find((item) => item.name === getPlayerDisplayName(playerName));
      if (myResult) {
        setLocalEvaluation(myResult);
      }
      return;
    }

    if (payload.type === 'round-verdict') {
      setRoundVerdict(payload.verdict);
      return;
    }

    if (payload.type === 'game-action' && payload.actionData?.gameType === 'npatm') {
      const state = payload.actionData;

      if (state.roundId && state.roundId !== roundIdRef.current) {
        roundIdRef.current = state.roundId;
        resetRoundState(state.currentLetter || '');
      }

      if (state.currentLetter) {
        setCurrentLetter(state.currentLetter);
      }
      if (state.stopPressedBy !== undefined) {
        setStopPressedBy(state.stopPressedBy);
      }
      if (state.roomScores) {
        setRoomScores(state.roomScores);
      }
      if (payload.roomStatus) {
        setRoomStatus(payload.roomStatus);
      }
    }
  };

  useEffect(() => {
    if (!stopPressedBy || hasSubmitted || roomStatus !== 'finished') return;

    const myName = getPlayerDisplayName(playerName);

    if (isHost) {
      setSubmissions((current) => upsertSubmission(current, {
        name: myName,
        submission: inputs
      }));
    } else {
      bridgeRef.current?.sendToHost({
        type: 'npatm-submit',
        action: 'SUBMIT',
        name: myName,
        submission: inputs,
        roundId: roundIdRef.current,
        timestamp: Date.now()
      });
    }

    setHasSubmitted(true);
  }, [hasSubmitted, inputs, isHost, playerName, roomStatus, stopPressedBy]);

  const handleSubmit = async () => {
    if (stopPressedBy || hasSubmitted) return;

    const myName = getPlayerDisplayName(playerName);
    await notify();

    setStopPressedBy(myName);
    setRoomStatus('finished');
    setHasSubmitted(true);

    if (isHost) {
      setSubmissions((current) => upsertSubmission(current, {
        name: myName,
        submission: inputs
      }));
      syncState({ stopPressedBy: myName }, 'finished');
      return;
    }

    bridgeRef.current?.sendToHost({
      type: 'npatm-submit',
      action: 'STOP',
      name: myName,
      submission: inputs,
      roundId: roundIdRef.current,
      timestamp: Date.now()
    });
  };

  const evaluateRoundVerdict = async (scores) => {
    try {
      const response = await fetch(getApiUrl('/api/evaluate-leaderboard'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          players: scores,
          missionTitle: `NPATM - ${currentLetter}`,
          language: 'English'
        })
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.details || data.error || 'Verdict generation failed.');
      }

      setRoundVerdict(data);
      bridgeRef.current?.broadcastMessage({
        type: 'round-verdict',
        verdict: data,
        timestamp: Date.now()
      });
    } catch (error) {}
  };

  const evaluateBatch = async () => {
    if (!isHost || !submissions.length || !currentLetter) return;

    setIsEvaluatingBatch(true);
    try {
      const response = await fetch(getApiUrl('/api/evaluate-batch'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructions: `Name, Place, Animal, Thing, Movie starting with ${currentLetter}`,
          submissions,
          inputType: 'text',
          language: 'English',
          gameType: 'npatm',
          letter: currentLetter
        })
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.details || data.error || 'Batch evaluation failed.');
      }

      const results = data.results || [];
      setRoomScores(results);
      syncState({ roomScores: results }, 'finished');

      const myResult = results.find((item) => item.name === getPlayerDisplayName(playerName));
      if (myResult) {
        setLocalEvaluation(myResult);
      }

      bridgeRef.current?.broadcastMessage({
        type: 'batch-results',
        results,
        timestamp: Date.now()
      });

      await evaluateRoundVerdict(results);
    } catch (error) {
      Alert.alert('Analysis Failed', error.message || 'The AI judge could not score this round.');
    } finally {
      setIsEvaluatingBatch(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <SpatialBackground />
      <NexusRoomBridge ref={bridgeRef} onMessage={handleMessage} onRoomIdCreated={setRoomId} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Pressable
            onPress={async () => {
              await tap(Haptics.ImpactFeedbackStyle.Medium);
              navigation.goBack();
            }}
            style={styles.backButton}
          >
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
            <TextInput
              style={styles.input}
              placeholder="NICKNAME"
              placeholderTextColor={Colors.slateGray}
              value={playerName}
              onChangeText={setPlayerName}
              autoCapitalize="characters"
            />
            <Pressable
              onPress={() => {
                if (playerName) {
                  setIsHost(true);
                  setPlayers([]);
                  setStatus('Creating...');
                  bridgeRef.current?.createRoom(getPlayerDisplayName(playerName));
                }
              }}
              style={[styles.primaryButton, !playerName && styles.disabled, { marginTop: 16 }]}
            >
              <Text style={styles.primaryButtonText}>HOST GAME</Text>
            </Pressable>
            <View style={styles.joinRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="ROOM ID"
                placeholderTextColor={Colors.slateGray}
                value={joinRoomId}
                onChangeText={setJoinRoomId}
                autoCapitalize="characters"
              />
              <Pressable
                onPress={() => {
                  if (playerName && joinRoomId) {
                    setIsHost(false);
                    setRoomId(joinRoomId);
                    setStatus('Connecting...');
                    bridgeRef.current?.joinRoom(joinRoomId, getPlayerDisplayName(playerName));
                  }
                }}
                style={[styles.joinButton, (!playerName || !joinRoomId) && styles.disabled]}
              >
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
                      <QRCodeSVG value={`https://technonexus.ca/games/npatm?join=${roomId}`} size={140} color={Colors.neonCyan} backgroundColor="transparent" />
                      <Text style={styles.scanLabel}>SCAN TO JOIN</Text>
                    </View>
                  )}
                  <Text style={styles.participantText}>PLAYERS IN ROOM: {expectedSubmissions}</Text>
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
                <GlassPanel style={styles.letterPanel} intensity={60}>
                  <Text style={styles.label}>ACTIVE LETTER</Text>
                  <Text style={styles.letterValue}>{currentLetter}</Text>
                </GlassPanel>

                <View style={{ gap: 12 }}>
                  {CATEGORIES.map((cat) => (
                    <View key={cat.id}>
                      <Text style={styles.label}>{cat.label}</Text>
                      <TextInput
                        style={styles.input}
                        value={inputs[cat.id]}
                        onChangeText={(value) => setInputs((prev) => ({ ...prev, [cat.id]: value }))}
                        editable={!stopPressedBy}
                        placeholder={`Starting with ${currentLetter}...`}
                        placeholderTextColor="rgba(255,255,255,0.12)"
                      />
                    </View>
                  ))}
                </View>

                {!stopPressedBy && (
                  <Pressable
                    onPress={handleSubmit}
                    disabled={Object.values(inputs).some((value) => !value)}
                    style={[styles.stopButton, Object.values(inputs).some((value) => !value) && styles.disabled]}
                  >
                    <Text style={styles.stopButtonText}>STOP!</Text>
                  </Pressable>
                )}
              </View>
            ) : (
              <GlassPanel style={styles.panel} intensity={50}>
                <Text style={styles.finishedTitle}>ROUND OVER</Text>
                <Text style={styles.finishedSubtitle}>
                  {stopPressedBy} pressed STOP! {roomScores.length ? 'The scores are in.' : 'Submissions are ready for host analysis.'}
                </Text>

                {!!roundVerdict && (
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>ROUND SUMMARY</Text>
                    <Text style={styles.summaryText}>{roundVerdict.roundSummary}</Text>
                  </View>
                )}

                {roomScores.length > 0 ? (
                  <View style={{ gap: 12, marginBottom: 20 }}>
                    {roomScores
                      .slice()
                      .sort((a, b) => b.score - a.score)
                      .map((player, index) => (
                        <View key={`${player.name}-${index}`} style={styles.resultCard}>
                          <View style={styles.resultHeader}>
                            <Text style={styles.resultName}>{index + 1}. {player.name}</Text>
                            <Text style={styles.resultScore}>{player.score}</Text>
                          </View>
                          {!!player.details && (
                            <View style={styles.detailGrid}>
                              {Object.entries(player.details).map(([key, rawValue]) => {
                                const detail = parseDetail(rawValue);
                                return (
                                  <View key={key} style={styles.detailTile}>
                                    <Text style={styles.detailKey}>{key.toUpperCase()}</Text>
                                    <Text style={styles.detailWord}>{detail.word}</Text>
                                    <Text style={styles.detailStatus}>{detail.status}</Text>
                                  </View>
                                );
                              })}
                            </View>
                          )}
                          {!!player.judgeComment && (
                            <Text style={styles.judgeComment}>{player.judgeComment}</Text>
                          )}
                        </View>
                      ))}
                  </View>
                ) : isHost ? (
                  <View style={styles.analysisCard}>
                    <Text style={styles.analysisMeta}>
                      SUBMISSIONS RECEIVED: {submissions.length} / {expectedSubmissions}
                    </Text>
                    <Pressable
                      onPress={evaluateBatch}
                      disabled={isEvaluatingBatch || submissions.length === 0}
                      style={[styles.primaryButton, (isEvaluatingBatch || submissions.length === 0) && styles.disabled]}
                    >
                      {isEvaluatingBatch ? (
                        <ActivityIndicator color={Colors.neonCyan} />
                      ) : (
                        <Text style={styles.primaryButtonText}>START ANALYSIS NOW</Text>
                      )}
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.analysisCard}>
                    <Text style={styles.waitingText}>Waiting for host to run AI analysis...</Text>
                  </View>
                )}

                {!!localEvaluation && (
                  <View style={styles.localScoreCard}>
                    <Text style={styles.localScoreValue}>{localEvaluation.score}</Text>
                    <Text style={styles.localScoreText}>{localEvaluation.judgeComment}</Text>
                  </View>
                )}

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
  scrollContent: { padding: 24, paddingTop: 60, paddingBottom: 120 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 },
  backButton: { padding: 8, minWidth: 44, minHeight: 44, justifyContent: 'center' },
  headerIcon: { color: Colors.neonCyan, fontSize: 24, fontWeight: 'bold' },
  headerTitle: { color: Colors.white, fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  panel: { padding: 24 },
  label: { color: Colors.slateGray, fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold'
  },
  primaryButton: {
    backgroundColor: Colors.cyanGlow,
    borderColor: Colors.neonCyan,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  primaryButtonText: { color: Colors.neonCyan, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  joinRow: { flexDirection: 'row', gap: 16 },
  joinButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 24,
    justifyContent: 'center'
  },
  disabled: { opacity: 0.5 },
  waitingText: { color: Colors.slateGray, textAlign: 'center', paddingVertical: 20, fontStyle: 'italic' },
  scanLabel: { color: Colors.neonCyan, fontSize: 8, fontWeight: '900', letterSpacing: 2, marginTop: 8 },
  participantText: { color: Colors.slateGray, fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  letterPanel: { padding: 20, alignItems: 'center' },
  letterValue: { color: Colors.neonCyan, fontSize: 64, fontWeight: '900' },
  stopButton: {
    backgroundColor: Colors.electricViolet,
    borderRadius: 24,
    paddingVertical: 20,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: Colors.electricViolet,
    shadowRadius: 15,
    shadowOpacity: 0.4
  },
  stopButtonText: { color: Colors.white, fontSize: 16, fontWeight: '900', letterSpacing: 4 },
  finishedTitle: { color: Colors.white, fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: 12 },
  finishedSubtitle: { color: Colors.slateGray, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  analysisCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20
  },
  analysisMeta: { color: Colors.slateGray, fontSize: 11, fontWeight: '900', letterSpacing: 1, textAlign: 'center', marginBottom: 12 },
  summaryCard: {
    backgroundColor: 'rgba(139,92,246,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.25)',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20
  },
  summaryLabel: { color: Colors.electricViolet, fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 8 },
  summaryText: { color: Colors.white, lineHeight: 20, fontSize: 13 },
  resultCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: 16
  },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  resultName: { color: Colors.white, fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  resultScore: { color: Colors.neonCyan, fontSize: 28, fontWeight: '900' },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  detailTile: {
    width: '48%',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 10
  },
  detailKey: { color: Colors.slateGray, fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
  detailWord: { color: Colors.white, fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  detailStatus: { color: Colors.neonCyan, fontSize: 10, fontWeight: '900' },
  judgeComment: { color: Colors.slateGray, fontSize: 12, lineHeight: 18, fontStyle: 'italic' },
  localScoreCard: {
    backgroundColor: 'rgba(0,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,255,255,0.25)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20
  },
  localScoreValue: { color: Colors.neonCyan, fontSize: 42, fontWeight: '900', marginBottom: 6 },
  localScoreText: { color: Colors.white, fontSize: 14, lineHeight: 20 }
});
