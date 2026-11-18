import type { NextConfig } from "next";
import path from "node:path";

const apiUrl = process.env.API_URL ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../.."),
  devIndicators: false,
  async rewrites() {
    return [
      {
        source: "/v1/:path*",
        destination: `${apiUrl}/v1/:path*`,
      },
      // One public origin for people and coding agents: health, OAuth discovery
      // and the token endpoints live in the API. /oauth/authorize is a page here.
      {
        source: "/healthz",
        destination: `${apiUrl}/healthz`,
      },
      {
        source: "/.well-known/:path*",
        destination: `${apiUrl}/.well-known/:path*`,
      },
      {
        source: "/oauth/:endpoint(token|register|revoke)",
        destination: `${apiUrl}/oauth/:endpoint`,
      },
    ];
  },
};

export default nextConfig;
