/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEWS_API_KEY: process.env.NEWS_API_KEY,
  },
  // Enable WebSocket support
  webpack: (config) => {
    config.externals.push({
      bufferutil: 'bufferutil',
      'utf-8-validate': 'utf-8-validate',
    });
    return config;
  },
};

export default nextConfig;
