/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { remotePatterns: [{ protocol: 'https', hostname: '**' }, { protocol: 'http', hostname: 'localhost' }] },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://rose-backend:9000/api/:path*',
      },
    ];
  },
};
module.exports = nextConfig;
