'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Haptics, ImpactStyle } from '../../../lib/haptics';
import { useGameStore } from '../../../store/gameStore';
import { getApiUrl } from '../../../lib/api';
import UnifiedGameLobby from '../../../components/UnifiedGameLobby';

const QUESTION_TIME = 15;
const OPTION_KEYS = ['A', 'B', 'C', 'D'];
const OPTION_COLORS = {
  A: 'neon-cyan',
  B: 'electric-violet',
  C: 'neon-yellow',
  D: 'neon-pink',
};
const OPTION_BG = {
  A: 'bg-neon-cyan',
  B: 'bg-electric-violet',
  C: 'bg-yellow-400',
  D: 'bg-pink-500',
};

const hapticFeedback = async (style = ImpactStyle.Medium) => {
  try { await Haptics.impact({ style }); } catch (e) {}
};

export default function NexusBlitz() {
  const {
    updateLeaderboard,
    updateSessionLeaderboard,
    playerName,
    roomId,
    isHost,
    customGame,
    setCustomGame,
    setRoomStatus
  } = useGameStore();

  const [phase, setPhase] = useState('setup'); // setup | loading | playing | result
  const [topic, setTopic] = useState('');
  const [language, setLanguage] = useState('English');
  const [questionCount, setQuestionCount] = useState(8);
  const [quiz, setQuiz] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);       // player's chosen option key
  const [revealed, setRevealed] = useState(false);      // show correct answer
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [scores, setScores] = useState([]);             // [{ correct, time, points }]
  const submittedResult = useRef(false);
  const lastRoundId = useRef(null);

  const syncBlitzGame = (patch, nextStatus) => {
    const activeGame = useGameStore.getState().customGame;
    const current = activeGame?.gameType === 'blitz' ? activeGame : { gameType: 'blitz' };
    const next = { ...current, ...patch, gameType: 'blitz' };

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
    if (customGame?.gameType !== 'blitz' || !customGame.quiz) return;
    
    // Prevent restart if it's the same round
    if (customGame.roundId && lastRoundId.current === customGame.roundId) {
       return;
    }
    
    lastRoundId.current = customGame.roundId;
    setQuiz(customGame.quiz);
    if (phase === 'setup' || phase === 'loading' || phase === 'result') {
      setCurrentIndex(0);
      setScores([]);
      setSelected(null);
      setRevealed(false);
      setTimeLeft(QUESTION_TIME);
      submittedResult.current = false;
      setPhase('playing');
    }
  }, [customGame]);

  // Timer per question
  useEffect(() => {
    if (phase !== 'playing' || revealed) return;

    if (timeLeft <= 0) {
      handleReveal(null);
      return;
    }

    const tick = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearInterval(tick);
  }, [phase, timeLeft, revealed]);

  // FIX: Isolated side effect for haptics
  useEffect(() => {
    if (phase === 'playing' && !revealed && timeLeft <= 4 && timeLeft > 0) {
      hapticFeedback(ImpactStyle.Light);
    }
  }, [timeLeft, phase, revealed]);

  const handleStartMission = async (unifiedPlayers) => {
    if (!topic.trim()) return alert('Select a topic first!');
    setPhase('loading');
    hapticFeedback();
    try {
      const res = await fetch(getApiUrl('/api/generate-trivia'), {
        method: 'POST',
        body: JSON.stringify({ topic: topic.trim(), count: questionCount, language }),
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      if (!data.questions?.length) throw new Error('No questions returned');
      
      setQuiz(data);
      setCurrentIndex(0);
      setScores([]);
      setSelected(null);
      setRevealed(false);
      setTimeLeft(QUESTION_TIME);
      setPhase('playing');
      submittedResult.current = false;
      
      syncBlitzGame({
        quiz: data,
        quizTitle: data.quizTitle,
        topic: topic.trim(),
        language,
        questionCount,
        roundId: Date.now(),
        blitzResults: []
      }, 'playing');
      hapticFeedback(ImpactStyle.Heavy);
    } catch (e) {
      alert('Failed to generate quiz. Please try again.');
      setPhase('setup');
    }
  };

  const handleReveal = (optionKey) => {
    if (revealed) return;
    hapticFeedback(ImpactStyle.Light);
    setSelected(optionKey);
    setRevealed(true);

    const isCorrect = optionKey === quiz.questions[currentIndex].correctOption;
    const points = isCorrect ? Math.ceil((timeLeft / QUESTION_TIME) * 100) : 0;

    setScores((prev) => [...prev, { correct: isCorrect, time: QUESTION_TIME - timeLeft, points }]);
  };

  useEffect(() => {
    if (!revealed) return;

    const delay = setTimeout(() => {
      if (currentIndex < quiz.questions.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setSelected(null);
        setRevealed(false);
        setTimeLeft(QUESTION_TIME);
      } else {
        setPhase('result');
        hapticFeedback(ImpactStyle.Heavy);
      }
    }, 1800);

    return () => clearTimeout(delay);
  }, [revealed]);

  useEffect(() => {
    if (phase !== 'result') return;

    const totalPoints = scores.reduce((acc, s) => acc + s.points, 0);
    const displayName = playerName || 'Nexus';
    
    if (totalPoints > 0) updateLeaderboard(displayName);
    if (totalPoints > 0) updateSessionLeaderboard([{ name: displayName, score: totalPoints }]);

    if (roomId && !submittedResult.current) {
      submittedResult.current = true;
      syncBlitzGame({
        blitzResult: { name: displayName, score: totalPoints }
      });
    }
  }, [phase, scores]);

  const resetGame = () => {
    setPhase('setup');
    setQuiz(null);
    setScores([]);
    syncBlitzGame({ quiz: null }, 'idle');
  };

  if (phase === 'setup' || phase === 'loading') {
    return (
      <div className="min-h-screen bg-dark-bg bg-grid-white py-8 px-4 flex flex-col pb-32">
        <header className="max-w-4xl mx-auto w-full flex justify-between items-center mb-8">
           <Link href="/games" className="text-neon-cyan hover:underline font-mono text-sm p-2 min-w-[44px] min-h-[44px] flex items-center">← EXIT</Link>
        </header>

        {phase === 'loading' ? (
           <div className="flex-1 flex flex-col items-center justify-center space-y-8">
              <div className="w-24 h-24 rounded-full border-t-4 border-l-4 border-neon-cyan animate-spin shadow-neon-glow" />
              <div className="text-center">
                <h2 className="text-4xl font-black text-white tracking-tighter uppercase mb-2 animate-pulse">Forging Quiz</h2>
                <p className="text-slate-500 font-mono text-xs uppercase tracking-widest italic">Extracting data from the digital ether...</p>
              </div>
           </div>
        ) : (
          <UnifiedGameLobby
            gameTitle="Nexus Blitz"
            onStart={handleStartMission}
            customSettingsUI={
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block text-left">Mission Domain</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. 80s Movies, Anime, Physics..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-neon-cyan transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block text-left">Scale</label>
                     <select 
                       value={questionCount} 
                       onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                       className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-neon-cyan appearance-none cursor-pointer text-xs"
                     >
                        <option value="5" className="bg-gray-900 text-white font-bold uppercase">5 DATA POINTS</option>
                        <option value="8" className="bg-gray-900 text-white font-bold uppercase">8 DATA POINTS</option>
                        <option value="12" className="bg-gray-900 text-white font-bold uppercase">12 DATA POINTS</option>
                        <option value="15" className="bg-gray-900 text-white font-bold uppercase">15 DATA POINTS</option>
                     </select>
                   </div>
                   <div>
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block text-left">Language</label>
                     <select 
                       value={language} 
                       onChange={(e) => setLanguage(e.target.value)}
                       className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-neon-cyan appearance-none cursor-pointer text-xs"
                     >
                        <option value="English" className="bg-gray-900 text-white font-bold uppercase">English</option>
                        <option value="Hindi" className="bg-gray-900 text-white font-bold uppercase">Hindi</option>
                        <option value="Hinglish" className="bg-gray-900 text-white font-bold uppercase">Hinglish</option>
                     </select>
                   </div>
                </div>
              </div>
            }
          />
        )}
      </div>
    );
  }

  if (phase === 'playing' && quiz) {
    const q = quiz.questions[currentIndex];
    return (
      <div className="min-h-screen bg-dark-bg bg-grid-white text-white p-4 flex flex-col items-center justify-center pb-32">
        <div className="max-w-2xl w-full">
          <div className="flex justify-between items-center mb-8">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
              Data Stream: {currentIndex + 1} / {quiz.questions.length}
            </span>
            <div className="flex items-center gap-4">
               <div className={`text-xl font-black tabular-nums transition-colors ${timeLeft <= 5 ? 'text-red-500' : 'text-neon-cyan'}`}>
                 {timeLeft}s
               </div>
            </div>
          </div>

          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden mb-12">
             <div 
               className="h-full bg-neon-cyan transition-all duration-1000 ease-linear shadow-neon-glow"
               style={{ width: `${(timeLeft / QUESTION_TIME) * 100}%` }}
             />
          </div>

          <div className="glass-panel p-8 md:p-12 rounded-[3rem] border-white/5 text-center mb-12 relative overflow-hidden">
             <h2 className="text-2xl md:text-3xl font-black leading-tight tracking-tight mb-4 uppercase">
               {q.question}
             </h2>
             {revealed && (
               <div className="mt-8 p-4 bg-yellow-400/10 border border-yellow-400/20 rounded-2xl animate-in fade-in zoom-in duration-300">
                 <p className="text-[10px] font-bold text-yellow-400/70 uppercase tracking-widest mb-1">Fun Fact</p>
                 <p className="text-slate-300 text-sm italic">{q.funFact}</p>
               </div>
             )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {OPTION_KEYS.map((key) => {
              const isSelected = selected === key;
              const isCorrect = key === q.correctOption;
              const showCheck = revealed && isCorrect;
              const showCross = revealed && isSelected && !isCorrect;

              return (
                <button
                  key={key}
                  onClick={() => handleReveal(key)}
                  disabled={revealed}
                  className={`
                    group p-6 rounded-2xl border transition-all text-left flex items-center justify-between
                    ${revealed ? 'cursor-default' : 'hover:scale-[1.02] active:scale-[0.98]'}
                    ${isSelected ? `border-${OPTION_COLORS[key]} bg-${OPTION_COLORS[key]}/10` : 'border-white/5 bg-white/5 hover:border-white/20'}
                    ${revealed && isCorrect ? 'border-green-500 bg-green-500/20' : ''}
                    ${revealed && isSelected && !isCorrect ? 'border-red-500 bg-red-500/20' : ''}
                  `}
                >
                  <div className="flex items-center gap-4">
                    <span className={`
                      w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm
                      ${OPTION_BG[key]} text-black
                    `}>
                      {key}
                    </span>
                    <span className={`font-bold transition-colors ${revealed && isCorrect ? 'text-green-400' : 'text-slate-200'}`}>
                      {q.options[key]}
                    </span>
                  </div>
                  {showCheck && <span className="text-green-500 font-black">✓</span>}
                  {showCross && <span className="text-red-500 font-black">×</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'result') {
    const totalPoints = scores.reduce((acc, s) => acc + s.points, 0);
    const correctCount = scores.filter((s) => s.correct).length;
    const blitzResults = customGame?.blitzResults || [];

    return (
      <div className="min-h-screen bg-dark-bg bg-grid-white text-white p-4 flex flex-col items-center justify-center pb-32">
        <div className="max-w-2xl w-full">
          <div className="glass-panel p-12 rounded-[3.5rem] border-white/5 text-center mb-8">
            <h2 className="text-6xl font-black mb-2 tracking-tighter uppercase">Mission End</h2>
            <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.3em] mb-12">Session analysis complete</p>

            <div className="grid grid-cols-3 gap-4 mb-12">
               <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Accuracy</p>
                  <p className="text-2xl font-black text-neon-cyan">{Math.round((correctCount / scores.length) * 100)}%</p>
               </div>
               <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Correct</p>
                  <p className="text-2xl font-black text-electric-violet">{correctCount}</p>
               </div>
               <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Points</p>
                  <p className="text-2xl font-black text-yellow-400">{totalPoints}</p>
               </div>
            </div>

            <button
              onClick={resetGame}
              className="w-full py-6 rounded-2xl bg-white text-black font-black uppercase tracking-[0.2em] hover:bg-neon-cyan transition-all shadow-2xl shadow-neon-cyan/20"
            >
              Next Mission
            </button>
          </div>

          {roomId && blitzResults.length > 0 && (
            <div className="glass-panel p-8 rounded-[2.5rem] border-white/5">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 text-center">Room Leaderboard</h3>
              <div className="space-y-3">
                {blitzResults.map((result, i) => (
                  <div key={i} className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-slate-600">#{i + 1}</span>
                      <span className="font-bold uppercase tracking-tight text-slate-200">{result.name}</span>
                    </div>
                    <span className="text-yellow-400 font-black">{result.score}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
