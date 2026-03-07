import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Serverless-compatible: API routes are now Next.js Route Handlers
  // No rewrites needed — /api/* routes live in app/api/
  serverExternalPackages: ["pg", "@prisma/adapter-pg", "bcryptjs", "jsonwebtoken"],
};

export default nextConfig;
