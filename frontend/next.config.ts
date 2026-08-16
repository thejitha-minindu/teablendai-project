import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 90],
  },

  turbopack: {
    // Tell Turbopack the workspace root is this frontend directory,
    // eliminating the "multiple lockfiles" warning.
    root: path.resolve(__dirname),
  },

  // Don't bundle these heavy server-only packages into the client
  serverExternalPackages: ["mssql", "plotly.js"],

  // Skip tracing node_modules (saves thousands of file-stat calls on Windows)
  outputFileTracingExcludes: {
    "*": [
      "./node_modules/**",
      "./.next/**",
    ],
  },

  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: "http://127.0.0.1:8000/api/v1/:path*",
      },
    ];
  },
};

export default nextConfig;