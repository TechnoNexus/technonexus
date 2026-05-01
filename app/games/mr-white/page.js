'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Haptics, ImpactStyle } from '../../../lib/haptics';
import NexusRoomManager from '../../../components/NexusRoomManager';
import { useGameStore } from '../../../store/gameStore';

const WORD_PAIRS = [
  ['Apple', 'Pear'], ['Car', 'Bus'], ['Guitar', 'Violin'], ['Ocean', 'Lake'],
  ['Sun', 'Moon'], ['Coffee', 'Tea'], ['Lion', 'Tiger'], ['Pizza', 'Burger'],
  ['Pencil', 'Pen'], ['Mountain', 'Hill'], ['Hospital', 'Clinic'],
  ['Batman', 'Superman'], ['Facebook', 'Instagram'], ['Winter', 'Summer'],
  ['Teacher', 'Student']
];

const INITIAL_STATE = {
  gameType: 'mr-white',
  isActive: false,
  word: '',
  undercoverWord: '',
  undercoverPlayers: [],
  mrWhitePlayers: [],
  civilianPlayers: [],
  phase: 'lobby', // 'lobby', 'revealing', 'speaking', 'voting', 'guessing', 'end'
  speakerOrder: [],
  currentSpeakerIndex: 0,
  eliminatedPlayers: [],
  guessingPlayer: null,
  winner: null, // 'Civilians' or 'Imposters'
};

export default function MrWhite() {
  const {
    roomId,
    isHost,
    customGame,
    setCustomGame,
    setRoomStatus,
    playerName,
    players,
  } = useGameStore();

  const [gameState, setGameState] = useState(INITIAL_STATE);
  
  // Host Configuration
  const [settings, setSettings] = useState({
    totalPlayers: 4,
    undercovers: 1,
    mrWhites: 0
  });

  // Local Pass-and-Play State
  const [localRevealIndex, setLocalRevealIndex] = useState(0);
  const [localShowWord, setLocalShowWord] = useState(false);
  const [editingName, setEditingName] = useState('');

  const applyState = (state) => {
    setGameState(state);
  };

  const syncState = (patch, nextStatus) => {
    const activeGame = useGameStore.getState().customGame;
    const current = activeGame?.gameType === 'mr-white' ? activeGame : INITIAL_STATE;
    const next = { ...current, ...patch, gameType: 'mr-white' };

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
    if (!customGame || customGame.gameType !== 'mr-white') {
      applyState(INITIAL_STATE);
    }
  }, []);

  useEffect(() => {
    if (customGame?.gameType === 'mr-white') {
      applyState(customGame);
    }
  }, [customGame]);

  const allNetworkNames = [playerName, ...players.map(p => p.name)];
  const allAssignedPlayers = [
    ...(gameState.undercoverPlayers || []),
    ...(gameState.mrWhitePlayers || []),
    ...(gameState.civilianPlayers || [])
  ];

  const myDevicePlayers = allAssignedPlayers.filter(p => 
    p === playerName || (isHost && !allNetworkNames.includes(p))
  );

  useEffect(() => {
    if (gameState.phase === 'revealing') {
      setLocalRevealIndex(0);
      setLocalShowWord(false);
      const firstPlayer = myDevicePlayers[0];
      if (firstPlayer) setEditingName(firstPlayer);
    }
  }, [gameState.phase, myDevicePlayers.length]);

  const startGame = () => {
    Haptics.impact({ style: ImpactStyle.Heavy });
    
    let allPlayers = [...allNetworkNames];
    
    // Get custom local names from previous game state
    const previousLocals = [...(gameState.undercoverPlayers || []), ...(gameState.mrWhitePlayers || []), ...(gameState.civilianPlayers || [])]
        .filter(p => !allNetworkNames.includes(p));

    if (settings.totalPlayers > allPlayers.length) {
        for (let i = allPlayers.length + 1; i <= settings.totalPlayers; i++) {
            const prevName = previousLocals[i - allNetworkNames.length - 1];
            allPlayers.push(prevName || `Player ${i}`);
        }
    } else if (settings.totalPlayers < allPlayers.length) {
        allPlayers = allPlayers.slice(0, settings.totalPlayers);
    }

    if (settings.undercovers + settings.mrWhites >= allPlayers.length) {
        alert("Too many special roles for the number of players!");
        return;
    }

    const pair = WORD_PAIRS[Math.floor(Math.random() * WORD_PAIRS.length)];
    let shuffledPlayers = [...allPlayers].sort(() => 0.5 - Math.random());
    
    const undercoverPlayers = shuffledPlayers.slice(0, settings.undercovers);
    const mrWhitePlayers = shuffledPlayers.slice(settings.undercovers, settings.undercovers + settings.mrWhites);
    const civilianPlayers = shuffledPlayers.slice(settings.undercovers + settings.mrWhites);
    
    const speakerOrder = [...allPlayers].sort(() => 0.5 - Math.random());

    syncState({
      isActive: true,
      word: pair[0],
      undercoverWord: pair[1],
      undercoverPlayers,
      mrWhitePlayers,
      civilianPlayers,
      phase: 'revealing',
      speakerOrder,
      currentSpeakerIndex: 0,
      eliminatedPlayers: [],
      guessingPlayer: null,
      winner: null
    }, 'playing');
  };

  const handleRename = (oldName) => {
      if (!editingName || editingName === oldName) return;
      Haptics.impact({ style: ImpactStyle.Light });
      
      const replace = (arr) => arr.map(p => p === oldName ? editingName : p);
      syncState({
          undercoverPlayers: replace(gameState.undercoverPlayers || []),
          mrWhitePlayers: replace(gameState.mrWhitePlayers || []),
          civilianPlayers: replace(gameState.civilianPlayers || []),
          speakerOrder: replace(gameState.speakerOrder || [])
      });
  };

  const nextSpeaker = () => {
      Haptics.impact({ style: ImpactStyle.Medium });
      syncState({ currentSpeakerIndex: gameState.currentSpeakerIndex + 1 });
  };

  const startVoting = () => {
      Haptics.impact({ style: ImpactStyle.Heavy });
      syncState({ phase: 'voting' });
  };

  const eliminatePlayer = (name) => {
      Haptics.impact({ style: ImpactStyle.Heavy });
      const isCivilian = gameState.civilianPlayers?.includes(name);
      
      const currentEliminated = gameState.eliminatedPlayers || [];
      const newEliminated = [...currentEliminated, name];
      
      const allActivePlayers = [...(gameState.undercoverPlayers || []), ...(gameState.mrWhitePlayers || []), ...(gameState.civilianPlayers || [])].filter(p => !newEliminated.includes(p));
      
      if (isCivilian) {
          if (allActivePlayers.length <= 3) {
              syncState({ eliminatedPlayers: newEliminated, phase: 'end', winner: 'Imposters' });
          } else {
              const newSpeakerOrder = [...allActivePlayers].sort(() => 0.5 - Math.random());
              syncState({ eliminatedPlayers: newEliminated, phase: 'speaking', speakerOrder: newSpeakerOrder, currentSpeakerIndex: 0 });
          }
      } else {
          syncState({ eliminatedPlayers: newEliminated, guessingPlayer: name, phase: 'guessing' });
      }
  };

  const handleGuess = (correct) => {
      Haptics.impact({ style: ImpactStyle.Heavy });
      if (correct) {
          syncState({ phase: 'end', winner: 'Imposters' });
      } else {
          const imposters = [...(gameState.undercoverPlayers || []), ...(gameState.mrWhitePlayers || [])];
          const currentEliminated = gameState.eliminatedPlayers || [];
          const remainingImposters = imposters.filter(p => !currentEliminated.includes(p));
          
          if (remainingImposters.length === 0) {
              syncState({ phase: 'end', winner: 'Civilians' });
          } else {
              const allActivePlayers = [...(gameState.undercoverPlayers || []), ...(gameState.mrWhitePlayers || []), ...(gameState.civilianPlayers || [])].filter(p => !currentEliminated.includes(p));
              if (allActivePlayers.length <= 3) {
                  syncState({ phase: 'end', winner: 'Imposters' });
              } else {
                  const newSpeakerOrder = [...allActivePlayers].sort(() => 0.5 - Math.random());
                  syncState({ phase: 'speaking', speakerOrder: newSpeakerOrder, currentSpeakerIndex: 0, guessingPlayer: null });
              }
          }
      }
  };

  const resetGame = () => {
    Haptics.impact({ style: ImpactStyle.Medium });
    syncState(INITIAL_STATE, 'idle');
  };

  return (
    <div className="min-h-screen bg-dark-bg bg-grid-white text-white py-8 px-4 flex flex-col pb-32 md:pb-8">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
        <header className="flex justify-between items-center mb-8">
          <Link href="/games" className="text-neon-cyan hover:underline font-mono text-sm p-2 min-w-[44px] min-h-[44px] flex items-center">← EXIT</Link>
          <button 
            onClick={resetGame}
            disabled={gameState.phase === 'lobby'}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest border transition-all min-h-[44px] ${
              gameState.phase === 'lobby' 
                ? 'opacity-50 cursor-not-allowed border-slate-700 text-slate-600' 
                : 'border-red-500/40 text-red-500 hover:bg-red-500/20 bg-red-500/10'
            }`}
          >
            × QUIT
          </button>
        </header>

        <NexusRoomManager />

        <div className="glass-panel rounded-[2rem] p-8 border-white/10 text-center flex-1 flex flex-col justify-center">
          <h1 className="text-4xl font-black tracking-tighter uppercase mb-2 gradient-text-cyan">Undercover</h1>
          <p className="text-slate-400 text-sm mb-8">Find the imposter among you.</p>

          {gameState.phase === 'lobby' ? (
            <div className="flex flex-col items-center">
              {isHost ? (
                <div className="w-full">
                  <div className="mb-8 space-y-4 text-left bg-white/5 p-6 rounded-2xl border border-white/10">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Players (Network + Local)</label>
                      <input type="number" min="3" max="15" value={settings.totalPlayers} onChange={e => setSettings({...settings, totalPlayers: parseInt(e.target.value) || 3})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white mt-1 outline-none focus:border-neon-cyan transition-colors" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Undercovers</label>
                        <input type="number" min="0" max="4" value={settings.undercovers} onChange={e => setSettings({...settings, undercovers: parseInt(e.target.value) || 0})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white mt-1 outline-none focus:border-neon-cyan transition-colors" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mr. Whites</label>
                        <input type="number" min="0" max="3" value={settings.mrWhites} onChange={e => setSettings({...settings, mrWhites: parseInt(e.target.value) || 0})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white mt-1 outline-none focus:border-neon-cyan transition-colors" />
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={startGame}
                    className="w-full py-6 rounded-2xl font-black bg-neon-cyan text-black shadow-neon-glow text-xl hover:scale-95 transition-transform"
                  >
                    START GAME
                  </button>
                </div>
              ) : (
                <p className="text-slate-400 italic">Waiting for host to configure game...</p>
              )}
            </div>
          ) : gameState.phase === 'revealing' ? (
            <div className="flex flex-col items-center justify-center flex-1 w-full">
              {myDevicePlayers.length === 0 ? (
                <div className="text-center">
                  <h2 className="text-2xl font-black text-slate-400 mb-4">SPECTATING</h2>
                  <p className="text-slate-500 text-sm">You are not assigned a role.</p>
                </div>
              ) : localRevealIndex < myDevicePlayers.length ? (
                (() => {
                  const currentPlayerToReveal = myDevicePlayers[localRevealIndex];
                  let role = 'Civilian';
                  if (gameState.undercoverPlayers?.includes(currentPlayerToReveal)) role = 'Undercover';
                  if (gameState.mrWhitePlayers?.includes(currentPlayerToReveal)) role = 'Mr. White';

                  const word = role === 'Undercover' ? gameState.undercoverWord : (role === 'Mr. White' ? 'MR. WHITE (No Word)' : gameState.word);

                  return (
                    <div className="flex flex-col items-center justify-center w-full">
                      <p className="text-slate-500 uppercase tracking-widest text-[10px] mb-4">Pass device to:</p>
                      
                      {!localShowWord ? (
                        <div className="w-full mb-8">
                            {currentPlayerToReveal.startsWith('Player ') ? (
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={editingName} 
                                        onChange={(e) => setEditingName(e.target.value)}
                                        placeholder="Enter your name"
                                        className="flex-1 bg-black/40 border border-white/10 rounded-xl p-4 text-white text-center font-bold text-xl outline-none focus:border-neon-cyan"
                                    />
                                    <button 
                                        onClick={() => handleRename(currentPlayerToReveal)}
                                        className="px-6 py-4 rounded-xl font-bold bg-white/10 text-white hover:bg-white/20 transition-colors"
                                    >
                                        SAVE
                                    </button>
                                </div>
                            ) : (
                                <h2 className="text-4xl font-black text-white">{currentPlayerToReveal}</h2>
                            )}
                        </div>
                      ) : (
                          <h2 className="text-4xl font-black text-white mb-8">{currentPlayerToReveal}</h2>
                      )}
                      
                      {!localShowWord ? (
                        <button onClick={() => { Haptics.impact({ style: ImpactStyle.Light }); setLocalShowWord(true); }} className="w-full py-16 rounded-3xl border-2 border-dashed border-white/20 text-neon-cyan font-black text-2xl tracking-widest cursor-pointer hover:bg-white/5 transition-colors">
                          TAP TO REVEAL
                        </button>
                      ) : (
                        <div className="flex flex-col items-center w-full">
                           <div className="w-full bg-white/5 border-2 border-neon-cyan/20 rounded-2xl p-8 mb-8 text-center shadow-inner">
                             <p className="text-slate-500 text-xs font-bold uppercase mb-4">YOUR SECRET WORD</p>
                             <h2 className={`text-4xl font-black leading-tight ${role === 'Mr. White' ? 'text-red-500' : 'text-white'}`}>
                               {word}
                             </h2>
                           </div>
                           <button onClick={() => { 
                               Haptics.impact({ style: ImpactStyle.Light }); 
                               setLocalShowWord(false); 
                               setLocalRevealIndex(localRevealIndex + 1); 
                               if (myDevicePlayers[localRevealIndex + 1]) setEditingName(myDevicePlayers[localRevealIndex + 1]);
                           }} className="w-full py-4 rounded-2xl font-black bg-neon-cyan text-black shadow-neon-glow text-xl hover:scale-95 transition-transform">
                             HIDE & NEXT
                           </button>
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 w-full">
                  <h2 className="text-3xl font-black text-white mb-6">Roles revealed!</h2>
                  <p className="text-slate-400 text-sm mb-8 text-center max-w-xs">
                    Waiting for host to start the speaking phase.
                  </p>

                  {isHost && (
                    <button 
                      onClick={() => syncState({ phase: 'speaking' })}
                      className="w-full py-4 rounded-2xl font-black bg-electric-violet/20 border border-electric-violet/30 text-electric-violet hover:bg-electric-violet hover:text-white transition-colors mt-auto"
                    >
                      START SPEAKING
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : gameState.phase === 'speaking' ? (
              <div className="flex flex-col items-center justify-center flex-1 w-full">
                  <p className="text-slate-500 uppercase tracking-widest text-[10px] mb-4">Current Speaker:</p>
                  
                  {gameState.eliminatedPlayers?.length > 0 && (
                     <p className="text-red-500 text-sm mb-4 font-bold">Eliminated: {gameState.eliminatedPlayers.join(', ')}</p>
                  )}

                  {gameState.currentSpeakerIndex < (gameState.speakerOrder?.length || 0) ? (
                      <div className="w-full">
                          <div className="bg-neon-cyan/10 border border-neon-cyan/30 rounded-3xl p-12 mb-8">
                              <h2 className="text-5xl font-black text-neon-cyan">{gameState.speakerOrder[gameState.currentSpeakerIndex]}</h2>
                          </div>
                          
                          {isHost && (
                              <button 
                                onClick={nextSpeaker}
                                className="w-full py-4 rounded-2xl font-black bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
                              >
                                NEXT SPEAKER
                              </button>
                          )}
                      </div>
                  ) : (
                      <div className="w-full">
                          <h2 className="text-3xl font-black text-white mb-8">Everyone has spoken!</h2>
                          {isHost && (
                              <button 
                                onClick={startVoting}
                                className="w-full py-6 rounded-2xl font-black bg-neon-cyan text-black shadow-neon-glow text-xl hover:scale-95 transition-transform"
                              >
                                START VOTING
                              </button>
                          )}
                      </div>
                  )}
              </div>
          ) : gameState.phase === 'voting' ? (
              <div className="flex flex-col items-center justify-center flex-1 w-full">
                  <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-widest">Time to Vote</h2>
                  <p className="text-slate-400 text-sm mb-8">Host: Select the player the room wants to eliminate.</p>
                  
                  {isHost ? (
                      <div className="w-full space-y-3">
                          {gameState.speakerOrder?.map(p => (
                              <button 
                                  key={p}
                                  onClick={() => eliminatePlayer(p)}
                                  className="w-full p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 font-bold hover:bg-red-500/20 transition-colors text-xl"
                              >
                                  ELIMINATE {p}
                              </button>
                          ))}
                      </div>
                  ) : (
                      <p className="text-slate-400 italic">Waiting for host to record the vote...</p>
                  )}
              </div>
          ) : gameState.phase === 'guessing' ? (
              <div className="flex flex-col items-center justify-center flex-1 w-full">
                  <h2 className="text-3xl font-black text-red-500 mb-2 uppercase tracking-widest">CAUGHT!</h2>
                  <p className="text-slate-300 text-lg mb-8">
                      <span className="font-bold text-white">{gameState.guessingPlayer}</span> was an Imposter!
                  </p>
                  <p className="text-slate-400 text-sm mb-8 text-center max-w-xs">
                      They have <span className="font-bold text-neon-cyan">one chance</span> to guess the civilian word to steal the win.
                  </p>
                  
                  {isHost ? (
                      <div className="w-full space-y-4">
                          <button 
                              onClick={() => handleGuess(true)}
                              className="w-full p-6 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-500 font-black hover:bg-red-500/20 transition-colors text-xl shadow-red-glow"
                          >
                              THEY GUESSED IT!
                          </button>
                          <button 
                              onClick={() => handleGuess(false)}
                              className="w-full p-6 rounded-2xl border border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan font-black hover:bg-neon-cyan/20 transition-colors text-xl shadow-neon-glow"
                          >
                              THEY WERE WRONG!
                          </button>
                      </div>
                  ) : (
                      <p className="text-slate-400 italic">Waiting for host to judge the guess...</p>
                  )}
              </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 w-full">
               <h2 className="text-4xl font-black mb-2 uppercase tracking-widest">
                   {gameState.winner === 'Imposters' ? (
                       <span className="text-red-500">IMPOSTERS WIN</span>
                   ) : (
                       <span className="text-neon-cyan">CIVILIANS WIN</span>
                   )}
               </h2>
               
               {gameState.eliminatedPlayers?.length > 0 && (
                   <p className="text-slate-400 text-sm mb-8">
                       Eliminated: <span className="font-bold text-white">{gameState.eliminatedPlayers.join(', ')}</span>
                   </p>
               )}
               
               <div className="w-full space-y-4 mb-8">
                 <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-left flex justify-between items-center">
                   <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Civilian Word</span>
                   <span className="text-white font-black">{gameState.word}</span>
                 </div>
                 
                 {gameState.undercoverPlayers?.length > 0 && (
                     <div className="bg-neon-cyan/10 p-4 rounded-xl border border-neon-cyan/30 text-left flex justify-between items-center">
                       <span className="text-neon-cyan font-bold text-xs uppercase tracking-widest">Undercover Word</span>
                       <span className="text-white font-black">{gameState.undercoverWord}</span>
                     </div>
                 )}
                 
                 {gameState.undercoverPlayers?.length > 0 && (
                   <div className="mt-6">
                     <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-2 text-left">Undercovers</p>
                     <div className="flex flex-wrap gap-2">
                       {gameState.undercoverPlayers?.map(p => (
                         <span key={p} className="bg-red-500/10 border border-red-500/30 text-red-500 px-3 py-1 rounded-full text-sm font-bold">{p}</span>
                       ))}
                     </div>
                   </div>
                 )}

                 {gameState.mrWhitePlayers?.length > 0 && (
                   <div className="mt-4">
                     <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-2 text-left">Mr. Whites</p>
                     <div className="flex flex-wrap gap-2">
                       {gameState.mrWhitePlayers?.map(p => (
                         <span key={p} className="bg-orange-500/10 border border-orange-500/30 text-orange-500 px-3 py-1 rounded-full text-sm font-bold">{p}</span>
                       ))}
                     </div>
                   </div>
                 )}
               </div>

               {isHost && (
                <button 
                  onClick={() => syncState({ phase: 'lobby' }, 'idle')}
                  className="w-full py-4 rounded-2xl font-black bg-neon-cyan text-black shadow-neon-glow hover:scale-95 transition-transform"
                >
                  PLAY AGAIN
                </button>
               )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
