// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Enable experimental features
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.supabase.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'modernnomads.mn' },
      { protocol: 'https', hostname: 'www.modernnomads.mn' },
      { protocol: 'https', hostname: '**.uploadthing.com' },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Redirect www to non-www
  async redirects() {
    return [
      {
        source: '/',
        has: [{ type: 'host', value: 'www.immersemongolia.mn' }],
        destination: 'https://immersemongolia.mn/',
        permanent: true,
      },
    ]
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://api.mapbox.com https://www.googletagmanager.com",
              "style-src 'self' 'unsafe-inline' https://api.mapbox.com https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.com https://*.mapbox.com https://lh3.googleusercontent.com https://avatars.githubusercontent.com https://images.unsplash.com https://modernnomads.mn https://www.modernnomads.mn https://*.uploadthing.com",
              "connect-src 'self' https://*.supabase.co https://api.mapbox.com https://events.mapbox.com wss://*.supabase.co",
              "worker-src blob:",
              "frame-src 'self' https://my.matterport.com https://www.google.com",
            ].join('; '),
          },
        ],
      },
    ]
  },

  webpack(config: any) {
    // Bundle analyzer (set ANALYZE=true to use)
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
      config.plugins.push(new BundleAnalyzerPlugin({ analyzerMode: 'static' }))
    }

    return config
  },
}

export default nextConfig
