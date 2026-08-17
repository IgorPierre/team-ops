import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  devIndicators: false,
  transpilePackages: [
    "three",
    "@react-three/fiber",
    "@react-three/postprocessing",
    "@paper-design/shaders-react",
    "@paper-design/shaders",
  ],
};

export default nextConfig;
