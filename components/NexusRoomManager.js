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
    roundVerdict, setRoundVerdict, customGame
  } = useGameStore();

  const [peer, setPeer] = useState(null);
  const [targetId, setTargetId] = useState('');
  const [status, setStatus] = useState('Disconnected');
  const [aiPrompt, setAiPrompt] = useState('');
  const [language, setLanguage] = useState('English');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEvaluatingRound, setIsEvaluatingRound] = useState(false);
  const connections = useRef([]);
  const hostConnection = useRef(null); // Ref for guest to talk back to host

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
      setRoomScores([]); // Reset scores for new game
      setRoundVerdict(null);
      setLocalEvaluation(null);
      hapticFeedback(ImpactStyle.Heavy);
      
      // Notify all connected players via PeerJS
      connections.current.forEach(conn => {
        conn.send({ type: 'new-custom-game', game: data });
      });
    } catch (e) {
      console.error('AI Generation Failed:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const evaluateRound = async () => {
    if (!isHost || roomScores.length === 0) return;
    setIsEvaluatingRound(true);
    try {
      const res = await fetch('/api/evaluate-leaderboard', {
        method: 'POST',
        body: JSON.stringify({ 
          players: roomScores, 
          missionTitle: customGame?.gameTitle 
        }),
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      setRoundVerdict(data);
      
      // Broadcast verdict to all
      connections.current.forEach(conn => {
        conn.send({ type: 'round-verdict', verdict: data });
      });
    } catch (e) {
      console.error('Round evaluation failed:', e);
    } finally {
      setIsEvaluatingRound(false);
    }
  };

  useEffect(() => {
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
            conn.send({ type: 'welcome', roomId });
          }
          // HOST LOGIC: Receive score from guest
          if (data.type === 'submit-score') {
            setRoomScores([...useGameStore.getState().roomScores, { name: data.name, score: data.score, judgeComment: data.judgeComment }]);
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
  }, [roomId, setPlayers]);

  const createRoom = () => {
    const id = Math.random().toString(36).substring(2, 6).toUpperCase();
    setRoomId(id);
    setHost(true);
    hapticFeedback();
  };

  const joinRoom = () => {
    if (!targetId || !peer) return;
    const conn = peer.connect(targetId);
    conn.on('open', () => {
      conn.send({ type: 'join', name: 'Player' });
      setRoomId(targetId);
      setHost(false);
      hostConnection.current = conn; 
      hapticFeedback();

      conn.on('data', (data) => {
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
      });
    });
  };

  // Guest Broadcast Score Effect
  useEffect(() => {
    if (!isHost && localEvaluation && hostConnection.current) {
      hostConnection.current.send({
        type: 'submit-score',
        name: 'Player',
        score: localEvaluation.score,
        judgeComment: localEvaluation.judgeComment
      });
    }
    if (isHost && localEvaluation && roomScores.findIndex(s => s.name === 'HOST') === -1) {
       setRoomScores([...roomScores, { name: 'HOST', score: localEvaluation.score, judgeComment: localEvaluation.judgeComment }]);
    }
  }, [localEvaluation, isHost]);

  // Host broadcast effect for room status
  useEffect(() => {
    if (isHost && connections.current.length > 0) {
      connections.current.forEach(conn => {
        conn.send({ type: 'room-status-update', status: roomStatus });
      });
    }
  }, [roomStatus, isHost]);

  // Host broadcast effect for custom game
  useEffect(() => {
    if (isHost && connections.current.length > 0 && customGame) {
      connections.current.forEach(conn => {
        conn.send({ type: 'new-custom-game', game: customGame });
      });
    }
  }, [customGame, isHost]);

  return (
    <div className="glass-panel p-6 rounded-3xl border-white/5 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xs font-black tracking-widest text-neon-cyan uppercase">NEXUS ROOM ENGINE</h3>
        <span className={`text-[10px] px-2 py-1 rounded-full ${status === 'Ready' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
          {status}
        </span>
      </div>

      {!roomId ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={createRoom}
            className="p-4 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan font-bold hover:bg-neon-cyan hover:text-black transition-all"
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
              className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all"
            >
              JOIN
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-slate-500 text-[10px] mb-2 uppercase tracking-widest">Active Room</p>
          <h2 className="text-4xl font-black text-white mb-6 tracking-tighter">{roomId}</h2>
          
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

          {isHost && roomStatus === 'finished' && roomScores.length > 0 && !roundVerdict && (
             <div className="mt-8 pt-6 border-t border-white/5">
                <button 
                  onClick={evaluateRound}
                  disabled={isEvaluatingRound}
                  className="w-full py-4 rounded-2xl bg-neon-cyan text-black font-black text-xs uppercase tracking-widest shadow-neon-glow hover:scale-[0.98] transition-all"
                >
                  {isEvaluatingRound ? 'AI JUDGE IS THINKING...' : 'GET ROOM VERDICT'}
                </button>
                <p className="text-[10px] text-slate-500 mt-4 uppercase tracking-widest italic">
                   {roomScores.length} submissions received
                </p>
             </div>
          )}

          <div className="flex flex-col gap-2 mb-6 mt-8">
            <p className="text-slate-500 text-[10px] uppercase tracking-widest">Players: {(players?.length || 0) + 1}</p>
            <div className="flex flex-wrap justify-center gap-2">
               <span className="px-3 py-1 bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 rounded-full text-[10px] font-bold">HOST</span>
               {(players || []).map((p, i) => (
                 <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] text-slate-400">PLAYER {i+1}</span>
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
