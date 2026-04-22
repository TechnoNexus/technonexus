'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Haptics, ImpactStyle } from '../../lib/haptics';
import { Home, Hammer, LayoutGrid, Gamepad2, FileText } from 'lucide-react';
import { cn } from '../../lib/utils';

const haptic = async () => {
  try { await Haptics.impact({ style: ImpactStyle.Light }); } catch (e) {}
};

export default function BottomTabNav() {
  const pathname = usePathname();

  const navLinks = [
    { name: 'Home', href: '/', icon: Home, match: '/' },
    { name: 'Forge', href: '/forge', icon: Hammer, match: '/forge' },
    { name: 'Apps', href: '/apps', icon: LayoutGrid, match: '/apps' },
    { name: 'Games', href: '/games', icon: Gamepad2, match: '/games' },
    { name: 'Blog', href: '/blog', icon: FileText, match: '/blog' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0A0A0A]/60 backdrop-blur-2xl saturate-150 border-t border-white/5 pb-[env(safe-area-inset-bottom,1.5rem)] px-2 shadow-spatial">
      <div className="flex items-center justify-around h-16 relative">
        {navLinks.map((link) => {
          const isActive = pathname === link.match || (link.match !== '/' && pathname.startsWith(link.match));
          const Icon = link.icon;
          return (
            <Link
              key={link.name}
              href={link.href}
              onClick={haptic}
              className="relative flex flex-col items-center justify-center w-full h-full z-10"
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-active"
                  className="absolute inset-y-1 left-2 right-2 bg-white/10 rounded-2xl border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              
              <motion.div
                whileTap={{ scale: 0.85 }}
                className={cn(
                  "p-1.5 rounded-xl transition-colors duration-300 relative z-20",
                  isActive ? "text-neon-cyan" : "text-slate-500"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive && "drop-shadow-[0_0_8px_rgba(0,255,255,0.6)]")} />
              </motion.div>

              <span className={cn(
                "text-[9px] font-bold uppercase tracking-widest mt-0.5 transition-colors duration-300 relative z-20",
                isActive ? "text-neon-cyan" : "text-slate-600"
              )}>
                {link.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
