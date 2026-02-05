/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  distDir: process.env.NODE_ENV === 'production' ? 'dist' : '.next',

  async redirects() {
    return [
      {
        source: '/ru',
        destination: '/ru/arched-prep-course',
        permanent: false, // 302 redirect (temporary)
      },
      {
        source: '/en',
        destination: '/en/arched-prep-course',
        permanent: false, // 302 redirect (temporary)
      },
    ];
  },
};

export default nextConfig;
