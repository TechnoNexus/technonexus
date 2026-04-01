'use client';

import { useEffect } from "react";

export default function CapacitorAppCheck() {
  useEffect(() => {
    // Only import and run on client side
    const initCapacitor = async () => {
      try {
        const { StatusBar, Style } = await import('@capacitor/status-bar');
        const { SplashScreen } = await import('@capacitor/splash-screen');
        
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#0A0A0A' });
        await SplashScreen.hide();
      } catch (e) {
        // Not in capacitor
      }
    };
    initCapacitor();
  }, []);
  
  return null;
}