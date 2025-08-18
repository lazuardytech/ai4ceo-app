import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: 'avatar.vercel.sh',
      },
      {
        hostname: 'pub-8ce3bb35dc1f47e588e30a204e09b319.r2.dev',
      },
    ],
  },
};

export default nextConfig;
