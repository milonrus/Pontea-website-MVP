/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  distDir: process.env.NODE_ENV === 'production' ? 'dist' : '.next',
  trailingSlash: true,

  async redirects() {
    return [
      {
        source: '/en',
        destination: '/',
        permanent: true,
      },
      {
        source: '/en/:path+',
        destination: '/:path+/',
        permanent: true,
      }
    ];
  },
};

export default nextConfig;
