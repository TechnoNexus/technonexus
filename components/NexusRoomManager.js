'use client';

import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { QRCodeSVG } from 'qrcode.react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export default function NexusRoomManager({ showForge = false }) {
  const { 
    roomId, setRoomId, isHost, setHost, players, setPlayers, 
    resetRoom, setCustomGame, roomStatus, setRoomStatus,
    setLocalEvaluation, roomScores, setRoomScores,
    setRoundVerdict, customGame, playerName, setPlayerName,
    gameMode, setGameMode, hostName, setHostName
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
  const [joinUrl, setJoinUrl] = useState('');
  const connections = useRef([]);
  const hostConnection = useRef(null); 

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setJoinUrl(`${window.location.origin}${window.location.pathname}?join=${roomId}`);
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
          missionTitle: customGame?.gameTitle,
          language: customGame?.language || 'English'
        }),
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      setRoundVerdict(data);
      connections.current.forEach(conn => conn.send({ type: 'round-verdict', verdict: data }));
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
          inputType: customGame?.inputType,
          language: customGame?.language || 'English'
        }),
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      setRoomScores(data.results);
      connections.current.forEach(conn => conn.send({ type: 'batch-results', results: data.results }));
      const myResult = data.results.find(r => r.name === playerName);
      if (myResult) setLocalEvaluation(myResult);
      evaluateRound(data.results);
    } catch (e) {
      console.error('Batch evaluation failed:', e);
    } finally {
      setIsEvaluatingBatch(false);
    }
  };

  const initPeer = (idAsHost) => {
    if (peer) return;
    import('peerjs').then(({ Peer }) => {
      const peerId = idAsHost ? `Nexus-${idAsHost}` : undefined;
      const newPeer = new Peer(peerId);
      
      newPeer.on('open', (id) => {
        console.log("Peer opened with ID:", id);
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
          }
          if (data.type === 'submit-raw-submission') {
            setSubmissions(prev => [...prev, { name: data.name, submission: data.submission }]);
            hapticFeedback(ImpactStyle.Light);
          }
        });
        connections.current.push(conn);
        setStatus('Player Connected');
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
        if (data.type === 'room-status-update') setRoomStatus(data.status);
        if (data.type === 'mode-update') setGameMode(data.mode);
        if (data.type === 'new-custom-game') {
          setCustomGame(data.game);
          setRoundVerdict(null);
          setLocalEvaluation(null);
          hapticFeedback(ImpactStyle.Medium);
        }
        if (data.type === 'round-verdict') setRoundVerdict(data.verdict);
        if (data.type === 'batch-results') {
          setRoomScores(data.results);
          const myResult = data.results.find(r => r.name === playerName);
          if (myResult) setLocalEvaluation(myResult);
        }
      });
    });

    conn.on('error', (err) => {
      console.error("Connection error:", err);
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

  useEffect(() => {
    if (isHost && connections.current.length > 0) {
      connections.current.forEach(conn => {
        conn.send({ type: 'room-status-update', status: roomStatus });
        if (customGame) conn.send({ type: 'new-custom-game', game: customGame });
        conn.send({ type: 'mode-update', mode: gameMode });
      });
    }
  }, [roomStatus, customGame, gameMode, isHost]);

  useEffect(() => {
    const handleLocalSubmit = (e) => {
      const { submission } = e.detail;
      if (isHost) setSubmissions(prev => [...prev, { name: playerName, submission }]);
      else if (hostConnection.current) {
        hostConnection.current.send({ type: 'submit-raw-submission', name: playerName, submission });
      }
    };
    window.addEventListener('nexus-submit-to-host', handleLocalSubmit);
    return () => window.removeEventListener('nexus-submit-to-host', handleLocalSubmit);
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
          {isHost && roomStatus === 'finished' && submissions.length > 0 && !roomScores.length && (
             <div className="mt-8 pt-6 border-t border-white/5">
                <button onClick={evaluateBatch} disabled={isEvaluatingBatch} className="w-full py-4 rounded-2xl bg-neon-cyan text-black font-black text-xs uppercase tracking-widest shadow-neon-glow hover:scale-[0.98] transition-all">{isEvaluatingBatch ? 'AI JUDGE IS THINKING...' : 'SCORE ALL PLAYERS'}</button>
                <p className="text-[10px] text-slate-500 mt-4 uppercase tracking-widest italic">{submissions.length} submissions received</p>
             </div>
          )}
          <div className="flex flex-col gap-4 mb-8 text-left bg-black/20 p-4 rounded-2xl border border-white/5">
            <p className="text-slate-500 text-[10px] uppercase tracking-[0.2em] font-black">In the Nexus: {(players?.length || 0) + 1}</p>
            <div className="flex flex-wrap gap-3">
               <div className="flex items-center gap-2 px-4 py-2 bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30 rounded-xl shadow-cyan-glow/20">
                  <span className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse shadow-[0_0_8px_#00FFFF]" />
                  <span className="text-[10px] font-black uppercase tracking-widest">HOST: {hostName || '...' }</span>
               </div>
               {(players || []).filter(p => p.name !== playerName).map((p, i) => (
                 <div key={i} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                   {p.name}
                 </div>
               ))}
               {!isHost && (
                 <div className="px-4 py-2 bg-electric-violet/10 border border-electric-violet/30 rounded-xl text-[10px] text-electric-violet font-black uppercase tracking-widest animate-in fade-in zoom-in duration-500">
                   YOU
                 </div>
               )}
            </div>
          </div>
          <button onClick={resetRoom} className="text-[10px] font-bold text-slate-600 hover:text-red-500 uppercase tracking-widest transition-colors">Leave Room</button>
        </div>
      )}
    </div>
  );
}
