"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import UnifiedGameLobby from '@/components/UnifiedGameLobby';
import { Haptics, ImpactStyle } from '@/lib/haptics';
import { motion, AnimatePresence } from 'framer-motion';

// Simple SVG Icons
const Icons = {
  Trophy: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
  ),
  User: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  ),
  MapPin: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
  ),
  Dog: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.123.354-2.5 3-2.5 3"/><path d="M14 5.172c0-1.39 1.577-2.493 3.5-2.172 2.123.354 2.5 3 2.5 3"/><path d="M4.42 11.247A4.422 4.422 0 0 1 3 8V5"/><path d="M19.58 11.247A4.422 4.422 0 0 0 21 8V5"/><path d="M12 18.5c.667 0 1.5-1.5 1.5-2.5 0-1.105-1.343-2-3-2s-3 .895-3 2c0 1 1.03 2.5 1.5 2.5Z"/><path d="M12 18.5c-1.5 0-3-1-3-4a3 3 0 1 1 6 0c0 3-1.5 4-3 4Z"/><path d="M9 14.5c.068-1.722.25-2.5 1-2.5"/><path d="M15 14.5c-.068-1.722-.25-2.5-1-2.5"/><path d="M12 21.485c3.5 0 6-3.485 6-6.485s-2.5-3-6-3-6 0-6 3 2.5 6.485 6 6.485Z"/></svg>
  ),
  Box: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
  ),
  Film: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18"/><path d="M17 3v18"/><path d="M3 7h4"/><path d="M3 12h4"/><path d="M3 17h4"/><path d="M17 7h4"/><path d="M17 12h4"/><path d="M17 17h4"/></svg>
  ),
  Play: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>
  ),
  Timer: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="15" y1="14" y2="11"/><circle cx="12" cy="14" r="8"/></svg>
  ),
  CheckCircle: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
  )
};

export default function NPATMPage() {
  const [hasMounted, setHasMounted] = useState(false);
  const { 
    roomStatus, 
    players, 
    isHost,
    customGame, 
    setCustomGame, 
    setRoomStatus, 
    playerName,
    roomScores,
    sessionLeaderboard
  } = useGameStore();

  const [inputs, setInputs] = useState({
    name: '',
    place: '',
    animal: '',
    thing: '',
    movie: ''
  });
  
  const [stopPressedBy, setStopPressedBy] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluationResults, setEvaluationResults] = useState(null);
  const [currentLetter, setCurrentLetter] = useState('');
  const lastRoundKey = useRef(null);

  // Prevent hydration mismatch
  useEffect(() => {
    setHasMounted(true);
  }, []);

  const categories = [
    { id: 'name', label: 'Name', icon: <Icons.User /> },
    { id: 'place', label: 'Place', icon: <Icons.MapPin /> },
    { id: 'animal', label: 'Animal', icon: <Icons.Dog /> },
    { id: 'thing', label: 'Thing', icon: <Icons.Box /> },
    { id: 'movie', label: 'Movie', icon: <Icons.Film /> }
  ];

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    Haptics.notification({ type: 'success' });

    const myName = playerName || 'Anonymous';
    
    // Dispatch STOP action to room if first
    if (!customGame?.stopPressedBy) {
      window.dispatchEvent(new CustomEvent('npatm-submit-to-host', { 
        detail: { action: 'STOP', name: myName } 
      }));
    }

    // Standard submission
    window.dispatchEvent(new CustomEvent('nexus-submit-to-host', { 
      detail: { submission: inputs } 
    }));

    if (isHost) {
      setCustomGame({
        ...customGame,
        stopPressedBy: customGame?.stopPressedBy || myName
      });
      setRoomStatus('finished');
    }
  }, [isSubmitting, inputs, playerName, isHost, customGame, setCustomGame, setRoomStatus]);

  // Sync state from customGame
  useEffect(() => {
    if (customGame?.stopPressedBy) {
      setStopPressedBy(customGame.stopPressedBy);
      // Auto-submit if we haven't submitted yet and someone pressed STOP
      if (!isSubmitting) {
        console.log('🛑 Auto-submitting NPATM for guest because STOP was pressed by:', customGame.stopPressedBy);
        handleSubmit();
      }
    }
    if (customGame?.currentLetter) setCurrentLetter(customGame.currentLetter);
  }, [customGame?.stopPressedBy, customGame?.currentLetter, isSubmitting, handleSubmit]);

  // Reset round logic
  useEffect(() => {
    const roundKey = customGame?.roundId || customGame?.currentLetter;
    if (roomStatus !== 'playing' || !roundKey || lastRoundKey.current === roundKey) return;

    lastRoundKey.current = roundKey;
    setInputs({ name: '', place: '', animal: '', thing: '', movie: '' });
    setEvaluationResults(null);
    setStopPressedBy(null);
    setIsSubmitting(false);
    setCurrentLetter(customGame.currentLetter || '');
  }, [customGame?.roundId, customGame?.currentLetter, roomStatus]);

  // Sync scores
  useEffect(() => {
    if (roomStatus === 'finished' && roomScores.length > 0) {
      setEvaluationResults(roomScores);
    }
  }, [roomStatus, roomScores]);

  const handleInputChange = (id, value) => {
    if (stopPressedBy || isSubmitting) return;
    setInputs(prev => ({ ...prev, [id]: value }));
  };

  const handleStartMission = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const randomLetter = letters[Math.floor(Math.random() * letters.length)];
    Haptics.impact('heavy');

    setCustomGame({
      gameType: 'npatm',
      currentLetter: randomLetter,
      roundId: Date.now(),
      stopPressedBy: null
    });
    setRoomStatus('playing');
  };

  const resetGame = () => {
    Haptics.impact('medium');
    setRoomStatus('idle');
    setCustomGame(null);
  };

  if (!hasMounted) return null;

  return (
    <div className="min-h-screen bg-dark-bg bg-grid-white text-white py-8 px-4 flex flex-col pb-32 md:pb-8">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
        <header className="flex justify-between items-center mb-12">
          <button onClick={() => window.location.href='/games'} className="text-neon-cyan hover:underline font-mono text-sm p-2 flex items-center gap-2 transition-all hover:-translate-x-1">
             <span className="text-lg">←</span> EXIT
          </button>
          <div className="flex gap-4">
             <button onClick={resetGame} className="px-6 py-2 rounded-xl border border-red-500/30 text-red-500 font-black text-[10px] uppercase tracking-widest hover:bg-red-500/10 transition-all">
                × RESET ROOM
             </button>
          </div>
        </header>

        {roomStatus === 'playing' ? (
          <div className="flex-1 flex flex-col">
            <div className="text-center mb-12 relative">
               <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="inline-block relative">
                 <div className="absolute inset-0 bg-neon-cyan/20 blur-3xl rounded-full" />
                 <h1 className="text-9xl font-black tracking-tighter relative z-10">{currentLetter}</h1>
               </motion.div>
               <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.4em] mt-4">Active Domain</p>
            </div>

            <div className="max-w-lg mx-auto w-full grid grid-cols-1 gap-4">
               {categories.map((cat) => (
                 <div key={cat.id} className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400/50 group-focus-within:text-cyan-400 transition-colors">
                      {cat.icon}
                    </div>
                    <input
                      type="text"
                      placeholder={cat.label.toUpperCase()}
                      value={inputs[cat.id]}
                      onChange={(e) => handleInputChange(cat.id, e.target.value)}
                      disabled={!!stopPressedBy || isSubmitting}
                      className="w-full bg-black/40 border border-white/5 rounded-2xl py-6 pl-14 pr-6 text-xl font-bold text-white outline-none focus:border-neon-cyan focus:bg-black/60 transition-all placeholder:text-slate-700"
                    />
                 </div>
               ))}
               
               <button
                 onClick={handleSubmit}
                 disabled={isSubmitting || !!stopPressedBy}
                 className="mt-8 py-8 rounded-3xl bg-white text-black font-black text-2xl uppercase tracking-tighter hover:bg-neon-cyan transition-all shadow-2xl active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
               >
                 STOP!
               </button>
            </div>
          </div>
        ) : roomStatus === 'finished' ? (
           <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col justify-center items-center py-12">
              <div className="glass-panel p-12 rounded-[4rem] border-white/10 text-center w-full max-w-2xl relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon-cyan to-transparent opacity-50" />
                 
                 <h2 className="text-6xl font-black tracking-tighter uppercase mb-2">Round Over</h2>
                 <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.3em] mb-12">
                   Terminated by: <span className="text-neon-cyan">{stopPressedBy || 'System'}</span>
                 </p>

                 {evaluationResults ? (
                   <div className="space-y-4 text-left max-h-[50vh] overflow-y-auto pr-4 custom-scrollbar">
                      {evaluationResults.map((res, i) => (
                        <div key={i} className="p-6 rounded-3xl bg-white/5 border border-white/10 group hover:border-neon-cyan/30 transition-all">
                           <div className="flex justify-between items-center mb-4">
                              <div className="flex items-center gap-3">
                                 <span className="text-[10px] font-bold text-white/20">#{i+1}</span>
                                 <span className="text-sm font-bold uppercase tracking-tight group-hover:text-cyan-400 transition-colors">{res.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                 <span className="text-2xl font-black text-neon-cyan tabular-nums">{res.score}</span>
                                 <span className="text-[8px] font-bold text-slate-500 uppercase">Points</span>
                              </div>
                           </div>
                           <p className="text-xs text-slate-400 italic leading-relaxed">"{res.verdict}"</p>
                        </div>
                      ))}
                   </div>
                 ) : (
                   <div className="py-20 flex flex-col items-center space-y-6">
                      <div className="w-16 h-16 rounded-full border-t-2 border-l-2 border-neon-cyan animate-spin" />
                      <p className="text-slate-500 font-mono text-[10px] uppercase tracking-widest animate-pulse">Host Analysis in Progress...</p>
                   </div>
                 )}

                 {isHost && (
                    <button onClick={handleStartMission} className="mt-12 w-full py-6 rounded-2xl bg-white text-black font-black uppercase tracking-[0.2em] text-sm hover:bg-neon-cyan transition-all shadow-2xl">
                      Next Round
                    </button>
                 )}
              </div>
           </div>
        ) : (
          <UnifiedGameLobby 
            gameTitle="Nexus NPATM"
            onStart={handleStartMission}
          />
        )}

        {/* Global Hub HUD */}
        {sessionLeaderboard?.length > 0 && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
             <div className="glass-panel px-6 py-3 rounded-2xl border-white/10 flex items-center gap-6 shadow-2xl">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nexus.MVP</span>
                </div>
                <div className="h-4 w-px bg-white/10" />
                <div className="flex items-center gap-3">
                  <Icons.Trophy />
                  <span className="text-xs font-black text-white uppercase tracking-tight">
                    {sessionLeaderboard[0]?.name || '---'} : {sessionLeaderboard[0]?.score || 0}
                  </span>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
