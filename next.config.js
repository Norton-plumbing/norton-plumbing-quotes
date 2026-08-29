/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  // Ensure images from PDFs and local storage work
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
