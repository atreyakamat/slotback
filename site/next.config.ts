import type { NextConfig } from "next";

// The marketing site is fully static: no server, no database, no secrets.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  // The repo root has its own lockfile; keep Turbopack inside this folder.
  turbopack: { root: import.meta.dirname },
};

export default nextConfig;
