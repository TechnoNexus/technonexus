'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Haptics, ImpactStyle } from '../../../lib/haptics';
import { useGameStore } from '../../../store/gameStore';
import { getApiUrl } from '../../../lib/api';

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
  const { updateLeaderboard, playerName } = useGameStore();

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
  const [name, setName] = useState(playerName || '');

  // Timer per question
  useEffect(() => {
    if (phase !== 'playing' || revealed) return;

    if (timeLeft <= 0) {
      handleReveal(null);
      return;
    }

    const tick = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 4 && t > 0) hapticFeedback(ImpactStyle.Light);
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(tick);
  }, [phase, timeLeft, revealed]);

  const generateQuiz = async () => {
    if (!topic.trim()) return;
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
      hapticFeedback(ImpactStyle.Heavy);
    } catch (e) {
      alert('Failed to generate quiz. Please try again.');
      setPhase('setup');
    }
  };

  const handleReveal = useCallback((chosenKey) => {
    if (revealed) return;
    setSelected(chosenKey);
    setRevealed(true);
    hapticFeedback(chosenKey ? ImpactStyle.Heavy : ImpactStyle.Light);
  }, [revealed]);

  const handleAnswer = (key) => {
    if (revealed) return;
    handleReveal(key);
  };

  // After reveal: wait 1.8s then advance
  useEffect(() => {
    if (!revealed || phase !== 'playing') return;

    const q = quiz.questions[currentIndex];
    const isCorrect = selected === q.correctOption;
    const pointsEarned = isCorrect ? Math.max(10, Math.round((timeLeft / QUESTION_TIME) * 100)) : 0;

    setScores((prev) => [...prev, { correct: isCorrect, time: QUESTION_TIME - timeLeft, points: pointsEarned }]);

    const delay = setTimeout(() => {
      if (currentIndex < quiz.questions.length - 1) {
        setCurrentIndex((i) => i + 1);
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

  // Update leaderboard on result
  useEffect(() => {
    if (phase !== 'result' || !quiz) return;
    const totalPoints = scores.reduce((sum, s) => sum + s.points, 0);
    const displayName = name.trim() || 'Anonymous';
    if (totalPoints > 0) updateLeaderboard(displayName);
  }, [phase]);

  const totalPoints = scores.reduce((sum, s) => sum + s.points, 0);
  const correctCount = scores.filter((s) => s.correct).length;
  const accuracy = quiz ? Math.round((correctCount / quiz.questions.length) * 100) : 0;

  if (phase === 'setup') {
    return (
      <div className="min-h-screen bg-dark-bg bg-grid-white text-white py-8 px-4 flex flex-col pb-20">
        <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
          <header className="flex justify-between items-center mb-8">
            <Link href="/games" className="text-neon-cyan hover:underline font-mono text-sm uppercase tracking-widest font-black">← Exit Arcade</Link>
            <div className="px-4 py-1 rounded-full border border-yellow-400 bg-yellow-400/10">
              <span className="text-[10px] block font-black text-yellow-400 uppercase tracking-widest text-center">Nexus Blitz</span>
            </div>
          </header>

          <div className="text-center mb-12">
            <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">
              NEXUS <span className="text-yellow-400">BLITZ</span>
            </h1>
            <p className="text-slate-500 text-xs uppercase tracking-[0.2em]">AI-powered rapid-fire trivia</p>
          </div>

          <div className="glass-panel p-6 rounded-[2rem] border-white/5 mb-6">
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-3 block">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name..."
              maxLength={24}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-yellow-400/60 outline-none transition-all mb-5"
            />

            <label className="text-[10px] font-bold text-slate-500 uppercase mb-3 block">Quiz Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Space Exploration, Bollywood, JavaScript..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-yellow-400/60 outline-none transition-all"
              onKeyDown={(e) => e.key === 'Enter' && generateQuiz()}
            />
          </div>

          <div className="glass-panel p-6 rounded-[2rem] border-white/5 mb-6">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-4">Questions</p>
            <div className="flex gap-2">
              {[5, 8, 10].map((n) => (
                <button
                  key={n}
                  onClick={() => { setQuestionCount(n); hapticFeedback(ImpactStyle.Light); }}
                  className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                    questionCount === n
                      ? 'bg-yellow-400 text-black border border-yellow-400'
                      : 'bg-white/5 border border-white/10 text-slate-400 hover:border-white/20'
                  }`}
                >
                  {n} Qs
                </button>
              ))}
            </div>
          </div>

          <div className="glass-panel p-6 rounded-[2rem] border-white/5 mb-8">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-4">Language</p>
            <div className="flex gap-2">
              {['English', 'Hindi', 'Hinglish'].map((lang) => (
                <button
                  key={lang}
                  onClick={() => { setLanguage(lang); hapticFeedback(ImpactStyle.Light); }}
                  className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                    language === lang
                      ? 'bg-yellow-400 text-black border border-yellow-400'
                      : 'bg-white/5 border border-white/10 text-slate-400 hover:border-white/20'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={generateQuiz}
            disabled={!topic.trim()}
            className={`w-full py-6 rounded-2xl font-black text-lg uppercase tracking-widest transition-all ${
              topic.trim()
                ? 'bg-yellow-400 text-black hover:scale-[0.98] shadow-lg'
                : 'bg-white/5 text-slate-600 border border-white/10 cursor-not-allowed'
            }`}
          >
            Generate Quiz
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center text-white px-4">
        <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mb-6"></div>
        <p className="text-slate-400 uppercase tracking-widest text-xs">Generating quiz on "{topic}"...</p>
      </div>
    );
  }

  if (phase === 'playing' && quiz) {
    const q = quiz.questions[currentIndex];
    const progress = ((currentIndex) / quiz.questions.length) * 100;
    const timerPct = (timeLeft / QUESTION_TIME) * 100;

    return (
      <div className="min-h-screen bg-dark-bg bg-grid-white text-white py-8 px-4 flex flex-col pb-20">
        <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Q {currentIndex + 1} / {quiz.questions.length}
            </span>
            <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest">
              {totalPoints} pts
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1 bg-white/5 rounded-full mb-6">
            <div
              className="h-full bg-yellow-400 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Timer */}
          <div className="relative h-1.5 bg-white/5 rounded-full mb-8 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 linear ${
                timeLeft <= 5 ? 'bg-red-500' : 'bg-yellow-400'
              }`}
              style={{ width: `${timerPct}%` }}
            />
          </div>

          {/* Timer number */}
          <div className={`text-center text-3xl font-black mb-6 tabular-nums ${timeLeft <= 5 ? 'text-red-400' : 'text-yellow-400'}`}>
            {revealed ? '' : `${timeLeft}s`}
          </div>

          {/* Question */}
          <div className="glass-panel p-6 rounded-[2rem] border-white/5 mb-6 text-center">
            <p className="text-white text-lg font-bold leading-snug">{q.question}</p>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 gap-3 mb-6">
            {OPTION_KEYS.map((key) => {
              const isCorrect = key === q.correctOption;
              const isSelected = key === selected;
              let borderClass = 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20';

              if (revealed) {
                if (isCorrect) borderClass = `border-green-500/60 bg-green-500/20 text-green-300`;
                else if (isSelected && !isCorrect) borderClass = `border-red-500/60 bg-red-500/20 text-red-300`;
                else borderClass = 'border-white/5 bg-white/5 text-slate-600 opacity-50';
              }

              return (
                <button
                  key={key}
                  onClick={() => handleAnswer(key)}
                  disabled={revealed}
                  className={`flex items-center gap-4 px-5 py-4 rounded-2xl border font-bold text-sm text-left transition-all ${borderClass} ${!revealed ? 'active:scale-[0.97]' : ''}`}
                >
                  <span className={`w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center text-xs font-black ${revealed && isCorrect ? 'bg-green-500 text-white' : revealed && isSelected ? 'bg-red-500 text-white' : 'bg-white/10 text-slate-400'}`}>
                    {key}
                  </span>
                  {q.options[key]}
                </button>
              );
            })}
          </div>

          {/* Fun fact after reveal */}
          {revealed && q.funFact && (
            <div className="glass-panel p-4 rounded-2xl border-yellow-400/20 text-center animate-in fade-in duration-300">
              <p className="text-[10px] font-bold text-yellow-400/70 uppercase tracking-widest mb-1">Fun Fact</p>
              <p className="text-slate-300 text-sm italic">{q.funFact}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (phase === 'result' && quiz) {
    const grade = accuracy >= 90 ? 'S' : accuracy >= 70 ? 'A' : accuracy >= 50 ? 'B' : accuracy >= 30 ? 'C' : 'D';
    const gradeColor = accuracy >= 90 ? 'text-yellow-400' : accuracy >= 70 ? 'text-green-400' : accuracy >= 50 ? 'text-neon-cyan' : accuracy >= 30 ? 'text-orange-400' : 'text-red-400';

    return (
      <div className="min-h-screen bg-dark-bg bg-grid-white text-white py-8 px-4 flex flex-col pb-20">
        <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
          <div className="text-center mb-10">
            <div className={`text-8xl font-black mb-2 ${gradeColor}`}>{grade}</div>
            <h2 className="text-2xl font-black uppercase tracking-tighter">{quiz.quizTitle}</h2>
            {name.trim() && <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest">{name.trim()}</p>}
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="glass-panel p-4 rounded-2xl border-white/5 text-center">
              <p className="text-2xl font-black text-yellow-400">{totalPoints}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Points</p>
            </div>
            <div className="glass-panel p-4 rounded-2xl border-white/5 text-center">
              <p className="text-2xl font-black text-green-400">{correctCount}/{quiz.questions.length}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Correct</p>
            </div>
            <div className="glass-panel p-4 rounded-2xl border-white/5 text-center">
              <p className="text-2xl font-black text-neon-cyan">{accuracy}%</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Accuracy</p>
            </div>
          </div>

          {/* Question-by-question breakdown */}
          <div className="glass-panel p-6 rounded-[2rem] border-white/5 mb-8">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-4">Breakdown</p>
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
              {quiz.questions.map((q, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border text-xs ${scores[i]?.correct ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                  <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${scores[i]?.correct ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                    {scores[i]?.correct ? '✓' : '✗'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-300 truncate">{q.question}</p>
                    {!scores[i]?.correct && <p className="text-green-400 text-[10px] mt-0.5">Answer: {q.options[q.correctOption]}</p>}
                  </div>
                  {scores[i]?.points > 0 && <span className="text-yellow-400 font-black flex-shrink-0">+{scores[i].points}</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { setPhase('setup'); setQuiz(null); setTopic(''); hapticFeedback(); }}
              className="py-4 rounded-2xl font-black bg-white/5 border border-white/10 text-white uppercase text-xs tracking-widest hover:bg-white/10 transition-all"
            >
              New Topic
            </button>
            <button
              onClick={() => { setCurrentIndex(0); setScores([]); setSelected(null); setRevealed(false); setTimeLeft(QUESTION_TIME); setPhase('playing'); hapticFeedback(ImpactStyle.Heavy); }}
              className="py-4 rounded-2xl font-black bg-yellow-400 text-black uppercase text-xs tracking-widest hover:scale-[0.98] transition-all"
            >
              Retry Quiz
            </button>
          </div>

          <Link
            href="/leaderboard"
            className="mt-3 block text-center py-3 text-yellow-400/60 text-xs font-bold uppercase tracking-widest hover:text-yellow-400 transition-colors"
          >
            View Leaderboard →
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
