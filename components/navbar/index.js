'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Menu, X } from 'lucide-react';
import NexusSearch from '../NexusSearch';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { name: 'Ecosystem', href: pathname === '/' ? '#ecosystem' : '/#ecosystem', match: '/' },
    { name: 'Forge', href: '/forge', match: '/forge' },
    { name: 'Apps', href: '/apps', match: '/apps' },
    { name: 'Games', href: '/games', match: '/games' },
    { name: 'Blog', href: '/blog', match: '/blog' },
  ];

  return (
    <nav className="flex items-center justify-between px-8 py-5 border-b border-white/5 sticky top-0 z-50 bg-[#0A0A0A]/60 backdrop-blur-2xl saturate-150 pt-[env(safe-area-inset-top,1.25rem)] shadow-spatial">
      <div className="flex items-center gap-8">
        <div className="text-2xl font-black tracking-tighter uppercase">
          <Link href="/" className="gradient-text-cyan hover:opacity-80 transition-opacity">
            TechnoNexus
          </Link>
        </div>
        
        <div className="hidden md:flex items-center space-x-2 font-medium text-sm">
          {navLinks.map((link) => {
            const isActive = pathname === link.match || (link.match !== '/' && pathname.startsWith(link.match));
            return (
              <Link
                key={link.name}
                href={link.href}
                className="relative px-4 py-2 rounded-full text-slate-300 hover:text-white transition-colors group"
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-0 bg-white/10 rounded-full border border-white/10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{link.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Search Trigger */}
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsSearchOpen(true)}
          className="p-2 text-slate-400 hover:text-neon-cyan transition-colors"
          title="Search the Nexus"
        >
          <Search className="w-5 h-5" />
        </motion.button>

        <div className="hidden md:block">
          <motion.a 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href="#contact" 
            className="glass-panel text-neon-violet px-6 py-2 rounded-full font-bold hover:bg-neon-violet hover:text-white transition-all duration-300 shadow-violet-glow text-sm inline-block border-neon-violet/30"
          >
            Consulting
          </motion.a>
        </div>
        
        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(!isOpen)} 
            className="text-slate-300 hover:text-neon-cyan focus:outline-none transition-colors"
          >
            {isOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </motion.button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
            transition={{ duration: 0.2 }}
            className="md:hidden absolute top-full mt-2 left-4 right-4 rounded-[2rem] glass-panel z-40 p-8 shadow-spatial overflow-hidden"
          >
            <div className="flex flex-col items-center space-y-6 py-4 relative z-10">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="text-xl font-bold tracking-tight text-slate-300 hover:text-neon-cyan transition-colors"
                >
                  {link.name}
                </Link>
              ))}
              <a 
                href="#contact" 
                className="bg-neon-violet text-white px-8 py-3 rounded-full font-bold w-full text-center shadow-violet-glow"
                onClick={() => setIsOpen(false)}
              >
                Book Consultation
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <NexusSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </nav>
  );
}
