import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['react-markdown'],
  images: {
    remotePatterns: [{ hostname: '*.public.blob.vercel-storage.com' }],
  },
};

export default nextConfig;
