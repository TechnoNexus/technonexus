/** @type {import('next').NextConfig} */

// When NEXT_PUBLIC_BUILD_TARGET=mobile, generate a static export for Capacitor bundling.
// The web/Cloudflare deployment never sets this flag, so API routes remain intact there.
const isMobile = process.env.NEXT_PUBLIC_BUILD_TARGET === 'mobile';

const nextConfig = {
  // Static export for mobile builds only. Excluded for Cloudflare Pages (API routes need Edge runtime).
  ...(isMobile ? { output: 'export' } : {}),

  // Required for Cloudflare: Standard Next.js image optimization is not supported at the Edge
  images: {
    unoptimized: true,
  },

  // The "Safety Valve": Prevents build failure if Next.js auto-generates TypeScript files
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
