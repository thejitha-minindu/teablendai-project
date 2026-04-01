import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 90],
  },
  turbopack: {},
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer && process.env.DOCKER === "true") {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }

    config.cache = {
      type: "filesystem",
    };

    return config;
  },
};

export default nextConfig;