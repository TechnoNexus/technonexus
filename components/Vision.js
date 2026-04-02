export default function Vision() {
  const visionImageStyle = {
    backgroundImage: "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')",
  };

  return (
    <section id="vision" className="grid md:grid-cols-2 gap-12 items-center glass-panel p-10 rounded-[3rem] border-white/5 scroll-mt-24">
      <div>
        <h2 className="text-3xl font-black mb-8 border-l-4 border-neon-cyan pl-6 tracking-tighter uppercase text-white">
          OUR <span className="gradient-text-cyan">VISION</span>
        </h2>
        <p className="text-slate-400 leading-relaxed text-lg mb-8 italic">
          We are on a mission to revolutionize the way people live, work, and play. Our vision is to create a world where everyone has access to innovative products and services that enhance their lives, blurring the line between open-source utility and enterprise-grade performance.
        </p>
        <div className="flex space-x-4">
          <button className="bg-neon-cyan/10 text-neon-cyan px-8 py-3 rounded-2xl font-black hover:bg-neon-cyan hover:text-black transition-all border border-neon-cyan/20 uppercase text-sm tracking-widest shadow-neon-glow">
            JOIN THE NEXUS
          </button>
        </div>
      </div>
      <div 
        className="h-full min-h-[300px] rounded-2xl border border-white/10 bg-cover bg-center opacity-60 grayscale hover:grayscale-0 transition-all duration-700"
        style={visionImageStyle}
      >
      </div>
    </section>
  );
}
