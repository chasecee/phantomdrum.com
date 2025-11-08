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
            threeCore: {
              test: /[\\/]node_modules[\\/]three[\\/]/,
              name: "three-core",
              priority: 35,
              reuseExistingChunk: true,
              enforce: true,
            },
            reactThreeFiber: {
              test: /[\\/]node_modules[\\/]@react-three[\\/]fiber[\\/]/,
              name: "react-three-fiber",
              priority: 34,
              reuseExistingChunk: true,
              enforce: true,
            },
            reactThreeDrei: {
              test: /[\\/]node_modules[\\/]@react-three[\\/]drei[\\/]/,
              name: "react-three-drei",
              priority: 33,
              reuseExistingChunk: true,
              enforce: true,
            },
            reactThreePostprocessing: {
              test: /[\\/]node_modules[\\/]@react-three[\\/]postprocessing[\\/]/,
              name: "react-three-postprocessing",
              priority: 32,
              reuseExistingChunk: true,
              enforce: true,
            },
            troikaText: {
              test: /[\\/]node_modules[\\/]troika-three-text[\\/]/,
              name: "troika-text",
              priority: 31,
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
