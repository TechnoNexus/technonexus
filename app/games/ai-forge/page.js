'use client';

import Link from 'next/link';
import NexusRoomManager from '../../../components/NexusRoomManager';
import { useGameStore } from '../../../store/gameStore';

export default function AIForgeGame() {
  const { customGame } = useGameStore();

  return (
    <div className="min-h-screen bg-dark-bg bg-grid-white text-white py-8 px-4 flex flex-col">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
        <header className="flex justify-between items-center mb-8">
          <Link href="/games" className="text-neon-cyan hover:underline font-mono text-sm uppercase tracking-widest font-black">← Exit Arcade</Link>
          <div className="px-4 py-1 rounded-full border border-neon-cyan bg-neon-cyan/10">
            <span className="text-[10px] block font-black text-neon-cyan uppercase tracking-widest text-center">AI MODE</span>
          </div>
        </header>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">
            <span className="gradient-text-cyan">NEXUS</span> AI FORGE
          </h1>
          <p className="text-slate-500 text-xs uppercase tracking-[0.2em]">Generate custom missions via LLM</p>
        </div>

        {/* Room Manager with Forge UI Enabled */}
        <NexusRoomManager showForge={true} />

        {customGame && (
          <div className="glass-panel rounded-[2rem] p-8 border-neon-cyan/20 text-center animate-in fade-in zoom-in duration-500">
             <div className="inline-block px-3 py-1 bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
               CURRENT MISSION
             </div>
             <h2 className="text-3xl font-black text-white mb-4 tracking-tight uppercase leading-none">
               {customGame.gameTitle}
             </h2>
             <p className="text-slate-400 text-sm leading-relaxed mb-8 italic">
               "{customGame.instructions}"
             </p>
             
             <div className="flex justify-center gap-8 mb-8">
               <div className="text-center">
                 <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Timer</p>
                 <p className="text-xl font-black text-white">{customGame.timeLimitSeconds}s</p>
               </div>
               <div className="text-center">
                 <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Input</p>
                 <p className="text-xl font-black text-white uppercase">{customGame.inputType}</p>
               </div>
             </div>

             <button className="w-full py-6 rounded-2xl bg-neon-cyan text-black font-black text-xl shadow-neon-glow hover:scale-[0.98] transition-all">
               START MISSION
             </button>
          </div>
        )}

        {!customGame && (
          <div className="glass-panel rounded-[2rem] p-12 border-dashed border-white/5 text-center flex-1 flex flex-col justify-center items-center">
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center mb-6">
              <span className="text-slate-700 font-black">?</span>
            </div>
            <p className="text-slate-600 text-sm italic max-w-[200px]">
              Host a room and describe a mission to begin the forge.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
