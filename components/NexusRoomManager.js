'use client';

import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { QRCodeSVG } from 'qrcode.react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export default function NexusRoomManager({ showForge = false }) {
  const { 
    roomId, setRoomId, isHost, setHost, players, setPlayers, 
    resetRoom, leaderboard, setCustomGame, roomStatus, setRoomStatus,
    localEvaluation, setLocalEvaluation, roomScores, setRoomScores,
    roundVerdict, setRoundVerdict, customGame, playerName, setPlayerName,
    gameMode, setGameMode
  } = useGameStore();

  const [peer, setPeer] = useState(null);
  const [targetId, setTargetId] = useState('');
  const [status, setStatus] = useState('Disconnected');
  const [aiPrompt, setAiPrompt] = useState('');
  const [language, setLanguage] = useState('English');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEvaluatingRound, setIsEvaluatingRound] = useState(false);
  const [isEvaluatingBatch, setIsEvaluatingBatch] = useState(false);
  const [submissions, setSubmissions] = useState([]); 
  const connections = useRef([]);
  const hostConnection = useRef(null); 

  const hapticFeedback = async (style = ImpactStyle.Medium) => {
    try { await Haptics.impact({ style }); } catch (e) {}
  };

  const generateGame = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    hapticFeedback();
    
    try {
      const response = await fetch('/api/generate-game', {
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
      
      connections.current.forEach(conn => {
        conn.send({ type: 'new-custom-game', game: data });
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
      const res = await fetch('/api/evaluate-leaderboard', {
        method: 'POST',
        body: JSON.stringify({ 
          players: scoresToUse, 
          missionTitle: customGame?.gameTitle 
        }),
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      setRoundVerdict(data);
      
      connections.current.forEach(conn => {
        conn.send({ type: 'round-verdict', verdict: data });
      });
    } catch (e) {
      console.error('Round evaluation failed:', e);
    } finally {
      setIsEvaluatingRound(false);
    }
  };

  const evaluateBatch = async () => {
    if (!isHost || submissions.length === 0) return;
    setIsEvaluatingBatch(true);
    try {
      const res = await fetch('/api/evaluate-batch', {
        method: 'POST',
        body: JSON.stringify({ 
          instructions: customGame?.instructions,
          submissions: submissions, 
          inputType: customGame?.inputType
        }),
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      setRoomScores(data.results);
      
      connections.current.forEach(conn => {
        conn.send({ type: 'batch-results', results: data.results });
      });
      
      const myResult = data.results.find(r => r.name === playerName);
      if (myResult) setLocalEvaluation(myResult);

      evaluateRound(data.results);
    } catch (e) {
      console.error('Batch evaluation failed:', e);
    } finally {
      setIsEvaluatingBatch(false);
    }
  };

  useEffect(() => {
    if (!playerName) return;

    import('peerjs').then(({ Peer }) => {
      const newPeer = new Peer();
      
      newPeer.on('open', (id) => {
        setPeer(newPeer);
        setStatus('Ready');
      });

      newPeer.on('connection', (conn) => {
        hapticFeedback(ImpactStyle.Heavy);
        conn.on('data', (data) => {
          if (data.type === 'join') {
            setPlayers((prev) => [...(prev || []), { peerId: conn.peer, name: data.name }]);
            conn.send({ type: 'welcome', roomId, gameMode: useGameStore.getState().gameMode });
          }
          if (data.type === 'submit-raw-submission') {
            setSubmissions(prev => [...prev, { name: data.name, submission: data.submission }]);
            hapticFeedback(ImpactStyle.Light);
          }
        });
        connections.current.push(conn);
        setStatus('Player Connected');
      });
    });

    return () => {
      if (peer) peer.destroy();
    };
  }, [playerName]);

  // Listen for local submissions
  useEffect(() => {
    const handleLocalSubmit = (e) => {
      const { submission } = e.detail;
      if (isHost) {
        setSubmissions(prev => [...prev, { name: playerName, submission }]);
      } else if (hostConnection.current) {
        hostConnection.current.send({ 
          type: 'submit-raw-submission', 
          name: playerName, 
          submission 
        });
      }
    };

    window.addEventListener('nexus-submit-to-host', handleLocalSubmit);
    return () => window.removeEventListener('nexus-submit-to-host', handleLocalSubmit);
  }, [isHost, playerName]);

  const createRoom = () => {
    if (!playerName) return alert("Enter a nickname first!");
    const id = Math.random().toString(36).substring(2, 6).toUpperCase();
    setRoomId(id);
    setHost(true);
    hapticFeedback();
  };

  const [joinUrl, setJoinUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setJoinUrl(`${window.location.origin}${window.location.pathname}?join=${roomId}`);
    }
  }, [roomId]);

  // Handle joining from URL param
  useEffect(() => {
    if (typeof window !== 'undefined' && peer && playerName) {
      const urlParams = new URLSearchParams(window.location.search);
      const joinId = urlParams.get('join');
      if (joinId && !roomId) {
        setTargetId(joinId);
        // We can't call joinRoom directly here because targetId state might not have updated
        // but we can pass joinId to a modified join function
        handleJoin(joinId);
      }
    }
  }, [peer, playerName]);

  const handleJoin = (idToJoin) => {
    const id = idToJoin || targetId;
    if (!id || !peer || !playerName) return;
    
    console.log("Attempting to join:", id);
    const conn = peer.connect(id);
    
    // Set a timeout for connection
    const timeout = setTimeout(() => {
      if (status !== 'Player Connected') {
        alert("Connection timed out. Check Room ID.");
      }
    }, 5000);

    conn.on('open', () => {
      clearTimeout(timeout);
      conn.send({ type: 'join', name: playerName });
      setRoomId(id);
      setHost(false);
      hostConnection.current = conn; 
      hapticFeedback();

      conn.on('data', (data) => {
        if (data.type === 'welcome') {
          setGameMode(data.gameMode);
        }
        if (data.type === 'mode-update') {
          setGameMode(data.mode);
        }
        if (data.type === 'new-custom-game') {
          setCustomGame(data.game);
          setRoundVerdict(null);
          setLocalEvaluation(null);
          hapticFeedback(ImpactStyle.Medium);
        }
        if (data.type === 'room-status-update') {
          setRoomStatus(data.status);
        }
        if (data.type === 'round-verdict') {
          setRoundVerdict(data.verdict);
        }
        if (data.type === 'batch-results') {
          setRoomScores(data.results);
          const myResult = data.results.find(r => r.name === playerName);
          if (myResult) setLocalEvaluation(myResult);
        }
      });
    });

    conn.on('error', (err) => {
      console.error("Connection error:", err);
      alert("Failed to connect to room.");
    });
  };

  const joinRoom = () => handleJoin();

  useEffect(() => {
    if (isHost && connections.current.length > 0) {
      connections.current.forEach(conn => conn.send({ type: 'mode-update', mode: gameMode }));
    }
  }, [gameMode, isHost]);

  useEffect(() => {
    if (isHost && connections.current.length > 0) {
      connections.current.forEach(conn => {
        conn.send({ type: 'room-status-update', status: roomStatus });
      });
    }
  }, [roomStatus, isHost]);

  return (
    <div className="glass-panel p-6 rounded-3xl border-white/5 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xs font-black tracking-widest text-neon-cyan uppercase">NEXUS ROOM ENGINE</h3>
        <span className={`text-[10px] px-2 py-1 rounded-full ${status === 'Ready' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
          {status}
        </span>
      </div>

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

      {!roomId ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={createRoom}
            className="p-4 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan font-bold hover:bg-neon-cyan hover:text-black transition-all uppercase text-xs tracking-widest"
          >
            HOST NEW ROOM
          </button>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="ROOM ID"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value.toUpperCase())}
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 text-center font-mono text-white outline-none"
            />
            <button 
              onClick={joinRoom}
              className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all uppercase text-xs tracking-widest"
            >
              JOIN
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-slate-500 text-[10px] mb-2 uppercase tracking-widest">Active Room</p>
          <h2 className="text-4xl font-black text-white mb-6 tracking-tighter">{roomId}</h2>
          
          {isHost && (
            <div className="flex justify-center mb-8 flex-col items-center">
              <div className="p-4 bg-white rounded-3xl mb-2">
                <QRCodeSVG value={joinUrl} size={128} />
              </div>
              <p className="text-[8px] text-slate-500 font-mono uppercase tracking-widest">Scan to Join</p>
            </div>
          )}

          {isHost && roomStatus === 'idle' && (
            <div className="mb-6 p-4 bg-white/5 rounded-2xl border border-white/10 flex justify-between items-center text-left">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Game Mode</span>
               <div className="flex bg-black/40 rounded-xl p-1">
                  <button 
                    onClick={() => setGameMode('individual')}
                    className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all ${gameMode === 'individual' ? 'bg-neon-cyan text-black' : 'text-slate-500'}`}
                  >
                    INDIVIDUAL
                  </button>
                  <button 
                    onClick={() => setGameMode('team')}
                    className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all ${gameMode === 'team' ? 'bg-electric-violet text-white' : 'text-slate-500'}`}
                  >
                    TEAMS
                  </button>
               </div>
            </div>
          )}

          {isHost && showForge && roomStatus === 'idle' && (
            <div className="mt-8 pt-6 border-t border-white/5 space-y-4 text-left">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Nexus AI Game Forge</h4>
              
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-slate-600 uppercase mb-2 ml-1">Language</p>
                  <select 
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:border-neon-cyan transition-colors outline-none appearance-none cursor-pointer"
                  >
                    <option value="English" className="bg-gray-900 text-white">English</option>
                    <option value="Hindi" className="bg-gray-900 text-white">Hindi (हिंदी)</option>
                    <option value="Hinglish" className="bg-gray-900 text-white">Hinglish (Mix)</option>
                  </select>
                </div>
              </div>

              <p className="text-[10px] font-bold text-slate-600 uppercase mb-2 ml-1">Mission Idea</p>
              <textarea 
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe your game idea..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:border-neon-cyan transition-colors outline-none h-24"
              />
              <button 
                onClick={generateGame}
                disabled={isGenerating || !aiPrompt}
                className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                  isGenerating ? 'opacity-50 cursor-not-allowed' : 'bg-electric-violet/20 text-electric-violet border border-electric-violet/30 hover:bg-electric-violet hover:text-white'
                }`}
              >
                {isGenerating ? 'FORGING REALITY...' : 'FORGE CUSTOM AI GAME'}
              </button>
            </div>
          )}

          {isHost && roomStatus === 'finished' && submissions.length > 0 && !roomScores.length && (
             <div className="mt-8 pt-6 border-t border-white/5">
                <button 
                  onClick={evaluateBatch}
                  disabled={isEvaluatingBatch}
                  className="w-full py-4 rounded-2xl bg-neon-cyan text-black font-black text-xs uppercase tracking-widest shadow-neon-glow hover:scale-[0.98] transition-all"
                >
                  {isEvaluatingBatch ? 'AI JUDGE IS THINKING...' : 'SCORE ALL PLAYERS'}
                </button>
                <p className="text-[10px] text-slate-500 mt-4 uppercase tracking-widest italic">
                   {submissions.length} submissions received
                </p>
             </div>
          )}

          <div className="flex flex-col gap-2 mb-6 mt-8 text-left">
            <p className="text-slate-500 text-[10px] uppercase tracking-widest">Players: {(players?.length || 0) + 1}</p>
            <div className="flex flex-wrap gap-2">
               <span className="px-3 py-1 bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 rounded-full text-[10px] font-bold">{playerName || 'HOST'}</span>
               {(players || []).map((p, i) => (
                 <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] text-slate-400">{p.name || `PLAYER ${i+1}`}</span>
               ))}
            </div>
          </div>

          <button 
            onClick={resetRoom}
            className="text-[10px] font-bold text-slate-600 hover:text-red-500 uppercase tracking-widest transition-colors"
          >
            Leave Room
          </button>
        </div>
      )}
    </div>
  );
}
