const PROD_BASE = 'https://technonexus.ca';

/**
 * Returns the correct URL for internal API calls.
 * All calls now use relative paths as this is the web-first version.
 */
export function getApiUrl(path) {
  return path;
}

/**
 * Returns a public HTTPS URL for shareable links (e.g. QR code join URLs).
 * Always resolves to a URL that any phone or browser can open.
 * On web: uses current window origin.
 */
export function getWebUrl(path) {
  if (typeof window !== 'undefined') return `${window.location.origin}${path}`;
  return `${PROD_BASE}${path}`;
}
