import React from 'react';
import { useForgeLogic, getPromptText } from '../hooks/useForgeLogic';
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
import { supabase } from '../lib/supabase';

export default function ForgeLobby({ navigation }) {
  const { bridgeRef, state, actions } = useForgeLogic();

  const {
    playerName, setPlayerName,
    joinRoomId, setJoinRoomId,
    status, setStatus,
    roomId, setRoomId,
    isHost, setIsHost,
    hostName, players, roomStatus, setGameMode,
    gameMode, customGame, language, setLanguage,
    aiPrompt, setAiPrompt, submission, setSubmission,
    timeLeft, currentContentIndex, showContent, setShowContent,
    sessionPoints, hasSubmitted, isGenerating,
    isEvaluatingBatch, isEvaluatingVerdict, isSaving,
    submissions, roomScores, roundVerdict,
    localEvaluation, user, savedGames, deletingGameId,
    totalPlayers, normalizedName, normalizedJoinRoomId,
    currentPrompt, missionPreview, hostSnapshot
  } = state;

  const {
    tap,
    notify,
    clearRoundState,
    applyPreparedGame,
    prepareMissionStart,
    resetToRoomIdle,
    leaveRoom,
    broadcastRoomSnapshot,
    evaluateRoundVerdict,
    evaluateBatch,
    submitCurrentResponse,
    finishMission,
    handleMessage,
    handleCreateRoom,
    handleJoinRoom,
    generateGame,
    startMission,
    saveGame,
    loadFromVault,
    deleteFromVault,
    cyclePerformancePrompt
  } = actions;

  const renderIdentityForm = () => (
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
          onPress={handleCreateRoom}
          disabled={!normalizedName}
          style={[styles.hostButton, !normalizedName && styles.disabled]}
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
            onPress={handleJoinRoom}
            disabled={!normalizedName || !normalizedJoinRoomId}
            style={[styles.joinButton, (!normalizedName || !normalizedJoinRoomId) && styles.disabled]}
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
        <Text style={styles.statusText}>ENGINE STATUS: {status.toUpperCase()}</Text>
      </View>
    </GlassPanel>
  );

  const renderVault = () => {
    if (!user || !savedGames.length) return null;

    return (
      <GlassPanel style={styles.panel} intensity={40}>
        <Text style={styles.subsectionTitle}>NEXUS VAULT</Text>
        <View style={styles.vaultList}>
          {savedGames.map((game) => (
            <View key={game.id} style={styles.vaultRow}>
              <View style={styles.vaultMeta}>
                <Text style={styles.vaultTitle} numberOfLines={1}>
                  {game.game_title}
                </Text>
              </View>
              <View style={styles.vaultActions}>
                <Pressable onPress={() => loadFromVault(game.config_json)} style={styles.vaultButton}>
                  <Text style={styles.vaultButtonText}>LOAD</Text>
                </Pressable>
                <Pressable
                  onPress={() => deleteFromVault(game.id)}
                  disabled={deletingGameId === game.id}
                  style={[styles.vaultButton, styles.vaultDeleteButton, deletingGameId === game.id && styles.disabled]}
                >
                  <Text style={[styles.vaultButtonText, styles.vaultDeleteText]}>
                    {deletingGameId === game.id ? '...' : 'DEL'}
                  </Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </GlassPanel>
    );
  };

  const renderRoomLobby = () => (
    <View style={styles.sectionStack}>
      <GlassPanel style={styles.panel} intensity={50}>
        <View style={styles.activeHeader}>
          <Text style={styles.label}>ACTIVE ROOM</Text>
          <Text style={styles.activeRoomId}>{roomId}</Text>
          <Text style={styles.miniStatus}>{status.toUpperCase()}</Text>
        </View>

        {isHost && (
          <View style={styles.qrBlock}>
            <View style={styles.qrWrapper}>
              <QRCodeSVG
                value={getApiUrl(`/games/ai-forge?join=${roomId}`).replace('/api', '')}
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
          <Text style={styles.playerChipHost}>HOST: {(hostName || normalizedName || 'NEXUS').toUpperCase()}</Text>
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

        {isHost && roomStatus === 'idle' && (
          <View style={styles.modeRow}>
            <Pressable
              onPress={async () => {
                await tap();
                setGameMode('individual');
                broadcastRoomSnapshot(customGame, 'individual', 'idle');
              }}
              style={[styles.modeButton, gameMode === 'individual' && styles.modeButtonActive]}
            >
              <Text style={[styles.modeButtonText, gameMode === 'individual' && styles.modeButtonTextActive]}>INDIVIDUAL</Text>
            </Pressable>
            <Pressable
              onPress={async () => {
                await tap();
                setGameMode('team');
                broadcastRoomSnapshot(customGame, 'team', 'idle');
              }}
              style={[styles.modeButton, gameMode === 'team' && styles.modeButtonVioletActive]}
            >
              <Text style={[styles.modeButtonText, gameMode === 'team' && styles.modeButtonTextActive]}>TEAMS</Text>
            </Pressable>
          </View>
        )}
      </GlassPanel>

      {renderVault()}

      {isHost && roomStatus === 'idle' && (
        <GlassPanel style={styles.panel} intensity={50}>
          <Text style={styles.subsectionTitle}>AI GAME FORGE</Text>
          <Text style={styles.label}>LANGUAGE</Text>
          <View style={styles.languageRow}>
            {['English', 'Hindi', 'Hinglish'].map((option) => (
              <Pressable
                key={option}
                onPress={async () => {
                  await tap();
                  setLanguage(option);
                }}
                style={[styles.languageChip, language === option && styles.languageChipActive]}
              >
                <Text style={[styles.languageChipText, language === option && styles.languageChipTextActive]}>
                  {option.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>MISSION IDEA</Text>
          <TextInput
            style={[styles.input, styles.promptInput]}
            placeholder="Describe your mission idea..."
            placeholderTextColor={Colors.slateGray}
            value={aiPrompt}
            onChangeText={setAiPrompt}
            multiline
            textAlignVertical="top"
          />

          <Pressable
            onPress={generateGame}
            disabled={!aiPrompt.trim() || isGenerating}
            style={[styles.forgeButton, (!aiPrompt.trim() || isGenerating) && styles.disabled]}
          >
            {isGenerating ? (
              <ActivityIndicator color={Colors.electricViolet} />
            ) : (
              <Text style={styles.forgeButtonText}>FORGE CUSTOM AI GAME</Text>
            )}
          </Pressable>
        </GlassPanel>
      )}

      {customGame && (
        <GlassPanel style={styles.panel} intensity={55}>
          <Text style={styles.prepBadge}>MISSION PREPARED</Text>
          <Text style={styles.missionTitle}>{customGame.gameTitle}</Text>
          <Text style={styles.instructionsText}>{customGame.instructions}</Text>

          <View style={styles.missionStats}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>DURATION</Text>
              <Text style={styles.statValue}>{customGame.timeLimitSeconds}s</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>MODE</Text>
              <Text style={styles.statValue}>{customGame.gameType?.toUpperCase()}</Text>
            </View>
          </View>

          {!!missionPreview.length && (
            <View style={styles.previewList}>
              {missionPreview.map((item, index) => (
                <View key={`${item}-${index}`} style={styles.previewItem}>
                  <Text style={styles.previewText}>{item}</Text>
                </View>
              ))}
            </View>
          )}

          {isHost ? (
            <View style={styles.hostMissionActions}>
              <Pressable onPress={startMission} style={styles.startButton}>
                <Text style={styles.startButtonText}>START MISSION FOR ALL</Text>
              </Pressable>
              <Pressable onPress={saveGame} disabled={isSaving} style={[styles.secondaryButton, isSaving && styles.disabled]}>
                <Text style={styles.secondaryButtonText}>{isSaving ? 'SAVING...' : 'SAVE TO VAULT'}</Text>
              </Pressable>
            </View>
          ) : (
            <Text style={styles.waitingText}>Waiting for host to launch the mission...</Text>
          )}
        </GlassPanel>
      )}

      <Pressable onPress={leaveRoom} style={styles.leaveButton}>
        <Text style={styles.leaveButtonText}>LEAVE ROOM</Text>
      </Pressable>
    </View>
  );

  const renderPerformanceMission = () => (
    <View style={styles.sectionStack}>
      <GlassPanel style={styles.timerPanel} intensity={55}>
        <Text style={styles.timerValue}>{timeLeft}<Text style={styles.timerSuffix}>s</Text></Text>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.max(0, ((timeLeft || 0) / (customGame?.timeLimitSeconds || 1)) * 100)}%`,
                backgroundColor: (timeLeft || 0) < 10 ? '#EF4444' : Colors.neonCyan
              }
            ]}
          />
        </View>
      </GlassPanel>

      <GlassPanel style={styles.panel} intensity={60}>
        <Text style={styles.playingTitle}>{customGame?.gameTitle}</Text>
        <Text style={styles.playingSubtitle}>ACT THIS OUT</Text>
        {showContent ? (
          <Text style={styles.performancePrompt}>{currentPrompt}</Text>
        ) : (
          <Pressable
            onPress={async () => {
              await tap(Haptics.ImpactFeedbackStyle.Heavy);
              setShowContent(true);
            }}
            style={styles.revealBox}
          >
            <Text style={styles.revealText}>TAP TO REVEAL</Text>
          </Pressable>
        )}

        <View style={styles.performanceActions}>
          <Pressable onPress={() => cyclePerformancePrompt(true)} style={styles.scoreButton}>
            <Text style={styles.scoreButtonText}>
              {currentContentIndex < ((customGame?.gameContent || []).length - 1) ? 'NEXT +' : 'FINISH'}
            </Text>
          </Pressable>
          <Pressable onPress={() => cyclePerformancePrompt(false)} style={styles.skipButton}>
            <Text style={styles.skipButtonText}>SKIP</Text>
          </Pressable>
        </View>
      </GlassPanel>
    </View>
  );

  const renderTextMission = () => (
    <View style={styles.sectionStack}>
      <GlassPanel style={styles.timerPanel} intensity={55}>
        <Text style={styles.timerValue}>{timeLeft}<Text style={styles.timerSuffix}>s</Text></Text>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.max(0, ((timeLeft || 0) / (customGame?.timeLimitSeconds || 1)) * 100)}%`,
                backgroundColor: (timeLeft || 0) < 10 ? '#EF4444' : Colors.neonCyan
              }
            ]}
          />
        </View>
      </GlassPanel>

      <GlassPanel style={styles.panel} intensity={60}>
        <Text style={styles.playingTitle}>{customGame?.gameTitle}</Text>
        <Text style={styles.playingInstructions}>{customGame?.instructions}</Text>

        {!!missionPreview.length && (
          <View style={styles.previewList}>
            {missionPreview.map((item, index) => (
              <View key={`${item}-${index}`} style={styles.previewItem}>
                <Text style={styles.previewText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        <TextInput
          style={[styles.input, styles.responseInput]}
          placeholder="TYPE YOUR RESPONSE HERE..."
          placeholderTextColor={Colors.slateGray}
          value={submission}
          onChangeText={setSubmission}
          multiline
          textAlignVertical="top"
        />

        <Pressable onPress={finishMission} style={styles.submitButton}>
          <Text style={styles.submitButtonText}>SUBMIT EARLY</Text>
        </Pressable>
      </GlassPanel>
    </View>
  );

  const renderPlayingMission = () => (
    <View style={styles.sectionStack}>
      <View style={styles.playingHeader}>
        <Pressable
          onPress={async () => {
            await tap(Haptics.ImpactFeedbackStyle.Medium);
            resetToRoomIdle();
            if (isHost) {
              broadcastRoomSnapshot(customGame, gameMode, 'idle');
            }
          }}
          style={styles.quitButton}
        >
          <Text style={styles.quitButtonText}>QUIT</Text>
        </Pressable>
      </View>

      {customGame?.gameType === 'performance' ? renderPerformanceMission() : renderTextMission()}
    </View>
  );

  const renderFinishedMission = () => (
    <View style={styles.sectionStack}>
      <GlassPanel style={styles.panel} intensity={55}>
        <Text style={styles.finishedTitle}>MISSION ANALYSIS</Text>

        {roundVerdict && (
          <View style={styles.verdictBlock}>
            <Text style={styles.subsectionTitle}>ROUND SUMMARY</Text>
            <Text style={styles.verdictText}>{roundVerdict.roundSummary}</Text>
            <View style={styles.verdictCard}>
              <Text style={styles.verdictLabel}>NEXUS MVP</Text>
              <Text style={styles.verdictTextSmall}>{roundVerdict.mvpVerdict}</Text>
            </View>
            <View style={styles.verdictCard}>
              <Text style={[styles.verdictLabel, { color: '#F87171' }]}>BOTTLENECK</Text>
              <Text style={styles.verdictTextSmall}>{roundVerdict.bottleneckVerdict}</Text>
            </View>
          </View>
        )}

        {roomScores.length > 0 && (
          <View style={styles.scoreboard}>
            <Text style={styles.subsectionTitle}>LIVE SCOREBOARD</Text>
            {[...roomScores].sort((a, b) => b.score - a.score).map((score, index) => (
              <View key={`${score.name}-${index}`} style={styles.scoreRow}>
                <View style={styles.scoreMeta}>
                  <Text style={styles.scoreName}>{score.name}</Text>
                  <Text style={styles.scoreComment}>{score.judgeComment}</Text>
                </View>
                <Text style={styles.scoreValue}>{score.score}</Text>
              </View>
            ))}
          </View>
        )}

        {localEvaluation ? (
          <View style={styles.localScoreCard}>
            <Text style={styles.localScoreValue}>{localEvaluation.score}</Text>
            <Text style={styles.localScoreText}>{localEvaluation.judgeComment}</Text>
          </View>
        ) : (
          <View style={styles.pendingCard}>
            <Text style={styles.pendingText}>
              {isHost
                ? `Awaiting ${Math.max(totalPlayers - submissions.length, 0)} more submission${Math.max(totalPlayers - submissions.length, 0) === 1 ? '' : 's'}...`
                : 'Awaiting AI analysis from host...'}
            </Text>
          </View>
        )}

        {isHost && roomScores.length === 0 && (
          <Pressable
            onPress={evaluateBatch}
            disabled={isEvaluatingBatch || !submissions.length}
            style={[styles.startButton, (isEvaluatingBatch || !submissions.length) && styles.disabled]}
          >
            <Text style={styles.startButtonText}>
              {isEvaluatingBatch ? 'AI JUDGE IS THINKING...' : 'START ANALYSIS NOW'}
            </Text>
          </Pressable>
        )}

        {isEvaluatingVerdict && (
          <Text style={styles.waitingText}>Generating round summary...</Text>
        )}

        <Pressable
          onPress={async () => {
            await tap();
            resetToRoomIdle();
            if (isHost) {
              broadcastRoomSnapshot(customGame, gameMode, 'idle');
            }
          }}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>RETURN TO ROOM</Text>
        </Pressable>
      </GlassPanel>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SpatialBackground />
      <NexusRoomBridge
        ref={bridgeRef}
        onMessage={handleMessage}
        onRoomIdCreated={setRoomId}
        hostSnapshot={hostSnapshot}
      />

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
          <View style={styles.headerCopy}>
            <Text style={styles.headerEyebrow}>AI MISSION ENGINE</Text>
            <Text style={styles.headerTitle}>NEXUS AI FORGE</Text>
          </View>
        </View>

        {!roomId && renderIdentityForm()}
        {!!roomId && roomStatus === 'idle' && renderRoomLobby()}
        {!!roomId && roomStatus === 'playing' && customGame && renderPlayingMission()}
        {!!roomId && roomStatus === 'finished' && renderFinishedMission()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkBg
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 120
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32
  },
  headerCopy: {
    flex: 1,
    alignItems: 'flex-end'
  },
  backButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center'
  },
  headerIcon: {
    color: Colors.neonCyan,
    fontSize: 24,
    fontWeight: '900'
  },
  headerEyebrow: {
    color: Colors.neonCyan,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2
  },
  headerTitle: {
    color: Colors.white,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -1
  },
  panel: {
    padding: 24
  },
  sectionStack: {
    gap: 20
  },
  label: {
    color: Colors.slateGray,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 8
  },
  subsectionTitle: {
    color: Colors.neonCyan,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 12
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 18,
    padding: 16,
    color: Colors.white,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  promptInput: {
    minHeight: 120,
    marginBottom: 18
  },
  responseInput: {
    minHeight: 180,
    marginTop: 8,
    marginBottom: 20
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
  modeRow: {
    flexDirection: 'row',
    gap: 12
  },
  modeButton: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)'
  },
  modeButtonActive: {
    backgroundColor: Colors.cyanGlow,
    borderColor: Colors.neonCyan
  },
  modeButtonVioletActive: {
    backgroundColor: Colors.violetGlow,
    borderColor: Colors.electricViolet
  },
  modeButtonText: {
    color: Colors.slateGray,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1
  },
  modeButtonTextActive: {
    color: Colors.white
  },
  languageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18
  },
  languageChip: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.05)'
  },
  languageChipActive: {
    borderColor: Colors.neonCyan,
    backgroundColor: Colors.cyanGlow
  },
  languageChipText: {
    color: Colors.slateGray,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1
  },
  languageChipTextActive: {
    color: Colors.white
  },
  forgeButton: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.electricViolet,
    backgroundColor: Colors.violetGlow,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center'
  },
  forgeButtonText: {
    color: Colors.electricViolet,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1
  },
  prepBadge: {
    color: Colors.neonCyan,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 10,
    textAlign: 'center'
  },
  missionTitle: {
    color: Colors.white,
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -1,
    marginBottom: 10
  },
  instructionsText: {
    color: Colors.slateGray,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20
  },
  missionStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18
  },
  statBox: {
    flex: 1,
    padding: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    alignItems: 'center'
  },
  statLabel: {
    color: Colors.slateGray,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 6
  },
  statValue: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '900'
  },
  previewList: {
    gap: 10,
    marginBottom: 18
  },
  previewItem: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 14
  },
  previewText: {
    color: Colors.white,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700'
  },
  hostMissionActions: {
    gap: 12
  },
  startButton: {
    borderRadius: 22,
    backgroundColor: Colors.neonCyan,
    paddingVertical: 18,
    alignItems: 'center'
  },
  startButtonText: {
    color: Colors.black,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1
  },
  secondaryButton: {
    borderRadius: 18,
    borderColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 16,
    alignItems: 'center'
  },
  secondaryButtonText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1
  },
  leaveButton: {
    borderRadius: 18,
    borderColor: 'rgba(248,113,113,0.4)',
    borderWidth: 1,
    backgroundColor: 'rgba(239,68,68,0.12)',
    paddingVertical: 16,
    alignItems: 'center'
  },
  leaveButtonText: {
    color: '#F87171',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1
  },
  timerPanel: {
    padding: 22
  },
  timerValue: {
    color: Colors.white,
    fontSize: 54,
    fontWeight: '900',
    textAlign: 'center'
  },
  timerSuffix: {
    color: Colors.neonCyan,
    fontSize: 22
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    marginTop: 12
  },
  progressFill: {
    height: 6,
    borderRadius: 999
  },
  playingHeader: {
    alignItems: 'flex-end'
  },
  quitButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.35)',
    backgroundColor: 'rgba(239,68,68,0.12)',
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  quitButtonText: {
    color: '#F87171',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1
  },
  playingTitle: {
    color: Colors.white,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -1,
    marginBottom: 12
  },
  playingSubtitle: {
    color: Colors.electricViolet,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 18
  },
  playingInstructions: {
    color: Colors.slateGray,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16
  },
  revealBox: {
    minHeight: 200,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22
  },
  revealText: {
    color: Colors.neonCyan,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2
  },
  performancePrompt: {
    color: Colors.white,
    fontSize: 34,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 24
  },
  performanceActions: {
    flexDirection: 'row',
    gap: 12
  },
  scoreButton: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: Colors.neonCyan,
    paddingVertical: 18,
    alignItems: 'center'
  },
  scoreButtonText: {
    color: Colors.black,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1
  },
  skipButton: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.35)',
    backgroundColor: 'rgba(239,68,68,0.12)',
    paddingVertical: 18,
    alignItems: 'center'
  },
  skipButtonText: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1
  },
  submitButton: {
    borderRadius: 18,
    backgroundColor: Colors.white,
    paddingVertical: 18,
    alignItems: 'center'
  },
  submitButtonText: {
    color: Colors.black,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1
  },
  finishedTitle: {
    color: Colors.white,
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -1,
    marginBottom: 20
  },
  verdictBlock: {
    marginBottom: 20
  },
  verdictCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 14,
    marginTop: 10
  },
  verdictLabel: {
    color: Colors.neonCyan,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 6
  },
  verdictText: {
    color: Colors.white,
    fontSize: 14,
    lineHeight: 22
  },
  verdictTextSmall: {
    color: Colors.white,
    fontSize: 13,
    lineHeight: 20
  },
  scoreboard: {
    marginBottom: 20
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    marginBottom: 10
  },
  scoreMeta: {
    flex: 1
  },
  scoreName: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4
  },
  scoreComment: {
    color: Colors.slateGray,
    fontSize: 12,
    lineHeight: 18
  },
  scoreValue: {
    color: Colors.neonCyan,
    fontSize: 32,
    fontWeight: '900'
  },
  localScoreCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,255,255,0.3)',
    backgroundColor: 'rgba(0,255,255,0.08)',
    padding: 22,
    marginBottom: 20
  },
  localScoreValue: {
    color: Colors.neonCyan,
    fontSize: 44,
    fontWeight: '900',
    marginBottom: 8
  },
  localScoreText: {
    color: Colors.white,
    fontSize: 15,
    lineHeight: 22
  },
  pendingCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 16,
    marginBottom: 20
  },
  pendingText: {
    color: Colors.slateGray,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center'
  },
  vaultList: {
    gap: 12
  },
  vaultRow: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  vaultMeta: {
    flex: 1
  },
  vaultTitle: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '800'
  },
  vaultActions: {
    flexDirection: 'row',
    gap: 8
  },
  vaultButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,255,255,0.2)',
    backgroundColor: 'rgba(0,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  vaultDeleteButton: {
    borderColor: 'rgba(248,113,113,0.3)',
    backgroundColor: 'rgba(239,68,68,0.12)'
  },
  vaultButtonText: {
    color: Colors.neonCyan,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1
  },
  vaultDeleteText: {
    color: '#F87171'
  }
});
