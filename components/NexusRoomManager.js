'use client';

import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { QRCodeSVG } from 'qrcode.react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export default function NexusRoomManager() {
  const { roomId, setRoomId, isHost, setHost, players, setPlayers, resetRoom, leaderboard, setCustomGame } = useGameStore();
  const [peer, setPeer] = useState(null);
  const [targetId, setTargetId] = useState('');
  const [status, setStatus] = useState('Disconnected');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const connections = useRef([]);

  const generateGame = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    hapticFeedback();
    
    try {
      const response = await fetch('/api/generate-game', {
        method: 'POST',
        body: JSON.stringify({ prompt: aiPrompt }),
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      setCustomGame(data);
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

  const hapticFeedback = async (style = ImpactStyle.Medium) => {
    try { await Haptics.impact({ style }); } catch (e) {}
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
            setPlayers([...players, { peerId: conn.peer, name: data.name }]);
            conn.send({ type: 'welcome', roomId });
          }
        });
        connections.current.push(conn);
        setStatus('Player Connected');
      });
    });

    return () => {
      if (peer) peer.destroy();
    };
  }, []);

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
      hapticFeedback();
    });
  };

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
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 text-center font-mono text-white"
            />
            <button 
              onClick={joinRoom}
              className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold"
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
            <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Nexus AI Game Forge</h4>
              <textarea 
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe your game idea... (e.g. Write a poem with 'paagal')"
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

          {isHost && (
            <div className="flex flex-col items-center gap-4 mb-6 mt-8">
              <div className="p-4 bg-white rounded-2xl">
                <QRCodeSVG value={roomId} size={120} />
              </div>
              <p className="text-slate-500 text-xs">Scan to join this Nexus Room</p>
            </div>
          )}

          <div className="flex flex-col gap-2 mb-6">
            <p className="text-slate-500 text-[10px] uppercase tracking-widest">Players Connected: {players.length + 1}</p>
            <div className="flex flex-wrap justify-center gap-2">
               <span className="px-3 py-1 bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 rounded-full text-[10px] font-bold">HOST</span>
               {players.map((p, i) => (
                 <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] text-slate-400">PLAYER {i+1}</span>
               ))}
            </div>
          </div>

          <button 
            onClick={resetRoom}
            className="text-[10px] font-bold text-slate-600 hover:text-red-500 uppercase tracking-widest"
          >
            Leave Room
          </button>
        </div>
      )}

      {/* Persistence Showcase: Leaderboard */}
      <div className="mt-8 pt-6 border-t border-white/5">
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Nexus Leaderboard</h4>
        <div className="space-y-2">
          {leaderboard.length === 0 ? (
            <p className="text-slate-600 text-[10px] italic">No games recorded in this session.</p>
          ) : (
            leaderboard.map((p, i) => (
              <div key={i} className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-slate-400">{i + 1}. {p.name}</span>
                <span className="text-neon-cyan">{p.wins} WINS</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
