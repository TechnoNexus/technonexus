import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { getApiUrl } from '../lib/api';
import { supabase } from '../lib/supabase';

const upsertByName = (list, entry) => {
  const filtered = list.filter((item) => item.name !== entry.name);
  return [...filtered, entry];
};

export const getPromptText = (item) => {
  if (!item) return '';
  if (typeof item === 'string') return item;
  if (typeof item === 'object') return item.question || item.content || item.prompt || '';
  return String(item);
};

const buildPerformanceSubmission = (completedCount) => (
  `Performance round complete. Completed ${completedCount} prompt${completedCount === 1 ? '' : 's'}.`
);

export function useForgeLogic() {
  const bridgeRef = useRef(null);

  const [playerName, setPlayerName] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [status, setStatus] = useState('Disconnected');
  const [roomId, setRoomId] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [hostName, setHostName] = useState('');
  const [players, setPlayers] = useState([]);

  const [roomStatus, setRoomStatus] = useState('idle');
  const [gameMode, setGameMode] = useState('individual');
  const [customGame, setCustomGame] = useState(null);
  const [language, setLanguage] = useState('English');
  const [aiPrompt, setAiPrompt] = useState('');
  const [submission, setSubmission] = useState('');
  const [timeLeft, setTimeLeft] = useState(null);
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const [sessionPoints, setSessionPoints] = useState(0);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isEvaluatingBatch, setIsEvaluatingBatch] = useState(false);
  const [isEvaluatingVerdict, setIsEvaluatingVerdict] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [submissions, setSubmissions] = useState([]);
  const [roomScores, setRoomScores] = useState([]);
  const [roundVerdict, setRoundVerdict] = useState(null);
  const [localEvaluation, setLocalEvaluation] = useState(null);

  const [user, setUser] = useState(null);
  const [savedGames, setSavedGames] = useState([]);
  const [deletingGameId, setDeletingGameId] = useState(null);

  const totalPlayers = players.length + 1;
  const normalizedName = playerName.trim().toUpperCase();
  const normalizedJoinRoomId = joinRoomId.trim().toUpperCase();
  const currentPrompt = useMemo(() => {
    if (!customGame || !Array.isArray(customGame.gameContent)) return '';
    return getPromptText(customGame.gameContent[currentContentIndex]);
  }, [customGame, currentContentIndex]);

  const missionPreview = useMemo(() => {
    if (!customGame || !Array.isArray(customGame.gameContent)) return [];
    return customGame.gameContent.slice(0, 4).map(getPromptText).filter(Boolean);
  }, [customGame]);

  const hostSnapshot = useMemo(() => {
    if (!isHost) return null;
    return {
      roomStatus,
      customGame,
      gameMode,
      hostName: hostName || normalizedName
    };
  }, [customGame, gameMode, hostName, isHost, normalizedName, roomStatus]);

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

  const clearRoundState = () => {
    setSubmission('');
    setTimeLeft(null);
    setCurrentContentIndex(0);
    setShowContent(false);
    setSessionPoints(0);
    setHasSubmitted(false);
    setSubmissions([]);
    setRoomScores([]);
    setRoundVerdict(null);
    setLocalEvaluation(null);
  };

  const applyPreparedGame = (game) => {
    setCustomGame(game);
    setRoomStatus('idle');
    clearRoundState();
  };

  const prepareMissionStart = (game, nextMode) => {
    setCustomGame(game);
    if (nextMode) {
      setGameMode(nextMode);
    }
    setRoomStatus('playing');
    setSubmission('');
    setTimeLeft(game?.timeLimitSeconds || 60);
    setCurrentContentIndex(0);
    setShowContent(false);
    setSessionPoints(0);
    setHasSubmitted(false);
    setSubmissions([]);
    setRoomScores([]);
    setRoundVerdict(null);
    setLocalEvaluation(null);
  };

  const resetToRoomIdle = () => {
    setRoomStatus('idle');
    setSubmission('');
    setTimeLeft(null);
    setCurrentContentIndex(0);
    setShowContent(false);
    setSessionPoints(0);
    setHasSubmitted(false);
    setSubmissions([]);
    setRoomScores([]);
    setRoundVerdict(null);
    setLocalEvaluation(null);
  };

  const leaveRoom = async () => {
    await tap(Haptics.ImpactFeedbackStyle.Rigid);
    bridgeRef.current?.leaveRoom();
    setRoomId('');
    setIsHost(false);
    setHostName('');
    setPlayers([]);
    setRoomStatus('idle');
    setGameMode('individual');
    setCustomGame(null);
    setAiPrompt('');
    setStatus('Ready');
    clearRoundState();
  };

  const fetchVault = async (userId) => {
    const { data, error } = await supabase
      .from('user_games')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSavedGames(data);
    }
  };

  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data: { user: activeUser } }) => {
      if (!mounted) return;
      setUser(activeUser);
      if (activeUser) {
        fetchVault(activeUser.id);
      }
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const activeUser = session?.user || null;
      setUser(activeUser);
      if (activeUser) {
        fetchVault(activeUser.id);
      } else {
        setSavedGames([]);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isHost) return;
    bridgeRef.current?.updateHostSnapshot(hostSnapshot);
  }, [hostSnapshot, isHost]);

  useEffect(() => {
    if (roomStatus !== 'playing' || timeLeft === null) return;

    if (timeLeft <= 0) {
      finishMission();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((current) => {
        if (current === null) return current;
        if (current <= 5 && current > 1) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }
        return current - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [roomStatus, timeLeft]);

  useEffect(() => {
    if (!isHost || roomStatus !== 'finished' || !customGame) return;
    if (roomScores.length > 0 || isEvaluatingBatch) return;
    if (submissions.length < totalPlayers) return;

    evaluateBatch();
  }, [customGame, isEvaluatingBatch, isHost, roomScores.length, roomStatus, submissions, totalPlayers]);

  const broadcastRoomSnapshot = (nextCustomGame = customGame, nextMode = gameMode, nextStatus = roomStatus) => {
    if (!isHost || !roomId) return;

    const payload = {
      type: 'room-snapshot',
      roomStatus: nextStatus,
      customGame: nextCustomGame,
      gameMode: nextMode,
      hostName: hostName || normalizedName
    };

    bridgeRef.current?.updateHostSnapshot({
      roomStatus: nextStatus,
      customGame: nextCustomGame,
      gameMode: nextMode,
      hostName: hostName || normalizedName
    });
    bridgeRef.current?.broadcastMessage(payload);
  };

  const evaluateRoundVerdict = async (scores) => {
    if (!scores.length) return;

    setIsEvaluatingVerdict(true);
    try {
      const response = await fetch(getApiUrl('/api/evaluate-leaderboard'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          players: scores,
          missionTitle: customGame?.gameTitle,
          language: customGame?.language || language
        })
      });

      const data = await response.json();
      setRoundVerdict(data);
      bridgeRef.current?.broadcastMessage({
        type: 'round-verdict',
        verdict: data,
        timestamp: Date.now()
      });
    } catch (error) {
      Alert.alert('Verdict Failed', 'The AI judge summary could not be generated.');
    } finally {
      setIsEvaluatingVerdict(false);
    }
  };

  const evaluateBatch = async () => {
    if (!isHost || !customGame || !submissions.length) return;

    setIsEvaluatingBatch(true);
    try {
      const response = await fetch(getApiUrl('/api/evaluate-batch'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructions: customGame.instructions,
          submissions,
          inputType: customGame.inputType,
          language: customGame.language || language,
          gameType: customGame.gameType
        })
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.details || data.error || 'Batch evaluation failed.');
      }
      const results = data.results || [];
      setRoomScores(results);

      const myResult = results.find((item) => item.name === (hostName || normalizedName));
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
      Alert.alert('Analysis Failed', 'The AI judge could not evaluate this round.');
    } finally {
      setIsEvaluatingBatch(false);
    }
  };

  const submitCurrentResponse = (overrideSubmission) => {
    if (hasSubmitted) return;

    const finalSubmission = customGame?.gameType === 'performance'
      ? buildPerformanceSubmission(sessionPoints)
      : (overrideSubmission ?? submission.trim());

    if (!finalSubmission) {
      Alert.alert('Response Required', 'Add a response before you submit this mission.');
      return;
    }

    const outbound = {
      type: 'submit-raw-submission',
      name: isHost ? (hostName || normalizedName) : normalizedName,
      submission: finalSubmission,
      timestamp: Date.now()
    };

    if (isHost) {
      setSubmissions((current) => upsertByName(current, { name: outbound.name, submission: outbound.submission }));
    } else {
      bridgeRef.current?.sendToHost(outbound);
    }

    setHasSubmitted(true);
  };

  function finishMission() {
    if (!customGame || hasSubmitted) return;
    tap(Haptics.ImpactFeedbackStyle.Heavy);
    setRoomStatus('finished');
    submitCurrentResponse();
  }

  const handleMessage = (action, data) => {
    if (action === 'open') {
      setStatus('Ready');
      return;
    }

    if (action === 'connectedToHost') {
      setStatus('Player Connected');
      return;
    }

    if (action === 'player-joined') {
      setPlayers(data.players || []);
      setStatus('Player Connected');
      return;
    }

    if (action === 'player-left') {
      setPlayers(data.players || []);
      setStatus((data.players || []).length > 0 ? 'Player Connected' : 'Ready');
      return;
    }

    if (action === 'disconnectedFromHost') {
      setStatus('Ready');
      Alert.alert('Disconnected', 'The host connection was closed.');
      return;
    }

    if (action === 'close' || action === 'destroyed' || action === 'peer-closed') {
      setStatus('Ready');
      return;
    }

    if (action === 'error') {
      setStatus('Error');
      if (!isHost && !customGame && roomStatus === 'idle') {
        setRoomId('');
      }
      return;
    }

    if (action !== 'data' || !data?.payload) return;

    const payload = data.payload;

    if (payload.type === 'welcome') {
      setIsHost(false);
      setStatus('Player Connected');
      setHostName(payload.hostName || '');
      setPlayers(payload.players || []);
      setGameMode(payload.gameMode || 'individual');
      setRoomStatus(payload.roomStatus || 'idle');
      setCustomGame(payload.customGame || null);
      clearRoundState();

      if (payload.roomStatus === 'playing' && payload.customGame) {
        prepareMissionStart(payload.customGame, payload.gameMode || 'individual');
      }
      return;
    }

    if (payload.type === 'player-list-update') {
      setPlayers(payload.players || []);
      setHostName(payload.hostName || '');
      return;
    }

    if (payload.type === 'room-snapshot') {
      setHostName(payload.hostName || hostName);
      setPlayers(payload.players || players);
      setGameMode(payload.gameMode || gameMode);
      setRoomStatus(payload.roomStatus || roomStatus);
      setCustomGame(payload.customGame || null);

      if (payload.roomStatus === 'idle') {
        clearRoundState();
      }
      return;
    }

    if (payload.type === 'start-game') {
      prepareMissionStart(payload.customGame, payload.gameMode || 'individual');
      notify(Haptics.NotificationFeedbackType.Success);
      return;
    }

    if (payload.type === 'submit-raw-submission') {
      setSubmissions((current) => upsertByName(current, {
        name: payload.name,
        submission: payload.submission
      }));
      return;
    }

    if (payload.type === 'batch-results') {
      const results = payload.results || [];
      setRoomScores(results);
      setRoomStatus('finished');

      const myResult = results.find((item) => item.name === normalizedName || item.name === hostName);
      if (myResult) {
        setLocalEvaluation(myResult);
      }
      return;
    }

    if (payload.type === 'round-verdict') {
      setRoundVerdict(payload.verdict);
    }
  };

  const handleCreateRoom = async () => {
    if (!normalizedName) return;

    await tap();
    setIsHost(true);
    setHostName(normalizedName);
    setPlayers([]);
    setStatus('Creating...');
    bridgeRef.current?.createRoom(normalizedName, {
      roomStatus: 'idle',
      customGame: null,
      gameMode,
      hostName: normalizedName
    });
  };

  const handleJoinRoom = async () => {
    if (!normalizedName || !normalizedJoinRoomId) return;

    await tap();
    setIsHost(false);
    setHostName('');
    setPlayers([]);
    setRoomId(normalizedJoinRoomId);
    setStatus('Connecting...');
    bridgeRef.current?.joinRoom(normalizedJoinRoomId, normalizedName);
  };

  const generateGame = async () => {
    if (!aiPrompt.trim() || !isHost) return;

    await tap();
    setIsGenerating(true);

    try {
      const response = await fetch(getApiUrl('/api/generate-game'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt.trim(),
          language
        })
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.details || data.error || 'Game generation failed.');
      }
      applyPreparedGame(data);
      broadcastRoomSnapshot(data, gameMode, 'idle');
      notify(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert('Forge Failed', 'The mission could not be generated right now.');
    } finally {
      setIsGenerating(false);
    }
  };

  const startMission = async () => {
    if (!isHost || !customGame) return;

    await tap();
    prepareMissionStart(customGame, gameMode);
    bridgeRef.current?.updateHostSnapshot({
      roomStatus: 'playing',
      customGame,
      gameMode,
      hostName: hostName || normalizedName
    });
    bridgeRef.current?.broadcastMessage({
      type: 'start-game',
      status: 'playing',
      customGame,
      gameMode,
      timestamp: Date.now()
    });
  };

  const saveGame = async () => {
    if (!user || !customGame) return;

    await tap();
    setIsSaving(true);
    const { error } = await supabase.from('user_games').insert({
      user_id: user.id,
      game_title: customGame.gameTitle,
      config_json: customGame
    });

    if (error) {
      Alert.alert('Save Failed', error.message);
    } else {
      notify(Haptics.NotificationFeedbackType.Success);
      fetchVault(user.id);
    }
    setIsSaving(false);
  };

  const loadFromVault = async (gameConfig) => {
    await tap(Haptics.ImpactFeedbackStyle.Heavy);
    applyPreparedGame(gameConfig);
    if (isHost) {
      broadcastRoomSnapshot(gameConfig, gameMode, 'idle');
    }
  };

  const deleteFromVault = async (gameId) => {
    if (!user) return;
    setDeletingGameId(gameId);

    const { error } = await supabase
      .from('user_games')
      .delete()
      .eq('id', gameId)
      .eq('user_id', user.id);

    if (error) {
      Alert.alert('Delete Failed', error.message);
    } else {
      notify(Haptics.NotificationFeedbackType.Success);
      fetchVault(user.id);
    }
    setDeletingGameId(null);
  };

  const cyclePerformancePrompt = async (didScore) => {
    await tap(didScore ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light);

    if (didScore) {
      setSessionPoints((current) => current + 1);
    }

    if (customGame?.gameContent && currentContentIndex < customGame.gameContent.length - 1) {
      setCurrentContentIndex((current) => current + 1);
      setShowContent(false);
      return;
    }

    finishMission();
  };

  return {
    bridgeRef,
    state: {
      playerName, setPlayerName,
      joinRoomId, setJoinRoomId,
      status, setStatus,
      roomId, setRoomId,
      isHost, setIsHost,
      hostName, setHostName,
      players, setPlayers,
      roomStatus, setRoomStatus,
      gameMode, setGameMode,
      customGame, setCustomGame,
      language, setLanguage,
      aiPrompt, setAiPrompt,
      submission, setSubmission,
      timeLeft, setTimeLeft,
      currentContentIndex, setCurrentContentIndex,
      showContent, setShowContent,
      sessionPoints, setSessionPoints,
      hasSubmitted, setHasSubmitted,
      isGenerating, setIsGenerating,
      isEvaluatingBatch, setIsEvaluatingBatch,
      isEvaluatingVerdict, setIsEvaluatingVerdict,
      isSaving, setIsSaving,
      submissions, setSubmissions,
      roomScores, setRoomScores,
      roundVerdict, setRoundVerdict,
      localEvaluation, setLocalEvaluation,
      user, setUser,
      savedGames, setSavedGames,
      deletingGameId, setDeletingGameId,
      totalPlayers,
      normalizedName,
      normalizedJoinRoomId,
      currentPrompt,
      missionPreview,
      hostSnapshot
    },
    actions: {
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
    }
  };
}