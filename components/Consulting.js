export default function Consulting() {
  return (
    <section id="consulting" className="relative">
      <h2 className="text-3xl font-bold mb-8 border-l-4 border-sky-500 pl-4">Enterprise Consulting</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-sky-500/50 transition">
          <div className="text-sky-400 text-3xl mb-4">🧠</div>
          <h3 className="font-bold text-lg mb-3">AI Integration Strategy</h3>
          <p className="text-slate-400 text-sm">Deploying custom LLMs and AI agents to automate your complex business workflows.</p>
        </div>
        <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-sky-500/50 transition">
          <div className="text-sky-400 text-3xl mb-4">🔄</div>
          <h3 className="font-bold text-lg mb-3">Digital Transformation</h3>
          <p className="text-slate-400 text-sm">Modernizing legacy systems to cloud-native, high-performance architectures.</p>
        </div>
        <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-sky-500/50 transition">
          <div className="text-sky-400 text-3xl mb-4">🤖</div>
          <h3 className="font-bold text-lg mb-3">QA &amp; Automation</h3>
          <p className="text-slate-400 text-sm">Bulletproof testing infrastructures using Playwright and advanced CI/CD pipelines.</p>
        </div>
        <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-sky-500/50 transition">
          <div className="text-sky-400 text-3xl mb-4">🌐</div>
          <h3 className="font-bold text-lg mb-3">Web Dev &amp; Marketing</h3>
          <p className="text-slate-400 text-sm">Full-stack web application development paired with data-driven growth marketing.</p>
        </div>
      </div>
    </section>
  );
}
