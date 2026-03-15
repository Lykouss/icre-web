import type { NextConfig } from "next";
import withPWA from 'next-pwa';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        // Supabase Storage — avatars, imagens de pastores, site
        protocol: 'https',
        hostname: 'oybwiwvoqsipilqaayyq.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        // Google (fotos de perfil OAuth)
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        // Qualquer URL HTTPS inserida no CMS pelo editor
        // Necessário porque admins podem inserir imagens de qualquer domínio
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
})(nextConfig as any);