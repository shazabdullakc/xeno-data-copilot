/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pure client-side app — no server runtime needed. This emits a static export
  // that hosts anywhere (Vercel, GitHub Pages, any CDN) with zero backend.
  output: "export",
  reactStrictMode: true,
};

export default nextConfig;
