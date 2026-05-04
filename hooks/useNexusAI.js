import { useState, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { Haptics, ImpactStyle } from '../lib/haptics';
import { getApiUrl } from '../lib/api';
import { RoomMessageType } from '../lib/roomProtocol';

export function useNexusAI({ 
  connections, 
  aiPrompt, 
  language, 
  customGame, 
  submissions, 
  roomScores, 
  playerName, 
  isHost,
  setSubmissions
}) {
  const {
    setCustomGame, setRoomScores, setRoundVerdict, setLocalEvaluation, updateLeaderboard
  } = useGameStore();

  const [isGenerating, setIsGenerating] = useState(false);
  const [isEvaluatingRound, setIsEvaluatingRound] = useState(false);
  const [isEvaluatingBatch, setIsEvaluatingBatch] = useState(false);
  const keepAliveInterval = useRef(null);

  const hapticFeedback = async (style = ImpactStyle.Medium) => {
    try { await Haptics.impact({ style }); } catch (e) {}
  };

  const generateGame = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    hapticFeedback();
    try {
      const response = await fetch(getApiUrl('/api/generate-game'), {
        method: 'POST',
        body: JSON.stringify({ prompt: aiPrompt, language }),
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      setCustomGame(data);
      setRoomScores([]);
      setRoundVerdict(null);
      setLocalEvaluation(null);
      setSubmissions([]);
      hapticFeedback(ImpactStyle.Heavy);
      
      connections.current.filter(c => c.open).forEach(conn => {
        try { conn.send({ type: RoomMessageType.NEW_CUSTOM_GAME, game: data }); } catch (e) {}
      });
    } catch (e) {
      console.error('AI Generation Failed:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const evaluateRound = async (overrideScores) => {
    const scoresToUse = overrideScores || roomScores;
    if (!isHost || scoresToUse.length === 0) return;
    setIsEvaluatingRound(true);
    try {
      const res = await fetch(getApiUrl('/api/evaluate-leaderboard'), {
        method: 'POST',
        body: JSON.stringify({ 
          players: scoresToUse, 
          missionTitle: customGame?.gameTitle,
          language: customGame?.language || 'English'
        }),
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      setRoundVerdict(data);
      connections.current.filter(c => c.open).forEach(conn => {
        try { conn.send({ type: RoomMessageType.ROUND_VERDICT, verdict: data }); } catch (e) {}
      });
    } catch (e) {
      console.error('Round evaluation failed:', e);
    } finally {
      setIsEvaluatingRound(false);
    }
  };

  const evaluateBatch = async () => {
    if (!isHost || submissions.length === 0) {
      console.warn('❌ evaluateBatch aborted:', { isHost, submissionCount: submissions.length });
      return;
    }
    setIsEvaluatingBatch(true);
    const isSoloHost = connections.current.filter(c => c.open).length === 0;

    // Start keep-alive ONLY if there are guests to keep alive
    if (!isSoloHost) {
      keepAliveInterval.current = setInterval(() => {
        const activeConns = connections.current.filter(c => c.open);
        activeConns.forEach(conn => {
          try {
            conn.send({ type: RoomMessageType.KEEP_ALIVE, timestamp: Date.now() });
          } catch (e) {}
        });
      }, 2000);
    } else {
      console.log('   ℹ️ Solo host - no keep-alive needed');
    }
    
    try {
      console.log('   🤖 Calling Gemini API...');
      const res = await fetch(getApiUrl('/api/evaluate-batch'), {
        method: 'POST',
        body: JSON.stringify({ 
          instructions: customGame?.instructions,
          submissions: submissions, 
          inputType: customGame?.inputType,
          language: customGame?.language || 'English',
          gameType: customGame?.gameType,
          letter: customGame?.letter || customGame?.currentLetter
        }),
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!res.ok) {
        throw new Error(`API returned ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log('   ✅ Gemini responded with', data.results?.length, 'results');
      console.log('   Results:', data.results);
      setRoomScores(data.results);
      
      // Update session cumulative leaderboard
      if (data.results?.length > 0) {
        useGameStore.getState().updateSessionLeaderboard(data.results);
      }

      // Update persistent leaderboard with the top scorer and record participation for all
      if (data.results?.length > 0) {
        const topScorer = [...data.results].sort((a, b) => b.score - a.score)[0];
        const allPlayerNames = data.results.map(r => r.name);
        if (topScorer?.name && topScorer.score > 0) {
          updateLeaderboard(topScorer.name, allPlayerNames);
        } else {
          updateLeaderboard(null, allPlayerNames); // Record participation only
        }
      }

      // Only broadcast to guests if there ARE guests
      if (!isSoloHost) {
        const activeConnections = connections.current.filter(c => c.open);
        console.log('   📡 Broadcasting to', activeConnections.length, 'guests');
        
        // Send results immediately to all open connections
        activeConnections.forEach(conn => {
          try {
            conn.send({ 
              type: RoomMessageType.BATCH_RESULTS, 
              results: data.results,
              timestamp: Date.now()
            });
            console.log('      ✉️ Sent to:', conn.peer);
          } catch (e) {
            console.error('      ❌ Failed to send to', conn.peer, ':', e);
          }
        });
        
        // Retry if no connections on first attempt
        if (activeConnections.length === 0) {
          console.log('   ⏰ No connections found, retrying in 500ms...');
          await new Promise(r => setTimeout(r, 500));
          const retryConnections = connections.current.filter(c => c.open);
          console.log('   Retry: found', retryConnections.length, 'connections');
          retryConnections.forEach(conn => {
            try {
              conn.send({ 
                type: RoomMessageType.BATCH_RESULTS, 
                results: data.results,
                timestamp: Date.now(),
                isRetry: true
              });
              console.log('      ✉️ Sent (RETRY) to:', conn.peer);
            } catch (e) {
              console.error('      ❌ Retry failed for', conn.peer, ':', e);
            }
          });
        }
      } else {
        console.log('   ℹ️ Solo host - results ready for local display');
      }
      
      // Host always gets their own score
      const myResult = data.results.find(r => r.name === playerName);
      if (myResult) {
        console.log('   👤 Host score:', myResult);
        setLocalEvaluation(myResult);
      }
      evaluateRound(data.results);
      console.log('📊 BATCH EVALUATION COMPLETE ✅');
    } catch (e) {
      console.error('❌ BATCH EVALUATION FAILED:', e);
      alert('AI evaluation failed: ' + e.message);
    } finally {
      // Stop keep-alive if it was running
      if (keepAliveInterval.current) {
        console.log('   ⏹️ Stopping keep-alive heartbeat');
        clearInterval(keepAliveInterval.current);
        keepAliveInterval.current = null;
      }
      setIsEvaluatingBatch(false);
    }
  };

  return {
    isGenerating,
    isEvaluatingRound,
    isEvaluatingBatch,
    generateGame,
    evaluateRound,
    evaluateBatch
  };
}
