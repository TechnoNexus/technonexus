'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CapacitorAppCheck() {
  const router = useRouter();

  useEffect(() => {
    const initCapacitor = async () => {
      try {
        const { StatusBar, Style } = await import('@capacitor/status-bar');
        const { SplashScreen } = await import('@capacitor/splash-screen');

        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#0A0A0A' });
        await SplashScreen.hide();
      } catch (e) {
        // Not in Capacitor — silently ignored on web
      }
    };

    const initBackButton = async () => {
      try {
        const { App } = await import('@capacitor/app');
        await App.addListener('backButton', ({ canGoBack }) => {
          if (canGoBack) {
            router.back();
          } else {
            App.exitApp();
          }
        });
      } catch (e) {
        // Not in Capacitor — silently ignored on web
      }
    };

    initCapacitor();
    initBackButton();

    return () => {
      // Clean up back-button listener to prevent duplicates on hot-reload
      import('@capacitor/app').then(({ App }) => {
        App.removeAllListeners();
      }).catch(() => {});
    };
  }, []);

  return null;
}
