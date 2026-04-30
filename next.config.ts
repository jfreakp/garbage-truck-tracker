import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Needed for the Docker multi-stage build
  output: "standalone",
  // Suppress bundling issues from firebase-admin (uses dynamic requires)
  serverExternalPackages: ["firebase-admin", "@scalar/nextjs-api-reference"],
};

export default nextConfig;
