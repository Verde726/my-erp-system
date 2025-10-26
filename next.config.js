const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Enable standalone output for Docker deployment
  output: 'standalone',

  // Enable gzip compression
  compress: true,

  // ESLint configuration for builds
  eslint: {
    // Don't fail the build on ESLint errors (warnings will still show)
    // Set to false for strict builds in CI/CD
    ignoreDuringBuilds: false,
  },

  // TypeScript configuration for builds
  typescript: {
    // Don't fail the build on TypeScript errors (for development flexibility)
    // Set to false for strict builds in CI/CD
    ignoreBuildErrors: false,
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  // Optimize production builds
  productionBrowserSourceMaps: false,

  // Enable experimental features for better performance
  experimental: {
    // Optimize package imports to reduce bundle size
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      'recharts',
      '@tanstack/react-query',
      'papaparse',
      'zod',
    ],

    // Enable optimized CSS loading
    optimizeCss: true,

    // Enable server actions for better data mutations
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Webpack optimization
  webpack: (config, { isServer, webpack }) => {
    // Optimize bundle size
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Vendor chunk
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20,
          },
          // Common chunk
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
          // UI components chunk
          ui: {
            name: 'ui',
            test: /[\\/]components[\\/]ui[\\/]/,
            chunks: 'all',
            priority: 30,
          },
        },
      },
    }

    // Reduce memory usage
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }

    return config
  },

  // Performance headers
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=30',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
        ],
      },
    ]
  },
}

module.exports = withBundleAnalyzer(nextConfig)
