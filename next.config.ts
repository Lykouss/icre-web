import type { NextConfig } from "next";
import withPWA from 'next-pwa';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        // Substitua pelo hostname do seu projeto Supabase se for diferente
        hostname: 'vkaasrypsl.supabase.co', 
      },
    ],
  },
  // CORREÇÃO: Aumenta o limite de upload via Server Actions para 5MB
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
};

// O next-pwa retorna uma função que envolve a config
export default withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
})(nextConfig as any);