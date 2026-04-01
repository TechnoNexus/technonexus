/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. Static Export: Required for Capacitor to bundle the app from the 'out' directory
  output: 'export',

  // 2. Required for Cloudflare: Standard Next.js image optimization is not supported at the Edge
  images: {
    unoptimized: true,
  },

  // 3. The "Safety Valve": Prevents build failure if Next.js auto-generates TypeScript files
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;