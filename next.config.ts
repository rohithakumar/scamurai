import type { NextConfig } from "next";
const upstream = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000")
  .trim()
  .replace(/\/+$/, "");
const nextConfig: NextConfig = {
  devIndicators: false,
  async headers() {
    return [
      {
        source: "/api/service/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
  async rewrites() {
    // Fixed upstream only: browser requests stay on the frontend origin.
    return [
      { source: "/api/service/health", destination: `${upstream}/health` },
      {
        source: "/api/service/api/v1/:path*",
        destination: `${upstream}/api/v1/:path*`,
      },
    ];
  },
};
export default nextConfig;
