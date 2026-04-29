import type { NextConfig } from "next";
import path from "path";

const nextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  serverActions: {
    bodySizeLimit: "10mb",
  },
} as NextConfig;

export default nextConfig;