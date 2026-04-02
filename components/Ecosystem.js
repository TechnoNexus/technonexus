import Link from 'next/link';

export default function Ecosystem() {
  return (
    <section id="ecosystem" className="relative scroll-mt-24">
      <h2 className="text-3xl font-black mb-8 border-l-4 border-neon-cyan pl-6 tracking-tighter uppercase">
        THE OPEN <span className="gradient-text-cyan">ECOSYSTEM</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Arcade - First Spot */}
        <Link href="/games" className="glass-panel p-8 rounded-[2.5rem] hover-glow transition block group cursor-pointer border-white/5">
          <div className="text-4xl mb-6 group-hover:scale-110 transition-transform duration-500">🎮</div>
          <h3 className="text-2xl font-black mb-3 text-white tracking-tighter uppercase">
            <span className="gradient-text-cyan">NEXUS</span> ARCADE
          </h3>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed font-medium">Local co-op games and experimental indie experiences. Connect via phone.</p>
          <div className="text-neon-cyan text-[10px] font-black tracking-[0.3em] uppercase group-hover:translate-x-2 transition-transform duration-300">
            PLAY NOW →
          </div>
        </Link>

        {/* Forge - Second Spot */}
        <Link href="/forge" className="glass-panel p-8 rounded-[2.5rem] hover-glow transition block group cursor-pointer border-white/5">
          <div className="text-4xl mb-6 group-hover:scale-110 transition-transform duration-500">⚙️</div>
          <h3 className="text-2xl font-black mb-3 text-white tracking-tighter uppercase">
            <span className="gradient-text-cyan">NEXUS</span> FORGE
          </h3>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed font-medium">Open-source automation frameworks, AI agents, and engineering toolkits.</p>
          <div className="text-neon-cyan text-[10px] font-black tracking-[0.3em] uppercase group-hover:translate-x-2 transition-transform duration-300">
            VIEW REPOSITORIES →
          </div>
        </Link>

        {/* The AI Cook - Third Spot */}
        <a 
          href="https://www.thebjp.ca" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="glass-panel p-8 rounded-[2.5rem] hover-glow transition block group cursor-pointer border-white/5"
        >
          <div className="text-4xl mb-6 group-hover:scale-110 transition-transform duration-500">🍳</div>
          <h3 className="text-2xl font-black mb-3 text-white tracking-tighter uppercase">
            <span className="gradient-text-cyan">NEXUS</span> COOK
          </h3>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed font-medium">Vegetarian & Jain AI Chef. Get masterclass recipes with what's in your fridge.</p>
          <div className="text-neon-cyan text-[10px] font-black tracking-[0.3em] uppercase group-hover:translate-x-2 transition-transform duration-300">
            VISIT THEBJP.CA →
          </div>
        </a>
      </div>
    </section>
  );
}
