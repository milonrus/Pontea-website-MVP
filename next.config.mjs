/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  distDir: process.env.NODE_ENV === 'production' ? 'dist' : '.next'
};

export default nextConfig;
