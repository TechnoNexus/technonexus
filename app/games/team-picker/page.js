'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const hapticFeedback = async (style = ImpactStyle.Medium) => {
  try {
    await Haptics.impact({ style });
  } catch (e) {
    console.log('Haptic feedback:', style);
  }
};

export default function TeamPicker() {
  const [playerName, setPlayerName] = useState('');
  const [players, setPlayers] = useState([]);
  const [teamCount, setTeamCount] = useState(2);
  const [teams, setTeams] = useState([]);

  const addPlayer = (e) => {
    e?.preventDefault();
    if (!playerName.trim()) return;
    
    hapticFeedback(ImpactStyle.Light);
    setPlayers([...players, playerName.trim()]);
    setPlayerName('');
  };

  const removePlayer = (index) => {
    hapticFeedback(ImpactStyle.Light);
    setPlayers(players.filter((_, i) => i !== index));
  };

  const generateTeams = () => {
    if (players.length < teamCount) return;
    
    hapticFeedback(ImpactStyle.Heavy);
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    const newTeams = Array.from({ length: teamCount }, () => []);
    
    shuffled.forEach((player, index) => {
      newTeams[index % teamCount].push(player);
    });
    
    setTeams(newTeams);
  };

  const resetTeams = () => {
    hapticFeedback();
    setTeams([]);
  };

  const clearAll = () => {
    hapticFeedback(ImpactStyle.Heavy);
    setPlayers([]);
    setTeams([]);
  };

  return (
    <div className="min-h-screen bg-dark-bg bg-grid-white text-white py-8 px-4 flex flex-col">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
        <header className="flex justify-between items-center mb-8">
          <Link href="/games" className="text-neon-cyan hover:underline font-mono text-sm">← EXIT</Link>
          <h1 className="text-xl font-black tracking-tighter gradient-text-cyan">TEAM PICKER</h1>
        </header>

        <div className="glass-panel rounded-[2rem] p-6 border-white/10 mb-6">
          <form onSubmit={addPlayer} className="flex gap-2 mb-6">
            <input 
              type="text" 
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter player name..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-neon-cyan transition-colors text-white"
            />
            <button 
              type="submit"
              className="bg-neon-cyan text-black font-black px-4 py-3 rounded-xl hover:scale-95 transition-all shadow-neon-glow"
            >
              ADD
            </button>
          </form>

          <div className="flex flex-wrap gap-2 mb-6 min-h-[40px]">
            {players.map((player, i) => (
              <span 
                key={i} 
                onClick={() => removePlayer(i)}
                className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-xs font-bold text-slate-300 flex items-center gap-2 cursor-pointer hover:border-red-500/50 hover:text-red-400 transition-all"
              >
                {player} <span className="text-[10px] opacity-50">×</span>
              </span>
            ))}
            {players.length === 0 && (
              <p className="text-slate-600 text-xs italic">No players added yet.</p>
            )}
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-white/5">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Teams:</span>
              <div className="flex border border-white/10 rounded-lg overflow-hidden">
                {[2, 3, 4].map(num => (
                  <button
                    key={num}
                    onClick={() => { hapticFeedback(ImpactStyle.Light); setTeamCount(num); }}
                    className={`px-4 py-1 text-xs font-bold transition-all ${teamCount === num ? 'bg-neon-violet text-white' : 'bg-transparent text-slate-500 hover:bg-white/5'}`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
            <button 
              onClick={clearAll}
              className="text-[10px] font-bold text-slate-600 hover:text-red-500 transition-colors uppercase tracking-widest"
            >
              Clear All
            </button>
          </div>
        </div>

        {teams.length === 0 ? (
          <button 
            disabled={players.length < teamCount}
            onClick={generateTeams}
            className={`w-full py-6 rounded-3xl font-black text-2xl transition-all shadow-neon-glow ${
              players.length >= teamCount 
              ? 'bg-neon-cyan text-black hover:scale-95' 
              : 'bg-white/5 text-slate-600 border border-white/10 cursor-not-allowed'
            }`}
          >
            GENERATE TEAMS
          </button>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {teams.map((team, i) => (
                <div key={i} className="glass-panel p-4 rounded-2xl border-white/5 border-l-4" style={{ borderColor: i % 2 === 0 ? '#00FFFF' : '#8B5CF6' }}>
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3">Team {i + 1}</h3>
                  <div className="flex flex-wrap gap-2">
                    {team.map((player, j) => (
                      <span key={j} className="text-lg font-bold text-white">{player}{j < team.length - 1 ? ',' : ''}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button 
              onClick={resetTeams}
              className="w-full py-4 rounded-2xl font-black bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 transition-all"
            >
              RESHUFFLE
            </button>
          </div>
        )}
      </div>
    </div>
  );
}