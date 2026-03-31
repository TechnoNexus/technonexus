'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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

export default function DumbCharades() {
  const [category, setCategory] = useState('Movies');
  const [currentWord, setCurrentWord] = useState('');
  const [timer, setTimer] = useState(60);
  const [isActive, setIsActive] = useState(false);
  const [showWord, setShowWord] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsActive(false);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, timer]);

  const generateWord = () => {
    const list = DATABASE[category];
    const randomIndex = Math.floor(Math.random() * list.length);
    setCurrentWord(list[randomIndex]);
    setShowWord(false);
    setTimer(60);
    setIsActive(false);
  };

  const startTimer = () => setIsActive(true);
  const resetGame = () => {
    setIsActive(false);
    setTimer(60);
    setCurrentWord('');
    setShowWord(false);
  };

  return (
    <div className="min-h-screen bg-dark-bg bg-grid-white text-white py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <Link href="/games" className="text-neon-cyan hover:underline font-mono">← EXIT ARCADE</Link>
          <h1 className="text-3xl font-black tracking-tighter gradient-text-cyan">DUMB CHARADES</h1>
          <div className="text-neon-violet font-mono text-xl">{timer}s</div>
        </header>

        <div className="glass-panel rounded-[2rem] p-12 border-white/10 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
            <div 
              className="h-full bg-neon-cyan transition-all duration-1000 ease-linear shadow-neon-glow"
              style={{ width: `${(timer / 60) * 100}%` }}
            ></div>
          </div>

          <div className="flex justify-center gap-4 mb-12">
            {Object.keys(DATABASE).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-6 py-2 rounded-full text-xs font-bold transition-all border ${
                  category === cat 
                  ? 'bg-neon-cyan text-black border-neon-cyan shadow-neon-glow' 
                  : 'bg-white/5 text-slate-400 border-white/10 hover:border-white/30'
                }`}
              >
                {cat.replace('_', ' ')}
              </button>
            ))}
          </div>

          {!currentWord ? (
            <div className="py-20">
              <p className="text-slate-500 mb-8 italic">Choose a category and generate a secret title.</p>
              <button 
                onClick={generateWord}
                className="bg-neon-cyan/20 text-neon-cyan border-2 border-neon-cyan px-10 py-4 rounded-full font-black text-xl hover:bg-neon-cyan hover:text-black transition-all shadow-neon-glow"
              >
                GENERATE TITLE
              </button>
            </div>
          ) : (
            <div className="py-10">
              <div className="mb-12">
                <p className="text-slate-500 uppercase tracking-widest text-xs mb-4">YOUR SECRET TITLE:</p>
                {showWord ? (
                  <h2 className="text-5xl md:text-7xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                    {currentWord}
                  </h2>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-full h-32 bg-white/5 border-2 border-dashed border-white/20 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors" onClick={() => setShowWord(true)}>
                      <span className="text-neon-cyan font-black text-2xl tracking-widest">TAP TO REVEAL</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col md:flex-row justify-center gap-4 pt-10 border-t border-white/5">
                <button 
                  onClick={isActive ? () => setIsActive(false) : startTimer}
                  className={`px-12 py-4 rounded-2xl font-black transition-all ${
                    isActive 
                    ? 'bg-red-500/20 text-red-500 border border-red-500/50 hover:bg-red-500 hover:text-white' 
                    : 'bg-neon-violet/20 text-neon-violet border border-neon-violet/50 hover:bg-neon-violet hover:text-white'
                  }`}
                >
                  {isActive ? 'PAUSE TIMER' : 'START TIMER'}
                </button>
                <button 
                  onClick={generateWord}
                  className="px-12 py-4 rounded-2xl font-black bg-white/5 text-slate-300 border border-white/20 hover:bg-white/10 hover:text-white"
                >
                  NEXT WORD
                </button>
                <button 
                  onClick={resetGame}
                  className="px-6 py-4 rounded-2xl font-bold bg-transparent text-slate-600 hover:text-slate-400"
                >
                  RESET
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-panel p-6 rounded-2xl border-white/5">
            <h4 className="text-neon-cyan text-xs font-bold uppercase mb-2">Rule #1</h4>
            <p className="text-slate-400 text-sm">No speaking or making any sound. Only physical gestures allowed.</p>
          </div>
          <div className="glass-panel p-6 rounded-2xl border-white/5">
            <h4 className="text-neon-cyan text-xs font-bold uppercase mb-2">Rule #2</h4>
            <p className="text-slate-400 text-sm">No lip-syncing or pointing at objects that name the title.</p>
          </div>
          <div className="glass-panel p-6 rounded-2xl border-white/5">
            <h4 className="text-neon-cyan text-xs font-bold uppercase mb-2">Rule #3</h4>
            <p className="text-slate-400 text-sm">You have 60 seconds. One point for your team if they guess correctly!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
