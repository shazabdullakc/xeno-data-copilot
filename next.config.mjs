/** @type {import('next').NextConfig} */

// On GitHub Pages the site lives under /<repo>, so assets need a base path.
// Locally (and on root-domain hosts like Vercel) this is empty.
const basePath = process.env.PAGES_BASE_PATH || "";

const nextConfig = {
  // Pure client-side app — no server runtime needed. This emits a static export
  // that hosts anywhere (GitHub Pages, Vercel, any CDN) with zero backend.
  output: "export",
  reactStrictMode: true,
  basePath,
  assetPrefix: basePath || undefined,
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
