/**
 * Mock Haptics utility to replace @capacitor/haptics.
 * This allows the web app to function without Capacitor dependencies.
 */
export const Haptics = {
  impact: async () => {
    // No-op on web
    return;
  },
  notification: async () => {
    // No-op on web
    return;
  },
  selectionStart: async () => {
    // No-op on web
    return;
  },
  selectionChanged: async () => {
    // No-op on web
    return;
  },
  selectionEnd: async () => {
    // No-op on web
    return;
  },
  vibrate: async () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(200);
    }
  }
};

export const ImpactStyle = {
  Heavy: 'HEAVY',
  Light: 'LIGHT',
  Medium: 'MEDIUM'
};
