'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Haptics, ImpactStyle } from '../../../lib/haptics';
import NexusRoomManager from '../../../components/NexusRoomManager';
import { useGameStore } from '../../../store/gameStore';

const DATABASE = {
  Movies: [
    "The Godfather", "Pulp Fiction", "The Dark Knight", "Inception", "Interstellar", 
    "Parasite", "The Matrix", "Fight Club", "Seven", "Spirited Away", "Jaws", 
    "Star Wars", "Back to the Future", "The Lion King", "Jurassic Park"
  ],
  TV_Shows: [
    "Breaking Bad", "Stranger Things", "The Office", "Game of Thrones", "Succession",
    "The Bear", "Black Mirror", "The Boys", "The Last of Us", "Sopranos"
  ],
  Books: [
    "The Great Gatsby", "1984", "Brave New World", "Harry Potter", "The Hobbit",
    "Dune", "Project Hail Mary", "Atomic Habits", "Foundation", "Neuromancer"
  ]
};

const hapticFeedback = async (style = ImpactStyle.Medium) => {
  try {
    await Haptics.impact({ style });
  } catch (e) {
    console.log('Haptic feedback:', style);
  }
};

const INITIAL_CHARADES_STATE = {
  gameType: 'charades',
  category: 'Movies',
  currentWord: '',
  timer: 60,
  timerEndsAt: null,
  isActive: false,
  showWord: false,
  score: { teamA: 0, teamB: 0 },
  turn: 'teamA',
  roundId: null
};

export default function DumbCharades() {
  const {
    roomId,
    isHost,
    customGame,
    setCustomGame,
    setRoomStatus,
    updateLeaderboard,
    updateSessionLeaderboard
  } = useGameStore();
  const [category, setCategory] = useState('Movies');
  const [currentWord, setCurrentWord] = useState('');
  const [timer, setTimer] = useState(60);
  const [isActive, setIsActive] = useState(false);
  const [showWord, setShowWord] = useState(false);
  const [score, setScore] = useState({ teamA: 0, teamB: 0 });
  const [turn, setTurn] = useState('teamA');

  const applyCharadesState = (state) => {
    setCategory(state.category || 'Movies');
    setCurrentWord(state.currentWord || '');
    if (!state.isActive || !state.timerEndsAt) {
      setTimer(state.timer ?? 60);
    }
    setIsActive(!!state.isActive);
    setShowWord(!!state.showWord);
    setScore(state.score || { teamA: 0, teamB: 0 });
    setTurn(state.turn || 'teamA');
  };

  const syncCharadesState = (patch, nextStatus) => {
    const activeGame = useGameStore.getState().customGame;
    const current = activeGame?.gameType === 'charades'
      ? activeGame
      : INITIAL_CHARADES_STATE;
    const next = {
      ...current,
      ...patch,
      gameType: 'charades'
    };

    applyCharadesState(next);

    if (roomId) {
      window.dispatchEvent(new CustomEvent('nexus-game-action', {
        detail: { actionData: next, roomStatus: nextStatus }
      }));
    } else {
      setCustomGame(next);
      if (nextStatus) setRoomStatus(nextStatus);
    }
  };

  // Reset game state on component mount - fresh session every time
  useEffect(() => {
    if (!customGame || customGame.gameType !== 'charades') {
      applyCharadesState(INITIAL_CHARADES_STATE);
    }
  }, []);

  useEffect(() => {
    if (customGame?.gameType === 'charades') {
      applyCharadesState(customGame);
    }
  }, [customGame]);

  useEffect(() => {
    let interval = null;
    if (isActive && customGame?.gameType === 'charades' && customGame?.timerEndsAt) {
      interval = setInterval(() => {
        const nextTimer = Math.max(Math.ceil((customGame.timerEndsAt - Date.now()) / 1000), 0);
        setTimer(nextTimer);
        if (nextTimer <= 5 && nextTimer > 0) hapticFeedback(ImpactStyle.Light);
        if (nextTimer === 0 && (!roomId || isHost)) {
          syncCharadesState({ timer: 0, isActive: false, timerEndsAt: null }, 'playing');
        }
      }, 1000);
    } else if (timer === 0 && isActive) {
      setIsActive(false);
      hapticFeedback(ImpactStyle.Heavy);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, customGame?.timerEndsAt, roomId, isHost]);

  const generateWord = () => {
    hapticFeedback();
    const list = DATABASE[category];
    const randomIndex = Math.floor(Math.random() * list.length);
    syncCharadesState({
      category,
      currentWord: list[randomIndex],
      showWord: false,
      timer: 60,
      timerEndsAt: null,
      isActive: false,
      score,
      turn,
      roundId: Date.now()
    }, 'playing');
  };

  const handlePoint = (team) => {
    hapticFeedback(ImpactStyle.Heavy);
    const nextScore = { ...score, [team]: score[team] + 1 };
    const nextTurn = team === 'teamA' ? 'teamB' : 'teamA';
    const teamName = team === 'teamA' ? 'Team Alpha' : 'Team Beta';
    
    if (!roomId || isHost) {
      updateLeaderboard(teamName);
      updateSessionLeaderboard([{ name: teamName, score: 1 }]);
    }
    
    const list = DATABASE[category];
    const randomIndex = Math.floor(Math.random() * list.length);
    syncCharadesState({
      category,
      currentWord: list[randomIndex],
      showWord: false,
      timer: 60,
      timerEndsAt: null,
      isActive: false,
      score: nextScore,
      turn: nextTurn,
      roundId: Date.now()
    }, 'playing');
  };

  const startTimer = () => {
    hapticFeedback();
    syncCharadesState({
      isActive: true,
      timer,
      timerEndsAt: Date.now() + (timer * 1000)
    }, 'playing');
  };
  
  const resetGame = () => {
    hapticFeedback();
    syncCharadesState(INITIAL_CHARADES_STATE, 'idle');
  };

  const revealWord = () => {
    hapticFeedback(ImpactStyle.Heavy);
    syncCharadesState({ showWord: true }, 'playing');
  };

  return (
    <div className="min-h-screen bg-dark-bg bg-grid-white text-white py-8 px-4 flex flex-col pb-32 md:pb-8">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
        <header className="flex justify-between items-center mb-8">
          <Link href="/games" className="text-neon-cyan hover:underline font-mono text-sm p-2 min-w-[44px] min-h-[44px] flex items-center">← EXIT</Link>
          <div className="flex gap-2">
            <button 
              onClick={resetGame}
              disabled={!isActive && !currentWord}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest border transition-all min-h-[44px] ${
                (!isActive && !currentWord) 
                  ? 'opacity-50 cursor-not-allowed border-slate-700 text-slate-600' 
                  : 'border-red-500/40 text-red-500 hover:bg-red-500/20 bg-red-500/10'
              }`}
            >
              × QUIT
            </button>
            <div className={`px-4 py-1 rounded-full border ${turn === 'teamA' ? 'border-neon-cyan bg-neon-cyan/10' : 'border-white/5 opacity-50'}`}>
              <span className="text-[10px] block font-bold text-slate-400">TEAM A</span>
              <span className="text-xl font-black">{score.teamA}</span>
            </div>
            <div className={`px-4 py-1 rounded-full border ${turn === 'teamB' ? 'border-electric-violet bg-electric-violet/10' : 'border-white/5 opacity-50'}`}>
              <span className="text-[10px] block font-bold text-slate-400">TEAM B</span>
              <span className="text-xl font-black">{score.teamB}</span>
            </div>
          </div>
        </header>

        {/* Room Management Section */}
        <NexusRoomManager />

        <div className="glass-panel rounded-[2rem] p-8 border-white/10 text-center relative overflow-hidden flex-1 flex flex-col justify-center">
          <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
            <div 
              className={`h-full transition-all duration-1000 ease-linear shadow-neon-glow ${timer < 10 ? 'bg-red-500' : 'bg-neon-cyan'}`}
              style={{ width: `${(timer / 60) * 100}%` }}
            ></div>
          </div>

          <div className="text-neon-violet font-mono text-4xl mb-8">{timer}s</div>

          <div className="flex justify-center gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar">
            {Object.keys(DATABASE).map((cat) => (
              <button
                key={cat}
                disabled={roomId && !isHost}
                onClick={() => {
                  hapticFeedback(ImpactStyle.Light);
                  setCategory(cat);
                  syncCharadesState({ category: cat }, currentWord ? 'playing' : undefined);
                }}
                className={`px-4 py-2 rounded-full text-[10px] font-bold transition-all border whitespace-nowrap ${
                  category === cat 
                  ? 'bg-neon-cyan text-black border-neon-cyan shadow-neon-glow' 
                  : 'bg-white/5 text-slate-400 border-white/10'
                } ${roomId && !isHost ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {cat.replace('_', ' ')}
              </button>
            ))}
          </div>

          {roomId && !isHost ? (
            <div className="flex-1 flex flex-col justify-center items-center text-center">
              <p className="text-slate-500 uppercase tracking-widest text-[10px] mb-4">Synced from Host</p>
              {currentWord ? (
                <>
                  <div className="w-full h-40 bg-white/5 border-2 border-dashed border-neon-cyan/20 rounded-2xl flex items-center justify-center mb-6">
                    <span className="text-neon-cyan font-black text-lg tracking-widest">SECRET TITLE HIDDEN</span>
                  </div>
                  <p className="text-white font-bold">{isActive ? 'Timer running. Guess out loud!' : 'Waiting for host to start timer...'}</p>
                  <p className="text-slate-500 text-xs mt-2 uppercase tracking-widest">Current turn: {turn === 'teamA' ? 'Team Alpha' : 'Team Beta'}</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin mb-6"></div>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Connected as Guest</p>
                  <p className="text-white mt-2 italic">Waiting for host to generate a title...</p>
                </>
              )}
            </div>
          ) : (
            <>
              {!currentWord ? (
                <div className="flex-1 flex flex-col justify-center">
                  <p className="text-slate-500 mb-8 italic text-sm">Next up: <span className="text-white font-bold">{turn === 'teamA' ? 'TEAM A' : 'TEAM B'}</span></p>
                  <button 
                    onClick={generateWord}
                    className="bg-neon-cyan/20 text-neon-cyan border-2 border-neon-cyan px-10 py-6 rounded-3xl font-black text-2xl hover:scale-95 transition-all shadow-neon-glow"
                  >
                    GENERATE TITLE
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col">
                  <div className="flex-1 flex flex-col justify-center mb-8">
                    <p className="text-slate-500 uppercase tracking-widest text-[10px] mb-4">YOUR SECRET TITLE:</p>
                    {showWord ? (
                      <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
                        {currentWord}
                      </h2>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div 
                          className="w-full h-40 bg-white/5 border-2 border-dashed border-white/20 rounded-2xl flex items-center justify-center cursor-pointer active:bg-white/10 transition-colors" 
                          onClick={revealWord}
                        >
                          <span className="text-neon-cyan font-black text-xl tracking-widest">TAP TO REVEAL</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-auto">
                    {isActive ? (
                      <>
                        <button 
                          onClick={() => handlePoint(turn)}
                          className="py-6 rounded-2xl font-black bg-neon-cyan text-black shadow-neon-glow text-xl"
                        >
                          GUESSED!
                        </button>
                        <button 
                          onClick={generateWord}
                          className="py-6 rounded-2xl font-black bg-white/5 text-slate-400 border border-white/10 text-xl"
                        >
                          PASS
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={startTimer}
                        className="col-span-2 py-6 rounded-2xl font-black bg-neon-violet text-white shadow-neon-glow text-xl"
                      >
                        START {timer < 60 ? 'RESUME' : 'TIMER'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
