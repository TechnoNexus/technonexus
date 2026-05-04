'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { Haptics, ImpactStyle } from '../lib/haptics';
import NexusRoomManager from './NexusRoomManager';
import { motion, AnimatePresence } from 'framer-motion';

export default function UnifiedGameLobby({ 
  gameTitle, 
  customSettingsUI, 
  onStart, 
  showForge = false 
}) {
  const {
    roomId,
    isHost,
    playerName,
    players,
    roomStatus,
    setRoomStatus,
    setPlayerName
  } = useGameStore();

  const [totalPlayers, setTotalPlayers] = useState(4);
  const [localNames, setLocalNames] = useState({}); // { index: name }
  const [isEditingNames, setIsEditingNames] = useState(false);

  const hapticFeedback = async (style = ImpactStyle.Medium) => {
    try { await Haptics.impact({ style }); } catch (e) {}
  };

  // Sync totalPlayers from customGame if available (for guests)
  // Actually, for guests, they just see what the host tells them.

  const allNetworkNames = [playerName, ...players.map(p => p.name)];
  
  // Calculate unified players
  const getUnifiedPlayers = () => {
    const unified = [];
    
    // 1. Add Network Players (Host + Joined Guests)
    allNetworkNames.forEach((name, i) => {
      unified.push({
        name: name || (i === 0 ? 'HOST' : `PLAYER ${i+1}`),
        isLocal: i === 0, // Host is local to themselves
        peerId: i === 0 ? null : players[i-1]?.peerId
      });
    });

    // 2. Add Local Placeholder Players (Pass-and-Play)
    if (totalPlayers > unified.length) {
      for (let i = unified.length + 1; i <= totalPlayers; i++) {
        unified.push({
          name: localNames[i] || `GUEST ${i}`,
          isLocal: true,
          peerId: null
        });
      }
    }

    return unified.slice(0, totalPlayers);
  };

  const handleStart = () => {
    hapticFeedback(ImpactStyle.Heavy);
    const unified = getUnifiedPlayers();
    onStart(unified);
  };

  if (roomStatus !== 'idle' && roomStatus !== 'waiting') {
    return null; // Don't show lobby if game is active
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
        <div className="text-left">
          <p className="text-neon-cyan font-black tracking-[0.3em] text-xs mb-2">SYSTEM.INITIALIZE</p>
          <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter uppercase leading-[0.8] mb-4">
            {gameTitle.split(' ')[0]} <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-electric-violet">
              {gameTitle.split(' ').slice(1).join(' ') || 'MODE'}
            </span>
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Player Identity & Setup */}
        <div className="lg:col-span-2 space-y-6">
          <NexusRoomManager showForge={showForge} />
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-8 rounded-[2.5rem] border-white/5"
          >
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xs font-black tracking-widest text-slate-500 uppercase">MISSION PARAMETERS</h3>
              <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-slate-400">
                {isHost ? 'HOST CONFIG' : 'GUEST VIEW'}
              </div>
            </div>

            <div className="space-y-8">
              {/* Total Players Slider (Host Only) */}
              {isHost && (
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Presence</label>
                    <span className="text-2xl font-black text-neon-cyan">{totalPlayers} <span className="text-xs text-slate-600">UNITS</span></span>
                  </div>
                  <input 
                    type="range" min="1" max="12" step="1"
                    value={totalPlayers}
                    onChange={(e) => {
                      hapticFeedback(ImpactStyle.Light);
                      setTotalPlayers(parseInt(e.target.value));
                    }}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-neon-cyan"
                  />
                  <div className="flex justify-between text-[8px] font-black text-slate-600 uppercase tracking-widest">
                    <span>Solo</span>
                    <span>Squad</span>
                    <span>Platoon</span>
                  </div>
                </div>
              )}

              {/* Custom Game Settings Slot */}
              {isHost && customSettingsUI && (
                <div className="pt-6 border-t border-white/5">
                  {customSettingsUI}
                </div>
              )}

              {/* Start Button */}
              {isHost ? (
                <button 
                  onClick={handleStart}
                  className="w-full py-6 rounded-2xl bg-white text-black font-black uppercase tracking-[0.2em] text-sm hover:bg-neon-cyan transition-all shadow-2xl shadow-neon-cyan/20 active:scale-[0.98]"
                >
                  INITIALIZE MISSION
                </button>
              ) : (
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
                   <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">Waiting for Host to Launch...</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Right Column: Roster Visualization */}
        <div className="space-y-6">
           <div className="glass-panel p-6 rounded-[2rem] border-white/5 h-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[10px] font-black tracking-widest text-slate-500 uppercase">ACTIVE ROSTER</h3>
                <button 
                  onClick={() => setIsEditingNames(!isEditingNames)}
                  className="text-[8px] font-black text-neon-cyan uppercase tracking-widest hover:underline"
                >
                  {isEditingNames ? 'DONE' : 'EDIT NAMES'}
                </button>
              </div>

              <div className="space-y-3">
                {getUnifiedPlayers().map((player, idx) => (
                  <motion.div 
                    key={idx}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-4 rounded-xl border flex justify-between items-center transition-all ${
                      player.peerId ? 'bg-neon-cyan/5 border-neon-cyan/20' : 
                      player.isLocal && idx === 0 ? 'bg-electric-violet/5 border-electric-violet/20' :
                      'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex flex-col text-left">
                       <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">
                          {idx === 0 ? 'COMMANDER' : player.peerId ? 'REMOTE LINK' : 'LOCAL UNIT'}
                       </span>
                       {isEditingNames && player.isLocal && idx > 0 ? (
                         <input 
                           value={localNames[idx+1] || ''} 
                           placeholder={`GUEST ${idx+1}`}
                           onChange={(e) => setLocalNames({...localNames, [idx+1]: e.target.value.toUpperCase()})}
                           className="bg-transparent border-none text-white font-bold outline-none text-xs"
                           autoFocus
                         />
                       ) : (
                         <span className={`text-sm font-black uppercase ${idx === 0 ? 'text-electric-violet' : player.peerId ? 'text-neon-cyan' : 'text-white'}`}>
                            {player.name}
                         </span>
                       )}
                    </div>
                    {player.peerId && <div className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-pulse shadow-[0_0_8px_#00FFFF]" />}
                  </motion.div>
                ))}

                {totalPlayers > getUnifiedPlayers().length && (
                  <p className="text-[10px] text-slate-600 italic text-center pt-4">
                    + {totalPlayers - getUnifiedPlayers().length} Units Pending Connection
                  </p>
                )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
