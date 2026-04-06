import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/nearbyneed",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
