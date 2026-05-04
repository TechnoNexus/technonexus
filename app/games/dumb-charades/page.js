'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Haptics, ImpactStyle } from '../../../lib/haptics';
import UnifiedGameLobby from '../../../components/UnifiedGameLobby';
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
  } catch (e) {}
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
    updateSessionLeaderboard,
    playerName
  } = useGameStore();

  const [category, setCategory] = useState('Movies');
  const [currentWord, setCurrentWord] = useState('');
  const [timer, setTimer] = useState(60);
  const [isActive, setIsActive] = useState(false);
  const [showWord, setShowWord] = useState(false);
  const [score, setScore] = useState({ teamA: 0, teamB: 0 });
  const [turn, setTurn] = useState('teamA');
  const [customList, setCustomList] = useState(null);

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
    setCustomList(state.customList || null);
  };

  const syncCharadesState = (patch, nextStatus) => {
    const activeGame = useGameStore.getState().customGame;
    const current = activeGame?.gameType === 'charades' ? activeGame : INITIAL_CHARADES_STATE;
    const next = { ...current, ...patch, gameType: 'charades' };

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
          const nextTurn = turn === 'teamA' ? 'teamB' : 'teamA';
          syncCharadesState({ 
            timer: 0, 
            isActive: false, 
            timerEndsAt: null,
            turn: nextTurn,
            currentWord: '',
            showWord: true
          }, 'playing');
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, customGame?.timerEndsAt, roomId, isHost, turn]);

  const generateWord = () => {
    hapticFeedback();
    const list = customList || DATABASE[category];
    const randomIndex = Math.floor(Math.random() * list.length);
    syncCharadesState({
      category,
      currentWord: list[randomIndex],
      showWord: false,
      isActive: true,
      timer: 60,
      timerEndsAt: Date.now() + 60000,
      roundId: Date.now()
    }, 'playing');
  };

  const handleCorrect = () => {
    hapticFeedback(ImpactStyle.Heavy);
    const nextScore = { ...score, [turn]: score[turn] + 1 };
    
    // Update leaderboards
    updateLeaderboard(playerName || 'Anonymous');
    updateSessionLeaderboard([{ name: playerName || 'Anonymous', score: 1 }]);

    const list = customList || DATABASE[category];
    const nextWord = list[Math.floor(Math.random() * list.length)];

    syncCharadesState({
      score: nextScore,
      currentWord: nextWord,
      showWord: false
    });
  };

  const handleSkip = () => {
    hapticFeedback(ImpactStyle.Light);
    const list = customList || DATABASE[category];
    const nextWord = list[Math.floor(Math.random() * list.length)];
    syncCharadesState({ currentWord: nextWord, showWord: false });
  };

  const resetGame = () => {
    hapticFeedback(ImpactStyle.Medium);
    syncCharadesState(INITIAL_CHARADES_STATE, 'idle');
  };

  const handleStartMission = (unifiedPlayers) => {
    hapticFeedback(ImpactStyle.Heavy);
    generateWord();
  };

  return (
    <div className="min-h-screen bg-dark-bg bg-grid-white text-white py-8 px-4 flex flex-col pb-32 md:pb-8">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
        <header className="flex justify-between items-center mb-8">
          <Link href="/games" className="text-neon-cyan hover:underline font-mono text-sm p-2 min-w-[44px] min-h-[44px] flex items-center">← EXIT</Link>
          <button 
            onClick={resetGame}
            className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest border border-red-500/40 text-red-500 hover:bg-red-500/20 bg-red-500/10 transition-all min-h-[44px]"
          >
            × QUIT
          </button>
        </header>

        {isActive || showWord || score.teamA > 0 || score.teamB > 0 ? (
          <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-center space-y-6">
            <div className="glass-panel p-8 rounded-[3rem] border-white/10 text-center relative overflow-hidden">
               <div className="flex justify-between items-center mb-8">
                  <div className={`px-4 py-2 rounded-xl border ${turn === 'teamA' ? 'bg-neon-cyan/20 border-neon-cyan/40 text-neon-cyan' : 'bg-white/5 border-white/10 text-slate-500'}`}>
                    <p className="text-[8px] font-black uppercase tracking-widest">Team A</p>
                    <p className="text-xl font-black">{score.teamA}</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Time Left</p>
                    <p className={`text-4xl font-black tabular-nums ${timer <= 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{timer}s</p>
                  </div>
                  <div className={`px-4 py-2 rounded-xl border ${turn === 'teamB' ? 'bg-electric-violet/20 border-electric-violet/40 text-electric-violet' : 'bg-white/5 border-white/10 text-slate-500'}`}>
                    <p className="text-[8px] font-black uppercase tracking-widest">Team B</p>
                    <p className="text-xl font-black">{score.teamB}</p>
                  </div>
               </div>

               <div className="py-12 border-y border-white/5 mb-8">
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4">{category}</p>
                  <h2 className="text-4xl font-black tracking-tighter uppercase leading-tight">
                    {currentWord || 'PREPARING...'}
                  </h2>
               </div>

               {isHost && (
                 <div className="flex flex-col gap-4">
                    <button 
                      onClick={handleCorrect}
                      className="w-full py-6 rounded-2xl bg-neon-cyan text-black font-black uppercase tracking-widest shadow-neon-glow hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      CORRECT! +1
                    </button>
                    <button 
                      onClick={handleSkip}
                      className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold uppercase tracking-widest text-xs hover:bg-white/10 transition-all"
                    >
                      SKIP WORD
                    </button>
                 </div>
               )}
               {!isHost && (
                  <div className="p-8 rounded-2xl bg-white/5 border border-white/10 italic text-slate-500 text-sm">
                    Watch the host's screen for the word!
                  </div>
               )}
            </div>
          </div>
        ) : (
          <UnifiedGameLobby
            gameTitle="Dumb Charades"
            onStart={handleStartMission}
            showForge={true}
            customSettingsUI={
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block text-left">Mission Category</label>
                <div className="grid grid-cols-3 gap-2">
                   {Object.keys(DATABASE).map(cat => (
                     <button 
                      key={cat}
                      onClick={() => { hapticFeedback(ImpactStyle.Light); setCategory(cat); setCustomList(null); }}
                      className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-tight border transition-all ${category === cat && !customList ? 'bg-neon-cyan text-black border-neon-cyan' : 'bg-white/5 border-white/10 text-slate-400'}`}
                     >
                       {cat.replace('_', ' ')}
                     </button>
                   ))}
                </div>
              </div>
            }
          />
        )}
      </div>
    </div>
  );
}
