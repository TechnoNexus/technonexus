import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-white/5 py-12 text-center bg-dark-bg">
      <div className="container mx-auto px-6">
        <div className="mb-8">
          <Link href="/" className="text-xl font-bold tracking-tighter gradient-text-cyan hover:opacity-80 transition-opacity">
            TechnoNexus
          </Link>
          <p className="text-slate-500 text-sm mt-4 italic">
            Building the next generation of digital ecosystems.
          </p>
        </div>
        
        <div className="flex justify-center space-x-8 text-slate-500 text-[10px] uppercase tracking-[0.2em] font-bold mb-8">
          <Link href="#" className="hover:text-neon-cyan transition-colors">Privacy Policy</Link>
          <Link href="#" className="hover:text-neon-cyan transition-colors">Terms of Service</Link>
          <Link href="#" className="hover:text-neon-cyan transition-colors">Cookies</Link>
        </div>

        <p className="text-slate-600 text-[10px] uppercase tracking-widest">
          © 2026 TechnoNexus. Designed in the digital void.
        </p>
      </div>
    </footer>
  );
}
