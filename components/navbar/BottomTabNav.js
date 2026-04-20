'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Haptics, ImpactStyle } from '../../lib/haptics';

const haptic = async () => {
  try { await Haptics.impact({ style: ImpactStyle.Light }); } catch (e) {}
};

export default function BottomTabNav() {
  const pathname = usePathname();

  const navLinks = [
    {
      name: 'Home',
      href: '/',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      name: 'Forge',
      href: '/forge',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.691.387a2 2 0 01-1.132.252 2 2 0 01-1.132-.252l-.69-.387a6 6 0 00-3.86-.517l-2.388.477a2 2 0 00-1.022.547l-.296.443a2 2 0 00.3 2.57l4.106 4.106a2 2 0 002.828 0l4.106-4.106a2 2 0 00.3-2.57l-.296-.443z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938-4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 11c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    },
    {
      name: 'Apps',
      href: '/apps',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      )
    },
    {
      name: 'Games',
      href: '/games',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
        </svg>
      )
    },
    {
      name: 'Blog',
      href: '/blog',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      )
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-xl border-t border-white/10 pb-[env(safe-area-inset-bottom,1.5rem)] px-1">
      <div className="flex items-center justify-around h-16">
        {navLinks.map((link) => {
          const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
          return (
            <Link
              key={link.name}
              href={link.href}
              onClick={haptic}
              className="flex flex-col items-center justify-center w-full h-full relative"
            >
              {/* Active indicator — thin neon line at top edge */}
              <span
                className={`absolute top-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full transition-all duration-300 ${
                  isActive ? 'w-8 bg-neon-cyan shadow-[0_0_8px_#00FFFF]' : 'w-0 bg-transparent'
                }`}
              />

              {/* Icon with active pill background */}
              <div
                className={`p-1.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-neon-cyan/15 text-neon-cyan drop-shadow-[0_0_6px_rgba(0,255,255,0.45)]'
                    : 'text-slate-500'
                }`}
              >
                {link.icon}
              </div>

              <span
                className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 transition-colors duration-200 ${
                  isActive ? 'text-neon-cyan' : 'text-slate-600'
                }`}
              >
                {link.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
