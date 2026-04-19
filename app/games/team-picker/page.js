'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Haptics, ImpactStyle } from '../../../lib/haptics';

export default function TeamPicker() {
  const [playerName, setPlayerName] = useState('');
  const [players, setPlayers] = useState([]);
  const [teamCount, setTeamCount] = useState(2);
  const [teams, setTeams] = useState([]);

  const hapticFeedback = async (style = ImpactStyle.Medium) => {
    try { await Haptics.impact({ style }); } catch (e) {}
  };

  const addPlayer = (e) => {
    e?.preventDefault();
    if (!playerName.trim()) return;
    
    hapticFeedback(ImpactStyle.Light);
    setPlayers([...players, { id: crypto.randomUUID(), name: playerName.trim() }]);
    setPlayerName('');
  };

  const removePlayer = (id) => {
    hapticFeedback(ImpactStyle.Light);
    setPlayers(players.filter(p => p.id !== id));
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
    hapticFeedback(ImpactStyle.Medium);
    setTeams([]);
  };

  const clearAll = () => {
    hapticFeedback(ImpactStyle.Heavy);
    setPlayers([]);
    setTeams([]);
  };

  return (
    <div className="min-h-screen bg-dark-bg bg-grid-white text-white py-8 px-4 flex flex-col pb-20">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
        <header className="flex justify-between items-center mb-8">
          <Link href="/games" className="text-neon-cyan hover:underline font-mono text-sm uppercase tracking-widest font-black">← Exit Arcade</Link>
          <div className="px-4 py-1 rounded-full border border-electric-violet bg-electric-violet/10">
            <span className="text-[10px] block font-black text-electric-violet uppercase tracking-widest text-center">Team Picker</span>
          </div>
        </header>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">
            <span className="gradient-text-cyan">NEXUS</span> TEAM PICKER
          </h1>
          <p className="text-slate-500 text-xs uppercase tracking-[0.2em]">Shuffle players into instant teams</p>
        </div>

        {teams.length === 0 ? (
          <>
            {/* Input Form */}
            <div className="glass-panel p-6 rounded-[2rem] border-white/5 mb-8">
              <form onSubmit={addPlayer} className="flex gap-2 mb-6">
                <input 
                  type="text" 
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Player name..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-neon-cyan transition-colors text-white text-sm"
                />
                <button 
                  type="submit"
                  className="bg-neon-cyan/20 border border-neon-cyan/30 text-neon-cyan px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-neon-cyan hover:text-black transition-all"
                >
                  Add
                </button>
              </form>

              {/* Players Display */}
              {players.length > 0 && (
                <div className="mb-6 pb-6 border-b border-white/10">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-3 ml-1">Players ({players.length})</p>
                  <div className="space-y-2">
                    {players.map((player) => (
                      <div key={player.id} className="flex justify-between items-center p-3 bg-white/5 border border-white/10 rounded-lg hover:border-red-500/30 group transition-all">
                        <span className="text-sm font-bold text-slate-300">{player.name}</span>
                        <button
                          onClick={() => removePlayer(player.id)}
                          className="text-red-500/0 group-hover:text-red-500 text-xs font-black transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Team Count Selection */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-600 uppercase mb-2">Number of Teams</p>
                  <div className="flex gap-2">
                    {[2, 3, 4].map(num => (
                      <button
                        key={num}
                        onClick={() => { hapticFeedback(ImpactStyle.Light); setTeamCount(num); }}
                        className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                          teamCount === num 
                            ? 'bg-electric-violet text-white border border-electric-violet' 
                            : 'bg-white/5 border border-white/10 text-slate-500 hover:border-white/20'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
                {players.length > 0 && (
                  <button 
                    onClick={clearAll}
                    className="text-[10px] font-bold text-red-500/60 hover:text-red-500 uppercase tracking-widest transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Generate Button */}
            <button 
              disabled={players.length < teamCount}
              onClick={generateTeams}
              className={`w-full py-6 rounded-2xl font-black text-lg uppercase tracking-widest transition-all ${
                players.length >= teamCount 
                  ? 'bg-electric-violet text-white hover:scale-[0.98] shadow-lg' 
                  : 'bg-white/5 text-slate-600 border border-white/10 cursor-not-allowed'
              }`}
            >
              {players.length < teamCount ? `Need ${teamCount - (players.length % teamCount)} more` : 'Generate Teams'}
            </button>
          </>
        ) : (
          <>
            {/* Teams Display */}
            <div className="space-y-4 mb-8 flex-1">
              {teams.map((team, i) => (
                <div key={i} className="glass-panel p-6 rounded-[2rem] border-white/5 animate-in fade-in slide-in-from-bottom duration-500">
                  <div className="inline-block px-3 py-1 bg-electric-violet/20 border border-electric-violet/30 rounded-lg text-[10px] font-black text-electric-violet uppercase tracking-widest mb-4">
                    Team {i + 1} ({team.length} {team.length === 1 ? 'member' : 'members'})
                  </div>
                  <div className="space-y-2">
                    {team.map((player) => (
                      <div key={player.id} className="px-4 py-3 bg-white/5 border border-neon-cyan/20 rounded-lg">
                        <span className="text-sm font-bold text-white">{player.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={resetTeams}
                className="py-4 rounded-2xl font-black bg-white/5 border border-white/10 text-white uppercase text-xs tracking-widest hover:bg-white/10 transition-all"
              >
                Reshuffle
              </button>
              <button 
                onClick={clearAll}
                className="py-4 rounded-2xl font-black bg-red-500/10 border border-red-500/20 text-red-500 uppercase text-xs tracking-widest hover:bg-red-500/20 transition-all"
              >
                Start Over
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}