import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          chunks: "all",
          minSize: 20000,
          maxSize: 244000,
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            vendors: {
              test: /[\\/]node_modules[\\/]/,
              name: "vendors",
              chunks: "all",
              priority: 10,
            },
          },
        },
      };
    }

    return config;
  },
};

export default nextConfig;