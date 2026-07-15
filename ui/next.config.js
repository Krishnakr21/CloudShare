/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://cloudshare-brf3.onrender.com';
    return [
      {
        source: '/api/upload',
        destination: `${backendUrl}/upload`,
      },
      {
        source: '/api/download/:port',
        destination: `${backendUrl}/download/:port`,
      },
    ];
  },
}

module.exports = nextConfig
