'use client';

import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { getWebUrl } from '../lib/api';
import NexusRoomPanel from './NexusRoomPanel';
import { useNexusAI } from '../hooks/useNexusAI';
import { useNexusEvents } from '../hooks/useNexusEvents';
import { useNexusTransport } from '../hooks/useNexusTransport';

export default function NexusRoomManager({ showForge = false }) {
  const {
    roomId, isHost, players,
    resetRoom, roomStatus, customGame, playerName, setPlayerName,
    gameMode, setGameMode, hostName, roomScores, setCustomGame
  } = useGameStore();

  const [targetId, setTargetId] = useState(
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('join') || '' : ''
  );
  const [aiPrompt, setAiPrompt] = useState('');
  const [language, setLanguage] = useState('English');
  const [submissions, setSubmissions] = useState([]); 
  const connections = useRef([]);
  const hostConnection = useRef(null);

  const hapticFeedback = async (style = ImpactStyle.Medium) => {
    try { await Haptics.impact({ style }); } catch (e) {}
  };

  const joinUrl = typeof window !== 'undefined' ? `${getWebUrl(window.location.pathname)}?join=${roomId}` : '';

  const {
    status,
    createRoom,
    joinRoom,
    broadcastRoomAction
  } = useNexusTransport({
    isHost,
    playerName,
    targetId,
    setTargetId,
    setSubmissions,
    connections,
    hostConnection
  });

  const {
    isGenerating,
    isEvaluatingRound,
    isEvaluatingBatch,
    generateGame,
    evaluateRound,
    evaluateBatch
  } = useNexusAI({
    connections,
    aiPrompt,
    language,
    customGame,
    submissions,
    roomScores,
    playerName,
    isHost,
    setSubmissions
  });

  const broadcastNPATMStop = (name) => {
    const updatedGame = {
      ...useGameStore.getState().customGame,
      stopPressedBy: name
    };

    setCustomGame(updatedGame);
    connections.current.filter(c => c.open).forEach(conn => {
      try {
        conn.send({
          type: RoomMessageType.NPATM_STOP,
          customGame: updatedGame,
          stoppedBy: name,
          timestamp: Date.now()
        });
      } catch (e) {}
    });
    hapticFeedback(ImpactStyle.Heavy);
  };

  useNexusEvents({
    isHost,
    playerName,
    hostConnection,
    connections,
    setSubmissions,
    broadcastNPATMStop,
    broadcastRoomAction
  });

  return (
    <NexusRoomPanel
      roomId={roomId}
      isHost={isHost}
      players={players}
      roomStatus={roomStatus}
      customGame={customGame}
      playerName={playerName}
      setPlayerName={setPlayerName}
      gameMode={gameMode}
      setGameMode={setGameMode}
      hostName={hostName}
      resetRoom={resetRoom}
      roomScores={roomScores}
      status={status}
      targetId={targetId}
      setTargetId={setTargetId}
      aiPrompt={aiPrompt}
      setAiPrompt={setAiPrompt}
      language={language}
      setLanguage={setLanguage}
      isGenerating={isGenerating}
      isEvaluatingBatch={isEvaluatingBatch}
      submissions={submissions}
      joinUrl={joinUrl}
      showForge={showForge}
      createRoom={createRoom}
      joinRoom={joinRoom}
      generateGame={generateGame}
      evaluateBatch={evaluateBatch}
    />
  );
}
