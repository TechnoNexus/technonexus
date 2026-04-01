import Link from 'next/link';

export default function Ecosystem() {
  return (
    <section id="ecosystem">
      <h2 className="text-3xl font-bold mb-8 border-l-4 border-neon-cyan pl-4">The Open Ecosystem</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Arcade - First Spot */}
        <Link href="/games" className="glass-panel p-8 rounded-2xl hover-glow transition block group cursor-pointer">
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🎮</div>
          <h3 className="text-xl font-bold mb-2 text-white">The Arcade</h3>
          <p className="text-slate-400 text-sm mb-6">Local co-op games and experimental indie experiences. Connect via phone.</p>
          <div className="text-neon-cyan text-xs font-bold tracking-widest">PLAY NOW →</div>
        </Link>

        {/* Forge - Second Spot */}
        <Link href="/forge" className="glass-panel p-8 rounded-2xl hover-glow transition block group cursor-pointer border-neon-cyan/10">
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">⚙️</div>
          <h3 className="text-xl font-bold mb-2 text-white uppercase tracking-tight">The Forge</h3>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">Open-source automation frameworks, AI agents, and engineering toolkits.</p>
          <div className="text-neon-cyan text-xs font-bold tracking-[0.3em] uppercase group-hover:translate-x-2 transition-transform duration-300">
            VIEW REPOSITORIES →
          </div>
        </Link>

        {/* The AI Cook - Third Spot */}
        <a 
          href="https://www.thebjp.ca" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="glass-panel p-8 rounded-2xl hover-glow transition block group cursor-pointer"
        >
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🍳</div>
          <h3 className="text-xl font-bold mb-2 text-white">The AI Cook</h3>
          <p className="text-slate-400 text-sm mb-6">Vegetarian & Jain AI Chef. Get masterclass recipes with what's in your fridge.</p>
          <div className="text-neon-cyan text-xs font-bold tracking-widest">VISIT THEBJP.CA →</div>
        </a>
      </div>
    </section>
  );
}
