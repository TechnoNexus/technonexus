'use client';

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export default function NativeGatekeeper() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    document.body.classList.add('is-native-app');

    // Eagerly hide footer to prevent a flash before CSS class takes effect
    const footer = document.querySelector('footer');
    if (footer) footer.style.display = 'none';
  }, []); // Run once on mount — native platform status never changes mid-session

  return null;
}
