/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  distDir: process.env.NODE_ENV === 'production' ? 'dist' : '.next',

  async redirects() {
    return [
      {
        source: '/ru/arched-prep-course',
        destination: '/ru',
        permanent: false, // 302 redirect (temporary)
      },
      {
        source: '/en/arched-prep-course',
        destination: '/en',
        permanent: false, // 302 redirect (temporary)
      },
    ];
  },
};

export default nextConfig;
