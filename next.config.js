// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      process.env.NEXT_PUBLIC_SUPABASE_DOMAIN || 'wifxignbduaxgtberblz.supabase.co'
    ],
  },
  webpack(config) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      bufferutil: false,
      'utf-8-validate': false, // ¡el nombre debe estar entre comillas!
    };
    return config;
  },
};

module.exports = nextConfig;
