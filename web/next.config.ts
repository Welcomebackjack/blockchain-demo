import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude docusign-esign from client-side bundling - it's server-only
  serverExternalPackages: ['docusign-esign'],
  // Empty turbopack config to allow builds with either bundler
  turbopack: {},
  // Configure webpack for server-only packages (used with --webpack flag)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't bundle server-only modules on client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    return config;
  },
};

export default nextConfig;
