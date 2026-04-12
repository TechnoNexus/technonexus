import { Capacitor } from '@capacitor/core';

const PROD_BASE = 'https://technonexus.ca';

/**
 * Returns the correct URL for internal API calls.
 * On native (Capacitor), uses the absolute production URL since there is no local server.
 * On web, returns a relative path so Next.js routes it internally.
 */
export function getApiUrl(path) {
  return Capacitor.isNativePlatform() ? `${PROD_BASE}${path}` : path;
}

/**
 * Returns a public HTTPS URL for shareable links (e.g. QR code join URLs).
 * Always resolves to a URL that any phone or browser can open.
 * On native: uses production base. On web: uses current window origin.
 */
export function getWebUrl(path) {
  if (Capacitor.isNativePlatform()) return `${PROD_BASE}${path}`;
  if (typeof window !== 'undefined') return `${window.location.origin}${path}`;
  return `${PROD_BASE}${path}`;
}
