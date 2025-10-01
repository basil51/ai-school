import { tr } from "date-fns/locale";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: false,
  },
  turbopack: {
    root: "/Users/baseljerjawi/Projects/AI-School/ai-school/web",
  },
};

export default nextConfig;
