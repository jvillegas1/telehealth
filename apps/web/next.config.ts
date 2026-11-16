import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@telehealth/config",
    "@telehealth/domain",
    "@telehealth/ui",
    "@telehealth/db",
  ],
};

export default nextConfig;