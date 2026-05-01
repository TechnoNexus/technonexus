import React from 'react';
import {
  ActivityIndicator,
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
import { useNpatmLogic, getPlayerDisplayName } from '../hooks/useNpatmLogic';
import { getApiUrl } from '../lib/api';

const CATEGORIES = [
  { id: 'name', label: 'Name' },
  { id: 'place', label: 'Place' },
  { id: 'animal', label: 'Animal' },
  { id: 'thing', label: 'Thing' },
  { id: 'movie', label: 'Movie' }
];

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
  const { bridgeRef, lobby, game, actions } = useNpatmLogic();

  const {
    playerName, setPlayerName,
    joinRoomId, setJoinRoomId,
    roomId, setRoomId,
    isHost, setIsHost,
    status, setStatus,
    players
  } = lobby;

  const {
    roomStatus,
    inputs, setInputs,
    currentLetter,
    stopPressedBy,
    submissions,
    roomScores,
    roundVerdict,
    localEvaluation,
    isEvaluatingBatch,
    expectedSubmissions
  } = game;

  const {
    tap,
    handleStartRound,
    handleMessage,
    handleSubmit,
    evaluateBatch
  } = actions;

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
                      <QRCodeSVG value={getApiUrl(`/games/npatm?join=${roomId}`).replace('/api', '')} size={140} color={Colors.neonCyan} backgroundColor="transparent" />
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
