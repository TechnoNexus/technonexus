export default function Hero() {
  return (
    <header className="glass-panel p-10 md:p-16 rounded-3xl relative overflow-hidden border-t border-t-sky-900/50">
      <div className="absolute top-0 right-0 w-96 h-96 bg-sky-600 opacity-20 rounded-full blur-[100px]"></div>
      <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 gradient-text">
        Engineer the Future.
      </h1>
      <h2 className="text-xl text-sky-400 font-mono mb-6">&gt; System Architect | AI Consultant | Vibe Coder</h2>
      <p className="text-slate-300 max-w-3xl leading-relaxed text-lg mb-8">
        Welcome to the central hub. I build high-performance automation frameworks, design AI-driven utility agents, and orchestrate enterprise digital transformations. Explore the free ecosystem below, or partner with us to scale your business.
      </p>
    </header>
  );
}
