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
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },
}

module.exports = withBundleAnalyzer(nextConfig)
