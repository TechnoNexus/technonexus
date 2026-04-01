import Link from 'next/link';

export default function ForgePage() {
  const projects = [
    {
      name: "Automation Frameworks",
      description: "Production-ready Playwright and Selenium frameworks designed for high-performance testing and scalability.",
      link: "https://github.com",
      tags: ["Playwright", "Typescript", "CI/CD"]
    },
    {
      name: "AI Demo Agents",
      description: "Experimental LLM-driven agents for workflow automation, task orchestration, and intelligent system monitoring.",
      link: "https://github.com",
      tags: ["AI", "OpenAI", "Node.js"]
    },
    {
      name: "Nexus Core Components",
      description: "The UI library used for TechnoNexus. Optimized for dark mode, glassmorphism, and performance.",
      link: "https://github.com",
      tags: ["React", "Tailwind", "Design"]
    }
  ];

  return (
    <div className="min-h-screen bg-dark-bg bg-grid-white">
      <div className="container mx-auto px-6 py-20">
        <header className="mb-20 text-center">
          <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter uppercase">
            <span className="gradient-text-cyan">NEXUS</span> FORGE
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-xl italic border-y border-white/5 py-4">
            Open-source automation frameworks, AI agents, and GitHub-hosted engineering toolkits.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <div 
              key={index}
              className="group glass-panel rounded-3xl p-8 border-white/5 hover:border-electric-violet/30 transition-all flex flex-col"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-2 flex-wrap">
                  {project.tags.map(tag => (
                    <span key={tag} className="text-[10px] font-bold tracking-widest px-2 py-1 bg-white/5 text-slate-400 rounded-full border border-white/10 uppercase">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              
              <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-electric-violet transition-colors">
                {project.name}
              </h3>
              
              <p className="text-slate-400 mb-8 flex-1 leading-relaxed">
                {project.description}
              </p>

              <a 
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 bg-electric-violet/10 text-electric-violet border border-electric-violet/30 rounded-2xl font-black text-center hover:bg-electric-violet hover:text-white transition-all shadow-neon-glow"
              >
                DOWNLOAD SOURCE
              </a>
            </div>
          ))}
        </div>

        <footer className="mt-24 text-center p-12 glass-panel rounded-[3rem] border-dashed border-white/5">
          <p className="text-slate-500 font-mono text-sm mb-4">
            &gt; Looking for a specific implementation?
          </p>
          <a 
            href="https://github.com" 
            className="text-neon-cyan hover:underline font-black tracking-widest text-xs"
          >
            EXPLORE ALL REPOSITORIES ON GITHUB →
          </a>
        </footer>
      </div>
    </div>
  );
}
