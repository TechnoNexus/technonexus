import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { getApiUrl } from '../lib/api';

const EMPTY_INPUTS = {
  name: '',
  place: '',
  animal: '',
  thing: '',
  movie: ''
};

export const getPlayerDisplayName = (name) => {
  const normalized = `${name || ''}`.trim().toUpperCase();
  return normalized || 'ANONYMOUS';
};

const upsertSubmission = (list, entry) => {
  const filtered = list.filter((item) => item.name !== entry.name);
  return [...filtered, entry];
};

export function useNpatmLogic() {
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

  return {
    bridgeRef,
    lobby: {
      playerName, setPlayerName,
      joinRoomId, setJoinRoomId,
      status, setStatus,
      roomId, setRoomId,
      isHost, setIsHost,
      players, setPlayers
    },
    game: {
      roomStatus, setRoomStatus,
      inputs, setInputs,
      currentLetter, setCurrentLetter,
      stopPressedBy, setStopPressedBy,
      submissions, setSubmissions,
      roomScores, setRoomScores,
      roundVerdict, setRoundVerdict,
      localEvaluation, setLocalEvaluation,
      hasSubmitted, setHasSubmitted,
      isEvaluatingBatch, setIsEvaluatingBatch,
      expectedSubmissions
    },
    actions: {
      tap,
      notify,
      handleStartRound,
      handleMessage,
      handleSubmit,
      evaluateBatch
    }
  };
}
