'use client';

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { useRouter, usePathname } from 'next/navigation';

export default function NativeGatekeeper() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const isNative = Capacitor.isNativePlatform();
    
    if (isNative) {
      document.body.classList.add('is-native-app');
      
      if (pathname === '/') {
        router.replace('/games');
      }
    }
  }, [pathname, router]);

  return null;
}
