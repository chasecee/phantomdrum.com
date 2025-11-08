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
            default: false,
            vendors: false,
            three: {
              test: /[\\/]node_modules[\\/](three|@react-three|troika-three-text)[\\/]/,
              name: "three",
              priority: 30,
              reuseExistingChunk: true,
              enforce: true,
            },
            gsap: {
              test: /[\\/]node_modules[\\/]gsap[\\/]/,
              name: "gsap",
              priority: 20,
              reuseExistingChunk: true,
              enforce: true,
            },
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              name: "react",
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
          },
        },
      };
    }
    return config;
  },
};

export default nextConfig;
