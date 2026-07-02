/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com" },
      // Supabase Storage (fotos de veículos e assets de website)
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
