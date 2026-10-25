/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // Allow symlinks in public/ (demos -> ../..) to resolve to legacy demo folders.
  experimental: {
    // Bound build workers on the shared two-core runner.
    cpus: 1,
  },
};

export default nextConfig;
