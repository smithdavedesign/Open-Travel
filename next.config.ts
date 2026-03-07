import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  // Disable in dev — Serwist requires webpack, but Next.js 16 uses Turbopack by default
  disable: process.env.NODE_ENV !== "production",
});

const nextConfig: NextConfig = {
  // Silence the "webpack config but no turbopack config" warning
  turbopack: {},
};

export default withSerwist(nextConfig);
