export default function Consulting() {
  return (
    <section id="consulting" className="relative scroll-mt-24">
      <h2 className="text-3xl font-black mb-8 border-l-4 border-neon-cyan pl-6 tracking-tighter uppercase">
        ENTERPRISE <span className="gradient-text-cyan">CONSULTING</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="group glass-panel p-8 rounded-[2rem] border-white/5 hover:border-neon-cyan/30 transition-all duration-500">
          <div className="text-neon-cyan text-4xl mb-6 group-hover:scale-110 transition-transform duration-500">🧠</div>
          <h3 className="font-bold text-xl mb-3 text-white">AI Strategy</h3>
          <p className="text-slate-400 text-sm leading-relaxed">Deploying custom LLMs and AI agents to automate your complex business workflows.</p>
        </div>
        <div className="group glass-panel p-8 rounded-[2rem] border-white/5 hover:border-neon-cyan/30 transition-all duration-500">
          <div className="text-neon-cyan text-4xl mb-6 group-hover:scale-110 transition-transform duration-500">🔄</div>
          <h3 className="font-bold text-xl mb-3 text-white">Digital Pivot</h3>
          <p className="text-slate-400 text-sm leading-relaxed">Modernizing legacy systems to cloud-native, high-performance architectures.</p>
        </div>
        <div className="group glass-panel p-8 rounded-[2rem] border-white/5 hover:border-neon-cyan/30 transition-all duration-500">
          <div className="text-neon-cyan text-4xl mb-6 group-hover:scale-110 transition-transform duration-500">🤖</div>
          <h3 className="font-bold text-xl mb-3 text-white">QA Automation</h3>
          <p className="text-slate-400 text-sm leading-relaxed">Bulletproof testing infrastructures using Playwright and advanced CI/CD pipelines.</p>
        </div>
        <div className="group glass-panel p-8 rounded-[2rem] border-white/5 hover:border-neon-cyan/30 transition-all duration-500">
          <div className="text-neon-cyan text-4xl mb-6 group-hover:scale-110 transition-transform duration-500">🌐</div>
          <h3 className="font-bold text-xl mb-3 text-white">Full-Stack Dev</h3>
          <p className="text-slate-400 text-sm leading-relaxed">Full-stack web application development paired with data-driven growth marketing.</p>
        </div>
      </div>
    </section>
  );
}
