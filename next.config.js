// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'wifxignbduaxgtberblz.supabase.co', // dominio de Supabase (si usás imágenes desde allí)
      'res.cloudinary.com' // dominio de Cloudinary
    ],
  },
  webpack(config) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      bufferutil: false,
      'utf-8-validate': false,
    };
    return config;
  },
};

module.exports = nextConfig;

