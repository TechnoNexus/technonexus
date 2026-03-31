import Link from 'next/link';

export default function GamesPage() {
  const games = [
    {
      id: 'dumb-charades',
      name: 'Dumb Charades',
      description: 'The classic party game, reimagined with a high-tech neon interface. Generate random movies, TV shows, and books.',
      tag: 'PARTY',
      status: 'AVAILABLE',
    },
    {
      id: 'team-picker',
      name: 'Team Picker',
      description: 'Quickly split players into balanced teams. Perfect for local multiplayer sessions or office tournaments.',
      tag: 'UTILITY',
      status: 'COMING SOON',
    },
    {
      id: 'neon-runner',
      name: 'Neon Runner',
      description: 'An experimental high-speed arcade experience. Test your reflexes in the digital void.',
      tag: 'ARCADE',
      status: 'IN DEVELOPMENT',
    }
  ];

  return (
    <div className="min-h-screen bg-dark-bg bg-grid-white">
      <div className="container mx-auto px-6 py-20">
        <header className="mb-20 text-center">
          <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter">
            <span className="gradient-text-cyan">NEXUS</span> ARCADE
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-xl italic border-y border-white/5 py-4">
            Experimental indie games & interactive digital experiences.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {games.map((game) => (
            <div 
              key={game.id}
              className={`group glass-panel rounded-3xl p-8 border-white/5 flex flex-col h-full transition-all duration-500 ${game.status === 'AVAILABLE' ? 'hover:scale-[1.02] neon-border' : 'opacity-60 cursor-not-allowed grayscale'}`}
            >
              <div className="flex justify-between items-start mb-6">
                 <span className="text-[10px] font-bold tracking-[0.2em] px-3 py-1 bg-white/5 text-slate-400 rounded-full border border-white/10 uppercase">
                   {game.tag}
                 </span>
                 <span className={`text-[10px] font-bold tracking-widest px-3 py-1 rounded-full ${game.status === 'AVAILABLE' ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20' : 'bg-white/5 text-slate-500'}`}>
                   {game.status}
                 </span>
              </div>
              
              <h3 className="text-3xl font-bold mb-4 text-white group-hover:text-neon-cyan transition-colors">
                {game.name}
              </h3>
              
              <p className="text-slate-400 mb-8 flex-1 leading-relaxed">
                {game.description}
              </p>

              {game.status === 'AVAILABLE' ? (
                <Link 
                  href={`/games/${game.id}`}
                  className="w-full py-4 bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30 rounded-2xl font-black text-center hover:bg-neon-cyan hover:text-black transition-all shadow-neon-glow"
                >
                  PLAY NOW
                </Link>
              ) : (
                <button 
                  disabled
                  className="w-full py-4 bg-white/5 text-slate-600 border border-white/10 rounded-2xl font-black cursor-not-allowed"
                >
                  LOCKED
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
