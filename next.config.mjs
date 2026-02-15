/** @type {import('next').NextConfig} */
const localeMode = process.env.LOCALE_MODE === 'ru_only' ? 'ru_only' : 'multilingual';

const nextConfig = {
  reactStrictMode: false,
  distDir: process.env.NODE_ENV === 'production' ? 'dist' : '.next',
  env: {
    LOCALE_MODE: localeMode
  },

  async redirects() {
    return [
      {
        source: '/ru/arched-prep-course',
        destination: '/ru',
        permanent: false, // 302 redirect (temporary)
      },
      {
        source: '/en/arched-prep-course',
        destination: localeMode === 'ru_only' ? '/ru' : '/en',
        permanent: false, // 302 redirect (temporary)
      },
    ];
  },
};

export default nextConfig;
