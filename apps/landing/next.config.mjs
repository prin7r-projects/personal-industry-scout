import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@pis/postmark": path.resolve(__dirname, "../../packages/postmark/src/postmark.ts")
    };
    return config;
  },
  async rewrites() {
    return [
      { source: "/scout", destination: "/app" },
      { source: "/scout/:path*", destination: "/app/:path*" },
      { source: "/api", destination: "/api/health" }
    ];
  }
};

export default nextConfig;
