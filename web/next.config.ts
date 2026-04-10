import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Removed turbopack config to avoid path issues
};

export default nextConfig;
