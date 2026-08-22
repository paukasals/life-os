import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // This app lives inside the life-os monorepo, which has its own
  // package-lock.json — pin the workspace root so Next/Turbopack don't
  // guess wrong and warn on every build.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
