import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native libSQL bindings must not be bundled by webpack
  serverExternalPackages: ["@prisma/adapter-libsql", "@libsql/client", "libsql"],
  // Allow large invoice image uploads through server actions
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
