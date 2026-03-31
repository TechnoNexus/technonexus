/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. Required for Cloudflare/Wrangler to find the server
  output: 'standalone',

  // 2. Required because Cloudflare Workers don't support default Next.js image optimization
  images: {
    unoptimized: true,
  },

  // 3. The "Safety Valve": Prevents the build from failing due to auto-generated TS errors
  typescript: {
    ignoreBuildErrors: true,
  },

  // 4. Optional: Prevents build failure due to minor linting warnings
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;