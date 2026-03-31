'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { name: 'Ecosystem', href: pathname === '/' ? '#ecosystem' : '/#ecosystem' },
    { name: 'Apps', href: '/apps' },
    { name: 'Games', href: '/games' },
    { name: 'Blog', href: '/blog' },
  ];

  return (
    <nav className="flex items-center justify-between px-8 py-5 border-b border-white/10 sticky top-0 z-50 bg-dark-bg/80 backdrop-blur-xl">
      <div className="text-2xl font-bold tracking-tighter">
        <Link href="/" className="gradient-text-cyan hover:opacity-80 transition-opacity">
          TechnoNexus
        </Link>
      </div>
      
      <div className="hidden md:flex items-center space-x-10 font-medium text-sm">
        {navLinks.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            className="text-slate-300 hover:text-neon-cyan hover:drop-shadow-[0_0_8px_rgba(0,255,255,0.4)] transition-all duration-300"
          >
            {link.name}
          </Link>
        ))}
      </div>

      <div className="hidden md:block">
        <a 
          href="#contact" 
          className="bg-neon-violet/10 text-neon-violet border border-neon-violet/30 px-6 py-2 rounded-full font-bold hover:bg-neon-violet hover:text-white transition-all duration-300 shadow-violet-glow text-sm"
        >
          Consulting
        </a>
      </div>
      
      {/* Mobile Menu Button */}
      <div className="md:hidden">
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="text-slate-300 hover:text-neon-cyan focus:outline-none transition-colors"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-dark-bg/95 border-b border-white/10 backdrop-blur-2xl z-40 p-8">
          <div className="flex flex-col items-center space-y-8 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="text-xl text-slate-300 hover:text-neon-cyan"
              >
                {link.name}
              </Link>
            ))}
            <a 
              href="#contact" 
              className="bg-neon-violet text-white px-8 py-3 rounded-full font-bold w-full text-center"
              onClick={() => setIsOpen(false)}
            >
              Book Consultation
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
