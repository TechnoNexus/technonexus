'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useGameStore } from '../../store/gameStore';

const RANK_COLORS = ['text-yellow-400', 'text-slate-300', 'text-orange-400'];
const RANK_LABELS = ['1ST', '2ND', '3RD'];

export default function LeaderboardPage() {
  const { leaderboard } = useGameStore();
  const [showConfirm, setShowConfirm] = useState(false);

  // Zustand persist hydrates asynchronously — leaderboard may be [] on first render
  const sorted = [...(leaderboard || [])].sort((a, b) => b.wins - a.wins);

  return (
    <div className="min-h-screen bg-dark-bg bg-grid-white text-white py-12 px-4">
      <div className="max-w-lg mx-auto">
        <header className="flex justify-between items-center mb-12">
          <Link href="/games" className="text-neon-cyan hover:underline font-mono text-sm uppercase tracking-widest font-black">← Arcade</Link>
          <div className="px-4 py-1 rounded-full border border-yellow-400/50 bg-yellow-400/10">
            <span className="text-[10px] block font-black text-yellow-400 uppercase tracking-widest">Hall of Fame</span>
          </div>
        </header>

        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-3">
            <span className="gradient-text-cyan">NEXUS</span>{' '}
            <span className="text-yellow-400">BOARD</span>
          </h1>
          <p className="text-slate-500 text-xs uppercase tracking-[0.2em]">
            Cross-game wins — persisted locally
          </p>
        </div>

        {sorted.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 border-white/5 text-center">
            <p className="text-4xl mb-4">🎮</p>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No scores yet</p>
            <p className="text-slate-600 text-xs mt-2">Win a round in any game to appear here</p>
            <Link
              href="/games"
              className="mt-6 inline-block px-6 py-3 bg-neon-cyan/20 border border-neon-cyan/30 text-neon-cyan rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-neon-cyan hover:text-black transition-all"
            >
              Play Now →
            </Link>
          </div>
        ) : (
          <>
            {/* Podium — top 3 */}
            {sorted.length >= 1 && (
              <div className="flex items-end justify-center gap-3 mb-10">
                {[1, 0, 2].map((podiumIndex) => {
                  const player = sorted[podiumIndex];
                  if (!player) return <div key={podiumIndex} className="flex-1" />;
                  const heights = ['h-24', 'h-32', 'h-20'];
                  return (
                    <div key={podiumIndex} className="flex-1 flex flex-col items-center">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 truncate max-w-full px-1 text-center">
                        {player.name}
                      </p>
                      <p className={`text-xl font-black ${RANK_COLORS[podiumIndex]}`}>
                        {player.wins}W
                      </p>
                      <div className={`w-full ${heights[podiumIndex]} rounded-t-2xl flex items-center justify-center ${podiumIndex === 0 ? 'bg-yellow-400/20 border border-yellow-400/30' : podiumIndex === 1 ? 'bg-white/5 border border-white/10' : 'bg-orange-400/10 border border-orange-400/20'}`}>
                        <span className={`text-lg font-black ${RANK_COLORS[podiumIndex]}`}>{RANK_LABELS[podiumIndex]}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Full table */}
            <div className="glass-panel rounded-3xl border-white/5 overflow-hidden mb-6">
              <div className="grid grid-cols-12 px-6 py-3 border-b border-white/5">
                <span className="col-span-1 text-[10px] font-bold text-slate-600 uppercase">#</span>
                <span className="col-span-6 text-[10px] font-bold text-slate-600 uppercase">Player</span>
                <span className="col-span-2 text-[10px] font-bold text-slate-600 uppercase text-center">Wins</span>
                <span className="col-span-3 text-[10px] font-bold text-slate-600 uppercase text-right">Win Rate</span>
              </div>
              {sorted.map((player, i) => {
                const winRate = player.totalGames > 0
                  ? Math.round((player.wins / player.totalGames) * 100)
                  : 0;
                return (
                  <div
                    key={player.name}
                    className={`grid grid-cols-12 px-6 py-4 border-b border-white/5 last:border-0 transition-colors hover:bg-white/5 ${i === 0 ? 'bg-yellow-400/5' : ''}`}
                  >
                    <span className={`col-span-1 font-black text-sm ${i < 3 ? RANK_COLORS[i] : 'text-slate-600'}`}>{i + 1}</span>
                    <div className="col-span-6 flex items-center gap-2">
                      <span className="font-bold text-sm text-white truncate">{player.name}</span>
                      {i === 0 && <span className="text-[10px] text-yellow-400">👑</span>}
                    </div>
                    <span className="col-span-2 text-center font-black text-neon-cyan">{player.wins}</span>
                    <div className="col-span-3 flex items-center justify-end gap-2">
                      <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-neon-cyan rounded-full" style={{ width: `${winRate}%` }} />
                      </div>
                      <span className="text-xs font-bold text-slate-500">{winRate}%</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Clear */}
            {!showConfirm ? (
              <button
                onClick={() => setShowConfirm(true)}
                className="text-[10px] font-bold text-slate-600 hover:text-red-500 uppercase tracking-widest transition-colors block mx-auto"
              >
                Clear leaderboard
              </button>
            ) : (
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    useGameStore.setState({ leaderboard: [] });
                    setShowConfirm(false);
                  }}
                  className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-black uppercase tracking-widest hover:bg-red-500/30 transition-all"
                >
                  Confirm Clear
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
