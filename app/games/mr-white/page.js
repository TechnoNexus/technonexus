'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Haptics, ImpactStyle } from '../../../lib/haptics';
import UnifiedGameLobby from '../../../components/UnifiedGameLobby';
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
  winner: null,
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
    undercovers: 1,
    mrWhites: 0
  });

  // Local Pass-and-Play State
  const [localRevealIndex, setLocalRevealIndex] = useState(0);
  const [localShowWord, setLocalShowWord] = useState(false);

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

  const shuffle = (array) => {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };

  const handleStartMission = (unifiedPlayers) => {
    const playerNames = unifiedPlayers.map(p => p.name);
    
    if (settings.undercovers + settings.mrWhites >= playerNames.length) {
      alert("Too many special roles!");
      return;
    }

    const pair = WORD_PAIRS[Math.floor(Math.random() * WORD_PAIRS.length)];
    const shuffled = shuffle(playerNames);
    
    const undercoverPlayers = shuffled.slice(0, settings.undercovers);
    const mrWhitePlayers = shuffled.slice(settings.undercovers, settings.undercovers + settings.mrWhites);
    const civilianPlayers = shuffled.slice(settings.undercovers + settings.mrWhites);
    const speakerOrder = shuffle(playerNames);

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

  const allNetworkNames = [playerName, ...players.map(p => p.name)];
  const myDevicePlayers = (gameState.speakerOrder || []).filter(p => 
    p === playerName || (isHost && !allNetworkNames.includes(p))
  );

  useEffect(() => {
    if (gameState.phase === 'revealing') {
      setLocalRevealIndex(0);
      setLocalShowWord(false);
    }
  }, [gameState.phase, myDevicePlayers.length]);

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
    
    const allActivePlayers = [...(gameState.undercoverPlayers || []), ...(gameState.mrWhitePlayers || []), ...(gameState.civilianPlayers || [])]
      .filter(p => !newEliminated.includes(p));
    
    if (isCivilian) {
      if (allActivePlayers.length <= 3) {
        syncState({ eliminatedPlayers: newEliminated, phase: 'end', winner: 'Imposters' });
      } else {
        const newSpeakerOrder = shuffle(allActivePlayers);
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
        const allActivePlayers = [...(gameState.undercoverPlayers || []), ...(gameState.mrWhitePlayers || []), ...(gameState.civilianPlayers || [])]
          .filter(p => !currentEliminated.includes(p));
        if (allActivePlayers.length <= 3) {
          syncState({ phase: 'end', winner: 'Imposters' });
        } else {
          const newSpeakerOrder = shuffle(allActivePlayers);
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
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
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

        {gameState.phase === 'lobby' ? (
          <UnifiedGameLobby
            gameTitle="Undercover Agent"
            onStart={handleStartMission}
            customSettingsUI={
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Undercovers</label>
                  <input type="number" min="1" max="4" value={settings.undercovers} onChange={e => setSettings({...settings, undercovers: parseInt(e.target.value) || 1})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white mt-1 outline-none focus:border-neon-cyan transition-colors" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mr. Whites</label>
                  <input type="number" min="0" max="3" value={settings.mrWhites} onChange={e => setSettings({...settings, mrWhites: parseInt(e.target.value) || 0})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white mt-1 outline-none focus:border-neon-cyan transition-colors" />
                </div>
              </div>
            }
          />
        ) : (
          <div className="glass-panel rounded-[3rem] p-8 border-white/10 text-center flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
            <h1 className="text-4xl font-black tracking-tighter uppercase mb-2 gradient-text-cyan">Undercover</h1>
            
            {gameState.phase === 'revealing' ? (
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
                        <h2 className="text-4xl font-black text-white mb-8">{currentPlayerToReveal}</h2>
                        
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

                    <div className="w-full bg-white/5 border-2 border-neon-cyan/20 rounded-2xl p-8 mb-8 text-center shadow-inner">
                        <h2 className="text-4xl font-black text-white">{gameState.speakerOrder[gameState.currentSpeakerIndex]}</h2>
                    </div>

                    {isHost && (
                        gameState.currentSpeakerIndex < gameState.speakerOrder.length - 1 ? (
                            <button onClick={nextSpeaker} className="w-full py-4 rounded-2xl font-black bg-neon-cyan text-black shadow-neon-glow text-xl hover:scale-95 transition-transform">
                                NEXT SPEAKER
                            </button>
                        ) : (
                            <button onClick={startVoting} className="w-full py-4 rounded-2xl font-black bg-electric-violet text-white shadow-violet-glow text-xl hover:scale-95 transition-transform">
                                START VOTING
                            </button>
                        )
                    )}
                </div>
            ) : gameState.phase === 'voting' ? (
                <div className="flex flex-col items-center justify-center flex-1 w-full">
                    <h2 className="text-2xl font-black text-white mb-6 tracking-tight uppercase">Eliminate a Suspect</h2>
                    <div className="grid grid-cols-2 gap-3 w-full">
                        {[...gameState.undercoverPlayers, ...gameState.mrWhitePlayers, ...gameState.civilianPlayers]
                            .filter(p => !gameState.eliminatedPlayers.includes(p))
                            .map(player => (
                                <button 
                                    key={player}
                                    onClick={() => isHost && eliminatePlayer(player)}
                                    disabled={!isHost}
                                    className="p-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-red-500/20 hover:border-red-500/40 transition-all uppercase text-xs truncate"
                                >
                                    {player}
                                </button>
                            ))
                        }
                    </div>
                    {!isHost && <p className="text-slate-500 text-xs mt-6 italic">Only the host can eliminate players.</p>}
                </div>
            ) : gameState.phase === 'guessing' ? (
                <div className="flex flex-col items-center justify-center flex-1 w-full">
                    <p className="text-red-500 font-black uppercase tracking-widest text-[10px] mb-2 animate-pulse">Imposter Found!</p>
                    <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-tight">{gameState.guessingPlayer}</h2>
                    <p className="text-slate-400 text-sm mb-8 text-center italic">Can the imposter guess the word?</p>

                    {isHost ? (
                        <div className="flex flex-col gap-4 w-full">
                            <button onClick={() => handleGuess(true)} className="w-full py-4 rounded-2xl font-black bg-red-500 text-white shadow-lg text-xl hover:scale-95 transition-transform uppercase">
                                They Guessed Right
                            </button>
                            <button onClick={() => handleGuess(false)} className="w-full py-4 rounded-2xl font-black bg-neon-cyan text-black shadow-neon-glow text-xl hover:scale-95 transition-transform uppercase">
                                They Guessed Wrong
                            </button>
                        </div>
                    ) : (
                        <p className="text-slate-500 text-xs italic">Host is confirming the guess...</p>
                    )}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center flex-1 w-full">
                  <h2 className={`text-5xl font-black mb-4 tracking-tighter uppercase ${gameState.winner === 'Civilians' ? 'text-neon-cyan' : 'text-red-500'}`}>
                    {gameState.winner} Win!
                  </h2>
                  
                  <div className="space-y-4 mb-8 text-left w-full">
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Civilian Word</p>
                        <p className="text-white font-bold">{gameState.word}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Undercover Word</p>
                        <p className="text-white font-bold">{gameState.undercoverWord}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Special Roles</p>
                        <p className="text-red-500 text-xs font-bold uppercase">Undercovers: {gameState.undercoverPlayers.join(', ')}</p>
                        {gameState.mrWhitePlayers.length > 0 && <p className="text-red-400 text-xs font-bold uppercase">Mr. Whites: {gameState.mrWhitePlayers.join(', ')}</p>}
                    </div>
                  </div>

                  {isHost && (
                    <button 
                      onClick={resetGame}
                      className="w-full py-6 rounded-2xl font-black bg-neon-cyan text-black shadow-neon-glow text-xl hover:scale-95 transition-transform"
                    >
                      PLAY AGAIN
                    </button>
                   )}
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
