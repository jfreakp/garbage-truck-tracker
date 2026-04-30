import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Suppress bundling issues from firebase-admin (uses dynamic requires)
  serverExternalPackages: ["firebase-admin", "@scalar/nextjs-api-reference"],
};

export default nextConfig;
