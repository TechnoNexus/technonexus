export default function Vision() {
  const visionImageStyle = {
    backgroundImage: "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')",
  };

  return (
    <section id="vision" className="grid md:grid-cols-2 gap-12 items-center bg-slate-900/30 p-10 rounded-3xl border border-slate-800/50">
      <div>
        <h2 className="text-3xl font-bold mb-6 text-white">Our Vision</h2>
        <p className="text-slate-400 leading-relaxed text-lg mb-6">
          We are on a mission to revolutionize the way people live, work, and play. Our vision is to create a world where everyone has access to innovative products and services that enhance their lives, blurring the line between open-source utility and enterprise-grade performance.
        </p>
        <div className="flex space-x-4">
          <button className="bg-slate-800 text-white px-6 py-3 rounded-lg font-bold hover:bg-slate-700 transition border border-slate-600">Join Our Cause</button>
        </div>
      </div>
      <div 
        className="h-full min-h-[250px] rounded-2xl border border-slate-700 bg-cover bg-center opacity-70"
        style={visionImageStyle}
      >
      </div>
    </section>
  );
}
