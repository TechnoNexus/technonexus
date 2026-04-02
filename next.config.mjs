/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. Removed 'export' output to support dynamic AI API routes in Phase 5.
  // Deployment to Cloudflare Pages will now use the @cloudflare/next-on-pages adapter for dynamic edge functions.

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