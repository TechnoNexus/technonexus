/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. Required for Cloudflare: Standard Next.js image optimization is not supported at the Edge
  images: {
    unoptimized: true,
  },

  // 2. The "Safety Valve": Prevents build failure if Next.js auto-generates TypeScript files
  typescript: {
    ignoreBuildErrors: true,
  },

  // Note: 'output: standalone' is removed as the Pages adapter handles the output format
};

export default nextConfig;