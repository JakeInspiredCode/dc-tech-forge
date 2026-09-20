/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The app has no API routes, server actions, or middleware — every page is
  // static or prerendered — so it ships as plain files. With no server
  // runtime, there is no server to attack, and it can be hosted anywhere.
  //
  // Static export does not support redirects() or headers() here; those live
  // in vercel.json. `npm start` serves the export with them applied.
  output: "export",
  images: { unoptimized: true },
};

module.exports = nextConfig;
