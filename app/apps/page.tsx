import Link from 'next/link';

export default function AppsPage() {
  const apps = [
    {
      id: 'random-generator',
      name: 'Random Generator',
      description: 'A versatile tool for generating random numbers, strings, and unique IDs with customizable constraints.',
      tag: 'UTILITY',
      status: 'COMING SOON',
    },
    {
      id: 'dev-utility',
      name: 'Dev Utility',
      description: 'A collection of developer tools including JSON formatters, Base64 encoders, and more.',
      tag: 'DEVELOPER',
      status: 'COMING SOON',
    },
    {
      id: 'ai-orchestrator',
      name: 'AI Orchestrator',
      description: 'An experimental interface for managing multiple AI model outputs in a single workspace.',
      tag: 'AI',
      status: 'IN RESEARCH',
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
              className="group glass-panel rounded-3xl p-8 border-white/5 flex flex-col h-full opacity-60 grayscale"
            >
              <div className="flex justify-between items-start mb-6">
                 <span className="text-[10px] font-bold tracking-[0.2em] px-3 py-1 bg-white/5 text-slate-400 rounded-full border border-white/10 uppercase">
                   {app.tag}
                 </span>
                 <span className="text-[10px] font-bold tracking-widest px-3 py-1 rounded-full bg-white/5 text-slate-500 uppercase">
                   {app.status}
                 </span>
              </div>
              
              <h3 className="text-3xl font-bold mb-4 text-white">
                {app.name}
              </h3>
              
              <p className="text-slate-400 mb-8 flex-1 leading-relaxed">
                {app.description}
              </p>

              <button 
                disabled
                className="w-full py-4 bg-white/5 text-slate-600 border border-white/10 rounded-2xl font-black cursor-not-allowed"
              >
                ACCESS DENIED
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
