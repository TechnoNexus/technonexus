import Link from 'next/link';

export default function GamesPage() {
  const games = [
    {
      id: 'ai-forge',
      name: 'Nexus AI Forge',
      description: 'The experimental custom game engine. Host a room and describe any mission—the AI will build it instantly.',
      tag: 'AI GENERATED',
      status: 'AVAILABLE',
    },
    {
      id: 'npatm',
      name: 'Nexus NPATM',
      description: 'The legendary "Name Place Animal Thing Movie" game. Race against friends to fill all categories and shout STOP!',
      tag: 'CLASSIC',
      status: 'AVAILABLE',
    },
    {
      id: 'nexus-blitz',
      name: 'Nexus Blitz',
      description: 'Rapid-fire AI trivia. Pick any topic, get 8 questions, and race the clock. Score high to claim the leaderboard.',
      tag: 'TRIVIA',
      status: 'AVAILABLE',
    },
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
      status: 'AVAILABLE',
    },
    {
      id: 'mr-white',
      name: 'Undercover',
      description: 'A social deduction game of hidden words and secret identities. Find the imposter among you.',
      tag: 'PARTY',
      status: 'AVAILABLE',
    },
    {
      id: 'pictionary',
      name: 'Pictionary',
      description: 'The classic drawing and guessing game. Share a real-time canvas and put your art skills to the test.',
      tag: 'PARTY',
      status: 'AVAILABLE',
    },
    {
      id: 'mafia',
      name: 'Digital Insurgency',
      description: 'A social deduction game of logic and deceit. Identify the rogue AI agents before they compromise the system.',
      tag: 'STRATEGY',
      status: 'AVAILABLE',
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
          
          <div className="mt-8 flex justify-center">
            <Link
              href="/leaderboard"
              className="flex items-center gap-2 px-5 py-2 bg-yellow-400/10 border border-yellow-400/30 rounded-2xl text-yellow-400 text-xs font-black uppercase tracking-widest hover:bg-yellow-400/20 transition-all"
            >
              🏆 Hall of Fame
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-6">
            <a 
              href="#" 
              className="flex items-center gap-4 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group"
            >
              <div className="w-8 h-8 bg-slate-400 rounded-full group-hover:bg-neon-cyan transition-colors" />
              <div className="text-left">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Download on the</p>
                <p className="text-xl font-black text-white leading-none">App Store</p>
              </div>
            </a>
            <a 
              href="#" 
              className="flex items-center gap-4 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group"
            >
              <div className="w-8 h-8 bg-slate-400 rounded-full group-hover:bg-electric-violet transition-colors" />
              <div className="text-left">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Get it on</p>
                <p className="text-xl font-black text-white leading-none">Google Play</p>
              </div>
            </a>
          </div>
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
