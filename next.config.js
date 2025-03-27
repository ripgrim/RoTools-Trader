/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove static export configuration
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        hostname: 'tr.rbxcdn.com',
      },
      {
        hostname: 'thumbnails.roblox.com',
      },
    ],
  },
  
  // Configure SWC for better compatibility
  swcMinify: true,
  experimental: {
    swcPlugins: []
  }
};

module.exports = nextConfig;