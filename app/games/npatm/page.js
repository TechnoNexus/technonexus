"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import NexusRoomManager from '@/components/NexusRoomManager';
import { Haptics } from '@/lib/haptics';

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
    leaderboard,
    roomScores
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
    Haptics.notification('success');

    const me = players.find(p => p.isMe);
    const myName = me?.name || 'Anonymous';
    
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
      setRoomStatus('finished');
    }
  }, [isSubmitting, inputs, players, isHost, customGame, setRoomStatus]);

  // Sync state from customGame
  useEffect(() => {
    if (customGame?.stopPressedBy) {
      setStopPressedBy(customGame.stopPressedBy);
      // Auto-submit if game is active and we haven't submitted
      if (roomStatus === 'playing' && !isSubmitting) {
        handleSubmit();
      }
    }
    if (customGame?.currentLetter) {
      setCurrentLetter(customGame.currentLetter);
    }
  }, [customGame, roomStatus, isSubmitting, handleSubmit]);

  // Clear results on new round
  useEffect(() => {
    if (roomStatus === 'playing') {
      setIsSubmitting(false);
      setEvaluationResults(null);
    }
  }, [roomStatus]);

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

  const handleStartRound = () => {
    const letters = 'ABCDEFGHIJKLMNOPRSTW';
    const randomLetter = letters[Math.floor(Math.random() * letters.length)];
    Haptics.impact('medium');
    
    // Clear states for new round
    setInputs({ name: '', place: '', animal: '', thing: '', movie: '' });
    setEvaluationResults(null);
    setStopPressedBy(null);
    setIsSubmitting(false);
    
    // Crucial: Clear host results so "Start Analysis" button reappears
    if (isHost) {
      useGameStore.getState().setRoomScores([]);
      // We also need to signal the Room Manager to clear its local submissions array
      window.dispatchEvent(new CustomEvent('nexus-clear-submissions'));
    }

    setCustomGame({
      gameType: 'npatm',
      currentLetter: randomLetter,
      stopPressedBy: null,
      instructions: `Name, Place, Animal, Thing, Movie starting with ${randomLetter}`,
      letter: randomLetter
    });
    setRoomStatus('playing');
  };

  // FIX: Move all hooks above conditional returns
  const sessionLeaderboard = useGameStore((state) => state.sessionLeaderboard);

  if (!hasMounted) return null;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-6 pb-32">
      {/* Side Leaderboard (Desktop) */}
      <div className="hidden xl:block fixed left-8 top-1/2 -translate-y-1/2 w-64 glass-panel p-6 rounded-[2rem] border-white/5">
        <h3 className="text-xs font-black tracking-widest text-cyan-400 uppercase mb-6 flex items-center gap-2">
          <Icons.Trophy /> SESSION RANKING
        </h3>
        <div className="space-y-4">
          {sessionLeaderboard.length > 0 ? sessionLeaderboard.map((p, i) => (
            <div key={i} className="flex items-center justify-between group">
               <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-white/20">#{i+1}</span>
                  <span className="text-sm font-bold uppercase tracking-tight group-hover:text-cyan-400 transition-colors">{p.name}</span>
               </div>
               <span className="text-cyan-400 font-black font-mono text-sm">{p.score}</span>
            </div>
          )) : (
            <p className="text-[10px] text-white/20 italic uppercase tracking-widest">No scores yet...</p>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-8 mt-12">
        
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black tracking-tighter uppercase italic animate-in fade-in slide-in-from-top duration-700">
            <span className="gradient-text-cyan">NEXUS</span> NPATM
          </h1>
          <p className="text-gray-400 text-sm font-medium tracking-widest uppercase">Name • Place • Animal • Thing • Movie</p>
        </div>

        <div className="relative">
          {(roomStatus === 'idle' || roomStatus === 'LOBBY') && (
            <div className="glass-panel p-8 rounded-[2.5rem] text-center space-y-6 animate-in zoom-in duration-500">
              <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto border border-cyan-500/20">
                <Icons.Play />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Ready for the Nexus Alpha?</h2>
                <p className="text-gray-400 px-4">Wait for the host to generate the first letter. Be the first to shout STOP!</p>
              </div>
              {isHost && (
                <div className="space-y-3">
                  <button 
                    onClick={handleStartRound}
                    className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-black rounded-2xl transition-all uppercase tracking-wider"
                  >
                    Start Round with Friends
                  </button>
                  <button 
                    onClick={handleStartRound}
                    className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl border border-white/10 transition-all uppercase tracking-widest text-xs"
                  >
                    Play Solo Mode
                  </button>
                </div>
              )}
            </div>
          )}

          {roomStatus === 'playing' && (
            <div className="space-y-6 animate-in fade-in zoom-in duration-500">
              <div className="flex justify-between items-center bg-white/5 border border-white/10 p-6 rounded-[2rem] backdrop-blur-xl">
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-1">Active Letter</p>
                  <div className="text-6xl font-black text-cyan-400 drop-shadow-[0_0_15px_rgba(0,255,255,0.3)]">
                    {currentLetter}
                  </div>
                </div>
                <div className="text-right">
                  {stopPressedBy ? (
                    <div className="flex flex-col items-end text-red-400 animate-pulse">
                      <Icons.Timer />
                      <span className="text-xs font-bold uppercase tracking-tighter">STOPPED BY</span>
                      <span className="text-lg font-black">{stopPressedBy}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-end text-cyan-400/50">
                      <div className="animate-spin-slow"><Icons.Timer /></div>
                      <span className="text-xs font-bold uppercase tracking-tighter">Round Active</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {categories.map((cat) => (
                  <div key={cat.id} className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-cyan-400/50 group-focus-within:text-cyan-400 transition-colors">
                      {cat.icon}
                    </div>
                    <input
                      type="text"
                      placeholder={cat.label}
                      value={inputs[cat.id]}
                      disabled={!!stopPressedBy || isSubmitting}
                      onChange={(e) => handleInputChange(cat.id, e.target.value)}
                      className="w-full bg-white/5 border border-white/10 focus:border-cyan-500/50 py-5 pl-14 pr-6 rounded-2xl outline-none transition-all placeholder:text-white/20 font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-widest text-white/20">
                      {cat.id}
                    </div>
                  </div>
                ))}
              </div>

              {!stopPressedBy && (
                <button
                  onClick={handleSubmit}
                  disabled={Object.values(inputs).some(v => !v)}
                  className="w-full py-5 bg-violet-600 hover:bg-violet-500 disabled:bg-white/5 disabled:text-white/20 text-white font-black rounded-[2rem] transition-all uppercase tracking-widest shadow-lg shadow-violet-900/20 flex items-center justify-center gap-3 group"
                >
                  <Icons.CheckCircle />
                  STOP & FINISH
                </button>
              )}
            </div>
          )}

          {roomStatus === 'finished' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-500">
              <div className="glass-panel p-8 rounded-[2.5rem] border-cyan-500/30">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-cyan-500/20 rounded-2xl text-cyan-400">
                    <Icons.Trophy />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Round Summary</h2>
                    <p className="text-gray-400 text-sm italic">"The Judge has spoken."</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {(evaluationResults || []).map((player, idx) => (
                    <div key={idx} className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden">
                      <div className="flex items-center justify-between p-5 bg-white/5">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black text-white/30 bg-white/5 px-2 py-1 rounded-lg">RANK {idx + 1}</span>
                          <span className="font-black uppercase tracking-tight text-lg">{player.name}</span>
                        </div>
                        <div className="text-cyan-400 font-black text-2xl drop-shadow-cyan-glow">+{player.score || 0}</div>
                      </div>
                      
                      {player.details && (
                        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-white/5">
                          {Object.entries(player.details).map(([cat, rawValue]) => {
                            // Extract "Word" and "[Status]" from "Word [Status]"
                            const parts = rawValue.split('[');
                            const word = parts[0].trim();
                            const status = parts[1] ? parts[1].replace(']', '').trim() : rawValue;

                            return (
                              <div key={cat} className="flex flex-col bg-black/40 p-3 rounded-xl border border-white/5 space-y-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{cat}</span>
                                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                                    status.toLowerCase().includes('valid') ? 'bg-green-500/10 text-green-500' : 
                                    status.toLowerCase().includes('duplicate') ? 'bg-yellow-500/10 text-yellow-500' : 
                                    'bg-red-500/10 text-red-500'
                                  }`}>
                                    {status.toUpperCase()}
                                  </span>
                                </div>
                                <div className="text-sm font-bold text-white tracking-tight truncate">
                                  {word || '---'}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      {player.judgeComment && (
                        <div className="px-5 pb-5 pt-2">
                           <p className="text-xs text-slate-400 italic border-l-2 border-cyan-500/30 pl-3">"{player.judgeComment}"</p>
                        </div>
                      )}
                    </div>
                  ))}
                  {(!evaluationResults || evaluationResults.length === 0) && (
                    <div className="text-center py-12">
                       <p className="text-slate-500 animate-pulse">Waiting for AI evaluation results...</p>
                    </div>
                  )}
                </div>

                {isHost && (
                  <button 
                    onClick={handleStartRound}
                    className="w-full mt-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl transition-all uppercase tracking-widest text-sm"
                  >
                    Next Round
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {roomStatus !== 'idle' && (
          <div className="fixed bottom-32 left-0 right-0 px-6 flex justify-center pointer-events-none">
             <div className="bg-black/80 backdrop-blur-md border border-white/10 px-6 py-3 rounded-full flex gap-6 items-center pointer-events-auto shadow-2xl animate-in slide-in-from-bottom duration-700">
                <div className="flex -space-x-2">
                  {players.slice(0, 3).map((p, i) => (
                    <div key={p.id || p.peerId} className="w-8 h-8 rounded-full bg-violet-500 border-2 border-black flex items-center justify-center text-[10px] font-bold">
                      {p.name.charAt(0)}
                    </div>
                  ))}
                </div>
                <div className="h-4 w-[1px] bg-white/10" />
                <div className="flex items-center gap-2">
                  <div className="text-yellow-500 scale-75"><Icons.Trophy /></div>
                  <span className="text-xs font-black tracking-tighter uppercase">
                    {leaderboard[0]?.name || '---'} : {leaderboard[0]?.score || 0}
                  </span>
                </div>
             </div>
          </div>
        )}

        <NexusRoomManager showForge={false} />
      </div>
    </div>
  );
}
