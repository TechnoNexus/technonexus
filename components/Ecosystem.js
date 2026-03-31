import Link from 'next/link';

export default function Ecosystem() {
  return (
    <section id="ecosystem">
      <h2 className="text-3xl font-bold mb-8 border-l-4 border-sky-500 pl-4">The Open Ecosystem</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/cook" className="glass-panel p-8 rounded-2xl hover-glow transition block group cursor-pointer">
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🍳</div>
          <h3 className="text-xl font-bold mb-2">The AI Cook</h3>
          <p className="text-slate-400 text-sm mb-6">Input your fridge ingredients. Get a masterclass recipe instantly.</p>
          <div className="text-sky-400 text-xs font-bold tracking-widest">LAUNCH MODULE →</div>
        </Link>
        <Link href="/forge" className="glass-panel p-8 rounded-2xl hover-glow transition block group cursor-pointer">
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">⚙️</div>
          <h3 className="text-xl font-bold mb-2">The Forge</h3>
          <p className="text-slate-400 text-sm mb-6">Open-source Playwright frameworks, AI agents, and sample web apps.</p>
          <div className="text-sky-400 text-xs font-bold tracking-widest">VIEW REPOSITORIES →</div>
        </Link>
        <div className="glass-panel p-8 rounded-2xl border-dashed border-slate-700 opacity-60">
          <div className="text-4xl mb-4 grayscale">🎮</div>
          <h3 className="text-xl font-bold mb-2">The Arcade</h3>
          <p className="text-slate-400 text-sm mb-6">Local co-op games (Uno, Undercover). Connect via phone.</p>
          <div className="text-slate-500 text-xs font-bold tracking-widest">IN DEVELOPMENT</div>
        </div>
      </div>
    </section>
  );
}
