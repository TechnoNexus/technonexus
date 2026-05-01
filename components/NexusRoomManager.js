'use client';

import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { QRCodeSVG } from 'qrcode.react';
import { Haptics, ImpactStyle } from '../lib/haptics';
import { getApiUrl, getWebUrl } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';

export default function NexusRoomManager({ showForge = false }) {
  const {
    roomId, setRoomId, isHost, setHost, players, setPlayers,
    resetRoom, setCustomGame, roomStatus, setRoomStatus,
    setLocalEvaluation, roomScores, setRoomScores,
    setRoundVerdict, customGame, playerName, setPlayerName,
    gameMode, setGameMode, hostName, setHostName, updateLeaderboard
  } = useGameStore();

  const [peer, setPeer] = useState(null);
  const [targetId, setTargetId] = useState('');
  const [status, setStatus] = useState('Disconnected');
  const [aiPrompt, setAiPrompt] = useState('');
  const [triggerBroadcast, setTriggerBroadcast] = useState(0); // Force effect re-trigger
  const [language, setLanguage] = useState('English');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEvaluatingRound, setIsEvaluatingRound] = useState(false);
  const [isEvaluatingBatch, setIsEvaluatingBatch] = useState(false);
  const [submissions, setSubmissions] = useState([]); 
  const [joinUrl, setJoinUrl] = useState('');
  const connections = useRef([]);
  const hostConnection = useRef(null);
  const lastStartGameTime = useRef(0);
  const keepAliveInterval = useRef(null); // Keep connections alive during evaluation 

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setJoinUrl(`${getWebUrl(window.location.pathname)}?join=${roomId}`);
    }
  }, [roomId]);

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
        try { conn.send({ type: 'new-custom-game', game: data }); } catch (e) {}
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
        try { conn.send({ type: 'round-verdict', verdict: data }); } catch (e) {}
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
            conn.send({ type: 'keep-alive', timestamp: Date.now() });
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

      // Update persistent leaderboard with the top scorer
      if (data.results?.length > 0) {
        const topScorer = [...data.results].sort((a, b) => b.score - a.score)[0];
        if (topScorer?.name && topScorer.score > 0) {
          updateLeaderboard(topScorer.name);
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
              type: 'batch-results', 
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
                type: 'batch-results', 
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

  const broadcastNPATMStop = (name) => {
    const updatedGame = {
      ...useGameStore.getState().customGame,
      stopPressedBy: name
    };

    setCustomGame(updatedGame);
    connections.current.filter(c => c.open).forEach(conn => {
      try {
        conn.send({
          type: 'npatm-stop',
          customGame: updatedGame,
          stoppedBy: name,
          timestamp: Date.now()
        });
      } catch (e) {}
    });
    hapticFeedback(ImpactStyle.Heavy);
  };

  const applyRoomAction = (actionData = {}, nextStatus) => {
    const currentGame = useGameStore.getState().customGame || {};
    let mergedActionData = actionData;

    if (actionData.blitzResult) {
      const currentResults = currentGame.blitzResults || [];
      const otherResults = currentResults.filter(result => result.name !== actionData.blitzResult.name);
      mergedActionData = {
        ...actionData,
        blitzResults: [...otherResults, actionData.blitzResult].sort((a, b) => b.score - a.score)
      };
      delete mergedActionData.blitzResult;
    }

    const updatedGame = {
      ...currentGame,
      ...mergedActionData
    };

    setCustomGame(updatedGame);
    if (nextStatus) setRoomStatus(nextStatus);
    return updatedGame;
  };

  const broadcastRoomAction = (actionData = {}, nextStatus, excludePeer) => {
    const updatedGame = applyRoomAction(actionData, nextStatus);

    connections.current.filter(c => c.open && c.peer !== excludePeer).forEach(conn => {
      try {
        conn.send({
          type: 'game-action',
          actionData,
          customGame: updatedGame,
          roomStatus: nextStatus,
          timestamp: Date.now()
        });
      } catch (e) {}
    });
  };

  const initPeer = (idAsHost) => {
    if (peer) return;
    import('peerjs').then(({ Peer }) => {
      const peerId = idAsHost ? `Nexus-${idAsHost}` : undefined;
      const newPeer = new Peer(peerId);
      
      newPeer.on('open', (id) => {
        setPeer(newPeer);
        setStatus('Ready');
        const urlParams = new URLSearchParams(window.location.search);
        const joinId = urlParams.get('join');
        if (!idAsHost && (joinId || targetId)) handleJoin(joinId || targetId, newPeer);
      });

      newPeer.on('connection', (conn) => {
        hapticFeedback(ImpactStyle.Heavy);
        conn.on('data', (data) => {
          if (data.type === 'join') {
            const currentPlayers = useGameStore.getState().players || [];
            const newPlayer = { peerId: conn.peer, name: data.name };
            const updatedPlayers = [...currentPlayers, newPlayer];
            setPlayers(updatedPlayers);
            
            conn.send({ 
              type: 'welcome', 
              roomId: idAsHost, 
              gameMode: useGameStore.getState().gameMode,
              players: updatedPlayers,
              hostName: useGameStore.getState().playerName,
              roomStatus: useGameStore.getState().roomStatus,
              customGame: useGameStore.getState().customGame
            });

            connections.current.forEach(c => {
              if (c.peer !== conn.peer) {
                c.send({ type: 'player-list-update', players: updatedPlayers, hostName: useGameStore.getState().playerName });
              }
            });
            
            // Add to pool AFTER successful join - connection is proven to be ready
            if (!connections.current.find(c => c.peer === conn.peer)) {
              connections.current.push(conn);
              setStatus('Player Connected');
            }
          }
          if (data.type === 'submit-raw-submission') {
            setSubmissions(prev => [...prev, { name: data.name, submission: data.submission }]);
            hapticFeedback(ImpactStyle.Light);
          }
          if (data.type === 'game-action') {
            let newGame = data.customGame;
            if (!newGame) {
                const oldGame = useGameStore.getState().customGame || {};
                newGame = { ...oldGame, ...data.actionData };
                if (data.actionData.newPath) {
                    newGame.paths = [...(oldGame.paths || []), data.actionData.newPath];
                    delete newGame.newPath;
                }
            }

            setCustomGame(newGame);
            if (data.roomStatus) setRoomStatus(data.roomStatus);
            hapticFeedback(ImpactStyle.Light);

            // RELAY to other guests
            broadcastRoomAction(data.actionData, data.roomStatus, conn.peer);
          }
          if (data.type === 'npatm-submit') {
            // FIX: Correctly handle action and name for NPATM synchronization
            if (data.action === 'STOP') {
              setCustomGame({
                ...useGameStore.getState().customGame,
                stopPressedBy: data.name
              });
              hapticFeedback(ImpactStyle.Heavy);
            }
          }
        });
        
        conn.on('close', () => {
          connections.current = connections.current.filter(c => c !== conn);
          setStatus('Player Disconnected');
        });
        
        conn.on('error', (err) => {
          connections.current = connections.current.filter(c => c !== conn);
        });
      });

      newPeer.on('error', (err) => {
        console.error("PeerJS Error:", err);
        if (err.type === 'unavailable-id') {
          alert("Room ID already taken.");
          resetRoom();
        } else {
          setStatus('Error');
        }
      });
    });
  };

  const createRoom = () => {
    if (!playerName) return alert("Enter a nickname first!");
    const id = Math.random().toString(36).substring(2, 6).toUpperCase();
    setRoomId(id);
    setHost(true);
    setHostName(playerName);
    initPeer(id);
    hapticFeedback();
  };

  const handleJoin = (idToJoin, activePeer) => {
    const p = activePeer || peer;
    const id = idToJoin || targetId;
    if (!id || !p || !playerName) return;
    const targetPeerId = id.startsWith('Nexus-') ? id : `Nexus-${id}`;
    setStatus('Connecting...');
    const conn = p.connect(targetPeerId);
    
    const timeout = setTimeout(() => {
      if (!hostConnection.current) {
        setStatus('Ready');
        alert("Connection timed out.");
      }
    }, 10000);

    conn.on('open', () => {
      clearTimeout(timeout);
      conn.send({ type: 'join', name: playerName });
      setRoomId(id.replace('Nexus-', ''));
      setHost(false);
      hostConnection.current = conn; 
      setStatus('Player Connected');
      hapticFeedback();

      conn.on('data', (data) => {
        if (data.type === 'welcome') {
          setGameMode(data.gameMode);
          setPlayers(data.players);
          setHostName(data.hostName);
          setRoomStatus(data.roomStatus);
          if (data.customGame) setCustomGame(data.customGame);
        }
        if (data.type === 'player-list-update') {
          setPlayers(data.players);
          setHostName(data.hostName);
        }
        if (data.type === 'start-game') {
          setCustomGame(data.customGame);
          setGameMode(data.gameMode);
          setRoomStatus(data.status);
          setRoundVerdict(null);
          setLocalEvaluation(null);
          hapticFeedback(ImpactStyle.Heavy);

        }
        if (data.type === 'room-status-update') {
          console.log('Status update:', data.status);
          setRoomStatus(data.status);
        }
        if (data.type === 'mode-update') setGameMode(data.mode);
        if (data.type === 'new-custom-game') {
          console.log('New game received, game title:', data.game?.gameTitle);
          setCustomGame(data.game);
          setRoundVerdict(null);
          setLocalEvaluation(null);
          hapticFeedback(ImpactStyle.Medium);
        }
        if (data.type === 'round-verdict') setRoundVerdict(data.verdict);
        if (data.type === 'batch-results') {
          console.log('🎯 Guest received batch-results:', { resultsCount: data.results?.length, playerName });
          setRoomScores(data.results);
          const myResult = data.results.find(r => r.name === playerName);
          if (myResult) {
            console.log('✅ Found my score in results:', myResult);
            setLocalEvaluation(myResult);
          } else {
            console.warn('⚠️ My name not found in results. Available names:', data.results?.map(r => r.name));
          }
        }
        if (data.type === 'keep-alive') {
          // Silently handle keep-alive pings to prevent disconnection during evaluation
          console.log('Keep-alive ping received');
        }
        if (data.type === 'npatm-stop') {
          setCustomGame(data.customGame);
          hapticFeedback(ImpactStyle.Heavy);
        }
        if (data.type === 'game-action') {
          setCustomGame(data.customGame || {
            ...useGameStore.getState().customGame,
            ...data.actionData
          });
          if (data.roomStatus) setRoomStatus(data.roomStatus);
          hapticFeedback(ImpactStyle.Light);
        }
      });

      conn.on('close', () => {
        hostConnection.current = null;
        setStatus('Ready');
        alert('Disconnected from host.');
      });
    });

    conn.on('error', (err) => {
      console.error("Connection error:", err);
      hostConnection.current = null;
      setStatus('Ready');
      alert("Host not found.");
    });
  };

  const joinRoom = () => {
    if (!playerName) return alert("Enter nickname first!");
    if (!targetId && !peer) return alert("Enter Room ID!");
    if (!peer) initPeer(); 
    else handleJoin();
  };

  // Main broadcast effect - triggers on state changes
  useEffect(() => {
    if (!isHost) return;

    if (roomStatus === 'playing') {
      const now = Date.now();
      if (now - lastStartGameTime.current > 2000) {
        const activeConnections = connections.current.filter(c => c.open);
        lastStartGameTime.current = now;
        
        if (activeConnections.length === 0) {
          // No connections yet - wait for retry
        } else {
          activeConnections.forEach(conn => {
            try {
              conn.send({ 
                type: 'start-game', 
                status: 'playing',
                customGame: customGame,
                gameMode: gameMode,
                timestamp: now
              });
            } catch (e) {
              console.error('Failed to send start-game:', e);
            }
          });
        }
      }
    } else {
      lastStartGameTime.current = 0;
      connections.current.forEach(conn => {
        if (conn.open) {
          try {
            conn.send({ type: 'room-status-update', status: roomStatus });
            if (customGame) conn.send({ type: 'new-custom-game', game: customGame });
            conn.send({ type: 'mode-update', mode: gameMode });
          } catch (e) {
            console.error('Failed to send state update:', e);
          }
        }
      });
    }
  }, [roomStatus, customGame, gameMode, isHost]);

  // MONITOR roomStatus changes - trigger broadcast when becomes 'playing'
  useEffect(() => {
    if (isHost && roomStatus === 'playing') {
      setTriggerBroadcast(prev => prev + 1);
    }
  }, [roomStatus, isHost]);

  // USE the trigger to force explicit broadcast
  useEffect(() => {
    if (!isHost || roomStatus !== 'playing') return;
    if (triggerBroadcast === 0) return;
    
    const activeConnections = connections.current.filter(c => c.open);

    if (activeConnections.length > 0) {
      activeConnections.forEach(conn => {
        try {
          conn.send({ 
            type: 'start-game', 
            status: 'playing',
            customGame: customGame,
            gameMode: gameMode,
            timestamp: Date.now()
          });
        } catch (e) {
          console.error('Failed to send start-game:', e);
        }
      });
    }
  }, [isHost, triggerBroadcast, customGame, gameMode]);

  // IMMEDIATE broadcast when roomStatus becomes 'playing'
  useEffect(() => {
    if (!isHost) return;
    
    if (roomStatus === 'playing') {
      const activeConnections = connections.current.filter(c => c.open);

      if (activeConnections.length > 0) {
        activeConnections.forEach(conn => {
          try {
            conn.send({ 
              type: 'start-game', 
              status: 'playing',
              customGame: customGame,
              gameMode: gameMode,
              timestamp: Date.now()
            });
          } catch (e) {
            console.error('Failed to send start-game:', e);
          }
        });
      }
    }
  }, [isHost, roomStatus]);

  useEffect(() => {
    const handleLocalSubmit = (e) => {
      const { submission } = e.detail;
      if (isHost) setSubmissions(prev => [...prev, { name: playerName, submission }]);
      else if (hostConnection.current) {
        hostConnection.current.send({ type: 'submit-raw-submission', name: playerName, submission });
      }
    };

    const handleNPATMSubmit = (e) => {
      const { action, name, playerId, data } = e.detail;
      if (isHost && action === 'STOP') {
        broadcastNPATMStop(name || playerName);
        return;
      }

      if (hostConnection.current) {
        hostConnection.current.send({ 
          type: 'npatm-submit', 
          action,
          name,
          playerId, 
          data
        });
      }
    };

    const handleClearSubmissions = () => {
      setSubmissions([]);
    };

    const handleGameAction = (e) => {
      const { actionData, roomStatus: nextStatus } = e.detail;
      if (isHost) {
        broadcastRoomAction(actionData, nextStatus);
      } else if (hostConnection.current) {
        hostConnection.current.send({
          type: 'game-action',
          actionData,
          roomStatus: nextStatus,
          timestamp: Date.now()
        });
      }
    };

    window.addEventListener('nexus-submit-to-host', handleLocalSubmit);
    window.addEventListener('npatm-submit-to-host', handleNPATMSubmit);
    window.addEventListener('nexus-clear-submissions', handleClearSubmissions);
    window.addEventListener('nexus-game-action', handleGameAction);
    return () => {
      window.removeEventListener('nexus-submit-to-host', handleLocalSubmit);
      window.removeEventListener('npatm-submit-to-host', handleNPATMSubmit);
      window.removeEventListener('nexus-clear-submissions', handleClearSubmissions);
      window.removeEventListener('nexus-game-action', handleGameAction);
    };
  }, [isHost, playerName]);

  return (
    <div className="glass-panel p-6 rounded-3xl border-white/5 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xs font-black tracking-widest text-neon-cyan uppercase">NEXUS ROOM ENGINE</h3>
        <span className={`text-[10px] px-2 py-1 rounded-full ${status === 'Ready' || status === 'Player Connected' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
          {status}
        </span>
      </div>

      {!roomId && (
        <div className="mb-6 text-left">
          <p className="text-[10px] font-bold text-slate-600 uppercase mb-2 ml-1">Your Identity</p>
          <input 
            type="text" 
            placeholder="ENTER NICKNAME"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 font-mono text-white outline-none focus:border-neon-cyan transition-all"
          />
        </div>
      )}

      {!roomId ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          <button onClick={createRoom} className="p-4 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan font-bold hover:bg-neon-cyan hover:text-black transition-all uppercase text-xs tracking-widest">HOST NEW ROOM</button>
          <div className="flex gap-2">
            <input type="text" placeholder="ROOM ID" value={targetId} onChange={(e) => setTargetId(e.target.value.toUpperCase())} className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 text-center font-mono text-white outline-none" />
            <button onClick={joinRoom} className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all uppercase text-xs tracking-widest">JOIN</button>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-slate-500 text-[10px] mb-2 uppercase tracking-widest">Active Room</p>
          <h2 className="text-4xl font-black text-white mb-6 tracking-tighter">{roomId}</h2>
          {isHost && (
            <div className="flex justify-center mb-8 flex-col items-center">
              <div className="p-4 bg-white rounded-3xl mb-2"><QRCodeSVG value={joinUrl} size={128} /></div>
              <p className="text-[8px] text-slate-500 font-mono uppercase tracking-widest">Scan to Join</p>
            </div>
          )}
          {isHost && roomStatus === 'idle' && (
            <div className="mb-6 p-4 bg-white/5 rounded-2xl border border-white/10 flex justify-between items-center text-left">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Game Mode</span>
               <div className="flex bg-black/40 rounded-xl p-1">
                  <button onClick={() => setGameMode('individual')} className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all ${gameMode === 'individual' ? 'bg-neon-cyan text-black' : 'text-slate-500'}`}>INDIVIDUAL</button>
                  <button onClick={() => setGameMode('team')} className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all ${gameMode === 'team' ? 'bg-electric-violet text-white' : 'text-slate-500'}`}>TEAMS</button>
               </div>
            </div>
          )}
          {isHost && showForge && roomStatus === 'idle' && (
            <div className="mt-8 pt-6 border-t border-white/5 space-y-4 text-left">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Nexus AI Game Forge</h4>
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-slate-600 uppercase mb-2 ml-1">Language</p>
                  <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:border-neon-cyan outline-none appearance-none cursor-pointer">
                    <option value="English" className="bg-gray-900 text-white">English</option>
                    <option value="Hindi" className="bg-gray-900 text-white">Hindi (हिंदी)</option>
                    <option value="Hinglish" className="bg-gray-900 text-white">Hinglish (Mix)</option>
                  </select>
                </div>
              </div>
              <p className="text-[10px] font-bold text-slate-600 uppercase mb-2 ml-1">Mission Idea</p>
              <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="Describe your game idea..." className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:border-neon-cyan outline-none h-24" />
              <button onClick={generateGame} disabled={isGenerating || !aiPrompt} className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'bg-electric-violet/20 text-electric-violet border border-electric-violet/30 hover:bg-electric-violet hover:text-white'}`}>{isGenerating ? 'FORGING REALITY...' : 'FORGE CUSTOM AI GAME'}</button>
            </div>
          )}
          {isHost && roomStatus === 'finished' && submissions.length > 0 && (
             <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
                <div className="bg-neon-violet/5 border border-neon-violet/20 rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">🎯 Analysis Ready</p>
                  <p className="text-[10px] text-slate-500 italic mb-4">{submissions.length} {submissions.length === 1 ? 'submission' : 'submissions'} received from {players.length} {players.length === 1 ? 'player' : 'players'}</p>
                  
                  {!roomScores.length ? (
                    <button 
                      onClick={() => {
                        console.log('🚀 Host manually triggered evaluateBatch');
                        evaluateBatch();
                      }}
                      disabled={isEvaluatingBatch}
                      className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                        isEvaluatingBatch 
                          ? 'opacity-50 cursor-not-allowed bg-slate-600 text-white' 
                          : 'bg-neon-cyan text-black shadow-neon-glow hover:scale-[0.98]'
                      }`}
                    >
                      {isEvaluatingBatch ? '⏳ AI JUDGE IS THINKING...' : '▶️ START ANALYSIS NOW'}
                    </button>
                  ) : (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
                      <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">✅ Analysis Complete</p>
                      <p className="text-xs text-green-400 mt-2">Results sent to all players</p>
                    </div>
                  )}
                </div>
             </div>
          )}
          {isHost && roomStatus === 'finished' && submissions.length === 0 && (
             <div className="mt-8 pt-6 border-t border-white/5">
                <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 text-center">
                  <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2">⚠️ No Submissions</p>
                  <p className="text-[10px] text-red-400 italic">Waiting for players to submit responses...</p>
                </div>
             </div>
          )}
          <div className="flex flex-col gap-4 mb-8 text-left bg-black/20 p-5 rounded-3xl border border-white/5 shadow-inner">
            <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] font-black">In the Nexus: {(players?.length || 0) + 1}</p>
            <motion.div layout className="flex flex-wrap gap-3">
               <motion.div 
                 layout 
                 initial={{ opacity: 0, scale: 0.8 }} 
                 animate={{ opacity: 1, scale: 1 }} 
                 className="flex items-center gap-2 px-4 py-2 bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30 rounded-xl shadow-neon-glow"
               >
                  <span className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse shadow-[0_0_8px_#00FFFF]" />
                  <span className="text-[10px] font-black uppercase tracking-widest">HOST: {hostName || '...' }</span>
               </motion.div>
               <AnimatePresence>
                 {(players || []).filter(p => p.name !== playerName).map((p, i) => (
                   <motion.div 
                     layout
                     initial={{ opacity: 0, scale: 0.8, filter: 'blur(4px)' }} 
                     animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} 
                     exit={{ opacity: 0, scale: 0.8 }}
                     key={p.peerId || i} 
                     className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] text-slate-300 uppercase font-bold tracking-wider shadow-sm"
                   >
                     {p.name}
                   </motion.div>
                 ))}
                 {!isHost && (
                   <motion.div 
                     layout 
                     initial={{ opacity: 0, scale: 0.8 }} 
                     animate={{ opacity: 1, scale: 1 }} 
                     className="px-4 py-2 bg-electric-violet/10 border border-electric-violet/30 rounded-xl text-[10px] text-electric-violet font-black uppercase tracking-widest shadow-violet-glow"
                   >
                     YOU
                   </motion.div>
                 )}
               </AnimatePresence>
            </motion.div>
          </div>
          <button onClick={resetRoom} className="text-[10px] font-bold text-slate-600 hover:text-red-500 uppercase tracking-widest transition-colors">Leave Room</button>
        </div>
      )}
    </div>
  );
}
