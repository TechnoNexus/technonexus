'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Haptics, ImpactStyle } from '../../../lib/haptics';
import UnifiedGameLobby from '../../../components/UnifiedGameLobby';
import { useGameStore } from '../../../store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';

const INITIAL_STATE = {
  gameType: 'mafia',
  isActive: false,
  phase: 'lobby', // lobby, roles, night, day, voting, end
  players: [], // { name, role, isAlive, isCompromised, isProtected }
  nightActions: {
    target: null,
    save: null,
    check: null
  },
  lastDeath: null,
  winner: null
};

export default function MafiaGame() {
  const {
    roomId,
    isHost,
    customGame,
    setCustomGame,
    setRoomStatus,
    playerName
  } = useGameStore();

  const [gameState, setGameState] = useState(INITIAL_STATE);
  
  const applyState = (state) => {
    setGameState(state);
  };

  const syncState = (patch, nextStatus) => {
    const activeGame = useGameStore.getState().customGame;
    const current = activeGame?.gameType === 'mafia' ? activeGame : INITIAL_STATE;
    const next = { ...current, ...patch, gameType: 'mafia' };

    applyState(next);

    if (roomId) {
      window.dispatchEvent(new CustomEvent('nexus-game-action', {
        detail: { actionData: next, roomStatus: nextStatus }
      }));
    } else {
      setCustomGame(next);
      if (nextStatus) setRoomStatus(nextStatus);
    }
  };

  useEffect(() => {
    if (!customGame || customGame.gameType !== 'mafia') {
      applyState(INITIAL_STATE);
    }
  }, []);

  useEffect(() => {
    if (customGame?.gameType === 'mafia') {
      applyState(customGame);
    }
  }, [customGame]);

  const handleStartMission = (unifiedPlayers) => {
    if (unifiedPlayers.length < 4) {
      alert("Minimum 4 units required for Insurgency detection.");
      return;
    }

    const shuffled = [...unifiedPlayers];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const playersWithRoles = shuffled.map((p, i) => {
      let role = 'USER';
      if (i === 0) role = 'ROGUE AI';
      if (i === 1) role = 'DEBUGGER';
      if (i === 2) role = 'LOG AUDITOR';
      return { ...p, role, isAlive: true };
    });

    syncState({
      isActive: true,
      phase: 'roles',
      players: playersWithRoles,
      nightActions: { target: null, save: null, check: null },
      lastDeath: null,
      winner: null
    }, 'playing');
  };

  const myPlayer = gameState.players.find(p => p.name === playerName);

  const startNight = () => {
    syncState({ 
      phase: 'night', 
      nightActions: { target: null, save: null, check: null } 
    });
  };

  const startDay = () => {
    const { target, save } = gameState.nightActions;
    let lastDeath = null;
    const nextPlayers = gameState.players.map(p => {
      if (p.name === target && target !== save) {
        lastDeath = p.name;
        return { ...p, isAlive: false };
      }
      return p;
    });

    // Check Win Conditions
    const rogues = nextPlayers.filter(p => p.role === 'ROGUE AI' && p.isAlive);
    const others = nextPlayers.filter(p => p.role !== 'ROGUE AI' && p.isAlive);

    if (rogues.length === 0) {
      syncState({ players: nextPlayers, phase: 'end', winner: 'SYSTEM' });
    } else if (rogues.length >= others.length) {
      syncState({ players: nextPlayers, phase: 'end', winner: 'ROGUE AI' });
    } else {
      syncState({ players: nextPlayers, phase: 'day', lastDeath });
    }
  };

  const voteOut = (name) => {
    const nextPlayers = gameState.players.map(p => 
      p.name === name ? { ...p, isAlive: false } : p
    );

    const rogues = nextPlayers.filter(p => p.role === 'ROGUE AI' && p.isAlive);
    const others = nextPlayers.filter(p => p.role !== 'ROGUE AI' && p.isAlive);

    if (rogues.length === 0) {
      syncState({ players: nextPlayers, phase: 'end', winner: 'SYSTEM' });
    } else if (rogues.length >= others.length) {
      syncState({ players: nextPlayers, phase: 'end', winner: 'ROGUE AI' });
    } else {
      syncState({ players: nextPlayers, phase: 'night' });
    }
  };

  const performNightAction = (type, target) => {
    syncState({
      nightActions: { ...gameState.nightActions, [type]: target }
    });
  };

  return (
    <div className="min-h-screen bg-dark-bg bg-grid-white text-white py-8 px-4 flex flex-col pb-32 md:pb-8">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
        <header className="flex justify-between items-center mb-12">
          <Link href="/games" className="text-neon-cyan hover:underline font-mono text-xs p-2">← BACKDOOR EXIT</Link>
          {gameState.isActive && (
            <button 
              onClick={() => syncState(INITIAL_STATE, 'idle')}
              className="px-6 py-2 rounded-xl border border-red-500/30 text-red-500 font-black text-[10px] uppercase tracking-widest hover:bg-red-500/10 transition-all"
            >
              × ABORT MISSION
            </button>
          )}
        </header>

        {gameState.phase === 'lobby' ? (
          <UnifiedGameLobby
            gameTitle="Digital Insurgency"
            onStart={handleStartMission}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center space-y-8">
            <div className="text-center">
              <h2 className={`text-6xl font-black tracking-tighter uppercase mb-2 ${gameState.phase === 'night' ? 'text-blue-500' : 'text-neon-cyan'}`}>
                {gameState.phase === 'night' ? 'Night: Processing' : 'Day: Uptime'}
              </h2>
              <div className="h-1 w-24 bg-gradient-to-r from-transparent via-current to-transparent mx-auto opacity-50" />
            </div>

            <div className="glass-panel p-8 rounded-[3rem] border-white/10 w-full max-w-2xl">
              {gameState.phase === 'roles' && (
                <div className="text-center space-y-8 py-12">
                   <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Identifying alignment...</p>
                   <div className="bg-white/5 border border-white/10 p-12 rounded-3xl">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Your Designated Role</p>
                      <h1 className={`text-5xl font-black tracking-tighter ${myPlayer?.role === 'ROGUE AI' ? 'text-red-500' : 'text-neon-cyan'}`}>
                        {myPlayer?.role || 'SPECTATOR'}
                      </h1>
                   </div>
                   {isHost && (
                     <button onClick={startNight} className="w-full py-6 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-sm hover:bg-neon-cyan transition-all">
                       INITIATE FIRST CYCLE
                     </button>
                   )}
                </div>
              )}

              {gameState.phase === 'night' && (
                <div className="space-y-8 py-8 text-center">
                   <div className="p-8 rounded-3xl bg-blue-500/5 border border-blue-500/20">
                      <p className="text-blue-400 text-sm italic">The system is quiet. Rogue agents are moving through the shadow sectors.</p>
                   </div>
                   
                   {myPlayer?.isAlive && (
                     <div className="space-y-4 text-left">
                        {myPlayer.role === 'ROGUE AI' && !gameState.nightActions.target && (
                          <>
                            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">ROGUE AI: Compromise a unit</p>
                            <div className="grid grid-cols-2 gap-3">
                               {gameState.players.filter(p => p.isAlive && p.role !== 'ROGUE AI').map(p => (
                                 <button key={p.name} onClick={() => performNightAction('target', p.name)} className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-xs uppercase hover:bg-red-500/20 transition-all">
                                   {p.name}
                                 </button>
                               ))}
                            </div>
                          </>
                        )}
                        {myPlayer.role === 'DEBUGGER' && !gameState.nightActions.save && (
                          <>
                            <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">DEBUGGER: Shield a unit</p>
                            <div className="grid grid-cols-2 gap-3">
                               {gameState.players.filter(p => p.isAlive).map(p => (
                                 <button key={p.name} onClick={() => performNightAction('save', p.name)} className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 font-bold text-xs uppercase hover:bg-green-500/20 transition-all">
                                   {p.name}
                                 </button>
                               ))}
                            </div>
                          </>
                        )}
                        {myPlayer.role === 'LOG AUDITOR' && !gameState.nightActions.check && (
                          <>
                            <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">LOG AUDITOR: Scan a unit</p>
                            <div className="grid grid-cols-2 gap-3">
                               {gameState.players.filter(p => p.isAlive && p.name !== playerName).map(p => (
                                 <button key={p.name} onClick={() => performNightAction('check', p.name)} className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-bold text-xs uppercase hover:bg-yellow-500/20 transition-all">
                                   {p.name}
                                 </button>
                               ))}
                            </div>
                          </>
                        )}
                        {(myPlayer.role === 'USER' || (myPlayer.role === 'ROGUE AI' && gameState.nightActions.target) || (myPlayer.role === 'DEBUGGER' && gameState.nightActions.save) || (myPlayer.role === 'LOG AUDITOR' && gameState.nightActions.check)) && (
                           <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center italic text-slate-500 text-sm">
                             Input logged. Awaiting system synchronization...
                           </div>
                        )}
                     </div>
                   )}

                   {isHost && (
                     <button onClick={startDay} className="w-full py-6 rounded-2xl bg-blue-500 text-white font-black uppercase tracking-widest text-sm hover:bg-blue-400 transition-all shadow-lg shadow-blue-500/20">
                       SYNCHRONIZE SYSTEM (DAYBREAK)
                     </button>
                   )}
                </div>
              )}

              {gameState.phase === 'day' && (
                <div className="space-y-8 py-8 text-center">
                   {gameState.lastDeath ? (
                     <div className="p-8 rounded-3xl bg-red-500/10 border border-red-500/30">
                        <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2">SYSTEM BREACH</p>
                        <h3 className="text-2xl font-black text-white uppercase">{gameState.lastDeath} was COMPROMISED.</h3>
                     </div>
                   ) : (
                     <div className="p-8 rounded-3xl bg-green-500/10 border border-green-500/30">
                        <p className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-2">INTEGRITY MAINTAINED</p>
                        <h3 className="text-2xl font-black text-white uppercase">No units were compromised last night.</h3>
                     </div>
                   )}

                   <div className="space-y-4 text-left">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Units</p>
                      <div className="grid grid-cols-2 gap-3">
                         {gameState.players.filter(p => p.isAlive).map(p => (
                           <button key={p.name} onClick={() => isHost && voteOut(p.name)} className={`p-4 rounded-xl border flex justify-between items-center transition-all ${isHost ? 'bg-white/5 border-white/10 hover:border-red-500/40' : 'bg-white/5 border-white/5 opacity-50 cursor-default'}`}>
                             <span className="font-bold text-xs uppercase">{p.name}</span>
                             {isHost && <span className="text-[8px] font-black text-red-500 uppercase">ISOLATE</span>}
                           </button>
                         ))}
                      </div>
                   </div>

                   {!isHost && <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest italic animate-pulse">Debate with your peers. Host will isolate the voted agent.</p>}
                </div>
              )}

              {gameState.phase === 'end' && (
                <div className="text-center space-y-8 py-12">
                   <div className={`p-12 rounded-[3.5rem] border-2 ${gameState.winner === 'ROGUE AI' ? 'bg-red-500/10 border-red-500/40' : 'bg-neon-cyan/10 border-neon-cyan/40'}`}>
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-4 opacity-50">Mission Outcome</p>
                      <h1 className={`text-7xl font-black tracking-tighter uppercase ${gameState.winner === 'ROGUE AI' ? 'text-red-500' : 'text-neon-cyan'}`}>
                        {gameState.winner === 'ROGUE AI' ? 'ROGUED' : 'SECURED'}
                      </h1>
                      <p className="mt-4 text-white font-bold">{gameState.winner} controlled the network.</p>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4 text-left">
                      {gameState.players.map(p => (
                        <div key={p.name} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center">
                           <span className="text-xs font-bold text-slate-300">{p.name}</span>
                           <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-full ${p.role === 'ROGUE AI' ? 'bg-red-500 text-white' : 'bg-neon-cyan text-black'}`}>{p.role}</span>
                        </div>
                      ))}
                   </div>

                   {isHost && (
                     <button onClick={() => syncState(INITIAL_STATE, 'idle')} className="w-full py-6 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-sm hover:bg-neon-cyan transition-all">
                       RE-BOOT SYSTEM
                     </button>
                   )}
                </div>
              )}
            </div>

            {/* Alive List Mini HUD */}
            <div className="flex gap-4 flex-wrap justify-center opacity-40 hover:opacity-100 transition-opacity">
               {gameState.players.map(p => (
                 <div key={p.name} className={`px-4 py-2 rounded-xl border flex items-center gap-2 ${p.isAlive ? 'bg-white/5 border-white/10' : 'bg-red-500/10 border-red-500/20 line-through'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${p.isAlive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{p.name}</span>
                 </div>
               ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
