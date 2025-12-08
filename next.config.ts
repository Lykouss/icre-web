/** @type {import('next').NextConfig} */
import withPWA from 'next-pwa';

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['lh3.googleusercontent.com', 'vkaasrypsl.supabase.co'], // Permitir imagens do Google e do Supabase
  },
};

export default withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development', // Desativa PWA em desenvolvimento para não travar o hot-reload
  register: true,
  skipWaiting: true,
})(nextConfig);