'use client';

import { useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NexusRoomPanel({
  // From useGameStore
  roomId,
  isHost,
  players,
  roomStatus,
  customGame,
  playerName,
  setPlayerName,
  gameMode,
  setGameMode,
  hostName,
  resetRoom,
  roomScores,

  // Local State
  status,
  targetId,
  setTargetId,
  aiPrompt,
  setAiPrompt,
  language,
  setLanguage,
  isGenerating,
  isEvaluatingBatch,
  submissions,
  joinUrl,
  showForge,

  // Functions
  createRoom,
  joinRoom,
  generateGame,
  evaluateBatch
}) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const joinId = params.get('join');
      if (joinId && !targetId) {
        setTargetId(joinId);
      }
    }
  }, []);
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
