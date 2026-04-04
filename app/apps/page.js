import Link from 'next/link';

export default function AppsPage() {
  const apps = [
    {
      id: 'random-generator',
      name: 'Random Generator',
      description: 'Generate random numbers, strings, and UUIDs with customizable constraints.',
      tag: 'UTILITY',
      status: 'AVAILABLE',
      href: '/apps/random-generator',
      disabled: false
    },
    {
      id: 'dev-utility',
      name: 'Dev Utility',
      description: 'JSON formatter, Base64 encoder/decoder, and other essential developer tools.',
      tag: 'DEVELOPER',
      status: 'AVAILABLE',
      href: '/apps/dev-utility',
      disabled: false
    },
    {
      id: 'ai-orchestrator',
      name: 'AI Orchestrator',
      description: 'An experimental interface for managing multiple AI model outputs in a single workspace.',
      tag: 'AI',
      status: 'IN RESEARCH',
      href: '#',
      disabled: true
    }
  ];

  return (
    <div className="min-h-screen bg-dark-bg bg-grid-white">
      <div className="container mx-auto px-6 py-20">
        <header className="mb-20 text-center">
          <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter text-white">
            <span className="gradient-text-cyan">NEXUS</span> APPS
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-xl italic border-y border-white/5 py-4">
            High-performance utilities and enterprise-grade tools.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {apps.map((app) => (
            <div 
              key={app.id}
              className={`group glass-panel rounded-3xl p-8 border-white/5 flex flex-col h-full transition-all ${
                app.disabled ? 'opacity-60 grayscale' : 'hover:border-neon-cyan/30'
              }`}
            >
              <div className="flex justify-between items-start mb-6">
                 <span className="text-[10px] font-bold tracking-[0.2em] px-3 py-1 bg-white/5 text-slate-400 rounded-full border border-white/10 uppercase">
                   {app.tag}
                 </span>
                 <span className={`text-[10px] font-bold tracking-widest px-3 py-1 rounded-full border uppercase ${
                   app.disabled 
                     ? 'bg-white/5 text-slate-500 border-white/10'
                     : 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan/30'
                 }`}>
                   {app.status}
                 </span>
              </div>
              
              <h3 className="text-3xl font-bold mb-4 text-white">
                {app.name}
              </h3>
              
              <p className="text-slate-400 mb-8 flex-1 leading-relaxed">
                {app.description}
              </p>

              {app.disabled ? (
                <button 
                  disabled
                  className="w-full py-4 bg-white/5 text-slate-600 border border-white/10 rounded-2xl font-black cursor-not-allowed"
                >
                  COMING SOON
                </button>
              ) : (
                <Link 
                  href={app.href}
                  className="w-full py-4 bg-neon-cyan text-black rounded-2xl font-black text-center hover:scale-[0.98] transition-all shadow-neon-glow uppercase text-sm tracking-widest"
                >
                  Access Tool →
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
