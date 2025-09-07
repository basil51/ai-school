import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  turbopack: {
    root: "/home/basel/Projects/AI-school/web",
  },
};

export default nextConfig;
