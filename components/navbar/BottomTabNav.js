'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomTabNav() {
  const pathname = usePathname();

  const navLinks = [
    { 
      name: 'Home', 
      href: '/', 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    { 
      name: 'Forge', 
      href: '/forge',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.691.387a2 2 0 01-1.132.252 2 2 0 01-1.132-.252l-.69-.387a6 6 0 00-3.86-.517l-2.388.477a2 2 0 00-1.022.547l-.296.443a2 2 0 00.3 2.57l4.106 4.106a2 2 0 002.828 0l4.106-4.106a2 2 0 00.3-2.57l-.296-.443z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938-4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 11c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    },
    { 
      name: 'Apps', 
      href: '/apps',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      )
    },
    { 
      name: 'Games', 
      href: '/games',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      )
    },
    { 
      name: 'Blog', 
      href: '/blog',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      )
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0A0A0A]/90 backdrop-blur-xl border-t border-white/10 pb-[env(safe-area-inset-bottom,1.5rem)] px-2">
      <div className="flex items-center justify-around h-16">
        {navLinks.map((link) => {
          const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${
                isActive ? 'text-neon-cyan drop-shadow-[0_0_8px_rgba(0,255,255,0.4)]' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`${isActive ? 'scale-110' : 'scale-100'} transition-transform duration-300`}>
                {link.icon}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest mt-1">
                {link.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
