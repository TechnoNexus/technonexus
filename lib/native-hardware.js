/**
 * Web-compatible mock for native hardware access.
 * Replaces @capacitor/camera logic.
 */
export const startQRScanner = async () => {
  console.warn('QR Scanner is not available in the web version. Please use the native mobile app.');
  throw new Error('QR Scanner not available on web');
};
